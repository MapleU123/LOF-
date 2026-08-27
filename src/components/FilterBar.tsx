import React from 'react';
import { LofCategory, ArbitrageOpportunityType } from '../types/lof';
import { CATEGORY_LIST } from '../data/lofDatabase';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Tractor,
  Star,
  Download,
  Filter,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  quickFilter: ArbitrageOpportunityType;
  setQuickFilter: (filter: ArbitrageOpportunityType) => void;
  watchlistCount: number;
  totalFilteredCount: number;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onExportCsv: () => void;
  minTurnover: number;
  setMinTurnover: (v: number) => void;
  onlyOpenPurchase: boolean;
  setOnlyOpenPurchase: (v: boolean) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  setSelectedCategory,
  quickFilter,
  setQuickFilter,
  watchlistCount,
  totalFilteredCount,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onExportCsv,
  minTurnover,
  setMinTurnover,
  onlyOpenPurchase,
  setOnlyOpenPurchase
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 shadow-2xs space-y-3">
      
      {/* 1. Category Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_LIST.map((cat) => {
            const isActive = selectedCategory === cat && quickFilter !== 'watchlist';
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (quickFilter === 'watchlist') setQuickFilter('all');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {cat}
              </button>
            );
          })}

          {/* Watchlist Tab */}
          <button
            onClick={() => setQuickFilter(quickFilter === 'watchlist' ? 'all' : 'watchlist')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              quickFilter === 'watchlist'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>自选基金 ({watchlistCount})</span>
          </button>
        </div>

        {/* Count and Export */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>共 <strong className="text-slate-900 font-semibold">{totalFilteredCount}</strong> 条标的</span>
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
            title="导出当前筛选结果为CSV"
          >
            <Download className="w-3 h-3" />
            <span>导出CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Strategy Chips & Sorting Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
        
        {/* Quick Opportunity Chips */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-500" />
            快捷策略:
          </span>

          <button
            onClick={() => setQuickFilter(quickFilter === 'premium' ? 'all' : 'premium')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
              quickFilter === 'premium'
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-rose-500" />
            <span>高溢价套利 (&ge;2%)</span>
          </button>

          <button
            onClick={() => setQuickFilter(quickFilter === 'discount' ? 'all' : 'discount')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
              quickFilter === 'discount'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <TrendingDown className="w-3 h-3 text-emerald-500" />
            <span>深度折价 (&le;-1.5%)</span>
          </button>

          <button
            onClick={() => setQuickFilter(quickFilter === 'tractor' ? 'all' : 'tractor')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
              quickFilter === 'tractor'
                ? 'bg-amber-50 border-amber-300 text-amber-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Tractor className="w-3 h-3 text-amber-600" />
            <span>拖拉机限额标的</span>
          </button>

          <button
            onClick={() => setQuickFilter(quickFilter === 'high_volume' ? 'all' : 'high_volume')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
              quickFilter === 'high_volume'
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>高流动性 (&gt;100万)</span>
          </button>

          {quickFilter !== 'all' && (
            <button
              onClick={() => setQuickFilter('all')}
              className="text-[11px] text-blue-600 hover:underline px-1 py-0.5 ml-1"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* Secondary filters & Sort */}
        <div className="flex items-center gap-3">
          
          {/* Purchase open only checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={onlyOpenPurchase}
              onChange={(e) => setOnlyOpenPurchase(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>仅看申购开放/限额</span>
          </label>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
            <span className="text-slate-400 text-[11px]">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-0 text-slate-700 font-medium text-xs focus:ring-0 cursor-pointer p-0 pr-2"
            >
              <option value="premiumRate">实时溢价率</option>
              <option value="netArbitrageSpread">净套利空间</option>
              <option value="currentPrice">场内现价</option>
              <option value="changePercent">现价涨跌幅</option>
              <option value="turnover">成交额</option>
              <option value="purchaseDailyLimit">单日限额</option>
              <option value="code">基金代码</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="text-slate-500 hover:text-slate-900 font-bold px-1"
              title={sortOrder === 'desc' ? '当前：降序 (高到低)' : '当前：升序 (低到高)'}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
