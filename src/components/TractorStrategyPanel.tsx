import React from 'react';
import { LofRealtimeQuote } from '../types/lof';
import {
  X,
  Tractor,
  TrendingUp,
  Sparkles,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Calculator,
  CheckCircle
} from 'lucide-react';

interface TractorStrategyPanelProps {
  quotes: LofRealtimeQuote[];
  onClose: () => void;
  onSelectFund: (fund: LofRealtimeQuote) => void;
  onOpenCalculatorWithFund: (fund: LofRealtimeQuote) => void;
}

export const TractorStrategyPanel: React.FC<TractorStrategyPanelProps> = ({
  quotes,
  onClose,
  onSelectFund,
  onOpenCalculatorWithFund
}) => {
  // Filter tractor opportunities: Shenzhen, has limit or open, premium > 1.0%
  const tractorFunds = quotes
    .filter(q => q.market === 'sz' && q.tractorAllowed && q.purchaseStatus !== '暂停')
    .sort((a, b) => b.premiumRate - a.premiumRate);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/30">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  深市拖拉机限额套利专区
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  共 {tractorFunds.length} 只标的
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                深市LOF支持单账户加挂6个深A股东卡，批量申购限额高溢价标的，无惧限额放大收益
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

        {/* Banner */}
        <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>套利法则：</strong> 优先选择 <strong>限额100~500元、实时溢价率&ge;2%、场内成交活跃</strong> 的QDII或商品LOF，单日打满6个席位。
            </span>
          </div>
        </div>

        {/* List of Tractor Funds */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tractorFunds.map((fund) => {
              const dailyQuota6Seats = (fund.purchaseDailyLimit || 10000) * 6;
              const estDailyProfit = (dailyQuota6Seats * (fund.netArbitrageSpread / 100)).toFixed(1);

              return (
                <div
                  key={fund.code}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {fund.code}
                        </span>
                        <strong className="text-slate-800 text-sm">{fund.name}</strong>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                          深市6卡
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        标的: {fund.trackingTarget}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">实时溢价率</div>
                      <div className={`font-mono text-base font-extrabold ${fund.premiumRate > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {fund.premiumRate > 0 ? `+${fund.premiumRate.toFixed(2)}` : fund.premiumRate.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Quota & Profit Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400">单席限额</span>
                      <div className="font-semibold text-slate-800">
                        {fund.purchaseDailyLimit > 0 ? `¥${fund.purchaseDailyLimit}` : '不限额'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">6席满打总额</span>
                      <div className="font-semibold text-amber-800">
                        {fund.purchaseDailyLimit > 0 ? `¥${dailyQuota6Seats}` : '按需申购'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">单日预计净利</span>
                      <div className="font-bold text-emerald-600 font-mono">
                        {fund.purchaseDailyLimit > 0 ? `¥+${estDailyProfit}` : `${fund.netArbitrageSpread}%`}
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      场内现价: <strong className="font-mono text-slate-800">{fund.currentPrice}</strong> (估值: {fund.estimatedNAV})
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenCalculatorWithFund(fund)}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>收益推演</span>
                      </button>

                      <button
                        onClick={() => onSelectFund(fund)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                      >
                        详情走势
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
