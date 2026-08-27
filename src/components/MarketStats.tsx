import React from 'react';
import { MarketSummary } from '../types/lof';
import {
  TrendingUp,
  TrendingDown,
  Tractor,
  Layers,
  CircleDot,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface MarketStatsProps {
  summary: MarketSummary | null;
  onFilterHighPremium: () => void;
  onFilterDeepDiscount: () => void;
  onFilterTractor: () => void;
  onShowAll: () => void;
  activeQuickFilter: string;
}

export const MarketStats: React.FC<MarketStatsProps> = ({
  summary,
  onFilterHighPremium,
  onFilterDeepDiscount,
  onFilterTractor,
  onShowAll,
  activeQuickFilter
}) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      
      {/* 1. All Monitored Funds */}
      <div
        onClick={onShowAll}
        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
          activeQuickFilter === 'all'
            ? 'border-blue-500 ring-2 ring-blue-500/10'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">监控LOF总数</span>
          <Layers className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900">{summary.totalCount}</span>
          <span className="text-xs text-slate-400">只</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>全市场精选</span>
          <span className="text-blue-600 font-medium">查看全部</span>
        </div>
      </div>

      {/* 2. High Premium Opportunities */}
      <div
        onClick={onFilterHighPremium}
        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
          activeQuickFilter === 'premium'
            ? 'border-rose-500 ring-2 ring-rose-500/10'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">高溢价套利机会</span>
          <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-rose-600">
            {summary.highPremiumCount}
          </span>
          <span className="text-xs text-slate-400">只</span>
        </div>
        <div className="text-[11px] text-rose-600/90 font-medium mt-1 flex items-center justify-between">
          <span>溢价 &ge; 2.0%</span>
          <span className="underline">申购套利</span>
        </div>
      </div>

      {/* 3. Deep Discount Opportunities */}
      <div
        onClick={onFilterDeepDiscount}
        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
          activeQuickFilter === 'discount'
            ? 'border-emerald-500 ring-2 ring-emerald-500/10'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">深度折价机会</span>
          <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-emerald-600">
            {summary.deepDiscountCount}
          </span>
          <span className="text-xs text-slate-400">只</span>
        </div>
        <div className="text-[11px] text-emerald-600/90 font-medium mt-1 flex items-center justify-between">
          <span>折价 &le; -1.5%</span>
          <span className="underline">买入赎回</span>
        </div>
      </div>

      {/* 4. Tractor Targets */}
      <div
        onClick={onFilterTractor}
        className={`bg-white p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
          activeQuickFilter === 'tractor'
            ? 'border-amber-500 ring-2 ring-amber-500/10'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">拖拉机套利标的</span>
          <Tractor className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-amber-600">
            {summary.tractorOpportunityCount}
          </span>
          <span className="text-xs text-slate-400">只</span>
        </div>
        <div className="text-[11px] text-amber-700/90 font-medium mt-1 flex items-center justify-between">
          <span>深市6号限额</span>
          <span className="underline">多号撸毛</span>
        </div>
      </div>

      {/* 5. Market Average Premium */}
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">全市场平均溢价</span>
          <CircleDot className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl font-bold ${
              summary.avgPremiumRate > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {summary.avgPremiumRate > 0 ? `+${summary.avgPremiumRate}` : summary.avgPremiumRate}%
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          <span>整体情绪水平</span>
        </div>
      </div>

      {/* 6. Total Market Turnover */}
      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">LOF场内总成交</span>
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-slate-900">{summary.totalTurnover}</span>
          <span className="text-xs text-slate-400">亿元</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          <span>更新于 {summary.updateTime}</span>
        </div>
      </div>

    </div>
  );
};
