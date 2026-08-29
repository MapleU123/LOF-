export type LofCategory =
  | '全部'
  | 'QDII海外'
  | '原油商品'
  | '港股互联'
  | '行业主题'
  | '宽基指数'
  | '债券固收'
  | '债券REITs'
  | '主动权益'
  | '混合策略'
  | '科技互联'
  | '医药医疗'
  | '消费白酒'
  | '新能源'
  | '红利价值'
  | string;

export type ArbitrageOpportunityType = 'all' | 'premium' | 'discount' | 'tractor' | 'high_volume' | 'watchlist';

export interface LofFundBase {
  code: string;               // 6位代码，如 "164824", "501018"
  name: string;               // 简称，如 "印度基金LOF", "南方原油"
  market: 'sz' | 'sh';        // 交易所：深圳/上海
  category: LofCategory;      // 分类
  trackingTarget: string;     // 跟踪标的，如 "MSCI印度指数", "WTI原油"
  manager: string;            // 基金公司，如 "华宝基金", "南方基金"
  purchaseStatus: string;     // 申购状态，如 "开放", "限额100元", "限额500元", "暂停"
  purchaseDailyLimit: number; // 每日申购限额 (元)，0表示不限额
  redemptionStatus: string;   // 赎回状态，如 "开放", "暂停"
  purchaseFeeRate: number;    // 申购费率 (%)，如 0.12%
  redemptionFeeRate: number;  // 赎回费率 (%)，如 0.5%
  tractorAllowed: boolean;    // 是否支持拖拉机 (深圳市场可单账户挂6个股东号)
  settlementDays: string;     // 套利周期，如 "T+2可卖", "T+3可卖"
  pinyin: string;             // 拼音简写，如 "ydjj", "sfyy"
  fundScale?: number;         // 基金规模 (亿元)
  description?: string;       // 基金特征说明
}

export interface WatchlistItem {
  code: string;
  tags: string[];      // e.g. ['套利池', '观察池']
  note?: string;       // Custom user note e.g. '每天限额100，套利收益高'
  updatedAt?: string;
}

export const PRESET_WATCHLIST_TAGS = [
  '套利池',
  '观察池',
  '核心底仓',
  '高溢价监控',
  '深度折价',
  '定投池',
  '大宗商品'
] as const;

export interface LofRealtimeQuote extends LofFundBase {
  currentPrice: number;          // 场内最新价
  changePercent: number;        // 场内现价涨跌幅 (%)
  changeAmount: number;         // 场内现价涨跌额
  prevClose: number;            // 昨收价
  openPrice: number;            // 今开盘
  highPrice: number;            // 最高价
  lowPrice: number;             // 最低价
  volume: number;               // 成交量 (手)
  turnover: number;             // 成交额 (万元)
  
  officialNAV: number;          // 最新官方单位净值 (T-1)
  officialNAVDate: string;      // 官方净值日期
  officialPremiumRate: number;  // 静态T-1溢价率 (%) = (现价 - 官方净值) / 官方净值 * 100
  
  estimatedNAV: number;         // 盘中实时预估净值 (IOPV/GSZ)
  estimatedNAVChange: number;   // 预估净值涨跌幅 (%)
  estimatedNAVTime: string;     // 估值更新时间
  
  premiumRate: number;          // 实时估算溢价率 (%) = (现价 - 实时估值) / 实时估值 * 100
  threeDayAvgPremium: number;   // 三日平均溢价率 (%)
  expectedReturn: number;       // 预计收益率 (%) = 静态溢价率 - 申购费率 (通常0.05%~0.12%)
  netArbitrageSpread: number;   // 扣除申购/交易费率后的净溢价空间 (%)
  
  isTrading: boolean;           // 是否正在交易
  quoteTime: string;            // 行情时间
  isCustomAlert?: boolean;      // 是否触发自定义预警
  
  // Custom user tags & note for this fund
  watchlistInfo?: WatchlistItem;
}

export interface MarketSummary {
  totalCount: number;
  marketStatus: 'trading' | 'midday' | 'closed' | 'pre_market';
  marketStatusText: string;
  updateTime: string;
  avgPremiumRate: number;
  highPremiumCount: number;     // 溢价率 > 2%
  deepDiscountCount: number;    // 折价率 < -1.5%
  tractorOpportunityCount: number; // 高溢价且限额可套利
  totalTurnover: number;        // 总成交额 (亿元)
}

export interface ArbitrageCalculationParams {
  fundCode: string;
  amount: number;               // 申购总金额 (元)
  purchaseFeeRate: number;      // 申购费率 (%)
  sellBrokerCommission: number; // 场内卖出佣金费率 (%)
  estimatedNAV: number;         // 估算申购净值
  currentPrice: number;         // 预计场内卖出价格
  accountsCount: number;        // 主证券账户数量
  cardsPerAccount: number;      // 每个账户绑定的拖拉机席位数量 (通常深市为6)
  dailyLimitPerCard: number;    // 单个席位单日限额 (元)
}

export interface ArbitrageCalculationResult {
  totalInvestment: number;      // 总投资额
  actualPurchaseAmount: number; // 实际可申购额 (受限额与账户数约束)
  purchaseFee: number;          // 申购费
  acquiredShares: number;       // 获得份额
  sellGrossAmount: number;      // 场内卖出总额
  sellFee: number;              // 卖出佣金
  netProfit: number;            // 净利润 (元)
  netReturnRate: number;        // 净收益率 (%)
  annualizedReturnRate: number; // 预估年化收益率 (按套利周期2天计算)
  timeline: {
    t0: string;
    t1: string;
    t2: string;
    t3: string;
  };
}

export interface HistoricalPremiumPoint {
  time: string;
  price: number;
  nav: number;
  premiumRate: number;
}
