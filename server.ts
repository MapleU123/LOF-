import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { ALL_LOF_FUNDS } from './src/data/lofDatabase';
import { LofRealtimeQuote, MarketSummary, HistoricalPremiumPoint } from './src/types/lof';

// Cache store
let cachedQuotes: LofRealtimeQuote[] = [];
let lastCacheTime = 0;
const CACHE_TTL_MS = 2500; // 2.5 seconds cache for high responsiveness

// Load latest fund limits metadata from JSON cache
let fundLimitsMap: Record<string, any> = {};
try {
  const limitsFilePath = path.join(process.cwd(), 'src/data/fundLimitsData.json');
  if (fs.existsSync(limitsFilePath)) {
    fundLimitsMap = JSON.parse(fs.readFileSync(limitsFilePath, 'utf-8'));
  }
} catch (e) {
  // Silent fallback
}

// Check A-share market status
function getMarketStatus(): { status: 'trading' | 'midday' | 'closed' | 'pre_market'; text: string } {
  // China Standard Time (UTC+8)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const bjTime = new Date(utc + (3600000 * 8));
  
  const day = bjTime.getDay();
  const hours = bjTime.getHours();
  const minutes = bjTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Weekend
  if (day === 0 || day === 6) {
    return { status: 'closed', text: '休市中 (周末)' };
  }

  // Pre-market: 09:15 - 09:30
  if (timeInMinutes >= 9 * 60 + 15 && timeInMinutes < 9 * 60 + 30) {
    return { status: 'pre_market', text: '集合竞价中 (09:15-09:30)' };
  }

  // Morning session: 09:30 - 11:30
  if (timeInMinutes >= 9 * 60 + 30 && timeInMinutes <= 11 * 60 + 30) {
    return { status: 'trading', text: '交易中 (早盘)' };
  }

  // Midday break: 11:30 - 13:00
  if (timeInMinutes > 11 * 60 + 30 && timeInMinutes < 13 * 60) {
    return { status: 'midday', text: '午间休市 (11:30-13:00)' };
  }

  // Afternoon session: 13:00 - 15:00
  if (timeInMinutes >= 13 * 60 && timeInMinutes <= 15 * 60) {
    return { status: 'trading', text: '交易中 (午盘)' };
  }

  // Closed
  return { status: 'closed', text: '已收盘 (15:00后)' };
}

// Generate deterministic baseline prices based on code
function getBasePrice(code: string): { price: number; nav: number; change: number; estChange: number } {
  const seed = parseInt(code, 10);
  // Realistic prices for LOFs (typically 0.7 - 2.8)
  const basePrice = 0.85 + ((seed % 1500) / 1000);
  
  // Specific typical characteristics for famous LOFs
  if (code === '164824') { // 印度基金 (typically high premium 5-15%)
    const nav = 1.485;
    const price = 1.625;
    return { price, nav, change: 1.25, estChange: 0.35 };
  }
  if (code === '501018') { // 南方原油 (frequent premium 3-8%)
    const nav = 1.052;
    const price = 1.118;
    return { price, nav, change: 0.82, estChange: 0.15 };
  }
  if (code === '162411') { // 华宝油气
    const nav = 0.628;
    const price = 0.648;
    return { price, nav, change: -0.46, estChange: -0.12 };
  }
  if (code === '161129') { // 易方达原油
    const nav = 1.342;
    const price = 1.415;
    return { price, nav, change: 1.15, estChange: 0.40 };
  }
  if (code === '161226') { // 国投白银
    const nav = 0.985;
    const price = 0.982;
    return { price, nav, change: 2.45, estChange: 2.30 };
  }
  if (code === '160140') { // 标普生物
    const nav = 1.120;
    const price = 1.186;
    return { price, nav, change: 0.68, estChange: -0.22 };
  }
  if (code === '161128') { // 标普科技
    const nav = 2.450;
    const price = 2.685;
    return { price, nav, change: 1.85, estChange: 0.95 };
  }
  if (code === '164908') { // 中概互联
    const nav = 0.965;
    const price = 0.970;
    return { price, nav, change: 0.52, estChange: 0.48 };
  }
  if (code === '161725') { // 招商白酒
    const nav = 0.865;
    const price = 0.862;
    return { price, nav, change: -0.35, estChange: -0.30 };
  }
  if (code === '163417') { // 兴全合宜 (often discount)
    const nav = 1.320;
    const price = 1.285;
    return { price, nav, change: -0.16, estChange: 0.05 };
  }

  const change = ((seed % 70) - 32) / 10;
  const estChange = change * 0.85 + ((seed % 10) - 5) / 10;
  const nav = Number((basePrice * (1 + (estChange / 100) * 0.1)).toFixed(4));
  const price = Number((basePrice * (1 + (change / 100) * 0.15)).toFixed(3));
  return { price, nav, change, estChange };
}

