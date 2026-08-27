import React from 'react';
import {
  TrendingUp,
  RefreshCw,
  Clock,
  Calculator,
  BookOpen,
  Tractor,
  Layers,
  Sparkles,
  Search,
  Bell
} from 'lucide-react';
import { MarketSummary } from '../types/lof';

interface HeaderProps {
  summary: MarketSummary | null;
  autoRefreshSec: number;
  setAutoRefreshSec: (sec: number) => void;
  countdown: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  onOpenCalculator: () => void;
  onOpenGuide: () => void;
  onOpenTractorPanel: () => void;
  onOpenAlerts: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCnColorMode: boolean;
  setIsCnColorMode: (cn: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  autoRefreshSec,
  setAutoRefreshSec,
  countdown,
  onManualRefresh,
  isRefreshing,
  onOpenCalculator,
  onOpenGuide,
  onOpenTractorPanel,
  onOpenAlerts,
  searchQuery,
  setSearchQuery,
  isCnColorMode,
  setIsCnColorMode
}) => {
  const getStatusBadge = () => {
    if (!summary) return null;
    switch (summary.marketStatus) {
      case 'trading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {summary.marketStatusText}
          </span>
        );
      case 'midday':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            {summary.marketStatusText}
          </span>
        );
      case 'pre_market':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            {summary.marketStatusText}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            {summary?.marketStatusText || '休市中'}
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  LOF实时溢价查
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    金快查版
                  </span>
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                全市场A股LOF基金实时行情 • 盘中预估净值 • 场内外折溢价套利监控
              </p>
            </div>
          </div>

          {/* Quick Action Navigation & Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            
            {/* Search Box in Header */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索代码/名称/拼音/标的..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Strategy Buttons */}
            <button
              onClick={onOpenTractorPanel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors shadow-xs"
              title="查看高溢价限额拖拉机套利推荐标的"
            >
              <Tractor className="w-3.5 h-3.5 text-amber-600" />
              <span>拖拉机专区</span>
            </button>

            <button
              onClick={onOpenCalculator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors shadow-xs"
              title="打开场内外LOF溢价与拖拉机套利收益计算器"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>套利计算器</span>
            </button>

            <button
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="查看LOF套利全流程与拖拉机开户实战指南"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-600" />
              <span>套利指南</span>
            </button>

            {/* Refresh Control */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                onClick={onManualRefresh}
                disabled={isRefreshing}
                className="p-1 rounded-md text-slate-600 hover:text-blue-600 hover:bg-white transition-colors"
                title="手动刷新实时行情"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <select
                value={autoRefreshSec}
                onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
                className="text-xs bg-transparent border-0 text-slate-700 font-medium focus:ring-0 cursor-pointer pr-4 py-0.5"
                title="自动刷新间隔"
              >
                <option value={0}>自动刷新: 关</option>
                <option value={3}>3秒 (高频)</option>
                <option value={5}>5秒 (推荐)</option>
                <option value={10}>10秒</option>
                <option value={30}>30秒</option>
              </select>

              {autoRefreshSec > 0 && (
                <span className="text-[10px] text-blue-600 font-mono font-semibold px-1 min-w-[20px] text-center">
                  {countdown}s
                </span>
              )}
            </div>

            {/* Color Mode Toggle */}
            <button
              onClick={() => setIsCnColorMode(!isCnColorMode)}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white"
              title={isCnColorMode ? '当前：国内配色(红涨绿跌/红溢绿折)' : '当前：国际配色(绿涨红跌)'}
            >
              {isCnColorMode ? '红涨/红溢' : '绿涨/绿溢'}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
