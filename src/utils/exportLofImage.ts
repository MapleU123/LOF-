import { LofRealtimeQuote } from '../types/lof';

export interface LofImageExportOptions {
  theme?: 'dark' | 'light' | 'wine';
  title?: string;
  subtitle?: string;
  watermark?: boolean;
  watermarkPosition?: 'full' | 'bottom' | 'none'; // 水印方位: 全图平铺 / 仅底部署名 / 无水印
  watermarkText?: string;
  scale?: number; // 缩放倍数，默认 2 (高清视网膜渲染 2160 × 3840)
  category?: string;
  strategy?: string;
  tagFilter?: string;
}

export const THEME_COLORS = {
  dark: {
    bg: '#080c15',
    cardBg: '#0f172a',
    cardBorder: '#1e293b',
    rowEven: '#0d1322',
    rowOdd: '#090e1a',
    border: '#1e293b',
    borderLight: '#334155',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    accentGold: '#f59e0b',
    accentCyan: '#06b6d4',
    accentRose: '#f43f5e',
    accentGreen: '#10b981',
    headerGradientStart: '#0f172a',
    headerGradientEnd: '#1e1b4b',
    badgeBg: '#1e293b',
    tableHeaderBg: '#131b2e'
  },
  light: {
    bg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    rowEven: '#f8fafc',
    rowOdd: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#cbd5e1',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    accentGold: '#d97706',
    accentCyan: '#0284c7',
    accentRose: '#e11d48',
    accentGreen: '#059669',
    headerGradientStart: '#ffffff',
    headerGradientEnd: '#f1f5f9',
    badgeBg: '#e2e8f0',
    tableHeaderBg: '#eef2f6'
  },
  wine: {
    bg: '#160813',
    cardBg: '#281023',
    cardBorder: '#4a1538',
    rowEven: '#200c1c',
    rowOdd: '#180915',
    border: '#4a1538',
    borderLight: '#701a53',
    text: '#fff1f2',
    textSecondary: '#fda4af',
    textMuted: '#9f1239',
    accentGold: '#fbbf24',
    accentCyan: '#38bdf8',
    accentRose: '#fb7185',
    accentGreen: '#34d399',
    headerGradientStart: '#281023',
    headerGradientEnd: '#4c0519',
    badgeBg: '#3d1231',
    tableHeaderBg: '#34132c'
  }
};

/**
 * 兼容所有浏览器的圆角矩形绘制函数
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string | CanvasGradient | CanvasPattern,
  stroke?: string,
  strokeWidth = 1
) {
  if (r * 2 > w) r = w / 2;
  if (r * 2 > h) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

/**
 * 绘制全屏倾斜防伪水印
 */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: 'dark' | 'light' | 'wine',
  text: string = '公众号：我爱这young'
) {
  ctx.save();
  const watermarkText = text || '公众号：我爱这young';
  ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = theme === 'dark' 
    ? 'rgba(255, 255, 255, 0.045)' 
    : theme === 'wine' 
    ? 'rgba(253, 164, 175, 0.055)' 
    : 'rgba(15, 23, 42, 0.045)';
  
  ctx.rotate((-24 * Math.PI) / 180);
  const stepX = 280;
  const stepY = 150;
  
  for (let x = -width; x < width * 2; x += stepX) {
    for (let y = -height; y < height * 2; y += stepY) {
      ctx.fillText(watermarkText, x, y);
    }
  }
  ctx.restore();
}

/**
 * 生成 9:16 小红书图文笔记格式的 LOF 基金行情 Canvas (无标的总数行，9:16 完美比例)
 */
