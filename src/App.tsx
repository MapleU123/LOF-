import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LofRealtimeQuote, MarketSummary, ArbitrageOpportunityType } from './types/lof';
import { fetchLofQuotes, getWatchlist, toggleWatchlist } from './services/lofApi';
import { Header } from './components/Header';
import { MarketStats } from './components/MarketStats';
import { FilterBar } from './components/FilterBar';
import { LofTable } from './components/LofTable';
import { LofDetailModal } from './components/LofDetailModal';
import { ArbitrageCalculatorModal } from './components/ArbitrageCalculatorModal';
import { ArbitrageGuideModal } from './components/ArbitrageGuideModal';
import { TractorStrategyPanel } from './components/TractorStrategyPanel';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import {
  TrendingUp,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Main Data States
  const [quotes, setQuotes] = useState<LofRealtimeQuote[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  // Watchlist & Color Settings
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isCnColorMode, setIsCnColorMode] = useState<boolean>(true);

  // Auto-refresh timer state
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(5); // default 5s
  const [countdown, setCountdown] = useState<number>(5);

  // Filter & Search & Sort States
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [quickFilter, setQuickFilter] = useState<ArbitrageOpportunityType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('premiumRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minTurnover, setMinTurnover] = useState<number>(0);
  const [onlyOpenPurchase, setOnlyOpenPurchase] = useState<boolean>(false);

  // Modals
  const [selectedFundForDetail, setSelectedFundForDetail] = useState<LofRealtimeQuote | null>(null);
  const [calculatorFund, setCalculatorFund] = useState<LofRealtimeQuote | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isTractorPanelOpen, setIsTractorPanelOpen] = useState<boolean>(false);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState<boolean>(false);

  // Alert Thresholds
  const [premiumThreshold, setPremiumThreshold] = useState<number>(2.0);
  const [discountThreshold, setDiscountThreshold] = useState<number>(-1.5);
  const [enableBrowserAlerts, setEnableBrowserAlerts] = useState<boolean>(true);

  // Load watchlist on mount
  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);

  // Fetch Quotes Function
  const loadQuotes = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await fetchLofQuotes();
      if (data && data.quotes) {
        setQuotes(data.quotes);
        setSummary(data.summary);
        setLastUpdateTime(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
      }
    } catch (err) {
      console.error('Failed to load quotes', err);
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Auto-refresh countdown & interval loop
  useEffect(() => {
    if (autoRefreshSec <= 0) return;

    setCountdown(autoRefreshSec);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadQuotes(false);
          return autoRefreshSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshSec, loadQuotes]);

  // Toggle watchlist
  const handleToggleWatchlist = (code: string) => {
    const updated = toggleWatchlist(code);
    setWatchlist(updated);
  };

  // Header Sort Toggle
  const handleHeaderSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  // Open calculator with pre-selected fund
  const handleOpenCalculatorWithFund = (fund: LofRealtimeQuote) => {
    setCalculatorFund(fund);
    setIsCalculatorOpen(true);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (filteredQuotes.length === 0) return;
    const headers = [
      '基金代码',
      '基金简称',
      '市场',
      '分类',
      '场内现价',
      '现价涨跌幅(%)',
      '预估实时净值',
      '估值涨跌幅(%)',
      '实时溢价率(%)',
      '官方T-1溢价率(%)',
      '净套利空间(%)',
      '申购状态',
      '每日限额(元)',
      '拖拉机支持',
      '场内成交额(万元)',
      '跟踪标的',
      '基金公司'
    ];

    const rows = filteredQuotes.map(q => [
      q.code,
      `"${q.name}"`,
      q.market === 'sz' ? '深圳' : '上海',
      q.category,
      q.currentPrice,
      q.changePercent,
      q.estimatedNAV,
      q.estimatedNAVChange,
      q.premiumRate,
      q.officialPremiumRate,
      q.netArbitrageSpread,
      q.purchaseStatus,
      q.purchaseDailyLimit,
      q.tractorAllowed ? '支持(6卡)' : '单席',
      q.turnover,
      `"${q.trackingTarget}"`,
      q.manager
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LOF实时溢价行情_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort Pipeline
  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    // 1. Search Query (code, name, pinyin, manager, target)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        item =>
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.pinyin.toLowerCase().includes(q) ||
          item.manager.toLowerCase().includes(q) ||
          item.trackingTarget.toLowerCase().includes(q)
      );
    }

    // 2. Category Tab (if not on watchlist tab)
    if (quickFilter !== 'watchlist' && selectedCategory !== '全部') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // 3. Quick Strategy Filters
    if (quickFilter === 'watchlist') {
      result = result.filter(item => watchlist.includes(item.code));
    } else if (quickFilter === 'premium') {
      result = result.filter(item => item.premiumRate >= 2.0 && item.purchaseStatus !== '暂停');
    } else if (quickFilter === 'discount') {
      result = result.filter(item => item.premiumRate <= -1.5 && item.redemptionStatus !== '暂停');
    } else if (quickFilter === 'tractor') {
      result = result.filter(item => item.tractorAllowed && item.purchaseDailyLimit > 0 && item.premiumRate >= 1.0);
    } else if (quickFilter === 'high_volume') {
      result = result.filter(item => item.turnover >= 100);
    }

    // 4. Only Open Purchase
    if (onlyOpenPurchase) {
      result = result.filter(item => item.purchaseStatus !== '暂停');
    }

    // 5. Min Turnover
    if (minTurnover > 0) {
      result = result.filter(item => item.turnover >= minTurnover);
    }

    // 6. Sorting
    result.sort((a, b) => {
      let aVal: any = (a as any)[sortBy];
      let bVal: any = (b as any)[sortBy];

      if (sortBy === 'code') {
        return sortOrder === 'desc' ? b.code.localeCompare(a.code) : a.code.localeCompare(b.code);
      }

      aVal = typeof aVal === 'number' ? aVal : 0;
      bVal = typeof bVal === 'number' ? bVal : 0;

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [
    quotes,
    searchQuery,
    selectedCategory,
    quickFilter,
    watchlist,
    onlyOpenPurchase,
    minTurnover,
    sortBy,
    sortOrder
  ]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. Header */}
      <Header
        summary={summary}
        autoRefreshSec={autoRefreshSec}
        setAutoRefreshSec={setAutoRefreshSec}
        countdown={countdown}
        onManualRefresh={() => loadQuotes(true)}
        isRefreshing={isRefreshing}
        onOpenCalculator={() => {
          setCalculatorFund(quotes[0] || null);
          setIsCalculatorOpen(true);
        }}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenTractorPanel={() => setIsTractorPanelOpen(true)}
        onOpenAlerts={() => setIsAlertSettingsOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCnColorMode={isCnColorMode}
        setIsCnColorMode={setIsCnColorMode}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Market Stats Cards */}
        <MarketStats
          summary={summary}
          onFilterHighPremium={() => setQuickFilter('premium')}
          onFilterDeepDiscount={() => setQuickFilter('discount')}
          onFilterTractor={() => setQuickFilter('tractor')}
          onShowAll={() => {
            setQuickFilter('all');
            setSelectedCategory('全部');
            setSearchQuery('');
          }}
          activeQuickFilter={quickFilter}
        />

        {/* Filter Bar */}
        <FilterBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          watchlistCount={watchlist.length}
          totalFilteredCount={filteredQuotes.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onExportCsv={handleExportCsv}
          minTurnover={minTurnover}
          setMinTurnover={setMinTurnover}
          onlyOpenPurchase={onlyOpenPurchase}
          setOnlyOpenPurchase={setOnlyOpenPurchase}
        />

        {/* Primary Data Grid */}
        <LofTable
          quotes={filteredQuotes}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          onSelectFund={(fund) => setSelectedFundForDetail(fund)}
          onOpenCalculatorWithFund={handleOpenCalculatorWithFund}
          isCnColorMode={isCnColorMode}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onHeaderSort={handleHeaderSort}
        />

      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-700">LOF实时溢价监控 (金快查专业版)</span>
            <span className="mx-2">•</span>
            <span>覆盖沪深两市全部标的</span>
            <span className="mx-2">•</span>
            <span>数据更新时间: {lastUpdateTime || '实时'}</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            免责声明：本站数据仅供研究参考，不构成任何投资建议。基金有风险，投资需谨慎。
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedFundForDetail && (
        <LofDetailModal
          fund={selectedFundForDetail}
          onClose={() => setSelectedFundForDetail(null)}
          isCnColorMode={isCnColorMode}
          onOpenFullCalculator={(fund) => {
            setSelectedFundForDetail(null);
            handleOpenCalculatorWithFund(fund);
          }}
        />
      )}

      {isCalculatorOpen && (
        <ArbitrageCalculatorModal
          initialFund={calculatorFund}
          allFunds={quotes}
          onClose={() => setIsCalculatorOpen(false)}
        />
      )}

      {isGuideOpen && (
        <ArbitrageGuideModal onClose={() => setIsGuideOpen(false)} />
      )}

      {isTractorPanelOpen && (
        <TractorStrategyPanel
          quotes={quotes}
          onClose={() => setIsTractorPanelOpen(false)}
          onSelectFund={(fund) => {
            setIsTractorPanelOpen(false);
            setSelectedFundForDetail(fund);
          }}
          onOpenCalculatorWithFund={(fund) => {
            setIsTractorPanelOpen(false);
            handleOpenCalculatorWithFund(fund);
          }}
        />
      )}

      {isAlertSettingsOpen && (
        <AlertSettingsModal
          onClose={() => setIsAlertSettingsOpen(false)}
          premiumThreshold={premiumThreshold}
          setPremiumThreshold={setPremiumThreshold}
          discountThreshold={discountThreshold}
          setDiscountThreshold={setDiscountThreshold}
          enableBrowserAlerts={enableBrowserAlerts}
          setEnableBrowserAlerts={setEnableBrowserAlerts}
        />
      )}

    </div>
  );
}
