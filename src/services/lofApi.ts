import {
  LofRealtimeQuote,
  MarketSummary,
  HistoricalPremiumPoint,
  ArbitrageCalculationParams,
  ArbitrageCalculationResult
} from '../types/lof';
import { ALL_LOF_FUNDS } from '../data/lofDatabase';

export async function fetchLofQuotes(): Promise<{
  summary: MarketSummary;
  quotes: LofRealtimeQuote[];
}> {
  try {
    const res = await fetch('/api/lof/quotes');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json = await res.json();
    if (json && json.success) {
      return {
        summary: json.summary,
        quotes: json.data
      };
    }
    throw new Error('API returned unsuccessful response');
  } catch (error) {
    console.warn('Using client-side fallback quote generator:', error);
    // Fallback data generator
    return generateFallbackQuotes();
  }
}

export async function fetchLofHistory(code: string): Promise<HistoricalPremiumPoint[]> {
  try {
    const res = await fetch(`/api/lof/history/${code}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success) {
        return json.data;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch history:', error);
  }
  return [];
}

// Client fallback if network offline
function generateFallbackQuotes(): { summary: MarketSummary; quotes: LofRealtimeQuote[] } {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  const quotes: LofRealtimeQuote[] = ALL_LOF_FUNDS.map(fund => {
    const seed = parseInt(fund.code, 10);
    const basePrice = 0.95 + ((seed % 1200) / 1000);
    const changePercent = Number((((seed % 60) - 28) / 10).toFixed(2));
    const currentPrice = Number((basePrice * (1 + changePercent / 100)).toFixed(3));
    const prevClose = Number((currentPrice / (1 + changePercent / 100)).toFixed(3));
    const officialNAV = Number(basePrice.toFixed(4));
    const estimatedNAVChange = Number((changePercent * 0.8).toFixed(2));
    const estimatedNAV = Number((officialNAV * (1 + estimatedNAVChange / 100)).toFixed(4));
    
    // Premium Rate = (Price - EstNAV) / EstNAV * 100
    const premiumRate = Number((((currentPrice - estimatedNAV) / estimatedNAV) * 100).toFixed(2));
    const officialPremiumRate = Number((((currentPrice - officialNAV) / officialNAV) * 100).toFixed(2));
    const threeDayAvgPremium = Number((officialPremiumRate * 0.4 + (((seed % 19) - 9) * 0.08) - 0.15).toFixed(2));
    const defaultDiscountedFee = (fund.purchaseFeeRate && fund.purchaseFeeRate > 0) ? Math.min(fund.purchaseFeeRate, 0.05) : 0.05;
    const expectedReturn = Number((officialPremiumRate - defaultDiscountedFee).toFixed(2));
    const netArbitrageSpread = Number((premiumRate - (fund.purchaseFeeRate || 0.12) - 0.03).toFixed(2));
    const volume = Math.floor(1500 + (seed % 6000));
    const turnover = Number(((volume * currentPrice * 100) / 10000).toFixed(2));

    return {
      ...fund,
      currentPrice,
      changePercent,
      changeAmount: Number((currentPrice * changePercent / 100).toFixed(3)),
      prevClose,
      openPrice: Number((prevClose * 1.002).toFixed(3)),
      highPrice: Math.max(currentPrice, prevClose),
      lowPrice: Math.min(currentPrice, prevClose),
      volume,
      turnover,
      officialNAV,
      officialNAVDate: todayStr,
      officialPremiumRate,
      estimatedNAV,
      estimatedNAVChange,
      estimatedNAVTime: `${todayStr} ${timeStr}`,
      premiumRate,
      threeDayAvgPremium,
      expectedReturn,
      netArbitrageSpread,
      isTrading: true,
      quoteTime: timeStr
    };
  });

  const totalTurnover = quotes.reduce((acc, q) => acc + q.turnover, 0) / 10000;
  const avgPremiumRate = quotes.reduce((acc, q) => acc + q.premiumRate, 0) / quotes.length;
  const highPremiumCount = quotes.filter(q => q.premiumRate >= 2.0 && q.purchaseStatus !== '暂停').length;
  const deepDiscountCount = quotes.filter(q => q.premiumRate <= -1.5 && q.redemptionStatus !== '暂停').length;
  const tractorOpportunityCount = quotes.filter(q => q.tractorAllowed && q.purchaseDailyLimit > 0 && q.premiumRate >= 1.5).length;

  return {
    summary: {
      totalCount: quotes.length,
      marketStatus: 'trading',
      marketStatusText: '交易中 (模拟)',
      updateTime: timeStr,
      avgPremiumRate: Number(avgPremiumRate.toFixed(2)),
      highPremiumCount,
      deepDiscountCount,
      tractorOpportunityCount,
      totalTurnover: Number(totalTurnover.toFixed(2))
    },
    quotes
  };
}

// Watchlist & Tags Helpers
const WATCHLIST_STORAGE_KEY = 'lof_tracker_watchlist_v2';
const LEGACY_WATCHLIST_STORAGE_KEY = 'lof_tracker_watchlist_v1';

export function getWatchlistMap(): Record<string, import('../types/lof').WatchlistItem> {
  try {
    const data = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Migration from legacy array format
    const legacy = localStorage.getItem(LEGACY_WATCHLIST_STORAGE_KEY);
    if (legacy) {
      const arr: string[] = JSON.parse(legacy);
      const initialMap: Record<string, import('../types/lof').WatchlistItem> = {};
      arr.forEach(code => {
        initialMap[code] = {
          code,
          tags: ['套利池'],
          note: '',
          updatedAt: new Date().toISOString()
        };
      });
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(initialMap));
      return initialMap;
    }
    // Default seed
    const defaultList = ['164824', '501018', '162411', '161129', '161226', '160140'];
    const defaultMap: Record<string, import('../types/lof').WatchlistItem> = {};
    defaultList.forEach(code => {
      const defaultTag = (code === '164824' || code === '162411') ? '套利池' : '观察池';
      defaultMap[code] = {
        code,
        tags: [defaultTag],
        note: code === '164824' ? '限额100元，常年溢价套利' : '',
        updatedAt: new Date().toISOString()
      };
    });
    return defaultMap;
  } catch {
    return {
      '164824': { code: '164824', tags: ['套利池'], note: '常年溢价套利', updatedAt: '' }
    };
  }
}

export function getWatchlist(): string[] {
  const map = getWatchlistMap();
  return Object.keys(map);
}

export function saveWatchlistMap(map: Record<string, import('../types/lof').WatchlistItem>): void {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(map));
    // Keep legacy key synced
    localStorage.setItem(LEGACY_WATCHLIST_STORAGE_KEY, JSON.stringify(Object.keys(map)));
  } catch (e) {
    console.error('Failed to save watchlist', e);
  }
}

export function toggleWatchlist(code: string, defaultTags: string[] = ['套利池']): Record<string, import('../types/lof').WatchlistItem> {
  const map = { ...getWatchlistMap() };
  if (map[code]) {
    delete map[code];
  } else {
    map[code] = {
      code,
      tags: defaultTags.length > 0 ? defaultTags : ['套利池'],
      note: '',
      updatedAt: new Date().toISOString()
    };
  }
  saveWatchlistMap(map);
  return map;
}

export function updateWatchlistItem(code: string, tags: string[], note: string = ''): Record<string, import('../types/lof').WatchlistItem> {
  const map = { ...getWatchlistMap() };
  map[code] = {
    code,
    tags: tags.filter(t => t.trim().length > 0),
    note: note.trim(),
    updatedAt: new Date().toISOString()
  };
  saveWatchlistMap(map);
  return map;
}

export function getAllUsedTags(): string[] {
  const map = getWatchlistMap();
  const tagSet = new Set<string>(['套利池', '观察池', '核心底仓', '高溢价监控', '深度折价', '定投池']);
  Object.values(map).forEach(item => {
    if (Array.isArray(item.tags)) {
      item.tags.forEach(t => {
        if (t && t.trim() && t.trim() !== '全部标签') tagSet.add(t.trim());
      });
    }
  });
  return Array.from(tagSet);
}

// Arbitrage Profit Calculator
export function calculateArbitrage(params: ArbitrageCalculationParams): ArbitrageCalculationResult {
  const {
    amount,
    purchaseFeeRate,
    sellBrokerCommission,
    estimatedNAV,
    currentPrice,
    accountsCount,
    cardsPerAccount,
    dailyLimitPerCard
  } = params;

  // Max quota calculation (if limited)
  const totalCards = Math.max(1, accountsCount * cardsPerAccount);
  let actualPurchaseAmount = amount;
  if (dailyLimitPerCard > 0) {
    const maxCapacity = totalCards * dailyLimitPerCard;
    actualPurchaseAmount = Math.min(amount, maxCapacity);
  }

  // 1. Purchase Fee calculation (申购费)
  const feeRate = (purchaseFeeRate || 0.12) / 100;
  // Net subscription amount = Amount / (1 + feeRate)
  const netSubscribed = actualPurchaseAmount / (1 + feeRate);
  const purchaseFee = actualPurchaseAmount - netSubscribed;

  // 2. Acquired Shares (份额确认)
  const nav = estimatedNAV > 0 ? estimatedNAV : 1.0;
  const acquiredShares = netSubscribed / nav;

  // 3. Gross Sell Amount (场内卖出)
  const sellPrice = currentPrice > 0 ? currentPrice : nav;
  const sellGrossAmount = acquiredShares * sellPrice;

  // 4. Broker commission (卖出交易佣金，通常万分之五或万分之三，最低无5元限制的券商居多)
  const brokerRate = (sellBrokerCommission || 0.03) / 100;
  const sellFee = sellGrossAmount * brokerRate;

  // 5. Net Profit & Yield
  const totalCost = actualPurchaseAmount;
  const netProceeds = sellGrossAmount - sellFee;
  const netProfit = netProceeds - totalCost;
  const netReturnRate = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  // Annualized: T+2 turnover (approx. 2.5 trading days = 100 cycles/year)
  const annualizedReturnRate = netReturnRate * 100;

  const now = new Date();
  const formatDay = (days: number) => {
    const d = new Date(now.getTime() + days * 24 * 3600 * 1000);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return {
    totalInvestment: amount,
    actualPurchaseAmount: Number(actualPurchaseAmount.toFixed(2)),
    purchaseFee: Number(purchaseFee.toFixed(2)),
    acquiredShares: Math.floor(acquiredShares),
    sellGrossAmount: Number(sellGrossAmount.toFixed(2)),
    sellFee: Number(sellFee.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    netReturnRate: Number(netReturnRate.toFixed(2)),
    annualizedReturnRate: Number(annualizedReturnRate.toFixed(2)),
    timeline: {
      t0: `T日 (${formatDay(0)} 15:00前): 场外申购申报`,
      t1: `T+1日 (${formatDay(1)}): 基金公司按T日净值确认份额`,
      t2: `T+2日 (${formatDay(2)}): 份额到账，场内集合竞价或开盘即可卖出`,
      t3: `T+2日 资金即刻可用，可再次申购循环套利`
    }
  };
}
