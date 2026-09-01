import { ALL_LOF_FUNDS } from '../src/data/lofDatabase';
import * as fs from 'fs';
import * as path from 'path';

export interface FundLimitInfo {
  purchaseStatus: '开放' | '暂停' | '限大额';
  redemptionStatus: '开放' | '暂停';
  purchaseDailyLimit: number;
  purchaseDailyLimitDesc: string;
  tractorAllowed: boolean;
  purchaseFeeRate: number;
  rawSGZT: string;
  rawSHZT: string;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSingle(code: string): Promise<{ code: string; info: FundLimitInfo } | null> {
  try {
    const url = `https://fundmobapi.eastmoney.com/FundMApi/FundBaseTypeInformation.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.Datas;
    if (!d) return null;

    const sgzt: string = d.SGZT || '';
    const shzt: string = d.SHZT || '';
    const isBuy = d.BUY === true;

    let purchaseStatus: '开放' | '暂停' | '限大额' = '开放';
    if (sgzt.includes('暂停申购') || (!isBuy && !sgzt.includes('开放'))) {
      purchaseStatus = '暂停';
    } else if (sgzt.includes('限大额') || sgzt.includes('上限')) {
      purchaseStatus = '限大额';
    } else if (sgzt.includes('开放')) {
      purchaseStatus = '开放';
    }

    let redemptionStatus: '开放' | '暂停' = '开放';
    if (shzt.includes('暂停')) {
      redemptionStatus = '暂停';
    }

    let limit = 0;
    let limitDesc = '';
    const limitMatch = sgzt.match(/上限([0-9.]+)(万|千|亿)?元?/);
    if (limitMatch) {
      const num = parseFloat(limitMatch[1]);
      const unit = limitMatch[2];
      if (unit === '万') {
        limit = num * 10000;
        limitDesc = `${num}万/天`;
      } else if (unit === '千') {
        limit = num * 1000;
        limitDesc = `${num}千/天`;
      } else if (unit === '亿') {
        limit = num * 100000000;
        limitDesc = `${num}亿/天`;
      } else {
        limit = num;
        limitDesc = `${num}元/天`;
      }
    } else if (purchaseStatus === '暂停') {
      limit = 0;
      limitDesc = '暂停申购';
    } else {
      limit = 0;
      limitDesc = '不限额';
    }

    const rateStr: string = d.RATE || d.SOURCERATE || '0.12%';
    const purchaseFeeRate = parseFloat(rateStr.replace('%', '')) || 0.12;
    const tractorAllowed = (purchaseStatus === '限大额' && limit > 0) || purchaseStatus === '开放';

    return {
      code,
      info: {
        purchaseStatus,
        redemptionStatus,
        purchaseDailyLimit: limit,
        purchaseDailyLimitDesc: limitDesc,
        tractorAllowed,
        purchaseFeeRate,
        rawSGZT: sgzt,
        rawSHZT: shzt,
      },
    };
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log(`Starting fetch for ${ALL_LOF_FUNDS.length} funds...`);
  const limitMap: Record<string, FundLimitInfo> = {};
  const BATCH = 20;

  for (let i = 0; i < ALL_LOF_FUNDS.length; i += BATCH) {
    const chunk = ALL_LOF_FUNDS.slice(i, i + BATCH);
    const results = await Promise.all(chunk.map((f) => fetchSingle(f.code)));
    for (const r of results) {
      if (r) {
        limitMap[r.code] = r.info;
      }
    }
    if ((i + BATCH) % 100 === 0 || i + BATCH >= ALL_LOF_FUNDS.length) {
      console.log(`Progress: ${Math.min(i + BATCH, ALL_LOF_FUNDS.length)} / ${ALL_LOF_FUNDS.length}`);
    }
    await sleep(120);
  }

  console.log(`Done! Fetched ${Object.keys(limitMap).length} fund limits.`);
  const outputPath = path.join(process.cwd(), 'src/data/fundLimitsData.json');
  fs.writeFileSync(outputPath, JSON.stringify(limitMap, null, 2), 'utf-8');
  console.log(`Saved output to ${outputPath}`);
}

run();
