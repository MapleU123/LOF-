import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Palette,
  ShieldCheck,
  ShieldOff,
  Filter,
  CheckSquare,
  ExternalLink,
  Layers,
  AlertCircle,
  Maximize2,
  ZoomIn,
  Edit3,
  Smartphone
} from 'lucide-react';
import { LofRealtimeQuote, MarketSummary } from '../types/lof';
import {
  generateLofTableCanvas,
  downloadLofTableImage,
  copyLofTableImageToClipboard,
  LofImageExportOptions
} from '../utils/exportLofImage';

interface ExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  allQuotes: LofRealtimeQuote[];
  filteredQuotes: LofRealtimeQuote[];
  selectedCodes: string[];
  onToggleSelectCode?: (code: string) => void;
  onUpdateSelectedCodes?: (codes: string[]) => void;
  watchlistCodes?: string[];
  summary: MarketSummary | null;
  selectedCategory: string;
  quickFilterLabel: string;
  selectedTagFilter?: string;
  sortByLabel: string;
  initialSource?: 'filtered' | 'selected' | 'all';
}

export const ExportImageModal: React.FC<ExportImageModalProps> = ({
  isOpen,
  onClose,
  allQuotes,
  filteredQuotes,
  selectedCodes,
  selectedCategory,
  quickFilterLabel,
  selectedTagFilter,
  initialSource = 'selected'
}) => {
  // 1. 基金数据源选择: 默认 'selected' (选中的基金)
  const [exportSource, setExportSource] = useState<'selected' | 'filtered' | 'all'>('selected');

  // 2. 颜色风格主题: 'dark' (经典深色) | 'light' (商务雅白) | 'wine' (典雅酒红)
  const [theme, setTheme] = useState<'dark' | 'light' | 'wine'>('dark');

  // 3. 方位水印选择: 'full' (全图平铺) | 'bottom' (底部署名) | 'none' (纯净无水印)
  const [watermarkPosition, setWatermarkPosition] = useState<'full' | 'bottom' | 'none'>('full');
  const [watermarkText, setWatermarkText] = useState<string>('公众号：我爱这young');
  const [isEditingWatermarkText, setIsEditingWatermarkText] = useState<boolean>(false);

  // 4. 预览缩放视图模式: 'fit' (自适应窗口) | 'original' (100% 原始高清可滚动)
  const [viewMode, setViewMode] = useState<'fit' | 'original'>('fit');

  // 5. 渲染与操作状态
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Sync initial export source on open
  useEffect(() => {
    if (isOpen) {
      if (initialSource === 'selected' && selectedCodes.length > 0) {
        setExportSource('selected');
      } else if (selectedCodes.length > 0) {
        setExportSource('selected');
      } else if (initialSource === 'all') {
        setExportSource('all');
      } else {
        setExportSource('filtered');
      }
      setRenderError(null);
    }
  }, [isOpen, initialSource, selectedCodes.length]);

  // Compute dataset to export based on source
  const targetQuotes = useMemo(() => {
    const quoteMap = new Map<string, LofRealtimeQuote>();
    allQuotes.forEach(q => quoteMap.set(q.code, q));
    filteredQuotes.forEach(q => quoteMap.set(q.code, q));

    if (exportSource === 'selected') {
      const matched = selectedCodes
        .map(code => quoteMap.get(code))
        .filter((q): q is LofRealtimeQuote => Boolean(q));
      return matched;
    }
    if (exportSource === 'all') {
      return allQuotes;
    }
    return filteredQuotes;
  }, [exportSource, selectedCodes, filteredQuotes, allQuotes]);

  // Current options object
  const currentOptions = useMemo<LofImageExportOptions>(() => {
    const title = exportSource === 'selected' 
      ? '精选 LOF 基金实时溢价套利行情表' 
      : exportSource === 'filtered' 
      ? '筛选 LOF 基金实时溢价套利行情表' 
      : '全市场 LOF 基金实时溢价套利行情表';

    return {
      theme,
      title,
      subtitle: '实时追踪场内折溢价 · 监控场外申购限额与套利机会',
      watermark: watermarkPosition !== 'none',
      watermarkPosition,
      watermarkText: watermarkText.trim() || '公众号：我爱这young',
      scale: 2,
      category: selectedCategory,
      strategy: quickFilterLabel,
      tagFilter: selectedTagFilter
    };
  }, [theme, watermarkPosition, watermarkText, exportSource, selectedCategory, quickFilterLabel, selectedTagFilter]);

  // Generate Real-time HD Preview (Canvas to DataURL)
  useEffect(() => {
    if (!isOpen || targetQuotes.length === 0) {
      setPreviewUrl(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setRenderError(null);

    const timer = setTimeout(async () => {
      try {
        const canvas = await generateLofTableCanvas(targetQuotes, currentOptions);
        if (isMounted) {
          const url = canvas.toDataURL('image/png');
          setPreviewUrl(url);
          setIsGenerating(false);
        }
      } catch (err: any) {
        console.error('Failed to render canvas preview:', err);
        if (isMounted) {
          setRenderError(err?.message || '长图渲染失败，请检查标的数据');
          setIsGenerating(false);
        }
      }
    }, 40);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, targetQuotes, currentOptions]);

  if (!isOpen) return null;

  const handleDownload = async (format: 'png' | 'jpg' = 'png') => {
    if (targetQuotes.length === 0) return;
    setIsGenerating(true);
    try {
      if (previewUrl && format === 'png') {
        const cleanTitle = (currentOptions.title || 'LOF基金实时溢价行情表')
          .replace(/[\\/:*?"<>|]/g, '_')
          .trim();
        const wmTag = watermarkPosition === 'full' ? '_平铺水印' : watermarkPosition === 'bottom' ? '_底部署名' : '_纯净版';
        const countTag = `_${targetQuotes.length}只`;
        const filename = `${cleanTitle}_小红书9_16${countTag}${wmTag}_${new Date().toISOString().slice(0, 10)}.png`;

        const link = document.createElement('a');
        link.download = filename;
        link.href = previewUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await downloadLofTableImage(targetQuotes, currentOptions, format);
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err: any) {
      console.error('Download image error:', err);
      if (previewUrl) {
        window.open(previewUrl, '_blank');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyClipboard = async () => {
    if (targetQuotes.length === 0) return;
    const success = await copyLofTableImageToClipboard(targetQuotes, currentOptions);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      handleDownload('png');
    }
  };

  const handleOpenInNewTab = () => {
    if (!previewUrl) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>小红书 9:16 LOF基金实时行情图文预览</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; background: #080c15; display: flex; justify-content: center; padding: 20px; font-family: sans-serif; }
              img { max-width: 100%; height: auto; max-height: 96vh; aspect-ratio: 9/16; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.7); border-radius: 12px; }
            </style>
          </head>
          <body>
            <img src="${previewUrl}" alt="小红书9:16 LOF行情图" />
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      window.location.href = previewUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[94vh] max-h-[950px] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* 1. 顶部标题栏 */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                小红书图文笔记 (9:16) 导出
                <span className="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  9:16 竖版超清
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  已选 {targetQuotes.length} 只标的
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                适配小红书图文笔记规范 · 基金名称、代码、限购额度、现价/预估净值、实时溢价率
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 核心控制工具栏 (放置在顶部：基金选择、颜色风格、方位水印、显示模式、下载操作) */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* ① 导出的基金标的切换 */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span>基金范围:</span>
              </span>
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setExportSource('selected')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                    exportSource === 'selected'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="仅导出在主列表中已勾选的基金"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>已勾选 ({selectedCodes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportSource('filtered')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    exportSource === 'filtered'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="导出当前筛选条件下的全部基金"
                >
                  当前筛选 ({filteredQuotes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setExportSource('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    exportSource === 'all'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="导出全市场全部 LOF 基金"
                >
                  全市场 ({allQuotes.length})
                </button>
              </div>
            </div>

            {/* ② 颜色风格切换 (经典深色 / 商务雅白 / 典雅酒红) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>颜色风格:</span>
              </span>
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {[
                  { id: 'dark' as const, label: '经典深色', dotBg: '#080c15', dotBorder: '#f59e0b' },
                  { id: 'light' as const, label: '商务雅白', dotBg: '#ffffff', dotBorder: '#0284c7' },
                  { id: 'wine' as const, label: '典雅酒红', dotBg: '#160813', dotBorder: '#fb7185' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                      theme === item.id 
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border"
                      style={{ backgroundColor: item.dotBg, borderColor: item.dotBorder }}
                    />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ③ 方位水印选择 (全图平铺 / 仅底部署名 / 纯净无水印) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                {watermarkPosition === 'full' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : watermarkPosition === 'bottom' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <ShieldOff className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>方位水印:</span>
              </span>
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setWatermarkPosition('full')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    watermarkPosition === 'full' 
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="全图倾斜平铺防伪水印"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>全图平铺</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkPosition('bottom')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    watermarkPosition === 'bottom' 
                      ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="仅在图片底部免责声明处署名"
                >
                  <span>底部署名</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkPosition('none')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    watermarkPosition === 'none' 
                      ? 'bg-slate-800 text-slate-200 font-bold border border-slate-700' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="无任何水印，导出纯净图片"
                >
                  <ShieldOff className="w-3 h-3" />
                  <span>无水印</span>
                </button>
              </div>

              {/* 水印文字编辑小按钮 */}
              {watermarkPosition !== 'none' && (
                <div className="flex items-center gap-1 ml-1">
                  {isEditingWatermarkText ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={e => setWatermarkText(e.target.value)}
                        placeholder="输入水印文字..."
                        className="px-2 py-0.5 bg-slate-900 border border-amber-500/50 rounded text-xs text-amber-200 w-36 focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingWatermarkText(false)}
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px]"
                      >
                        完成
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingWatermarkText(true)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center gap-1 text-[11px] transition cursor-pointer"
                      title="点击修改水印文字内容"
                    >
                      <Edit3 className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[120px]">{watermarkText || '公众号：我爱这young'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ④ 视图缩放模式切换 (适屏全貌 / 100% 原始高清) */}
            <div className="flex items-center gap-1.5">
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('fit')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    viewMode === 'fit'
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="整页 9:16 完整缩放适配窗口，免滚动"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>9:16 适屏</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('original')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    viewMode === 'original'
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="以 100% 原始超清像素展示，支持滚动细看"
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>100% 原图</span>
                </button>
              </div>
            </div>

          </div>

          {/* ⑤ 右侧下载与快捷操作按钮组 */}
          <div className="flex items-center gap-2 ml-auto">
            {previewUrl && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                title="在新标签页中打开全尺寸 9:16 高清图"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">新标签大图</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyClipboard}
              disabled={isGenerating || targetQuotes.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              title="复制图片到剪贴板"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>复制图片</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownload('png')}
              disabled={isGenerating || targetQuotes.length === 0}
              className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>已保存</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>下载 9:16 小红书长图</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* 3. 核心 9:16 大图展示区 (支持「9:16 适屏全貌」与「100% 原始高清」即时切换) */}
        <div className="flex-1 w-full min-h-0 bg-slate-950/95 p-3 sm:p-4 flex items-center justify-center overflow-auto relative">
          {targetQuotes.length === 0 ? (
            <div className="bg-slate-900 rounded-xl p-8 text-center text-slate-400 max-w-md my-auto border border-slate-800 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-rose-900/40 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-400">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-200 text-base">
                {exportSource === 'selected' ? '您当前尚未勾选任何基金' : '当前条件下暂无基金标的'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                {exportSource === 'selected'
                  ? '请在上方工具栏切换为“当前筛选”或在主界面行情表中勾选基金。'
                  : '请在上方工具栏切换为“全市场”或放宽筛选条件。'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setExportSource('filtered')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  切换为当前筛选 ({filteredQuotes.length}只)
                </button>
                <button
                  type="button"
                  onClick={() => setExportSource('all')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  切换为全市场 ({allQuotes.length}只)
                </button>
              </div>
            </div>
          ) : isGenerating || !previewUrl ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm font-medium">正在生成 9:16 小红书图文笔记...</div>
            </div>
          ) : renderError ? (
            <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-6 text-center text-red-200 max-w-md my-auto">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <p className="text-sm font-bold">{renderError}</p>
            </div>
          ) : (
            <div className={`w-full h-full flex flex-col items-center select-none ${
              viewMode === 'fit' ? 'justify-center overflow-hidden' : 'justify-start overflow-auto p-4'
            }`}>
              {/* 9:16 整页自适应 / 100% 原始长图 */}
              <div className={viewMode === 'fit' ? 'h-full max-h-full flex items-center justify-center p-1' : 'w-auto'}>
                <img
                  src={previewUrl}
                  alt="小红书9:16 LOF基金行情图文笔记"
                  style={{
                    aspectRatio: '9/16',
                    maxHeight: viewMode === 'fit' ? '100%' : 'none'
                  }}
                  className={`rounded-xl shadow-2xl border border-slate-800/90 transition-all duration-150 ${
                    viewMode === 'fit' 
                      ? 'max-h-full object-contain cursor-zoom-in hover:scale-[1.01]' 
                      : 'w-auto max-w-none cursor-default'
                  }`}
                  onClick={() => {
                    if (viewMode === 'fit') {
                      setViewMode('original');
                    }
                  }}
                  title={viewMode === 'fit' ? '点击切换为 100% 原始超清细节，或右键另存为图片' : '100% 原始像素展示中，可右键另存为图片'}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. 底部说明与状态栏 */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-semibold">
              📕 9:16 小红书图文笔记格式
            </span>
            <span className="text-slate-600">|</span>
            <span>
              已展示 <strong className="text-slate-100 font-bold">{Math.min(targetQuotes.length, 22)}</strong> 只核心标的
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400">
              {watermarkPosition === 'full' 
                ? `✓ 全图平铺防伪水印（${watermarkText || '公众号：我爱这young'}）` 
                : watermarkPosition === 'bottom' 
                ? `✓ 底部署名水印（${watermarkText || '公众号：我爱这young'}）` 
                : '✓ 纯净无水印模式'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-mono">
              2160 × 3840 (Retina 2x)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              💡 提示：可直接在图片上【右键另存为】或手机【长按保存】
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition cursor-pointer"
            >
              关闭
            </button>
            <button
              onClick={() => handleDownload('png')}
              disabled={isGenerating || targetQuotes.length === 0}
              className="px-4 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 9:16 图片</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
