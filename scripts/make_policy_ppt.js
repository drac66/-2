const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pptx.author = 'OpenClaw Assistant';
pptx.subject = '形式与政策讨论课';
pptx.title = '形式与政策讨论课 第二版';
pptx.company = 'Class Group';
pptx.lang = 'zh-CN';

const slides = [
  {
    title: '夯基固本启新程，数字赋能向未来',
    bullets: [
      '乘势而上，接续推进中国式现代化与数字中国建设',
      '班级｜第X组｜成员｜日期',
      '动画要求：本页元素统一“从下方飞入”'
    ]
  },
  {
    title: '为什么要把两个主题合讲？',
    bullets: [
      '中国式现代化回答“发展走向哪里”',
      '数字中国回答“发展如何提速提质”',
      '两者关系：目标牵引路径，路径反哺目标',
      '一句话：现代化定方向，数字化强引擎'
    ]
  },
  {
    title: '中国式现代化：方向与价值',
    bullets: [
      '人口规模巨大的现代化',
      '全体人民共同富裕',
      '物质文明与精神文明相协调',
      '人与自然和谐共生',
      '走和平发展道路'
    ]
  },
  {
    title: '夯实基础：推进现代化的底盘',
    bullets: [
      '制度基础：治理效能与执行能力',
      '产业基础：现代化产业体系与实体经济韧性',
      '民生基础：教育、医疗、就业、社保托底',
      '安全基础：粮食、能源、产业链、数据安全'
    ]
  },
  {
    title: '全面发力：高质量发展的四个抓手',
    bullets: [
      '创新：科技自立自强，发展新质生产力',
      '协调：区域协同、城乡融合、产业联动',
      '绿色：低碳转型、生态价值转化',
      '开放：更高水平开放与规则对接'
    ]
  },
  {
    title: '数字中国：为什么是“乘数效应”？',
    bullets: [
      '数字化同时作用于治理、生产、生活三大系统',
      '重构流程、重组资源、重塑效率',
      '数字中国效能 = 基础设施 × 数据要素 × 技术创新 × 场景落地'
    ]
  },
  {
    title: '建设路径：一底座、两能力、三场景',
    bullets: [
      '一底座：算力网络、数据平台、数字基础设施',
      '两能力：数据治理能力 + 技术创新能力',
      '三场景：数字政府、数字经济、数字社会'
    ]
  },
  {
    title: '场景一：数字政府（治理提效）',
    bullets: [
      '政务流程线上化、标准化、协同化',
      '群众办事少跑腿、少材料、少等待',
      '数据辅助决策，提升公共服务精准度'
    ]
  },
  {
    title: '场景二：数字经济（产业升级）',
    bullets: [
      '制造业数字化改造：可视化、柔性化、智能化',
      '传统产业与平台经济深度融合',
      '中小企业上云用数赋智，提升抗风险能力'
    ]
  },
  {
    title: '场景三：数字社会（普惠便民）',
    bullets: [
      '在线教育、互联网医疗、智慧交通持续优化',
      '公共服务覆盖更广，城乡可及性提升',
      '重视数字鸿沟治理，确保重点群体不掉队'
    ]
  },
  {
    title: '现实挑战：发展与安全双平衡',
    bullets: [
      '核心技术与关键环节仍需突破',
      '数据流通与隐私保护边界要更清晰',
      '地区、行业、人群数字能力差异仍存在'
    ]
  },
  {
    title: '结语：把目标变成可执行行动',
    bullets: [
      '中国式现代化是长期目标，需夯基固本',
      '数字中国是关键引擎，正在持续赋能',
      '把质量、效率、公平、安全统一起来',
      '谢谢大家，欢迎批评指正'
    ]
  }
];

for (const s of slides) {
  const slide = pptx.addSlide();
  slide.background = { color: 'F7FAFC' };

  slide.addShape(pptx.ShapeType.line, {
    x: 0.6, y: 1.25, w: 12.1, h: 0,
    line: { color: '2F80ED', pt: 2 }
  });

  slide.addText(s.title, {
    x: 0.6, y: 0.35, w: 12.1, h: 0.7,
    fontFace: 'Microsoft YaHei',
    fontSize: 30,
    bold: true,
    color: '1F4E79'
  });

  const bulletText = s.bullets.map(t => ({ text: t, options: { bullet: { indent: 18 } } }));
  slide.addText(bulletText, {
    x: 0.9, y: 1.7, w: 11.8, h: 4.9,
    fontFace: 'Microsoft YaHei',
    fontSize: 22,
    color: '333333',
    paraSpaceAfterPt: 10
  });

  slide.addText('动画统一设置：标题与要点依次“飞入（自底部）”，持续0.5秒，延迟每项+0.1秒', {
    x: 0.6, y: 6.9, w: 12.1, h: 0.3,
    fontFace: 'Microsoft YaHei',
    fontSize: 11,
    color: '666666',
    align: 'right'
  });
}

pptx.writeFile({ fileName: 'C:\\Users\\damaster\\.openclaw\\workspace\\形式与政策_讨论课_第二版_可直接播放.pptx' });
