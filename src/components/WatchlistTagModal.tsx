import React, { useState, useEffect } from 'react';
import { LofRealtimeQuote, WatchlistItem, PRESET_WATCHLIST_TAGS } from '../types/lof';
import { X, Tag, StickyNote, Star, Trash2, Check, Plus } from 'lucide-react';

interface WatchlistTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  fund: LofRealtimeQuote | null;
  watchlistInfo?: WatchlistItem;
  onSave: (code: string, tags: string[], note: string) => void;
  onRemove: (code: string) => void;
}

const TAG_COLOR_MAP: Record<string, string> = {
  '套利池': 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  '观察池': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  '核心底仓': 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  '高溢价监控': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  '深度折价': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  '定投池': 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  '大宗商品': 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
};

export const WatchlistTagModal: React.FC<WatchlistTagModalProps> = ({
  isOpen,
  onClose,
  fund,
  watchlistInfo,
  onSave,
  onRemove
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (fund) {
      setSelectedTags(watchlistInfo?.tags || ['套利池']);
      setNote(watchlistInfo?.note || '');
      setCustomTagInput('');
    }
  }, [fund, watchlistInfo, isOpen]);

  if (!isOpen || !fund) return null;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tag = customTagInput.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setCustomTagInput('');
    }
  };

  const handleSave = () => {
    onSave(fund.code, selectedTags, note);
    onClose();
  };

  const handleRemove = () => {
    onRemove(fund.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{fund.name}</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/15 text-slate-200">
                  {fund.code}.{fund.market.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300">设置自选标签与专属投资备注</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div>
              <div className="text-[11px] text-slate-500">场内现价</div>
              <div className="font-mono font-bold text-slate-900 text-sm">¥{fund.currentPrice.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">实时溢价率</div>
              <div className={`font-mono font-bold text-sm ${fund.premiumRate >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {fund.premiumRate >= 0 ? `+${fund.premiumRate}%` : `${fund.premiumRate}%`}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">申购状态</div>
              <div className="text-xs font-semibold text-slate-800 truncate">{fund.purchaseStatus}</div>
            </div>
          </div>

          {/* Preset Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                选择标签分类
              </label>
              <span className="text-[11px] text-slate-400">可多选</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_WATCHLIST_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const colorClass = TAG_COLOR_MAP[tag] || 'bg-slate-100 text-slate-700 border-slate-200';
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : `${colorClass} hover:border-slate-300`
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tag Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              自定义标签
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag(e)}
                placeholder="输入新标签名，例如：实盘A、打底仓..."
                maxLength={12}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddCustomTag()}
                disabled={!customTagInput.trim()}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加
              </button>
            </div>

            {/* Render any non-preset custom tags */}
            {selectedTags.filter(t => !PRESET_WATCHLIST_TAGS.includes(t as any)).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedTags
                  .filter(t => !PRESET_WATCHLIST_TAGS.includes(t as any))
                  .map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className="hover:text-indigo-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
              投资备忘与交易笔记
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录您的套利策略、单日申购额度、卖出触发目标或观察心得..."
              rows={3}
              maxLength={200}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
            <div className="text-[11px] text-slate-400 text-right">{note.length}/200 字</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            移出自选
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
