import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LofRealtimeQuote, MarketSummary, ArbitrageOpportunityType, WatchlistItem } from './types/lof';
import {
  fetchLofQuotes,
  getWatchlistMap,
  saveWatchlistMap,
  toggleWatchlist,
  updateWatchlistItem,
  getAllUsedTags
} from './services/lofApi';
import { Header } from './components/Header';
import { MarketStats } from './components/MarketStats';
import { FilterBar } from './components/FilterBar';
import { LofTable } from './components/LofTable';
import { LofDetailModal } from './components/LofDetailModal';
import { ArbitrageCalculatorModal } from './components/ArbitrageCalculatorModal';
import { ArbitrageGuideModal } from './components/ArbitrageGuideModal';
import { TractorStrategyPanel } from './components/TractorStrategyPanel';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { WatchlistTagModal } from './components/WatchlistTagModal';
import { ExportImageModal } from './components/ExportImageModal';
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

  // Watchlist Map (v2 schema) & Color Settings
  const [watchlistMap, setWatchlistMap] = useState<Record<string, WatchlistItem>>({});
  const [isCnColorMode, setIsCnColorMode] = useState<boolean>(true);

  // Auto-refresh timer state
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(5); // default 5s
  const [countdown, setCountdown] = useState<number>(5);

  // Filter & Search & Sort States
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [quickFilter, setQuickFilter] = useState<ArbitrageOpportunityType>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('全部标签');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('premiumRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minTurnover, setMinTurnover] = useState<number>(0);
  const [onlyOpenPurchase, setOnlyOpenPurchase] = useState<boolean>(false);

  // Advanced Filter States (溢价率、基金规模、限购金额)
  const [premiumFilterPreset, setPremiumFilterPreset] = useState<string>('all');
  const [premiumMin, setPremiumMin] = useState<string>('');
  const [premiumMax, setPremiumMax] = useState<string>('');

  const [scaleFilterPreset, setScaleFilterPreset] = useState<string>('all');
  const [scaleMin, setScaleMin] = useState<string>('');
  const [scaleMax, setScaleMax] = useState<string>('');

  const [purchaseLimitFilter, setPurchaseLimitFilter] = useState<string>('all');

  // Modals
  const [selectedFundForDetail, setSelectedFundForDetail] = useState<LofRealtimeQuote | null>(null);
  const [calculatorFund, setCalculatorFund] = useState<LofRealtimeQuote | null>(null);
  const [tagModalFund, setTagModalFund] = useState<LofRealtimeQuote | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [guideInitialSection, setGuideInitialSection] = useState<'what_is_lof' | 'premium_arb' | 'tractor_guide' | 'risks' | 'formulas'>('premium_arb');
  const [isTractorPanelOpen, setIsTractorPanelOpen] = useState<boolean>(false);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState<boolean>(false);
  const [isExportImageOpen, setIsExportImageOpen] = useState<boolean>(false);
  const [exportImageInitialSource, setExportImageInitialSource] = useState<'filtered' | 'selected' | 'all'>('selected');

  // Selected funds for batch export/operations
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  // Alert Thresholds
  const [premiumThreshold, setPremiumThreshold] = useState<number>(2.0);
  const [discountThreshold, setDiscountThreshold] = useState<number>(-1.5);
  const [enableBrowserAlerts, setEnableBrowserAlerts] = useState<boolean>(true);

  // Load watchlist map on mount
  useEffect(() => {
    setWatchlistMap(getWatchlistMap());
  }, []);

  const watchlist = useMemo(() => Object.keys(watchlistMap), [watchlistMap]);

  // Compute available tags for filter bar
  const availableTags = useMemo(() => {
    const customTags = getAllUsedTags().filter(t => t !== '全部标签');
    return Array.from(new Set(['全部标签', ...customTags]));
  }, [watchlistMap]);

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
    const isCurrentlyWatched = !!watchlistMap[code];
    if (isCurrentlyWatched) {
      // Remove from map
      const next = { ...watchlistMap };
      delete next[code];
      saveWatchlistMap(next);
      setWatchlistMap(next);
    } else {
      // Add with default tag
      const updated = updateWatchlistItem(code, ['套利池'], '');
      setWatchlistMap(updated);
    }
  };

  // Save tags and notes from modal
  const handleSaveWatchlistTags = (code: string, tags: string[], note: string) => {
    const updated = updateWatchlistItem(code, tags, note);
    setWatchlistMap(updated);
  };

  // Remove fund from watchlist via tag modal
  const handleRemoveFromWatchlist = (code: string) => {
    const next = { ...watchlistMap };
    delete next[code];
    saveWatchlistMap(next);
    setWatchlistMap(next);
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
      '自选标签',
      '自选备注',
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

    const rows = filteredQuotes.map(q => {
      const item = watchlistMap[q.code];
      return [
        q.code,
        `"${q.name}"`,
        q.market === 'sz' ? '深圳' : '上海',
        q.category,
        `"${(item?.tags || []).join(';')}"`,
        `"${item?.note || ''}"`,
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
      ];
    });

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

  const handleResetAllFilters = () => {
    setSelectedCategory('全部');
    setQuickFilter('all');
    setSelectedTagFilter('全部标签');
    setSearchQuery('');
    setMinTurnover(0);
    setOnlyOpenPurchase(false);
    setPremiumFilterPreset('all');
    setPremiumMin('');
    setPremiumMax('');
    setScaleFilterPreset('all');
    setScaleMin('');
    setScaleMax('');
    setPurchaseLimitFilter('all');
  };

  const hasActiveFilters = Boolean(
    selectedCategory !== '全部' ||
    quickFilter !== 'all' ||
    (selectedTagFilter && selectedTagFilter !== '全部标签') ||
    searchQuery.trim() !== '' ||
    minTurnover > 0 ||
    onlyOpenPurchase ||
    premiumFilterPreset !== 'all' ||
    scaleFilterPreset !== 'all' ||
    purchaseLimitFilter !== 'all'
  );

  // Filter & Sort Pipeline
  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    // 1. Search Query (code, name, pinyin, manager, target, tag, note)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(item => {
        const itemWatch = watchlistMap[item.code];
        const tagsStr = (itemWatch?.tags || []).join(' ').toLowerCase();
        const noteStr = (itemWatch?.note || '').toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.pinyin.toLowerCase().includes(q) ||
          item.manager.toLowerCase().includes(q) ||
          item.trackingTarget.toLowerCase().includes(q) ||
          tagsStr.includes(q) ||
          noteStr.includes(q)
        );
      });
    }

    // 2. Category Tab (if not on watchlist tab)
    if (quickFilter !== 'watchlist' && selectedCategory !== '全部') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // 3. Quick Strategy Filters
    if (quickFilter === 'watchlist') {
      result = result.filter(item => !!watchlistMap[item.code]);
    } else if (quickFilter === 'premium') {
      result = result.filter(item => item.premiumRate >= 2.0 && item.purchaseStatus !== '暂停');
    } else if (quickFilter === 'discount') {
      result = result.filter(item => item.premiumRate <= -1.5 && item.redemptionStatus !== '暂停');
    } else if (quickFilter === 'tractor') {
      result = result.filter(item => item.tractorAllowed && item.purchaseDailyLimit > 0 && item.premiumRate >= 1.0);
    } else if (quickFilter === 'high_volume') {
      result = result.filter(item => item.turnover >= 100);
    }

    // 4. Tag Filter
    if (selectedTagFilter && selectedTagFilter !== '全部标签') {
      result = result.filter(item => {
        const itemWatch = watchlistMap[item.code];
        return itemWatch && itemWatch.tags && itemWatch.tags.includes(selectedTagFilter);
      });
    }

    // 5. Only Open Purchase
    if (onlyOpenPurchase) {
      result = result.filter(item => item.purchaseStatus !== '暂停');
    }

    // 6. Min Turnover
    if (minTurnover > 0) {
      result = result.filter(item => item.turnover >= minTurnover);
    }

    // 7. Premium Rate Range Filter
    if (premiumFilterPreset === 'ge_5') {
      result = result.filter(item => item.premiumRate >= 5.0);
    } else if (premiumFilterPreset === 'ge_2') {
      result = result.filter(item => item.premiumRate >= 2.0);
    } else if (premiumFilterPreset === '0_to_2') {
      result = result.filter(item => item.premiumRate >= 0 && item.premiumRate < 2.0);
    } else if (premiumFilterPreset === 'le_0') {
      result = result.filter(item => item.premiumRate < 0);
    } else if (premiumFilterPreset === 'le_minus_1_5') {
      result = result.filter(item => item.premiumRate <= -1.5);
    } else if (premiumFilterPreset === 'custom') {
      const minP = premiumMin !== '' ? parseFloat(premiumMin) : null;
      const maxP = premiumMax !== '' ? parseFloat(premiumMax) : null;
      if (minP !== null && !isNaN(minP)) {
        result = result.filter(item => item.premiumRate >= minP);
      }
      if (maxP !== null && !isNaN(maxP)) {
        result = result.filter(item => item.premiumRate <= maxP);
      }
    }

    // 8. Fund Scale Filter (亿元)
    if (scaleFilterPreset === 'lt_1') {
      result = result.filter(item => (item.fundScale || 0) < 1.0);
    } else if (scaleFilterPreset === '1_to_5') {
      result = result.filter(item => (item.fundScale || 0) >= 1.0 && (item.fundScale || 0) <= 5.0);
    } else if (scaleFilterPreset === '5_to_20') {
      result = result.filter(item => (item.fundScale || 0) > 5.0 && (item.fundScale || 0) <= 20.0);
    } else if (scaleFilterPreset === 'gt_20') {
      result = result.filter(item => (item.fundScale || 0) > 20.0);
    } else if (scaleFilterPreset === 'custom') {
      const minS = scaleMin !== '' ? parseFloat(scaleMin) : null;
      const maxS = scaleMax !== '' ? parseFloat(scaleMax) : null;
      if (minS !== null && !isNaN(minS)) {
        result = result.filter(item => (item.fundScale || 0) >= minS);
      }
      if (maxS !== null && !isNaN(maxS)) {
        result = result.filter(item => (item.fundScale || 0) <= maxS);
      }
    }

    // 9. Purchase Daily Limit Filter
    if (purchaseLimitFilter === 'le_100') {
      result = result.filter(item => item.purchaseDailyLimit > 0 && item.purchaseDailyLimit <= 100);
    } else if (purchaseLimitFilter === 'le_500') {
      result = result.filter(item => item.purchaseDailyLimit > 0 && item.purchaseDailyLimit <= 500);
    } else if (purchaseLimitFilter === 'le_1000') {
      result = result.filter(item => item.purchaseDailyLimit > 0 && item.purchaseDailyLimit <= 1000);
    } else if (purchaseLimitFilter === 'unlimited') {
      result = result.filter(item => item.purchaseDailyLimit === 0 && item.purchaseStatus !== '暂停');
    } else if (purchaseLimitFilter === 'paused') {
      result = result.filter(item => item.purchaseStatus === '暂停');
    }

    // 10. Sorting
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

    // Attach watchlist item reference for easily passing around
    return result.map(item => ({
      ...item,
      watchlistInfo: watchlistMap[item.code]
    }));
  }, [
    quotes,
    searchQuery,
    selectedCategory,
    quickFilter,
    selectedTagFilter,
    watchlistMap,
    onlyOpenPurchase,
    minTurnover,
    premiumFilterPreset,
    premiumMin,
    premiumMax,
    scaleFilterPreset,
    scaleMin,
    scaleMax,
    purchaseLimitFilter,
    sortBy,
    sortOrder
  ]);

  // Selection handlers
  const handleToggleSelectCode = (code: string) => {
    setSelectedCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSelectAllCurrent = () => {
    const currentFilteredCodes = filteredQuotes.map(q => q.code);
    const isAllSelected = currentFilteredCodes.length > 0 && currentFilteredCodes.every(c => selectedCodes.includes(c));
    if (isAllSelected) {
      setSelectedCodes(prev => prev.filter(c => !currentFilteredCodes.includes(c)));
    } else {
      setSelectedCodes(prev => Array.from(new Set([...prev, ...currentFilteredCodes])));
    }
  };

  const isAllFilteredSelected = useMemo(() => {
    return filteredQuotes.length > 0 && filteredQuotes.every(q => selectedCodes.includes(q.code));
  }, [filteredQuotes, selectedCodes]);

  const handleSelectAllFiltered = () => {
    const currentFilteredCodes = filteredQuotes.map(q => q.code);
    if (isAllFilteredSelected) {
      setSelectedCodes(prev => prev.filter(c => !currentFilteredCodes.includes(c)));
    } else {
      setSelectedCodes(prev => Array.from(new Set([...prev, ...currentFilteredCodes])));
    }
  };

  const handleClearSelection = () => {
    setSelectedCodes([]);
  };

  const handleOpenExportSelected = () => {
    setExportImageInitialSource('selected');
    setIsExportImageOpen(true);
  };

  const handleOpenExportFiltered = () => {
    setExportImageInitialSource(selectedCodes.length > 0 ? 'selected' : 'filtered');
    setIsExportImageOpen(true);
  };

  const handleOpenExportGeneral = () => {
    setExportImageInitialSource(selectedCodes.length > 0 ? 'selected' : 'filtered');
    setIsExportImageOpen(true);
  };

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
        onOpenGuide={() => {
          setGuideInitialSection('premium_arb');
          setIsGuideOpen(true);
        }}
        onOpenFormulaGuide={() => {
          setGuideInitialSection('formulas');
          setIsGuideOpen(true);
        }}
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
          onFilterHighPremium={() => {
            setQuickFilter('premium');
            setSelectedTagFilter('全部标签');
          }}
          onFilterDeepDiscount={() => {
            setQuickFilter('discount');
            setSelectedTagFilter('全部标签');
          }}
          onFilterTractor={() => {
            setQuickFilter('tractor');
            setSelectedTagFilter('全部标签');
          }}
          onShowAll={() => {
            setQuickFilter('all');
            setSelectedCategory('全部');
            setSelectedTagFilter('全部标签');
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
          selectedCount={selectedCodes.length}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onExportCsv={handleExportCsv}
          onExportImage={handleOpenExportGeneral}
          onExportFilteredImage={handleOpenExportFiltered}
          onExportSelectedImage={handleOpenExportSelected}
          minTurnover={minTurnover}
          setMinTurnover={setMinTurnover}
          onlyOpenPurchase={onlyOpenPurchase}
          setOnlyOpenPurchase={setOnlyOpenPurchase}
          selectedTagFilter={selectedTagFilter}
          setSelectedTagFilter={setSelectedTagFilter}
          availableTags={availableTags}
          premiumFilterPreset={premiumFilterPreset}
          setPremiumFilterPreset={setPremiumFilterPreset}
          premiumMin={premiumMin}
          setPremiumMin={setPremiumMin}
          premiumMax={premiumMax}
          setPremiumMax={setPremiumMax}
          scaleFilterPreset={scaleFilterPreset}
          setScaleFilterPreset={setScaleFilterPreset}
          scaleMin={scaleMin}
          setScaleMin={setScaleMin}
          scaleMax={scaleMax}
          setScaleMax={setScaleMax}
          purchaseLimitFilter={purchaseLimitFilter}
          setPurchaseLimitFilter={setPurchaseLimitFilter}
          onSelectAllFiltered={handleSelectAllFiltered}
          isAllFilteredSelected={isAllFilteredSelected}
          onResetAllFilters={handleResetAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Primary Data Grid */}
        <LofTable
          quotes={filteredQuotes}
          watchlist={watchlist}
          watchlistMap={watchlistMap}
          selectedCodes={selectedCodes}
          onToggleSelectCode={handleToggleSelectCode}
          onSelectAll={handleSelectAllCurrent}
          onClearSelection={handleClearSelection}
          onExportSelectedImage={handleOpenExportSelected}
          onToggleWatchlist={handleToggleWatchlist}
          onOpenTagModal={(fund) => setTagModalFund(fund)}
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
            <span>覆盖沪深两市520+全部LOF标的</span>
            <span className="mx-2">•</span>
            <span>数据更新时间: {lastUpdateTime || '实时'}</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            公众号：我爱这young • 免责声明：本站数据仅供研究参考，不构成任何投资建议。基金有风险，投资需谨慎。
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
          isSelected={selectedCodes.includes(selectedFundForDetail.code)}
          onToggleSelect={handleToggleSelectCode}
          onExportSingleImage={(fund) => {
            if (!selectedCodes.includes(fund.code)) {
              setSelectedCodes([fund.code]);
            }
            setSelectedFundForDetail(null);
            setExportImageInitialSource('selected');
            setIsExportImageOpen(true);
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
        <ArbitrageGuideModal
          initialSection={guideInitialSection}
          onClose={() => setIsGuideOpen(false)}
        />
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

      {/* Watchlist Tag & Note Modal */}
      {tagModalFund && (
        <WatchlistTagModal
          isOpen={!!tagModalFund}
          fund={tagModalFund}
          watchlistInfo={watchlistMap[tagModalFund.code]}
          onClose={() => setTagModalFund(null)}
          onSave={handleSaveWatchlistTags}
          onRemove={handleRemoveFromWatchlist}
        />
      )}

      {/* Export to Image Modal with Custom 4-Column Mode and Selection Support */}
      {isExportImageOpen && (
        <ExportImageModal
          isOpen={isExportImageOpen}
          allQuotes={quotes}
          filteredQuotes={filteredQuotes}
          selectedCodes={selectedCodes}
          onToggleSelectCode={handleToggleSelectCode}
          onUpdateSelectedCodes={(codes) => setSelectedCodes(codes)}
          watchlistCodes={Object.keys(watchlistMap)}
          summary={summary}
          selectedCategory={selectedCategory}
          quickFilterLabel={
            quickFilter === 'watchlist' ? '自选池' :
            quickFilter === 'premium' ? '高溢价套利' :
            quickFilter === 'discount' ? '深度折价' :
            quickFilter === 'tractor' ? '拖拉机限额' :
            quickFilter === 'high_volume' ? '高流动性' : '全部标的'
          }
          selectedTagFilter={selectedTagFilter}
          sortByLabel={
            sortBy === 'premiumRate' ? '实时溢价率' :
            sortBy === 'netArbitrageSpread' ? '净套利空间' :
            sortBy === 'currentPrice' ? '场内现价' :
            sortBy === 'turnover' ? '成交额' :
            sortBy === 'purchaseDailyLimit' ? '单日限额' : '综合排序'
          }
          initialSource={exportImageInitialSource}
          onClose={() => setIsExportImageOpen(false)}
        />
      )}

    </div>
  );
}