export async function generateLofTableCanvas(
  items: LofRealtimeQuote[],
  options: LofImageExportOptions = {}
): Promise<HTMLCanvasElement> {
  const {
    theme = 'dark',
    title = '精选LOF基金实时溢价率',
    subtitle = '',
    watermark = true,
    watermarkPosition = 'full',
    watermarkText = '公众号：我爱这young',
    scale = 2,
    category,
    strategy,
    tagFilter
  } = options;

  const colors = THEME_COLORS[theme];
  const isDark = theme === 'dark';
  const isWine = theme === 'wine';

  const isWatermarkActive = watermark && watermarkPosition !== 'none';
  const isFullWatermark = isWatermarkActive && watermarkPosition === 'full';
  const isBottomWatermark = isWatermarkActive;

  // 1. 严格 9:16 标准分辨率设计 (1080 × 1920)
  const canvasWidth = 1080;
  const canvasHeight = 1920;
  const paddingX = 44;
  const contentWidth = canvasWidth - paddingX * 2; // 992px

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 Canvas 2D 绘图上下文');

  ctx.scale(scale, scale);

  const fontRegular = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  const fontMono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

  // 绘制 9:16 主背景底色
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 绘制平铺水印 (仅在 full 模式开启)
  if (isFullWatermark) {
    drawWatermark(ctx, canvasWidth, canvasHeight, theme, watermarkText);
  }

  // 2. 顶部头部卡片 (已按要求去除小红书徽标行以及实时追踪副标题行，聚焦纯粹大标题与更新时间)
  const headerCardY = 36;
  const headerCardHeight = 88;

  // 头部卡片背景
  const headerGrad = ctx.createLinearGradient(paddingX, headerCardY, paddingX + contentWidth, headerCardY + headerCardHeight);
  headerGrad.addColorStop(0, colors.headerGradientStart);
  headerGrad.addColorStop(1, colors.headerGradientEnd);
  drawRoundRect(ctx, paddingX, headerCardY, contentWidth, headerCardHeight, 16, headerGrad, colors.border, 1.5);

  // 主标题 (居中对齐卡片高度，纯粹突出：精选LOF基金实时溢价率)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.text;
  ctx.font = `bold 30px ${fontRegular}`;
  ctx.fillText('精选LOF基金实时溢价率', paddingX + 28, headerCardY + headerCardHeight / 2);

  // 右侧更新时间
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `13px ${fontMono}`;
  ctx.fillStyle = colors.textMuted;
  ctx.fillText(`更新: ${dateStr} ${timeStr}`, paddingX + contentWidth - 28, headerCardY + headerCardHeight / 2);

  // ⚠️ 注：按用户要求已彻底去除【标的总数那一行】(statsPills)，直接衔接套利逻辑卡片！

  // 3. 核心套利逻辑说明卡片
  const formulaY = headerCardY + headerCardHeight + 16;
  const formulaHeight = 84;
  const fFill = isDark
    ? 'rgba(15, 23, 42, 0.95)'
    : isWine
    ? 'rgba(40, 16, 35, 0.9)'
    : 'rgba(241, 245, 249, 0.95)';
  const fStroke = isDark
    ? 'rgba(245, 158, 11, 0.4)'
    : isWine
    ? 'rgba(251, 191, 36, 0.45)'
    : 'rgba(217, 119, 6, 0.4)';

  drawRoundRect(ctx, paddingX, formulaY, contentWidth, formulaHeight, 14, fFill, fStroke, 1.2);

  // 卡片内两行套利逻辑
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // 第一行：计算公式
  ctx.fillStyle = colors.accentGold;
  ctx.font = `bold 14px ${fontRegular}`;
  ctx.fillText('💡 溢价率公式:', paddingX + 20, formulaY + 26);

  ctx.fillStyle = colors.text;
  ctx.font = `14px ${fontRegular}`;
  let fX1 = paddingX + 120;
  ctx.fillText('实时溢价率 = ', fX1, formulaY + 26);
  fX1 += ctx.measureText('实时溢价率 = ').width;

  ctx.fillStyle = colors.accentRose;
  ctx.font = `bold 14px ${fontMono}`;
  ctx.fillText('(场内现价 - 预估净值) ÷ 预估净值 × 100%', fX1, formulaY + 26);

  // 第二行：实操流程
  ctx.fillStyle = colors.accentCyan;
  ctx.font = `bold 14px ${fontRegular}`;
  ctx.fillText('🚜 套利实操法:', paddingX + 20, formulaY + 58);

  ctx.fillStyle = colors.text;
  ctx.font = `14px ${fontRegular}`;
  let fX2 = paddingX + 120;
  ctx.fillText('每日场外低成本申购限购份额 → T+2/3 场内高溢价挂单卖出套利', fX2, formulaY + 58);

  // 4. 表格区域设计 (适配 9:16 屏幕高度)
  const tableStartY = formulaY + formulaHeight + 18;
  const footerHeight = 100;
  const bottomMargin = 28;
  const tableContainerMaxHeight = canvasHeight - tableStartY - footerHeight - bottomMargin; // ~1470px

  // 列定义 (针对 992px 总宽精确排版)
  const columns = [
    { key: 'index', title: '序号', width: 54, align: 'center' },
    { key: 'name', title: '基金名称', width: 304, align: 'left' },
    { key: 'code', title: '基金代码', width: 148, align: 'left' },
    { key: 'limit', title: '基金限购额度', width: 156, align: 'center' },
    { key: 'priceNav', title: '现价 / 预估净值', width: 162, align: 'right' },
    { key: 'premium', title: '实时溢价率', width: 168, align: 'right' },
  ];

  const tableHeaderHeight = 48;

  // 动态根据标的数量自适应计算行高，保证 9:16 页面充实且不超出
  const displayItems = items.length > 0 ? items : [];
  const maxRowsFit = Math.min(displayItems.length, 20);
  const effectiveItems = displayItems.slice(0, maxRowsFit);

  let rowHeight = 66;
  if (effectiveItems.length > 0) {
    const calculatedHeight = (tableContainerMaxHeight - tableHeaderHeight) / effectiveItems.length;
    rowHeight = Math.max(54, Math.min(74, Math.floor(calculatedHeight)));
  }

  const tableTotalHeight = tableHeaderHeight + effectiveItems.length * rowHeight;

  // 绘制表格外框卡片
  drawRoundRect(
    ctx,
    paddingX,
    tableStartY,
    contentWidth,
    tableTotalHeight,
    14,
    isDark ? 'rgba(15, 23, 42, 0.75)' : isWine ? 'rgba(35, 12, 30, 0.75)' : 'rgba(255, 255, 255, 0.95)',
    colors.border,
    1.2
  );

  // 绘制表头
  drawRoundRect(
    ctx,
    paddingX,
    tableStartY,
    contentWidth,
    tableHeaderHeight,
    14,
    colors.tableHeaderBg
  );
  // 补齐表头下边角
  ctx.fillStyle = colors.tableHeaderBg;
  ctx.fillRect(paddingX, tableStartY + tableHeaderHeight - 8, contentWidth, 8);

  // 表头分割线
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, tableStartY + tableHeaderHeight);
  ctx.lineTo(paddingX + contentWidth, tableStartY + tableHeaderHeight);
  ctx.stroke();

  // 绘制表头文字
  let curHeaderX = paddingX;
  ctx.fillStyle = colors.textSecondary;
  ctx.font = `bold 14px ${fontRegular}`;
  ctx.textBaseline = 'middle';

  columns.forEach(col => {
    if (col.align === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText(col.title, curHeaderX + col.width / 2, tableStartY + tableHeaderHeight / 2);
    } else if (col.align === 'right') {
      ctx.textAlign = 'right';
      ctx.fillText(col.title, curHeaderX + col.width - 16, tableStartY + tableHeaderHeight / 2);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(col.title, curHeaderX + 16, tableStartY + tableHeaderHeight / 2);
    }
    curHeaderX += col.width;
  });

  // 绘制数据行
  let curRowY = tableStartY + tableHeaderHeight;

  effectiveItems.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven ? colors.rowEven : colors.rowOdd;
    ctx.fillStyle = rowBg;
    ctx.fillRect(paddingX + 1, curRowY, contentWidth - 2, rowHeight);

    let cellX = paddingX;

    // 1. 序号
    const colIdx = columns[0];
    ctx.textAlign = 'center';
    ctx.font = `bold 14px ${fontMono}`;
    ctx.fillStyle = colors.textMuted;
    ctx.fillText(`${index + 1}`, cellX + colIdx.width / 2, curRowY + rowHeight / 2);
    cellX += colIdx.width;

    // 2. 基金名称 (加大字号)
    const colName = columns[1];
    ctx.textAlign = 'left';
    ctx.font = `bold 16px ${fontRegular}`;
    ctx.fillStyle = colors.text;

    let displayName = item.name;
    while (ctx.measureText(displayName).width > colName.width - 24 && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName.length < item.name.length) displayName += '…';
    ctx.fillText(displayName, cellX + 12, curRowY + rowHeight * 0.36);

    // 分类 + 跟踪标的
    ctx.font = `12px ${fontRegular}`;
    ctx.fillStyle = colors.textSecondary;
    const catLabel = item.category || 'LOF';
    const trackLabel = item.trackingTarget ? ` · ${item.trackingTarget}` : '';
    let subLabel = `${catLabel}${trackLabel}`;
    while (ctx.measureText(subLabel).width > colName.width - 24 && subLabel.length > 0) {
      subLabel = subLabel.slice(0, -1);
    }
    ctx.fillText(subLabel, cellX + 12, curRowY + rowHeight * 0.70);
    cellX += colName.width;

    // 3. 基金代码 (加大字号，带 [深]/[沪] 徽标)
    const colCode = columns[2];
    const isSZ = item.market === 'sz';
    const tagX = cellX + 10;
    const tagY = curRowY + (rowHeight - 22) / 2;
    
    const tagFill = isSZ 
      ? (isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(147, 51, 234, 0.12)')
      : (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.12)');
    
    drawRoundRect(ctx, tagX, tagY, 22, 22, 5, tagFill);

    ctx.fillStyle = isSZ 
      ? (isDark ? '#c084fc' : '#7e22ce')
      : (isDark ? '#60a5fa' : '#1d4ed8');
    ctx.font = `bold 12px ${fontRegular}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSZ ? '深' : '沪', tagX + 11, tagY + 11);

    ctx.textAlign = 'left';
    ctx.font = `bold 16px ${fontMono}`;
    ctx.fillStyle = colors.text;
    ctx.fillText(item.code, tagX + 30, curRowY + rowHeight / 2);
    cellX += colCode.width;

    // 4. 基金限购额度 (加大字号)
    const colLimit = columns[3];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const limitPillX = cellX + 12;
    const limitPillW = colLimit.width - 24;
    const limitPillH = 28;
    const limitPillY = curRowY + (rowHeight - limitPillH) / 2;

    if (item.purchaseStatus === '暂停') {
      const pFill = isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(226, 232, 240, 0.8)';
      drawRoundRect(ctx, limitPillX, limitPillY, limitPillW, limitPillH, 6, pFill);
      ctx.fillStyle = colors.textMuted;
      ctx.font = `bold 13px ${fontRegular}`;
      ctx.fillText('暂停申购', cellX + colLimit.width / 2, curRowY + rowHeight / 2);
    } else if (item.purchaseDailyLimit > 0) {
      const limitStr = item.purchaseDailyLimit >= 10000 
        ? `${item.purchaseDailyLimit / 10000}万/天` 
        : `${item.purchaseDailyLimit}元/天`;
      
      const lFill = isDark 
        ? 'rgba(245, 158, 11, 0.2)' 
        : isWine 
        ? 'rgba(251, 191, 36, 0.25)' 
        : '#fef3c7';
      const lStroke = isDark 
        ? 'rgba(245, 158, 11, 0.5)' 
        : '#fde68a';
      
      drawRoundRect(ctx, limitPillX, limitPillY, limitPillW, limitPillH, 6, lFill, lStroke, 1);
      ctx.fillStyle = isDark ? '#fbbf24' : isWine ? '#fef08a' : '#92400e';
      ctx.font = `bold 14px ${fontMono}`;
      ctx.fillText(limitStr, cellX + colLimit.width / 2, curRowY + rowHeight / 2);
    } else {
      const lFill = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';
      drawRoundRect(ctx, limitPillX, limitPillY, limitPillW, limitPillH, 6, lFill);
      ctx.fillStyle = colors.accentGreen;
      ctx.font = `bold 13px ${fontRegular}`;
      ctx.fillText('无限额', cellX + colLimit.width / 2, curRowY + rowHeight / 2);
    }
    cellX += colLimit.width;

    // 5. 现价 / 预估净值 (加大字号)
    const colPriceNav = columns[4];
    ctx.textAlign = 'right';
    ctx.font = `bold 15px ${fontMono}`;
    ctx.fillStyle = colors.text;
    ctx.fillText(`¥${item.currentPrice.toFixed(3)}`, cellX + colPriceNav.width - 16, curRowY + rowHeight * 0.36);

    ctx.font = `13px ${fontMono}`;
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText(`净值 ¥${item.estimatedNAV.toFixed(3)}`, cellX + colPriceNav.width - 16, curRowY + rowHeight * 0.70);
    cellX += colPriceNav.width;

    // 6. 实时溢价率 (加大药丸尺寸与字号)
    const colPrem = columns[5];
    const prem = item.premiumRate;
    const isHigh = prem >= 2.0;
    const isDisc = prem <= -1.5;
    const isUp = prem >= 0;
    const premText = isUp ? `+${prem.toFixed(2)}%` : `${prem.toFixed(2)}%`;

    const premPillW = 104;
    const premPillH = 30;
    const premPillX = cellX + colPrem.width - 16 - premPillW;
    const premPillY = curRowY + (rowHeight - premPillH) / 2;

    if (isHigh) {
      drawRoundRect(ctx, premPillX, premPillY, premPillW, premPillH, 6, '#ef4444');
      ctx.fillStyle = '#ffffff';
    } else if (isDisc) {
      drawRoundRect(ctx, premPillX, premPillY, premPillW, premPillH, 6, '#059669');
      ctx.fillStyle = '#ffffff';
    } else if (isUp) {
      const pFill = isDark ? 'rgba(239, 68, 68, 0.22)' : '#fef2f2';
      const pStroke = isDark ? 'rgba(239, 68, 68, 0.55)' : '#fecaca';
      drawRoundRect(ctx, premPillX, premPillY, premPillW, premPillH, 6, pFill, pStroke, 1);
      ctx.fillStyle = isDark ? '#f87171' : '#b91c1c';
    } else {
      const pFill = isDark ? 'rgba(16, 185, 129, 0.22)' : '#ecfdf5';
      const pStroke = isDark ? 'rgba(16, 185, 129, 0.55)' : '#a7f3d0';
      drawRoundRect(ctx, premPillX, premPillY, premPillW, premPillH, 6, pFill, pStroke, 1);
      ctx.fillStyle = isDark ? '#34d399' : '#047857';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 15px ${fontMono}`;
    ctx.fillText(premText, premPillX + premPillW / 2, premPillY + premPillH / 2);

    // 行底部分割线
    if (index < effectiveItems.length - 1) {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(paddingX, curRowY + rowHeight);
      ctx.lineTo(paddingX + contentWidth, curRowY + rowHeight);
      ctx.stroke();
    }

    curRowY += rowHeight;
  });

  // 如果筛选标的大于可容纳上限，绘制底部温馨提示
  if (items.length > effectiveItems.length) {
    ctx.fillStyle = colors.textMuted;
    ctx.font = `11px ${fontRegular}`;
    ctx.textAlign = 'center';
    ctx.fillText(
      `（小红书9:16版已精选展示前 ${effectiveItems.length} 只标的，可勾选特定标的精准导出）`,
      paddingX + contentWidth / 2,
      curRowY + 16
    );
  }

  // 5. 9:16 小红书图文笔记底部署名与声明
  const footerY = canvasHeight - 88;

  // 底部卡片线
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, footerY - 14);
  ctx.lineTo(paddingX + contentWidth, footerY - 14);
  ctx.stroke();

  ctx.fillStyle = colors.textMuted;
  ctx.font = `12px ${fontRegular}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('⚠️ 声明：本图数据基于盘中实时估值与场内行情，仅供套利策略参考，不构成任何投资建议。', paddingX, footerY);

  if (isBottomWatermark) {
    ctx.textAlign = 'right';
    ctx.font = `bold 13px ${fontRegular}`;
    ctx.fillStyle = colors.accentGold;
    ctx.fillText(
      watermarkText || '公众号：我爱这young',
      paddingX + contentWidth,
      footerY
    );
  }

  return canvas;
}

/**
 * 下载 9:16 小红书图片
 */
export async function downloadLofTableImage(
  items: LofRealtimeQuote[],
  options: LofImageExportOptions = {},
  format: 'png' | 'jpg' = 'png'
): Promise<boolean> {
  const canvas = await generateLofTableCanvas(items, options);
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';

  const cleanTitle = (options.title || 'LOF基金实时溢价行情表_小红书9_16')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();

  const wmTag = options.watermark ? '_带水印' : '_无水印';
  const countTag = `_${items.length}只`;
  const filename = `${cleanTitle}${countTag}${wmTag}_${new Date().toISOString().slice(0, 10)}.${format}`;

  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 30000);
          resolve(true);
        } else {
          const dataUrl = canvas.toDataURL(mimeType, 0.95);
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve(true);
        }
      }, mimeType, 0.95);
    } else {
      const dataUrl = canvas.toDataURL(mimeType, 0.95);
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve(true);
    }
  });
}

/**
 * 复制图片到剪贴板
 */
export async function copyLofTableImageToClipboard(
  items: LofRealtimeQuote[],
  options: LofImageExportOptions = {}
): Promise<boolean> {
  try {
    const canvas = await generateLofTableCanvas(items, options);
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      }, 'image/png');
    });
  } catch {
    return false;
  }
}
