import fs from 'fs';
import path from 'path';

async function buildLofDatabase() {
  console.log('Fetching EastMoney fund list...');
  const res = await fetch('http://fund.eastmoney.com/js/fundcode_search.js');
  const text = await res.text();
  const jsonStr = text.replace(/^var r = /, '').replace(/;$/, '');
  const allFunds = JSON.parse(jsonStr);

  const lofMap = new Map();

  // Helper category detector
  function detectCategory(name, type) {
    if (/QDII|美|纳斯达克|标普|印度|德国|日经|法国|海外|恒生|中概|越南|全球/i.test(name)) return 'QDII海外';
    if (/原油|石油|油气|白银|黄金|商品|豆粕|有色/i.test(name)) return '原油商品';
    if (/红利|低波|价值|高股息/i.test(name)) return '红利价值';
    if (/医药|医疗|生物|创新药|中药/i.test(name)) return '医药医疗';
    if (/科技|芯片|半导体|互联|计算机|人工智能|软件|电子|数字/i.test(name)) return '科技互联';
    if (/新能源|光伏|电池|碳中和|风电|核电/i.test(name)) return '新能源';
    if (/白酒|消费|食品|饮料|农业/i.test(name)) return '消费白酒';
    if (/证券|券商|银行|保险|金融|地产|煤炭|钢铁|基建|军工|环保|传媒/i.test(name)) return '行业主题';
    if (/300|500|1000|50|800|中证|深证|创业板|科创|上证|宽基|A50/i.test(name)) return '宽基指数';
    if (/量化|对冲|绝对收益/i.test(name)) return '量化对冲';
    if (/债|REIT|转债/i.test(name)) return '债券REITs';
    return '混合策略';
  }

  // Helper manager detector
  function detectManager(name) {
    const managers = [
      '华夏', '易方达', '广发', '南方', '富国', '嘉实', '博时', '招商', '汇添富', '工银瑞信',
      '华宝', '国泰', '天弘', '交银施罗德', '兴全', '兴证全球', '大成', '银华', '中欧', '鹏华',
      '建信', '华安', '国投瑞银', '平安', '申万菱信', '海富通', '万家', '前海开源', '诺安',
      '融通', '长盛', '财通', '泰达宏利', '宏利', '景顺长城', '银河', '金鹰', '创金合信',
      '农银汇理', '浦银安盛', '华泰柏瑞', '摩根', '民生加银', '国联', '信达澳亚', '中金',
      '汇丰晋信', '德邦', '长城', '华泰保兴', '中银', '东证资管', '东方红'
    ];
    for (const m of managers) {
      if (name.startsWith(m)) return m + '基金';
    }
    return '公募基金';
  }

  allFunds.forEach(f => {
    const code = String(f[0]).trim();
    const py = String(f[1]).trim();
    const name = String(f[2]).trim();
    const type = String(f[3]).trim();
    const pinyin = String(f[4]).trim();

    // Exchange traded LOF codes:
    // Shenzhen: 16xxxx
    // Shanghai: 501xxx, 502xxx, 505xxx, 506xxx
    const isSzLof = code.startsWith('16');
    const isShLof = code.startsWith('501') || code.startsWith('502') || code.startsWith('505') || code.startsWith('506');

    if (isSzLof || isShLof) {
      if (!lofMap.has(code)) {
        const market = isSzLof ? 'sz' : 'sh';
        const category = detectCategory(name, type);
        const manager = detectManager(name);
        
        // Purchase limit estimate
        let purchaseStatus = '开放';
        let purchaseDailyLimit = 0;
        if (category === 'QDII海外' || category === '原油商品') {
          if (code === '164824' || code === '161129' || code === '160723') {
            purchaseStatus = '限额100元';
            purchaseDailyLimit = 100;
          } else if (code === '501018') {
            purchaseStatus = '限额500元';
            purchaseDailyLimit = 500;
          } else if (code === '162411') {
            purchaseStatus = '限额1000元';
            purchaseDailyLimit = 1000;
          } else {
            purchaseStatus = '开放';
          }
        }

        // Tractor: Shenzhen LOFs support 6 trading accounts (拖拉机6席位), Shanghai LOFs are single-seat (单席位)
        const tractorAllowed = market === 'sz';

        // Tracking Target
        let trackingTarget = type;
        if (name.includes('原油')) trackingTarget = '标普高盛原油商品指数/WTI期货';
        else if (name.includes('白银')) trackingTarget = '上期所白银期货主力合约';
        else if (name.includes('黄金')) trackingTarget = '国内黄金现货/国际金价';
        else if (name.includes('油气')) trackingTarget = '标普石油天然气上游股票指数';
        else if (name.includes('印度')) trackingTarget = 'MSCI印度指数(净总收益)';
        else if (name.includes('券商') || name.includes('证券')) trackingTarget = '中证全指证券公司指数';
        else if (name.includes('煤炭')) trackingTarget = '中证煤炭等权指数';
        else if (name.includes('银行')) trackingTarget = '中证银行指数';
        else if (name.includes('白酒')) trackingTarget = '中证白酒指数';
        else if (name.includes('标普500')) trackingTarget = '标普500指数(S&P 500)';
        else if (name.includes('纳斯达克')) trackingTarget = '纳斯达克100指数(NDX)';
        else if (name.includes('300')) trackingTarget = '沪深300指数';
        else if (name.includes('500')) trackingTarget = '中证500指数';
        else if (name.includes('1000')) trackingTarget = '中证1000指数';
        else trackingTarget = name;

        // Clean fund short name if overly long
        let cleanName = name;
        if (cleanName.includes('(LOF)')) cleanName = cleanName.replace(/\(LOF\)[A-Z]?/, 'LOF');
        else if (!cleanName.includes('LOF') && !cleanName.includes('分级')) cleanName += 'LOF';

        lofMap.set(code, {
          code,
          name: cleanName,
          market,
          category,
          trackingTarget,
          manager,
          purchaseStatus,
          purchaseDailyLimit,
          redemptionStatus: '开放',
          purchaseFeeRate: category === '原油商品' || category === 'QDII海外' ? 0.15 : 0.12,
          redemptionFeeRate: 0.5,
          tractorAllowed,
          settlementDays: 'T+2可卖',
          pinyin: py.toLowerCase(),
          description: `${cleanName}（代码：${code}），由${manager}管理，标的市场：${market === 'sz' ? '深交所' : '上交所'}，属于${category}。`
        });
      }
    }
  });

  const list = Array.from(lofMap.values());
  // Sort by popular funds first then code
  const priorityCodes = ['164824', '501018', '162411', '161129', '160723', '161226', '502053', '501032', '501205', '161725', '163417', '161128', '160140', '164908', '501005', '501007'];
  list.sort((a, b) => {
    const aPri = priorityCodes.indexOf(a.code);
    const bPri = priorityCodes.indexOf(b.code);
    if (aPri !== -1 && bPri !== -1) return aPri - bPri;
    if (aPri !== -1) return -1;
    if (bPri !== -1) return 1;
    return a.code.localeCompare(b.code);
  });

  console.log(`Generated ${list.length} total LOF funds.`);
  
  const content = `import { LofFundBase } from '../types/lof';\n\nexport const ALL_LOF_FUNDS: LofFundBase[] = ${JSON.stringify(list, null, 2)};\n`;
  fs.writeFileSync(path.join(process.cwd(), 'src/data/lofDatabase.ts'), content, 'utf-8');
  console.log('Saved to src/data/lofDatabase.ts successfully!');
}

buildLofDatabase();
