import React, { useState } from 'react';
import { X, Bell, Shield, Check, Info } from 'lucide-react';

interface AlertSettingsModalProps {
  onClose: () => void;
  premiumThreshold: number;
  setPremiumThreshold: (val: number) => void;
  discountThreshold: number;
  setDiscountThreshold: (val: number) => void;
  enableBrowserAlerts: boolean;
  setEnableBrowserAlerts: (val: boolean) => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  onClose,
  premiumThreshold,
  setPremiumThreshold,
  discountThreshold,
  setDiscountThreshold,
  enableBrowserAlerts,
  setEnableBrowserAlerts
}) => {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">折溢价异动预警设置</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              高溢价套利预警阈值 (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.5}
                min={0.5}
                max={50}
                value={premiumThreshold}
                onChange={(e) => setPremiumThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 shrink-0">当前: &ge; {premiumThreshold}%</span>
            </div>
            <p className="text-[11px] text-slate-400">当任意LOF实时溢价率超过该数值时高亮提醒并标记</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              深度折价机会预警阈值 (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.5}
                max={-0.5}
                min={-30}
                value={discountThreshold}
                onChange={(e) => setDiscountThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 shrink-0">当前: &le; {discountThreshold}%</span>
            </div>
            <p className="text-[11px] text-slate-400">当LOF折价率低于该阈值时触发折价买入提示</p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-700">启用行情刷新高亮闪烁</span>
            <input
              type="checkbox"
              checked={enableBrowserAlerts}
              onChange={(e) => setEnableBrowserAlerts(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{saved ? '已保存' : '保存设置'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
