import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Tractor,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  ShieldAlert,
  Zap,
  ArrowRight
} from 'lucide-react';

interface ArbitrageGuideModalProps {
  onClose: () => void;
}

export const ArbitrageGuideModal: React.FC<ArbitrageGuideModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<'what_is_lof' | 'premium_arb' | 'tractor_guide' | 'risks'>('premium_arb');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                LOF基金套利与拖拉机实战全攻略
              </h2>
              <p className="text-xs text-slate-500">
                一文吃透A股LOF折溢价套利机制、深市6拖拉机开户与避坑指南
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveSection('premium_arb')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'premium_arb'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>1. 溢价套利 4 步走实操</span>
          </button>

          <button
            onClick={() => setActiveSection('tractor_guide')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'tractor_guide'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tractor className="w-3.5 h-3.5" />
            <span>2. 拖拉机套利玩法与开卡教程</span>
          </button>

          <button
            onClick={() => setActiveSection('what_is_lof')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'what_is_lof'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>3. 什么是LOF？跨市场原理</span>
          </button>

          <button
            onClick={() => setActiveSection('risks')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'risks'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>4. 核心风险与避坑秘籍</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700 leading-relaxed">
          
          {/* Section 1: Premium Arb */}
          {activeSection === 'premium_arb' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 text-indigo-950">
                <h4 className="font-bold text-sm text-indigo-900 mb-1">溢价套利核心逻辑</h4>
                <p>
                  当某只LOF基金在二级市场被资金热炒，导致 <strong>场内现价 &gt; 基金预估净值 (溢价率 &gt; 2%)</strong> 时，我们可以在证券软件中通过 <strong>场内申购</strong> (按净值获取份额)，并在 <strong>T+2日</strong> 份额到账后在场内以市场价卖出，赚取中间的折溢价差价。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px]">1</span>
                    <span>T日 发现机会并申购</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    交易日 15:00 前，在券商App中点击【场内申购】(注意不是普通理财申购)，输入基金代码与金额。
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[11px]">2</span>
                    <span>T+1日 份额确认</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    基金公司按照T日收盘公布的净值结算扣款并确认基金份额。
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[11px]">3</span>
                    <span>T+2日 场内卖出</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    早盘 09:15 集合竞价或 09:30 开盘后，基金份额显示在持仓中，直接以市价或限价卖出。
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[11px]">4</span>
                    <span>资金回笼再循环</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    T+2日卖出所得资金即刻回到证券可用资金，当日15:00前可继续申购下一轮，实现日日循环！
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  什么是净套利空间？
                </h5>
                <p className="text-slate-600 text-[11px]">
                  <strong>净套利空间 = 实时溢价率 - 申购费率 (通常0.10%~0.15%) - 券商卖出交易佣金 (通常万三0.03%)</strong>。只要净套利空间 &gt; 1.5%，且底层资产标的走势平稳，通常就具备较好的实操性价比。
                </p>
              </div>
            </div>
          )}

          {/* Section 2: Tractor Guide */}
          {activeSection === 'tractor_guide' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-amber-950">
                <h4 className="font-bold text-sm text-amber-900 mb-1 flex items-center gap-1.5">
                  <Tractor className="w-4 h-4 text-amber-600" />
                  什么是“拖拉机套利”？
                </h4>
                <p>
                  像印度基金 (164824)、易方达原油 (161129) 等热门QDII基金，由于外汇额度紧缺，基金公司通常设置了 <strong>单日单账户限额 100 元或 500 元</strong>。
                  如果只用一个席位申购，每天只能申购100元，赚取的绝对收益较少。<br />
                  <strong>拖拉机技巧：</strong> 深圳证券交易所规则允许<strong>同一个身份证可以在不同券商开立多达 6 个深A股东卡</strong>（1个主股东卡 + 5个加挂辅助股东席位）。把这6个深A股东卡全部挂载到支持拖拉机功能的券商（如华宝证券、银河证券、国金证券等），就可以实现 <strong>1个账户单日同时提交 6 笔 100 元申购，额度直接翻 6 倍！</strong>
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h5 className="font-bold text-slate-800 text-xs">深市拖拉机开户与配置 3 步法：</h5>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>
                    <strong>准备 6 个深A股东代码：</strong> 在不同的券商App完成开户（中国结算规定每人最多可开立3个主券商账户，若需更多可通过转托管或增开深A股东代码）。
                  </li>
                  <li>
                    <strong>在主券商加挂股东席位：</strong> 登录支持拖拉机操作的券商App（如华宝证券等），进入【业务办理】→【加挂股东账户】或【开立深A基金账户/深A证券衍生账户】，将名下的其他深A股东卡号码绑定进同一个交易软件。
                  </li>
                  <li>
                    <strong>一键多席位申购：</strong> 在软件的【LOF多账户申购】或【批量申购】功能中，勾选全部6个席位，输入限额金额（如100元），一键提交，系统将同时向基金公司报送6笔申购！
                  </li>
                </ol>
              </div>

              <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 text-purple-900">
                <strong>💡 收益放大倍数：</strong>
                若本人有 6 个深市席位，配偶/家人也有 6 个席位，则总共拥有 <strong>12 个拖拉机席位</strong>。若单日限额 500 元、溢价率 8%，则每日可申购 6,000 元，单日理论收益可达约 <strong>480 元</strong>，月度收益轻松过万元！
              </div>
            </div>
          )}

          {/* Section 3: What is LOF */}
          {activeSection === 'what_is_lof' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">什么是 LOF (上市开放式基金)？</h4>
                <p className="text-slate-600">
                  LOF 是 <em>Listed Open-Ended Fund</em> 的缩写。与普通场外基金只能申购赎回、普通封闭基金只能在二级市场买卖不同，<strong>LOF 基金既可以在场外按每日净值申购/赎回，也可以像股票一样在证券交易所场内实时买卖交易</strong>。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200">
                  <h5 className="font-bold text-rose-900 mb-1">场内买卖价格 (二级市场现价)</h5>
                  <p className="text-rose-700 text-[11px]">
                    由场内买家和卖家撮合交易决定，受市场情绪、流动性短缺或追捧影响，经常脱离基金实际净值产生大幅溢价或折价。
                  </p>
                </div>

                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
                  <h5 className="font-bold text-blue-900 mb-1">基金单位净值 (NAV / IOPV)</h5>
                  <p className="text-blue-700 text-[11px]">
                    基金实际持有的底层一篮子股票、期货、外汇等资产的真实市值。每日收盘后官方结算公布，盘中由行情系统根据标的涨跌实时预估。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Risks */}
          {activeSection === 'risks' && (
            <div className="space-y-4">
              <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 text-rose-950">
                <h4 className="font-bold text-sm text-rose-900 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  LOF套利必须警惕的 4 大风险
                </h4>
                <p>
                  套利并非 100% 绝对无风险保本，请在实操前务必理解以下潜在风险点：
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                  <div>
                    <strong className="text-slate-900">1. T+2 期间底层资产大跌风险：</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      从T日申购到T+2日场内卖出存在2个交易日的时间差。如果期间海外市场或原油等大宗商品暴跌，可能侵蚀套利安全垫。建议溢价率 &gt; 2%~3% 时再行操作。
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                  <div>
                    <strong className="text-slate-900">2. 溢价率在T+2日快速收敛：</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      若某只基金大量投资者涌入套利，T+2日到账抛压增大可能导致场内价格砸跌停。对于小盘LOF需关注每日场内成交额。
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                  <div>
                    <strong className="text-slate-900">3. 基金公司突然关闭申购或调低限额：</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      外汇额度耗尽时基金公司可能突发公告“自明日起暂停申购”，请及时关注本平台的【申购状态】与限额提醒。
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                  <div>
                    <strong className="text-slate-900">4. 场外申购误选“普通申购”而非“场内申购”：</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      在券商下单时，务必选择【场内申购 / 场内基金申购】。如果误选场外理财申购，份额会落在场外，需要耗费2个交易日做【跨系统转托管】到场内后才能卖出。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            我已了解
          </button>
        </div>

      </div>
    </div>
  );
};
