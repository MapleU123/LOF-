import React, { useState } from 'react';
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
  Flame,
  Image as ImageIcon,
  Tag,
  CheckSquare,
  Square,
  RotateCcw,
  DollarSign,
  PieChart,
  Percent,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  quickFilter: ArbitrageOpportunityType;
  setQuickFilter: (filter: ArbitrageOpportunityType) => void;
  watchlistCount: number;
  totalFilteredCount: number;
  selectedCount: number;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onExportCsv: () => void;
  onExportImage: () => void;
  minTurnover: number;
  setMinTurnover: (v: number) => void;
  onlyOpenPurchase: boolean;
  setOnlyOpenPurchase: (v: boolean) => void;
  selectedTagFilter: string;
  setSelectedTagFilter: (tag: string) => void;
  availableTags: string[];

  // Precision Filter Props
  premiumFilterPreset: string;
  setPremiumFilterPreset: (v: string) => void;
  premiumMin: string;
  setPremiumMin: (v: string) => void;
  premiumMax: string;
  setPremiumMax: (v: string) => void;

  scaleFilterPreset: string;
  setScaleFilterPreset: (v: string) => void;
  scaleMin: string;
  setScaleMin: (v: string) => void;
  scaleMax: string;
  setScaleMax: (v: string) => void;

  purchaseLimitFilter: string;
  setPurchaseLimitFilter: (v: string) => void;

  onSelectAllFiltered: () => void;
  isAllFilteredSelected: boolean;
  onExportFilteredImage: () => void;
  onExportSelectedImage: () => void;
  onResetAllFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  setSelectedCategory,
  quickFilter,
  setQuickFilter,
  watchlistCount,
  totalFilteredCount,
  selectedCount,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onExportCsv,
  onExportImage,
  minTurnover,
  setMinTurnover,
  onlyOpenPurchase,
  setOnlyOpenPurchase,
  selectedTagFilter,
  setSelectedTagFilter,
  availableTags,
  premiumFilterPreset,
  setPremiumFilterPreset,
  premiumMin,
  setPremiumMin,
  premiumMax,
  setPremiumMax,
  scaleFilterPreset,
  setScaleFilterPreset,
  scaleMin,
  setScaleMin,
  scaleMax,
  setScaleMax,
  purchaseLimitFilter,
  setPurchaseLimitFilter,
  onSelectAllFiltered,
  isAllFilteredSelected,
  onExportFilteredImage,
  onExportSelectedImage,
  onResetAllFilters,
  hasActiveFilters
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-4 shadow-2xs space-y-3">
      
      {/* 1. Top Row: Category Tabs & Global Export Actions */}
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
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
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              quickFilter === 'watchlist'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>自选池 ({watchlistCount})</span>
          </button>
        </div>

        {/* Count and Export Actions */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>共筛选出 <strong className="text-slate-900 font-bold text-sm">{totalFilteredCount}</strong> 只标的</span>
          
          {/* Quick Select All Filtered Button */}
          <button
            onClick={onSelectAllFiltered}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
              isAllFilteredSelected
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="一键勾选/取消勾选当前筛选出的所有LOF基金"
          >
            {isAllFilteredSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isAllFilteredSelected ? '取消全选' : '全选筛选标的'}</span>
          </button>

          {/* Export Selected to Image Button (if any selected) */}
          {selectedCount > 0 && (
            <button
              onClick={onExportSelectedImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-lg transition-all cursor-pointer shadow-xs animate-in fade-in"
              title={`导出已勾选的 ${selectedCount} 只基金图片`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>导出已选 ({selectedCount}只)</span>
            </button>
          )}

          {/* Export Filtered to Image Button */}
          <button
            onClick={onExportFilteredImage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all cursor-pointer shadow-xs"
            title="将当前筛选结果直接生成为高清长图（支持全图铺满水印）"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>导出长图</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="导出当前筛选结果为CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Precision Filters Panel: 溢价率范围 & 基金规模 & 限购金额 */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>多维度高级筛选</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-semibold">
                筛选生效中
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={onResetAllFilters}
                className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重置所有筛选</span>
              </button>
            )}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-0.5 cursor-pointer"
            >
              <span>{showAdvancedFilters ? '收起' : '展开筛选器'}</span>
              {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 text-xs">
            
            {/* Filter 1: 溢价率范围 (Premium Rate Range) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 font-semibold text-[11px]">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-rose-500" />
                  溢价率范围:
                </span>
                {premiumFilterPreset === 'custom' && (
                  <span className="text-[10px] text-blue-600">自定义区间</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'ge_5', label: '≥5%' },
                  { id: 'ge_2', label: '≥2%' },
                  { id: '0_to_2', label: '0~2%' },
                  { id: 'le_0', label: '≤0% (折价)' },
                  { id: 'custom', label: '自定义' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPremiumFilterPreset(opt.id)}
                    className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                      premiumFilterPreset === opt.id
                        ? 'bg-rose-500 text-white font-bold shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              
              {/* Custom Min / Max Input for Premium Rate */}
              {premiumFilterPreset === 'custom' && (
                <div className="flex items-center gap-1.5 pt-1 animate-in fade-in duration-150">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="最低 %"
                    value={premiumMin}
                    onChange={(e) => setPremiumMin(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <span className="text-slate-400 font-medium">至</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="最高 %"
                    value={premiumMax}
                    onChange={(e) => setPremiumMax(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Filter 2: 基金规模 (Fund Scale - 亿元) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 font-semibold text-[11px]">
                <span className="flex items-center gap-1">
                  <PieChart className="w-3 h-3 text-indigo-500" />
                  基金规模:
                </span>
                {scaleFilterPreset === 'custom' && (
                  <span className="text-[10px] text-blue-600">自定义规模</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'lt_1', label: '<1亿 (迷你)' },
                  { id: '1_to_5', label: '1~5亿' },
                  { id: '5_to_20', label: '5~20亿' },
                  { id: 'gt_20', label: '>20亿' },
                  { id: 'custom', label: '自定义' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setScaleFilterPreset(opt.id)}
                    className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                      scaleFilterPreset === opt.id
                        ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom Min / Max Input for Fund Scale */}
              {scaleFilterPreset === 'custom' && (
                <div className="flex items-center gap-1.5 pt-1 animate-in fade-in duration-150">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="最低 (亿)"
                    value={scaleMin}
                    onChange={(e) => setScaleMin(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-slate-400 font-medium">至</span>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="最高 (亿)"
                    value={scaleMax}
                    onChange={(e) => setScaleMax(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Filter 3: 限购金额 (Purchase Daily Limit) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 font-semibold text-[11px]">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-amber-500" />
                  限购金额 / 申购状态:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'le_100', label: '≤100元' },
                  { id: 'le_500', label: '≤500元' },
                  { id: 'le_1000', label: '≤1000元' },
                  { id: 'unlimited', label: '无限额' },
                  { id: 'paused', label: '暂停申购' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPurchaseLimitFilter(opt.id)}
                    className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                      purchaseLimitFilter === opt.id
                        ? 'bg-amber-600 text-white font-bold shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 3. Quick Strategy Chips & Sorting Controls & Tag Filter */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
        
        {/* Quick Opportunity Chips */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-500" />
            快捷策略:
          </span>

          <button
            onClick={() => setQuickFilter(quickFilter === 'premium' ? 'all' : 'premium')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
              quickFilter === 'premium'
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-rose-500" />
            <span>高溢价套利 (≥2%)</span>
          </button>

          <button
            onClick={() => setQuickFilter(quickFilter === 'discount' ? 'all' : 'discount')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
              quickFilter === 'discount'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <TrendingDown className="w-3 h-3 text-emerald-500" />
            <span>深度折价 (≤-1.5%)</span>
          </button>

          <button
            onClick={() => setQuickFilter(quickFilter === 'tractor' ? 'all' : 'tractor')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
              quickFilter === 'high_volume'
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>高流动性 (&gt;100万)</span>
          </button>

          {/* Watchlist Tags Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 ml-1">
            <Tag className="w-3 h-3 text-indigo-600" />
            <span className="text-slate-400 text-[11px]">标签:</span>
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-transparent border-0 text-slate-700 font-medium text-xs focus:ring-0 cursor-pointer p-0 pr-2"
            >
              {Array.from(new Set(availableTags)).map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary filters & Sort */}
        <div className="flex items-center gap-3">
          
          {/* Purchase open only checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={onlyOpenPurchase}
              onChange={(e) => setOnlyOpenPurchase(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>仅看开放/限额</span>
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
              <option value="officialPremiumRate">静态溢价率</option>
              <option value="expectedReturn">预计收益率</option>
              <option value="purchaseDailyLimit">限购金额</option>
              <option value="fundScale">基金规模</option>
              <option value="netArbitrageSpread">净套利空间</option>
              <option value="currentPrice">场内现价</option>
              <option value="changePercent">现价涨跌幅</option>
              <option value="turnover">成交额</option>
              <option value="code">基金代码</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="text-slate-500 hover:text-slate-900 font-bold px-1 cursor-pointer"
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
