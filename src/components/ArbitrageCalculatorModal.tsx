import React, { useState, useEffect } from 'react';
import { LofRealtimeQuote } from '../types/lof';
import { calculateArbitrage } from '../services/lofApi';
import {
  X,
  Calculator,
  Tractor,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';

interface ArbitrageCalculatorModalProps {
  initialFund: LofRealtimeQuote | null;
  allFunds: LofRealtimeQuote[];
  onClose: () => void;
}

export const ArbitrageCalculatorModal: React.FC<ArbitrageCalculatorModalProps> = ({
  initialFund,
  allFunds,
  onClose
}) => {
  const [selectedFundCode, setSelectedFundCode] = useState<string>(
    initialFund?.code || (allFunds[0]?.code || '164824')
  );

  const selectedFund = allFunds.find(f => f.code === selectedFundCode) || initialFund || allFunds[0];

  // Parameters
  const [amount, setAmount] = useState<number>(
    selectedFund?.purchaseDailyLimit && selectedFund.purchaseDailyLimit > 0
      ? selectedFund.purchaseDailyLimit * 6
      : 10000
  );
  const [accountsCount, setAccountsCount] = useState<number>(2); // 2个主账户 (本人 + 家人)
  const [cardsPerAccount, setCardsPerAccount] = useState<number>(
    selectedFund?.market === 'sz' ? 6 : 1
  );
  const [dailyLimit, setDailyLimit] = useState<number>(
    selectedFund?.purchaseDailyLimit || 100
  );
  const [customNav, setCustomNav] = useState<number>(
    selectedFund?.estimatedNAV || 1.0
  );
  const [customPrice, setCustomPrice] = useState<number>(
    selectedFund?.currentPrice || 1.05
  );
  const [purchaseFeeRate, setPurchaseFeeRate] = useState<number>(
    selectedFund?.purchaseFeeRate || 0.12
  );
  const [brokerCommission, setBrokerCommission] = useState<number>(0.03); // 万三

  // Mode: 1. 拖拉机批量套利 2. 普通单账户溢价套利
  const [calcMode, setCalcMode] = useState<'tractor' | 'standard'>('tractor');

  // Sync parameters when selectedFund changes
  useEffect(() => {
    if (selectedFund) {
      setCustomNav(selectedFund.estimatedNAV);
      setCustomPrice(selectedFund.currentPrice);
      setPurchaseFeeRate(selectedFund.purchaseFeeRate);
      setDailyLimit(selectedFund.purchaseDailyLimit);
      setCardsPerAccount(selectedFund.market === 'sz' ? 6 : 1);
      if (selectedFund.purchaseDailyLimit > 0) {
        setAmount(selectedFund.purchaseDailyLimit * (selectedFund.market === 'sz' ? 6 : 1) * accountsCount);
      }
    }
  }, [selectedFundCode]);

  const result = calculateArbitrage({
    fundCode: selectedFund?.code || '164824',
    amount: calcMode === 'tractor'
      ? (dailyLimit > 0 ? dailyLimit * cardsPerAccount * accountsCount : amount)
      : amount,
    purchaseFeeRate,
    sellBrokerCommission: brokerCommission,
    estimatedNAV: customNav,
    currentPrice: customPrice,
    accountsCount: calcMode === 'tractor' ? accountsCount : 1,
    cardsPerAccount: calcMode === 'tractor' ? cardsPerAccount : 1,
    dailyLimitPerCard: dailyLimit
  });

  const totalSeats = calcMode === 'tractor' ? accountsCount * cardsPerAccount : 1;
  const currentPremiumRate = customNav > 0 ? ((customPrice - customNav) / customNav) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                LOF套利与拖拉机收益计算器
              </h2>
              <p className="text-xs text-slate-500">
                支持单标的溢价测算与深市6席位拖拉机多账户矩阵套利推演
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2 text-xs">
          <button
            onClick={() => setCalcMode('tractor')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              calcMode === 'tractor'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <Tractor className="w-3.5 h-3.5" />
            <span>🚜 拖拉机多账户批量套利 (推荐)</span>
          </button>

          <button
            onClick={() => setCalcMode('standard')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              calcMode === 'standard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>普通单账户溢价套利</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* 1. Target Fund Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                选择套利标的基金
              </label>
              <span className="text-[11px] text-slate-400">切换标的将自动代入最新现价与预估净值</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={selectedFundCode}
                onChange={(e) => setSelectedFundCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {allFunds.map((f) => (
                  <option key={f.code} value={f.code}>
                    [{f.market.toUpperCase()}] {f.code} - {f.name} (实时溢价: {f.premiumRate > 0 ? `+${f.premiumRate}` : f.premiumRate}%)
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500">当前实时溢价率:</span>
                <span
                  className={`font-mono font-extrabold text-sm ${
                    currentPremiumRate > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {currentPremiumRate > 0 ? `+${currentPremiumRate.toFixed(2)}` : currentPremiumRate.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-400">
                  ({selectedFund?.purchaseStatus || '开放'})
                </span>
              </div>
            </div>
          </div>

          {/* 2. Key Input Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {calcMode === 'tractor' ? (
              <>
                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                  <label className="font-semibold text-amber-900 block mb-1">
                    主证券账户数 (个)
                  </label>
                  <input
                    type="number"
                    value={accountsCount}
                    onChange={(e) => setAccountsCount(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={10}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-amber-700 mt-1 block">如本人+家人共2个主账户</span>
                </div>

                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                  <label className="font-semibold text-amber-900 block mb-1">
                    单账户深A股东席位数 (个)
                  </label>
                  <input
                    type="number"
                    value={cardsPerAccount}
                    onChange={(e) => setCardsPerAccount(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={6}
                    disabled={selectedFund?.market === 'sh'}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    {selectedFund?.market === 'sz' ? '深市常规最高支持 6 个席位' : '沪市标的仅支持 1 席位'}
                  </span>
                </div>

                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                  <label className="font-semibold text-amber-900 block mb-1">
                    单席位单日限额 (元)
                  </label>
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Math.max(0, Number(e.target.value)))}
                    step={100}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-amber-700 mt-1 block">填 0 表示不设限额</span>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 sm:col-span-3">
                <label className="font-semibold text-slate-700 block mb-1">
                  申购总金额 (元)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(10, Number(e.target.value)))}
                  step={1000}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Price & NAV custom tweaks */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                申购估值净值 (NAV)
              </label>
              <input
                type="number"
                value={customNav}
                onChange={(e) => setCustomNav(Math.max(0.0001, Number(e.target.value)))}
                step={0.001}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                预计场内卖出价 (现价)
              </label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(Math.max(0.001, Number(e.target.value)))}
                step={0.001}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                申购费率 (%)
              </label>
              <input
                type="number"
                value={purchaseFeeRate}
                onChange={(e) => setPurchaseFeeRate(Math.max(0, Number(e.target.value)))}
                step={0.01}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>

          </div>

          {/* 3. Output Profit Cards */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">套利收益测算报告</span>
                {calcMode === 'tractor' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    共 {totalSeats} 个拖拉机席位矩阵
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300">
                每日可申购上限: <strong className="text-white font-mono">¥{result.actualPurchaseAmount}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px]">单日净利润</span>
                <div className="text-lg font-mono font-extrabold text-emerald-400 mt-1">
                  ¥{result.netProfit > 0 ? `+${result.netProfit}` : result.netProfit}
                </div>
                <span className="text-[10px] text-slate-400">已扣除申购费与佣金</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px]">单次净收益率</span>
                <div className="text-lg font-mono font-extrabold text-rose-400 mt-1">
                  {result.netReturnRate > 0 ? `+${result.netReturnRate}` : result.netReturnRate}%
                </div>
                <span className="text-[10px] text-slate-400">单次周期约2个交易日</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px]">预计月度套利收益</span>
                <div className="text-lg font-mono font-extrabold text-amber-300 mt-1">
                  ¥{(result.netProfit * 20).toFixed(1)}
                </div>
                <span className="text-[10px] text-slate-400">按每月20个交易日测算</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px]">滚动资金池需求</span>
                <div className="text-lg font-mono font-extrabold text-white mt-1">
                  ¥{(result.actualPurchaseAmount * 2).toFixed(0)}
                </div>
                <span className="text-[10px] text-slate-400">T+2资金回笼平滑周转</span>
              </div>
            </div>

            {/* Practical Advice */}
            <div className="text-[11px] text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 leading-relaxed">
              <strong>📌 实操建议：</strong>
              若该基金每日限额 {dailyLimit} 元，建议使用深市6拖拉机席位在交易日上午9:30至下午15:00前完成场外申购；T+2日开盘直接在场内以市价或限价卖出。由于套利资金T+2即可回到证券可用余额，只需准备两天的资金量（约 ¥{(result.actualPurchaseAmount * 2).toFixed(0)}）即可实现无缝循环日日套利。
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            完成
          </button>
        </div>

      </div>
    </div>
  );
};