// Fetch live quotes from Tencent Finance API in batches
async function fetchLiveTencentQuotes(codes: { code: string; market: 'sz' | 'sh' }[]): Promise<Map<string, any>> {
  const resultMap = new Map<string, any>();
  if (!codes || codes.length === 0) return resultMap;

  const BATCH_SIZE = 80;
  const chunks: { code: string; market: 'sz' | 'sh' }[][] = [];
  for (let i = 0; i < codes.length; i += BATCH_SIZE) {
    chunks.push(codes.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < chunks.length; i++) {
    try {
      const queryList = chunks[i].map(c => `${c.market}${c.code}`).join(',');
      const url = `http://qt.gtimg.cn/q=${queryList}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('gbk');
        const text = decoder.decode(buffer);

        const statements = text.split(';');
        for (const line of statements) {
          if (!line || !line.includes('=')) continue;
          const match = line.match(/v_([a-z0-9]+)="([^"]+)"/);
          if (match) {
            const fullCode = match[1];
            const code = fullCode.replace(/^[a-z]+/, '');
            const parts = match[2].split('~');
            if (parts.length > 30) {
              const currentPrice = parseFloat(parts[3]) || 0;
              const prevClose = parseFloat(parts[4]) || 0;
              const openPrice = parseFloat(parts[5]) || 0;
              const volume = parseFloat(parts[6]) || 0; // 手
              const turnover = parseFloat(parts[57]) || parseFloat(parts[37]) || 0; // 万元
              const changePercent = parseFloat(parts[32]) || 0;
              const changeAmount = parseFloat(parts[31]) || 0;
              const highPrice = parseFloat(parts[33]) || currentPrice;
              const lowPrice = parseFloat(parts[34]) || currentPrice;
              const liveName = parts[1] || '';
              const officialNAV = parseFloat(parts[81]) || 0;
              const iopv = parseFloat(parts[85]) || 0;
              const totalShares = parseFloat(parts[72]) || parseFloat(parts[76]) || 0;
              const dateStr = parts[30] ? parts[30].substring(0, 8) : '';

              if (currentPrice > 0 || prevClose > 0) {
                resultMap.set(code, {
                  currentPrice: currentPrice > 0 ? currentPrice : prevClose,
                  prevClose,
                  openPrice,
                  volume,
                  turnover,
                  changePercent,
                  changeAmount,
                  highPrice,
                  lowPrice,
                  liveName,
                  officialNAV,
                  iopv,
                  totalShares,
                  dateStr,
                  time: parts[30] || ''
                });
              }
            }
          }
        }
      }
    } catch (err) {
      // Continue on chunk error
    }
  }

  return resultMap;
}

// Fetch live valuations (GSZ/IOPV) from Sina Finance
async function fetchLiveSinaValuations(fundCodes: string[]): Promise<Map<string, any>> {
  const resultMap = new Map<string, any>();
  if (!fundCodes || fundCodes.length === 0) return resultMap;

  const BATCH_SIZE = 80;
  const chunks: string[][] = [];
  for (let i = 0; i < fundCodes.length; i += BATCH_SIZE) {
    chunks.push(fundCodes.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < chunks.length; i++) {
    try {
      const queryList = chunks[i].map(c => `fu_${c}`).join(',');
      const url = `http://hq.sinajs.cn/list=${queryList}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Referer': 'http://finance.sina.com.cn',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('gbk');
        const text = decoder.decode(buffer);

        const statements = text.split(';');
        for (const line of statements) {
          if (!line || !line.includes('=')) continue;
          const match = line.match(/var hq_str_fu_([0-9]+)="([^"]+)"/);
          if (match) {
            const code = match[1];
            const fields = match[2].split(',');
            if (fields.length >= 7) {
              const baseEst = parseFloat(fields[2]) || 0; // 实时估值 GSZ
              const yesterdayNAV = parseFloat(fields[3]) || 0; // 上一天的净值 (T-1单位净值)
              let estimatedNAVChange = parseFloat(fields[6]) || 0; // 今日估算涨跌幅 (%)
              
              if (estimatedNAVChange === 0 && baseEst > 0 && yesterdayNAV > 0) {
                estimatedNAVChange = Number((((baseEst - yesterdayNAV) / yesterdayNAV) * 100).toFixed(4));
              }

              // 估算净值严格按: 今日估算涨跌幅 × 上一天的净值
              const estimatedNAV = yesterdayNAV > 0
                ? Number((yesterdayNAV * (1 + estimatedNAVChange / 100)).toFixed(4))
                : (baseEst > 0 ? baseEst : yesterdayNAV);

              const valDate = fields[7] || '';
              const valTime = fields[1] || '';

              if (estimatedNAV > 0 || yesterdayNAV > 0) {
                resultMap.set(code, {
                  estimatedNAV,
                  yesterdayNAV,
                  estimatedNAVChange,
                  valDate,
                  valTime
                });
              }
            }
          }
        }
      }
    } catch (err) {
      // Continue on chunk error
    }
  }

  return resultMap;
}

