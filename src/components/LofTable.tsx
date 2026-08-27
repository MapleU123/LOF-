import React, { useState } from 'react';
import { LofRealtimeQuote } from '../types/lof';
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
  ArrowUpDown
} from 'lucide-react';

interface LofTableProps {
  quotes: LofRealtimeQuote[];
  watchlist: string[];
  onToggleWatchlist: (code: string) => void;
  onSelectFund: (fund: LofRealtimeQuote) => void;
  onOpenCalculatorWithFund: (fund: LofRealtimeQuote) => void;
  isCnColorMode: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onHeaderSort: (key: string) => void;
}

export const LofTable: React.FC<LofTableProps> = ({
  quotes,
  watchlist,
  onToggleWatchlist,
  onSelectFund,
  onOpenCalculatorWithFund,
  isCnColorMode,
  sortBy,
  sortOrder,
  onHeaderSort
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold select-none sticky top-0 z-10">
              <th className="py-3 px-3 w-10 text-center">自选</th>
              
              <th
                onClick={() => onHeaderSort('code')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center">
                  <span>代码</span>
                  {getSortIcon('code')}
                </div>
              </th>

              <th className="py-3 px-3 min-w-[140px]">
                <span>基金简称 / 标的</span>
              </th>

              <th
                onClick={() => onHeaderSort('currentPrice')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end">
                  <span>场内现价</span>
                  {getSortIcon('currentPrice')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('changePercent')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end">
                  <span>现价涨幅</span>
                  {getSortIcon('changePercent')}
                </div>
              </th>

              <th className="py-3 px-3 text-right whitespace-nowrap">
                <span title="基金盘中实时估算净值 (IOPV/GSZ)">实时估值 (GSZ)</span>
              </th>

              <th
                onClick={() => onHeaderSort('premiumRate')}
                className="py-3 px-3 text-right cursor-pointer bg-blue-50/40 hover:bg-blue-50/80 text-blue-900 transition-colors group whitespace-nowrap font-bold"
              >
                <div className="flex items-center justify-end">
                  <span className="underline decoration-blue-400 underline-offset-2">实时溢价率</span>
                  {getSortIcon('premiumRate')}
                </div>
              </th>

              <th
                onClick={() => onHeaderSort('netArbitrageSpread')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end" title="实时溢价率扣除申购费与交易佣金后的理论净套利收益空间">
                  <span>净套利空间</span>
                  {getSortIcon('netArbitrageSpread')}
                </div>
              </th>

              <th className="py-3 px-3 text-center whitespace-nowrap">
                <span>申购状态 / 限额</span>
              </th>

              <th className="py-3 px-3 text-center whitespace-nowrap">
                <span title="深圳市场支持单账户绑定6个股东席位申购">拖拉机</span>
              </th>

              <th
                onClick={() => onHeaderSort('turnover')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors group whitespace-nowrap"
              >
                <div className="flex items-center justify-end">
                  <span>成交额</span>
                  {getSortIcon('turnover')}
                </div>
              </th>

              <th className="py-3 px-3 text-center w-28 whitespace-nowrap">操作</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {quotes.map((fund, idx) => {
              const isWatched = watchlist.includes(fund.code);
              const isHighPremium = fund.premiumRate >= 2.0;
              const isDiscount = fund.premiumRate <= -1.5;

              return (
                <tr
                  key={fund.code}
                  onClick={() => onSelectFund(fund)}
                  className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  } ${isWatched ? 'bg-amber-50/20' : ''}`}
                >
                  {/* Star Watchlist */}
                  <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleWatchlist(fund.code)}
                      className="p-1 text-slate-300 hover:text-amber-500 transition-colors rounded"
                      title={isWatched ? '移出自选' : '加入自选'}
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
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
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

                  {/* Fund Name & Target */}
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
                  </td>

                  {/* Current Price */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {fund.currentPrice.toFixed(3)}
                  </td>

                  {/* Change Percent */}
                  <td className={`py-2.5 px-3 text-right font-mono whitespace-nowrap ${getChangeColor(fund.changePercent)}`}>
                    {fund.changePercent > 0 ? `+${fund.changePercent.toFixed(2)}` : fund.changePercent.toFixed(2)}%
                  </td>

                  {/* Estimated NAV */}
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    <div className="text-slate-800 font-medium">{fund.estimatedNAV.toFixed(4)}</div>
                    <div className={`text-[10px] ${getChangeColor(fund.estimatedNAVChange)}`}>
                      {fund.estimatedNAVChange > 0 ? `+${fund.estimatedNAVChange.toFixed(2)}` : fund.estimatedNAVChange.toFixed(2)}%
                    </div>
                  </td>

                  {/* Realtime Premium Rate % (Highlighted) */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap bg-blue-50/20">
                    <div className="flex items-center justify-end gap-1.5">
                      {getPremiumBadge(fund.premiumRate, fund.purchaseStatus)}
                      <span
                        className={`font-mono text-sm font-extrabold ${
                          fund.premiumRate > 0
                            ? isCnColorMode ? 'text-rose-600' : 'text-emerald-600'
                            : isCnColorMode ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {fund.premiumRate > 0 ? `+${fund.premiumRate.toFixed(2)}` : fund.premiumRate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      静态: {fund.officialPremiumRate > 0 ? `+${fund.officialPremiumRate.toFixed(2)}` : fund.officialPremiumRate.toFixed(2)}%
                    </div>
                  </td>

                  {/* Net Arbitrage Spread */}
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        fund.netArbitrageSpread > 0.5
                          ? isCnColorMode ? 'text-rose-600' : 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {fund.netArbitrageSpread > 0 ? `+${fund.netArbitrageSpread.toFixed(2)}` : fund.netArbitrageSpread.toFixed(2)}%
                    </span>
                  </td>

                  {/* Purchase Status / Limit */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {fund.purchaseDailyLimit > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        限额 {fund.purchaseDailyLimit} 元
                      </span>
                    ) : fund.purchaseStatus === '开放' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        开放申购
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        {fund.purchaseStatus}
                      </span>
                    )}
                  </td>

                  {/* Tractor Support */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
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
                    {fund.turnover >= 1000 ? (
                      <strong className="text-slate-900">{(fund.turnover / 100).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">百万</span></strong>
                    ) : (
                      <span>{fund.turnover.toFixed(1)} <span className="text-[10px] text-slate-400">万</span></span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* Calculator Trigger */}
                      <button
                        onClick={() => onOpenCalculatorWithFund(fund)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        title="测算套利收益"
                      >
                        <Calculator className="w-4 h-4" />
                      </button>

                      {/* Detail / Chart Trigger */}
                      <button
                        onClick={() => onSelectFund(fund)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title="查看30日走势与套利明细"
                      >
                        <LineChart className="w-4 h-4" />
                      </button>

                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>

      {/* Table Footer / Summary Bar */}
      <div className="bg-slate-50/70 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>💡 提示：点击任意基金行可查看<strong>分时/历史走势</strong>与<strong>套利收益推演</strong>。</span>
        </div>
        <div>
          <span>已显示 <strong className="text-slate-800">{quotes.length}</strong> 只标的</span>
        </div>
      </div>

    </div>
  );
};
