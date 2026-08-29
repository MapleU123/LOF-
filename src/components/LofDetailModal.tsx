import React, { useEffect, useState } from 'react';
import { LofRealtimeQuote, HistoricalPremiumPoint } from '../types/lof';
import { fetchLofHistory, calculateArbitrage } from '../services/lofApi';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calculator,
  Calendar,
  Layers,
  Building,
  Tag,
  DollarSign,
  ShieldCheck,
  Tractor,
  ExternalLink,
  Clock,
  ArrowRight,
  CheckSquare,
  Square,
  Image as ImageIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface LofDetailModalProps {
  fund: LofRealtimeQuote | null;
  onClose: () => void;
  isCnColorMode: boolean;
  onOpenFullCalculator: (fund: LofRealtimeQuote) => void;
  isSelected?: boolean;
  onToggleSelect?: (code: string) => void;
  onExportSingleImage?: (fund: LofRealtimeQuote) => void;
}

export const LofDetailModal: React.FC<LofDetailModalProps> = ({
  fund,
  onClose,
  isCnColorMode,
  onOpenFullCalculator,
  isSelected = false,
  onToggleSelect,
  onExportSingleImage
}) => {
  const [historyData, setHistoryData] = useState<HistoricalPremiumPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'trend' | 'arbitrage' | 'info'>('trend');

  // Quick Simulation state
  const [simAmount, setSimAmount] = useState(fund?.purchaseDailyLimit && fund.purchaseDailyLimit > 0 ? fund.purchaseDailyLimit : 10000);
  const [simAccounts, setSimAccounts] = useState(1);
  const [simCards, setSimCards] = useState(fund?.tractorAllowed ? 6 : 1);

  useEffect(() => {
    if (!fund) return;
    setLoadingHistory(true);
    fetchLofHistory(fund.code).then((data) => {
      setHistoryData(data);
      setLoadingHistory(false);
    });
  }, [fund?.code]);

  if (!fund) return null;

  const simResult = calculateArbitrage({
    fundCode: fund.code,
    amount: simAmount,
    purchaseFeeRate: fund.purchaseFeeRate,
    sellBrokerCommission: 0.03,
    estimatedNAV: fund.estimatedNAV,
    currentPrice: fund.currentPrice,
    accountsCount: simAccounts,
    cardsPerAccount: simCards,
    dailyLimitPerCard: fund.purchaseDailyLimit
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {fund.market === 'sz' ? '深' : '沪'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">{fund.name}</h2>
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                  {fund.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  {fund.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                跟踪标的: <strong className="text-slate-700">{fund.trackingTarget}</strong> • 管理人: {fund.manager}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <button
                type="button"
                onClick={() => onToggleSelect(fund.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                }`}
                title={isSelected ? '已勾选用于导出' : '勾选此基金用于导出长图'}
              >
                {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isSelected ? '已勾选' : '勾选导出'}</span>
              </button>
            )}

            {onExportSingleImage && (
              <button
                type="button"
                onClick={() => onExportSingleImage(fund)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="为此基金生成海报长图"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>生成海报</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Metric Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-6 py-3.5 bg-slate-50/40 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-500">场内现价</span>
            <div className="text-lg font-mono font-bold text-slate-900">
              {fund.currentPrice.toFixed(3)}
              <span className={`text-xs ml-1.5 font-normal ${fund.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {fund.changePercent >= 0 ? `+${fund.changePercent.toFixed(2)}` : fund.changePercent.toFixed(2)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400">成交: {fund.turnover <= 0 ? '无成交' : `${fund.turnover.toFixed(1)}万`}</span>
          </div>

          <div>
            <span className="text-slate-500">官方公布净值 (T-1)</span>
            <div className="text-lg font-mono font-bold text-slate-900">
              {fund.officialNAV.toFixed(4)}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">{fund.officialNAVDate}</span>
          </div>

          <div>
            <span className="text-slate-500">实时估值 (GSZ)</span>
            <div className="text-lg font-mono font-bold text-slate-900">
              {fund.estimatedNAV.toFixed(4)}
              <span className={`text-xs ml-1 font-normal ${fund.estimatedNAVChange >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {fund.estimatedNAVChange >= 0 ? `+${fund.estimatedNAVChange.toFixed(2)}` : fund.estimatedNAVChange.toFixed(2)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400">{fund.estimatedNAVTime.includes(' ') ? fund.estimatedNAVTime.split(' ')[1] : '盘中'}</span>
          </div>

          <div className="bg-blue-50/40 p-1.5 rounded-lg border border-blue-100">
            <span className="text-blue-950 font-bold">静态/估算溢价率</span>
            <div className="text-base font-mono font-black text-rose-600 mt-0.5">
              {fund.officialPremiumRate >= 0 ? `+${fund.officialPremiumRate.toFixed(2)}` : fund.officialPremiumRate.toFixed(2)}%
              <span className="text-slate-400 font-normal text-xs"> / </span>
              <span className={fund.premiumRate >= 0 ? 'text-rose-600 text-sm' : 'text-emerald-600 text-sm'}>
                {fund.premiumRate >= 0 ? `+${fund.premiumRate.toFixed(2)}` : fund.premiumRate.toFixed(2)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500">3日均溢: {fund.threeDayAvgPremium >= 0 ? `+${fund.threeDayAvgPremium.toFixed(2)}` : fund.threeDayAvgPremium.toFixed(2)}%</span>
          </div>

          <div>
            <span className="text-slate-500">预计套利收益率</span>
            <div className="text-lg font-mono font-extrabold text-amber-700">
              {fund.expectedReturn >= 0 ? `+${fund.expectedReturn.toFixed(2)}` : fund.expectedReturn.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {fund.purchaseDailyLimit > 0 ? `限额 ${fund.purchaseDailyLimit}元` : fund.purchaseStatus}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('trend')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'trend'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>30日折溢价与价格走势</span>
          </button>

          <button
            onClick={() => setActiveTab('arbitrage')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'arbitrage'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>实时套利收益测算</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>基金档案与规则</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Tab 1: Trend Charts */}
          {activeTab === 'trend' && (
            <div className="space-y-6">
              
              {/* Premium Rate Area Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    30日折溢价率走势 (%)
                  </h4>
                  <span className="text-[11px] text-slate-400">正数=溢价 (场内买贵)，负数=折价 (场内便宜)</span>
                </div>

                <div className="h-56 w-full bg-slate-50/50 p-2 rounded-xl border border-slate-200">
                  {historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="premiumGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} unit="%" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                          formatter={(value: any) => [`${value}%`, '溢价率']}
                        />
                        <Area
                          type="monotone"
                          dataKey="premiumRate"
                          stroke="#e11d48"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#premiumGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">加载走势数据中...</div>
                  )}
                </div>
              </div>

              {/* Price vs NAV Line Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    场内收盘价 vs 基金单位净值对比
                  </h4>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <span className="w-2.5 h-0.5 bg-blue-600"></span> 场内现价
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <span className="w-2.5 h-0.5 bg-emerald-600"></span> 基金净值 (NAV)
                    </span>
                  </div>
                </div>

                <div className="h-56 w-full bg-slate-50/50 p-2 rounded-xl border border-slate-200">
                  {historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                        />
                        <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} name="场内价格" />
                        <Line type="monotone" dataKey="nav" stroke="#059669" strokeWidth={2} dot={false} strokeDasharray="4 4" name="基金净值" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">加载走势数据中...</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Arbitrage Simulation */}
          {activeTab === 'arbitrage' && (
            <div className="space-y-4">
              
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 text-xs">
                <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  当前标的实时套利收益模型
                </h4>
                <p className="text-blue-700 leading-relaxed">
                  按照 <strong>实时预估净值 {fund.estimatedNAV}</strong> 申购，预计 <strong>T+2日</strong> 场内以 <strong>现价 {fund.currentPrice}</strong> 卖出。
                  {fund.tractorAllowed && ' 该基金为深市LOF，支持单账户挂6个股东号进行拖拉机限额套利。'}
                </p>
              </div>

              {/* Simulation Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    拟投入申购总金额 (元)
                  </label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Math.max(10, Number(e.target.value)))}
                    step={100}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    主证券账户数 (个)
                  </label>
                  <input
                    type="number"
                    value={simAccounts}
                    onChange={(e) => setSimAccounts(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={10}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    单账户拖拉机席位数 (个)
                  </label>
                  <input
                    type="number"
                    value={simCards}
                    onChange={(e) => setSimCards(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={6}
                    disabled={!fund.tractorAllowed}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  />
                  {!fund.tractorAllowed && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">沪市标的仅支持单席位</span>
                  )}
                </div>
              </div>

              {/* Simulation Result Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">套利收益测算结果</span>
                  <span className="text-xs text-slate-500">
                    实际申购额: <strong className="text-slate-900 font-mono">¥{simResult.actualPurchaseAmount}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-500">申购手续费</span>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">¥{simResult.purchaseFee}</div>
                    <span className="text-[10px] text-slate-400">费率 {fund.purchaseFeeRate}%</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-500">预计确认份额</span>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{simResult.acquiredShares} 份</div>
                    <span className="text-[10px] text-slate-400">按估值净值折算</span>
                  </div>

                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="text-emerald-700 font-medium">预计净利润</span>
                    <div className="font-mono font-extrabold text-emerald-700 text-sm mt-0.5">
                      ¥{simResult.netProfit > 0 ? `+${simResult.netProfit}` : simResult.netProfit}
                    </div>
                    <span className="text-[10px] text-emerald-600">扣除双边所有费用</span>
                  </div>

                  <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200/60">
                    <span className="text-rose-700 font-medium">单次净收益率</span>
                    <div className="font-mono font-extrabold text-rose-700 text-sm mt-0.5">
                      {simResult.netReturnRate > 0 ? `+${simResult.netReturnRate}` : simResult.netReturnRate}%
                    </div>
                    <span className="text-[10px] text-rose-600">周期仅约2交易日</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <h5 className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    套利流转时间表
                  </h5>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span>{simResult.timeline.t0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      <span>{simResult.timeline.t1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-slate-800">{simResult.timeline.t2}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Detailed Info */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1.5">交易与套利规则</h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">上市交易所</span>
                    <span className="font-semibold text-slate-900">{fund.market === 'sz' ? '深圳证券交易所 (深市)' : '上海证券交易所 (沪市)'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">套利周期</span>
                    <span className="font-semibold text-slate-900">{fund.settlementDays}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">申购费率 (场外/场内)</span>
                    <span className="font-mono text-slate-900">{fund.purchaseFeeRate}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">赎回费率</span>
                    <span className="font-mono text-slate-900">{fund.redemptionFeeRate}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">拖拉机多号支持</span>
                    <span className="font-semibold text-purple-700">{fund.tractorAllowed ? '支持 (深市6股东席位)' : '不支持 (沪市单席位)'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1.5">基金基本属性</h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">基金管理人</span>
                    <span className="font-semibold text-slate-900">{fund.manager}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">所属分类</span>
                    <span className="font-semibold text-slate-900">{fund.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">跟踪标的</span>
                    <span className="font-semibold text-slate-900">{fund.trackingTarget}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">官方T-1净值</span>
                    <span className="font-mono text-slate-900">{fund.officialNAV} ({fund.officialNAVDate})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">场内成交量</span>
                    <span className="font-mono text-slate-900">{fund.volume} 手</span>
                  </div>
                </div>

              </div>

              {fund.description && (
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
                  <strong>💡 标的特征与套利技巧：</strong>
                  {fund.description}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            行情时间: <span className="font-mono">{fund.quoteTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenFullCalculator(fund)}
              className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>打开独立套利计算器</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