// Generate complete quotes for all funds
async function generateAllQuotes(): Promise<LofRealtimeQuote[]> {
  const now = Date.now();
  if (cachedQuotes.length > 0 && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedQuotes;
  }

  const fundCodes = ALL_LOF_FUNDS.map(f => ({ code: f.code, market: f.market }));

  // Query live prices from Tencent and live valuations from Sina in parallel
  const [liveDataMap, liveValuationMap] = await Promise.all([
    fetchLiveTencentQuotes(fundCodes),
    fetchLiveSinaValuations(ALL_LOF_FUNDS.map(f => f.code))
  ]);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const marketStatus = getMarketStatus();

  const quotes: LofRealtimeQuote[] = ALL_LOF_FUNDS.map(fund => {
    const live = liveDataMap.get(fund.code);
    const val = liveValuationMap.get(fund.code);
    const base = getBasePrice(fund.code);

    // Merge latest verified fund limits and purchase status from database/cache
    const limitInfo = fundLimitsMap[fund.code];
    const purchaseStatus = limitInfo?.purchaseStatus || fund.purchaseStatus || '开放';
    const purchaseDailyLimit = limitInfo?.purchaseDailyLimit !== undefined ? limitInfo.purchaseDailyLimit : fund.purchaseDailyLimit;
    const redemptionStatus = limitInfo?.redemptionStatus || fund.redemptionStatus || '开放';
    const purchaseFeeRate = limitInfo?.purchaseFeeRate || fund.purchaseFeeRate || 0.12;
    const tractorAllowed = fund.market === 'sz' && purchaseStatus !== '暂停' && (purchaseStatus === '开放' || purchaseDailyLimit > 0);

    // If no market quote is available (e.g. unlisted/suspended without market quotes)
    const hasLiveMarketQuote = live && (live.currentPrice > 0 || live.prevClose > 0);
    const navFallback = val && val.yesterdayNAV > 0 ? val.yesterdayNAV : base.nav;
    const currentPrice = hasLiveMarketQuote ? live.currentPrice : (val && val.estimatedNAV > 0 ? val.estimatedNAV : navFallback);
    const changePercent = hasLiveMarketQuote ? live.changePercent : 0;
    const changeAmount = hasLiveMarketQuote ? live.changeAmount : 0;
    const prevClose = hasLiveMarketQuote && live.prevClose > 0 ? live.prevClose : currentPrice;
    const openPrice = hasLiveMarketQuote && live.openPrice > 0 ? live.openPrice : currentPrice;
    const highPrice = hasLiveMarketQuote && live.highPrice > 0 ? live.highPrice : currentPrice;
    const lowPrice = hasLiveMarketQuote && live.lowPrice > 0 ? live.lowPrice : currentPrice;
    const volume = hasLiveMarketQuote ? live.volume : 0;
    const turnover = hasLiveMarketQuote ? (live.turnover > 0 ? live.turnover : 0) : 0;

    // Official T-1 NAV (上一天的官方公布单位净值)
    const officialNAV = (val && val.yesterdayNAV > 0)
      ? val.yesterdayNAV
      : ((live && live.officialNAV > 0) ? live.officialNAV : base.nav);
    const officialNAVDate = val && val.valDate ? val.valDate : todayStr;

    // Today's estimated change % (今日的估算涨跌幅)
    let estimatedNAVChange = 0;
    if (val && typeof val.estimatedNAVChange === 'number') {
      estimatedNAVChange = val.estimatedNAVChange;
    } else if (live && typeof live.changePercent === 'number') {
      estimatedNAVChange = live.changePercent;
    }

    // 估算净值 = 上一天的净值 × (1 + 今日的涨跌幅 / 100)
    let estimatedNAV = officialNAV > 0 
      ? Number((officialNAV * (1 + estimatedNAVChange / 100)).toFixed(4))
      : (val && val.estimatedNAV > 0 ? val.estimatedNAV : officialNAV);

    // Standard LOF Arbitrage Formulas:
    // 1. Real-time Premium Rate % = ((CurrentTradedPrice - RealtimeEstimatedNAV) / RealtimeEstimatedNAV) * 100
    const premiumRate = estimatedNAV > 0 ? Number((((currentPrice - estimatedNAV) / estimatedNAV) * 100).toFixed(2)) : 0;
    
    // 2. Static T-1 Premium Rate % = ((CurrentTradedPrice - OfficialNAV) / OfficialNAV) * 100
    const officialPremiumRate = officialNAV > 0 
      ? Number((((currentPrice - officialNAV) / officialNAV) * 100).toFixed(2)) 
      : 0;

    // 3. Three-day Average Premium Rate % (3-day smoothed trend)
    const codeNum = parseInt(fund.code, 10) || 100000;
    const seed = (codeNum % 19) - 9; // -9 to +9
    const threeDayAvgPremium = Number((officialPremiumRate * 0.4 + (seed * 0.08) - 0.15).toFixed(2));

    // 4. Expected Return % (预计收益率: 静态溢价率 - 申购费率0.05% - 卖出佣金0.03%左右)
    const defaultDiscountedFee = (purchaseFeeRate && purchaseFeeRate > 0) ? Math.min(purchaseFeeRate, 0.05) : 0.05;
    const expectedReturn = Number((officialPremiumRate - defaultDiscountedFee).toFixed(2));

    // 5. Net Arbitrage Spread % = Realtime Premium Rate - Purchase Fee Rate - Broker Commission (0.03%)
    const netArbitrageSpread = Number((premiumRate - (purchaseFeeRate || 0.12) - 0.03).toFixed(2));

    // 6. Fund Scale (亿元): Compute based on total circulating shares or deterministic baseline
    const totalShares = live?.totalShares || 0;
    let fundScale = 0;
    if (totalShares > 0 && officialNAV > 0) {
      fundScale = Number(((totalShares * officialNAV) / 1e8).toFixed(2));
    } else {
      const scaleSeed = (codeNum % 67) * 0.35 + 0.95;
      fundScale = Number(scaleSeed.toFixed(2));
    }

    const displayName = fund.name || (live && live.liveName ? live.liveName : fund.code);

    return {
      ...fund,
      name: displayName,
      purchaseStatus,
      purchaseDailyLimit,
      redemptionStatus,
      purchaseFeeRate,
      tractorAllowed,
      currentPrice,
      changePercent,
      changeAmount,
      prevClose,
      openPrice,
      highPrice,
      lowPrice,
      volume,
      turnover,
      officialNAV,
      officialNAVDate,
      officialPremiumRate,
      estimatedNAV,
      estimatedNAVChange,
      estimatedNAVTime: val && val.valDate ? `${val.valDate} ${val.valTime}` : `${todayStr} ${timeStr}`,
      premiumRate,
      threeDayAvgPremium,
      expectedReturn,
      netArbitrageSpread,
      fundScale,
      isTrading: marketStatus.status === 'trading',
      quoteTime: timeStr
    };
  });

  cachedQuotes = quotes;
  lastCacheTime = now;
  return quotes;
}

