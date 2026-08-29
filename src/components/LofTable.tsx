import React, { useState } from 'react';
import { LofRealtimeQuote, WatchlistItem } from '../types/lof';
import {
  Star,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Calculator,
  LineChart,
  Tractor,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Tag,
  StickyNote,
  Plus,
  Image as ImageIcon,
  CheckSquare,
  Square
} from 'lucide-react';

interface LofTableProps {
  quotes: LofRealtimeQuote[];
  watchlist: string[];
  watchlistMap: Record<string, WatchlistItem>;
  selectedCodes: string[];
  onToggleSelectCode: (code: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExportSelectedImage: () => void;
  onToggleWatchlist: (code: string) => void;
  onOpenTagModal: (fund: LofRealtimeQuote) => void;
  onSelectFund: (fund: LofRealtimeQuote) => void;
  onOpenCalculatorWithFund: (fund: LofRealtimeQuote) => void;
  isCnColorMode: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onHeaderSort: (key: string) => void;
}

const TAG_STYLES: Record<string, string> = {
  '套利池': 'bg-red-50 text-red-700 border-red-200',
  '观察池': 'bg-blue-50 text-blue-700 border-blue-200',
  '核心底仓': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '高溢价监控': 'bg-amber-50 text-amber-700 border-amber-200',
  '深度折价': 'bg-purple-50 text-purple-700 border-purple-200',
  '定投池': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  '大宗商品': 'bg-orange-50 text-orange-700 border-orange-200',
};

export const LofTable: React.FC<LofTableProps> = ({
  quotes,
  watchlist,
  watchlistMap,
  selectedCodes,
  onToggleSelectCode,
  onSelectAll,
  onClearSelection,
  onExportSelectedImage,
  onToggleWatchlist,
  onOpenTagModal,
  onSelectFund,
  onOpenCalculatorWithFund,
  isCnColorMode,
  sortBy,
  sortOrder,
  onHeaderSort
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50); // 50 items per page by default

  // Reset to page 1 if filter / sorting changes length
  React.useEffect(() => {
    setCurrentPage(1);
  }, [quotes.length, sortBy, sortOrder]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(quotes.length / pageSize);
  const displayedQuotes = pageSize === 0 
    ? quotes 
    : quotes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllCurrentSelected = displayedQuotes.length > 0 && displayedQuotes.every(q => selectedCodes.includes(q.code));

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // Helper for color styling (CN mode: Red for positive, Green for negative)
  const getChangeColor = (val: number) => {
    if (val > 0) return isCnColorMode ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold';
    if (val < 0) return isCnColorMode ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold';
    return 'text-slate-500 font-medium';
  };

  const getPremiumBadge = (rate: number, purchaseStatus: string) => {
    if (rate >= 5.0) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          极高溢价
        </span>
      );
    }
    if (rate >= 2.0) {
      if (purchaseStatus !== '暂停') {
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            溢价套利
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
          高溢价
        </span>
      );
    }
    if (rate <= -1.5) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          折价机会
        </span>
      );
    }
    return null;
  };

  const getSortIcon = (key: string) => {
    if (sortBy !== key) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 ml-1 inline" />;
    }
    return sortOrder === 'desc' ? (
      <ChevronDown className="w-3.5 h-3.5 text-blue-600 ml-1 inline stroke-[2.5]" />
    ) : (
      <ChevronUp className="w-3.5 h-3.5 text-blue-600 ml-1 inline stroke-[2.5]" />
    );
  };

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">未找到符合条件的LOF基金</h3>
        <p className="text-xs text-slate-500 mt-1">请尝试放宽筛选条件、清除搜索关键字或切换分类标签</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Floating Selection Banner */}
      {selectedCodes.length > 0 && (
        <div className="bg-indigo-700 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-in slide-in-from-top-2 duration-150 border-b border-indigo-800">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckSquare className="w-4 h-4 text-indigo-300" />
              <span>已勾选 <strong className="text-amber-300 font-black text-sm">{selectedCodes.length}</strong> 只基金:</span>
            </div>

            {/* Chips of first few selected funds */}
            <div className="flex items-center gap-1 flex-wrap">
              {selectedCodes.slice(0, 6).map(code => {
                const quote = displayedQuotes.find(q => q.code === code);
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-800/90 text-indigo-100 border border-indigo-500/50 font-mono text-[11px]"
                  >
                    <span className="font-bold">{code}</span>
                    {quote?.name && <span className="font-sans text-[10px] text-indigo-200">{quote.name}</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectCode(code);
                      }}
                      className="text-indigo-300 hover:text-white ml-0.5 cursor-pointer font-sans"
                      title="取消勾选"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
              {selectedCodes.length > 6 && (
                <span className="text-[11px] text-indigo-300 font-medium">
                  等共{selectedCodes.length}只
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportSelectedImage}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer text-xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-900" />
              <span>生成已选海报长图 ({selectedCodes.length}只)</span>
            </button>

            <button
              onClick={onClearSelection}
              className="px-2.5 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-indigo-200 hover:text-white rounded-lg transition-colors cursor-pointer text-xs"
            >
              清空勾选
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold select-none sticky top-0 z-10">
              <th className="py-3 px-2.5 w-9 text-center">
                <input
                  type="checkbox"
                  checked={isAllCurrentSelected}
                  onChange={onSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  title={isAllCurrentSelected ? '取消全选当前页' : '全选当前页'}
                />
              </th>

              <th className="py-3 px-2 w-8 text-center">自选</th>
              
              <th
                onClick={() => onHeaderSort('code')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center">
                  <span>基金代码</span>
                  {getSortIcon('code')}
                </div>
              </th>

              <th className="py-3 px-3 min-w-[160px]">
                <span>基金名称 / 标的</span>
              </th>

              <th
                onClick={() => onHeaderSort('currentPrice')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end">
                  <span>现价</span>
                  {getSortIcon('currentPrice')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('officialNAV')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end" title="最新官方公布单位净值 (T-1)">
                  <span>净值</span>
                  {getSortIcon('officialNAV')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('estimatedNAV')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end" title="盘中实时预估净值 (IOPV/GSZ)">
                  <span>估算净值</span>
                  {getSortIcon('estimatedNAV')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('officialPremiumRate')}
                className="py-3 px-3 text-right cursor-pointer bg-blue-50/50 hover:bg-blue-100/60 text-blue-900 transition-colors group whitespace-nowrap font-bold"
              >
                <div className="flex items-center justify-end" title="静态溢价率 (基于昨净值) / 实时估算溢价率 (基于实时估值)">
                  <span className="underline decoration-blue-400 underline-offset-2">溢价/估算</span>
                  {getSortIcon('officialPremiumRate')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('threeDayAvgPremium')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end" title="近3个交易日平均溢价率">
                  <span>三日均溢</span>
                  {getSortIcon('threeDayAvgPremium')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('expectedReturn')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5" title="预计收益率 = 静态溢价率 - 优惠申购费率(约0.05%~0.12%)">
                  <span>预计收益率</span>
                  <span className="text-[10px] text-amber-500 font-bold">?</span>
                  {getSortIcon('expectedReturn')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('purchaseDailyLimit')}
                className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap font-bold text-amber-900 bg-amber-50/40"
              >
                <div className="flex items-center justify-center">
                  <span>限购金额</span>
                  {getSortIcon('purchaseDailyLimit')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('fundScale')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end">
                  <span>规模</span>
                  {getSortIcon('fundScale')}
                </div>
              </th>

              <th className="py-3 px-2.5 text-center whitespace-nowrap">
                <span title="深圳市场支持单账户绑定6个股东席位申购">拖拉机</span>
              </th>

              <th
                onClick={() => onHeaderSort('turnover')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end" title="今日场内成交金额">
                  <span>成交额</span>
                  {getSortIcon('turnover')}
                </div>
              </th>

              <th className="py-3 px-3 text-center w-28 whitespace-nowrap">操作</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {displayedQuotes.map((fund, idx) => {
              const watchItem = watchlistMap[fund.code];
              const isWatched = !!watchItem;
              const isSelected = selectedCodes.includes(fund.code);
              const tags = watchItem?.tags || [];
              const note = watchItem?.note || '';
              const isHighPremium = fund.premiumRate >= 2.0;
              const isDiscount = fund.premiumRate <= -1.5;

              return (
                <tr
                  key={fund.code}
                  onClick={() => onSelectFund(fund)}
                  className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-50/70 hover:bg-indigo-100/60' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')
                  } ${isWatched && !isSelected ? 'bg-amber-50/20' : ''}`}
                >
                  {/* Select Checkbox */}
                  <td className="py-2.5 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectCode(fund.code)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title={isSelected ? '取消勾选' : '勾选此基金'}
                    />
                  </td>

                  {/* Star Watchlist */}
                  <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleWatchlist(fund.code)}
                      className="p-1 text-slate-300 hover:text-amber-500 transition-colors rounded cursor-pointer"
                      title={isWatched ? '移出自选池' : '加入自选池'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isWatched ? 'fill-amber-400 text-amber-400' : 'hover:fill-amber-100'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Fund Code & Market */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono font-medium">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-1 py-0.5 rounded font-sans font-bold uppercase ${
                          fund.market === 'sz'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {fund.market === 'sz' ? '深' : '沪'}
                      </span>
                      <span className="text-slate-900 font-bold">{fund.code}</span>
                      <button
                        onClick={(e) => handleCopy(e, fund.code)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                        title="复制基金代码"
                      >
                        {copiedCode === fund.code ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Fund Name & Target & Tags */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900 line-clamp-1 hover:text-blue-600 transition-colors">
                        {fund.name}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60 whitespace-nowrap shrink-0">
                        {fund.category}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {fund.trackingTarget}
                    </div>

                    {/* Tags & Note display under fund */}
                    {(tags.length > 0 || note) && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTagModal(fund);
                            }}
                            className={`text-[10px] px-1.5 py-0.2 rounded border font-medium cursor-pointer transition-opacity hover:opacity-80 ${
                              TAG_STYLES[tag] || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title="点击修改自选标签与备注"
                          >
                            #{tag}
                          </span>
                        ))}

                        {note && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTagModal(fund);
                            }}
                            className="inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 rounded line-clamp-1 max-w-[160px] cursor-pointer hover:bg-amber-100"
                            title={`笔记: ${note} (点击编辑)`}
                          >
                            <StickyNote className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                            <span className="truncate">{note}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Current Price */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {fund.currentPrice.toFixed(3)}
                    </div>
                    <div className={`font-mono text-[10px] ${getChangeColor(fund.changePercent)}`}>
                      {fund.changePercent > 0 ? `+${fund.changePercent.toFixed(2)}%` : `${fund.changePercent.toFixed(2)}%`}
                    </div>
                  </td>

                  {/* Official NAV (T-1) & Date */}
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    <div className="text-slate-900 font-semibold text-xs">{fund.officialNAV.toFixed(4)}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{fund.officialNAVDate}</div>
                  </td>

                  {/* Estimated NAV & Time / Change */}
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    <div className="text-slate-900 font-semibold text-xs">{fund.estimatedNAV.toFixed(4)}</div>
                    <div className="text-[10px] text-slate-400 font-sans flex items-center justify-end gap-1">
                      <span>{fund.estimatedNAVTime.includes(' ') ? fund.estimatedNAVTime.split(' ')[1]?.slice(0, 5) : '盘中'}</span>
                      <span className={getChangeColor(fund.estimatedNAVChange)}>
                        ({fund.estimatedNAVChange > 0 ? `+${fund.estimatedNAVChange.toFixed(2)}%` : `${fund.estimatedNAVChange.toFixed(2)}%`})
                      </span>
                    </div>
                  </td>

                  {/* Premium / Estimate Pair (Highlight Column) */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap bg-blue-50/30">
                    <div className="flex items-center justify-end gap-1 font-mono font-extrabold text-xs">
                      <span
                        className={
                          fund.officialPremiumRate > 0
                            ? isCnColorMode ? 'text-rose-600' : 'text-emerald-600'
                            : isCnColorMode ? 'text-emerald-600' : 'text-rose-600'
                        }
                        title={`静态溢价率: ${fund.officialPremiumRate}%`}
                      >
                        {fund.officialPremiumRate > 0 ? `+${fund.officialPremiumRate.toFixed(2)}%` : `${fund.officialPremiumRate.toFixed(2)}%`}
                      </span>
                      <span className="text-slate-300 font-normal">/</span>
                      <span
                        className={
                          fund.premiumRate > 0
                            ? isCnColorMode ? 'text-rose-600' : 'text-emerald-600'
                            : isCnColorMode ? 'text-emerald-600' : 'text-rose-600'
                        }
                        title={`实时估算溢价率: ${fund.premiumRate}%`}
                      >
                        {fund.premiumRate > 0 ? `+${fund.premiumRate.toFixed(2)}%` : `${fund.premiumRate.toFixed(2)}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {getPremiumBadge(fund.officialPremiumRate, fund.purchaseStatus)}
                    </div>
                  </td>

                  {/* Three-day Average Premium Rate */}
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    <span
                      className={`font-semibold text-xs ${
                        fund.threeDayAvgPremium > 0
                          ? isCnColorMode ? 'text-rose-600' : 'text-emerald-600'
                          : isCnColorMode ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {fund.threeDayAvgPremium > 0 ? `+${fund.threeDayAvgPremium.toFixed(2)}%` : `${fund.threeDayAvgPremium.toFixed(2)}%`}
                    </span>
                  </td>

                  {/* Expected Return Rate */}
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    <div className="flex items-center justify-end gap-0.5">
                      <span
                        className={`font-bold text-xs ${
                          fund.expectedReturn > 0
                            ? isCnColorMode ? 'text-rose-600' : 'text-emerald-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {fund.expectedReturn > 0 ? `+${fund.expectedReturn.toFixed(2)}%` : `${fund.expectedReturn.toFixed(2)}%`}
                      </span>
                      <span
                        className="text-[10px] text-amber-500 font-bold cursor-help"
                        title="申购后到账卖出预计净收益率 (静态溢价率减去优惠申购费率0.05%)"
                      >
                        ?
                      </span>
                    </div>
                  </td>

                  {/* 1. 限购金额 Column */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap bg-amber-50/20 font-mono">
                    {fund.purchaseStatus === '暂停' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        暂停申购
                      </span>
                    ) : fund.purchaseDailyLimit > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                        {fund.purchaseDailyLimit >= 10000 
                          ? `${fund.purchaseDailyLimit / 10000}万/天` 
                          : `${fund.purchaseDailyLimit.toLocaleString()}元/天`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        不限额
                      </span>
                    )}
                  </td>

                  {/* 2. 基金规模 Column */}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap text-xs">
                    <span className="font-semibold">
                      {fund.fundScale ? `${fund.fundScale.toFixed(2)}亿` : '--'}
                    </span>
                  </td>

                  {/* Tractor Support */}
                  <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                    {fund.tractorAllowed ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"
                        title="深市LOF基金，单账户支持绑定6个深A股东号同时申购"
                      >
                        <Tractor className="w-3 h-3 text-purple-600" />
                        6卡
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-sans">
                        单席
                      </span>
                    )}
                  </td>

                  {/* Turnover */}
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                    {fund.turnover <= 0 ? (
                      <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="今日成交量为0，无场内流动性，价格可能失真">
                        无成交
                      </span>
                    ) : fund.turnover >= 1000 ? (
                      <strong className="text-slate-900">{(fund.turnover / 100).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">百万</span></strong>
                    ) : (
                      <span>{fund.turnover.toFixed(2)} <span className="text-[10px] text-slate-400">万</span></span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      
                      {/* Tag & Note Trigger */}
                      <button
                        onClick={() => onOpenTagModal(fund)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          tags.length > 0 || note
                            ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 bg-indigo-50/50'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                        }`}
                        title="设置标签备注 (如: 套利池、观察池)"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>

                      {/* Calculator Trigger */}
                      <button
                        onClick={() => onOpenCalculatorWithFund(fund)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="测算套利收益"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>

                      {/* Detail / Chart Trigger */}
                      <button
                        onClick={() => onSelectFund(fund)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="查看30日走势与套利明细"
                      >
                        <LineChart className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>

      {/* Table Footer / Summary & Pagination Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <span>每页显示:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              <option value={50}>50 条</option>
              <option value={100}>100 条</option>
              <option value={200}>200 条</option>
              <option value={0}>全部显示 ({quotes.length}条)</option>
            </select>
          </div>

          <span className="text-slate-400">
            共 <strong className="text-slate-900 font-mono">{quotes.length}</strong> 只标的
            {pageSize > 0 && ` (第 ${currentPage} / ${totalPages} 页)`}
          </span>
        </div>

        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center gap-1.5 select-none">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors font-medium text-[11px] cursor-pointer"
            >
              首页
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors font-medium cursor-pointer"
            >
              上一页
            </button>

            {/* Dynamic Page Numbers */}
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const hasGap = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {hasGap && <span className="text-slate-400 px-0.5">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[28px] h-7 px-1.5 rounded font-mono font-semibold transition-colors text-xs cursor-pointer ${
                          currentPage === p
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors font-medium cursor-pointer"
            >
              下一页
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors font-medium text-[11px] cursor-pointer"
            >
              末页
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