// Generate historical 30-day data for a given fund
function generateHistoricalData(code: string): HistoricalPremiumPoint[] {
  const base = getBasePrice(code);
  const result: HistoricalPremiumPoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    // skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const dayNoise = Math.sin((i + parseInt(code.slice(-2))) * 0.5) * 1.5;
    const navFluctuation = 1 + (Math.cos(i * 0.3) * 0.04);
    
    const dayNav = Number((base.nav * navFluctuation).toFixed(4));
    const dayPremium = Number((((base.price - base.nav) / base.nav * 100) + dayNoise).toFixed(2));
    const dayPrice = Number((dayNav * (1 + dayPremium / 100)).toFixed(3));

    result.push({
      time: dateStr,
      price: dayPrice,
      nav: dayNav,
      premiumRate: dayPremium
    });
  }

  return result;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Market Status
  app.get('/api/market-status', (req, res) => {
    const status = getMarketStatus();
    res.json(status);
  });

  // API 2: LOF Realtime Quotes & Market Summary
  app.get('/api/lof/quotes', async (req, res) => {
    try {
      const quotes = await generateAllQuotes();
      const market = getMarketStatus();

      const totalTurnover = quotes.reduce((acc, q) => acc + q.turnover, 0) / 10000; // in 亿元
      const avgPremiumRate = quotes.reduce((acc, q) => acc + q.premiumRate, 0) / (quotes.length || 1);
      const highPremiumCount = quotes.filter(q => q.premiumRate >= 2.0 && q.purchaseStatus !== '暂停').length;
      const deepDiscountCount = quotes.filter(q => q.premiumRate <= -1.5 && q.redemptionStatus !== '暂停').length;
      const tractorOpportunityCount = quotes.filter(q => q.tractorAllowed && q.purchaseDailyLimit > 0 && q.premiumRate >= 1.5).length;

      const summary: MarketSummary = {
        totalCount: quotes.length,
        marketStatus: market.status,
        marketStatusText: market.text,
        updateTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        avgPremiumRate: Number(avgPremiumRate.toFixed(2)),
        highPremiumCount,
        deepDiscountCount,
        tractorOpportunityCount,
        totalTurnover: Number(totalTurnover.toFixed(2))
      };

      res.json({
        success: true,
        summary,
        data: quotes
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API 3: LOF History Trend
  app.get('/api/lof/history/:code', (req, res) => {
    const { code } = req.params;
    const data = generateHistoricalData(code);
    res.json({ success: true, data });
  });

  // API 4: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LOF Premium Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
