const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OpenClaw Assistant';
pptx.title = '形式与政策讨论课（讲稿同款｜大字科技版）';
pptx.lang = 'zh-CN';

const slides = [
  {
    title: '封面｜夯实基础，全面发力；乘数而上，智启未来',
    body: '我们是第X组。今天汇报两个主题：\n1）夯实基础，全面发力——乘势而上，接续推进中国式现代化\n2）乘数而上，智启未来——深入推进数字中国建设\n\n汇报结构：先讲“现代化的方向与基础逻辑”，再讲“数字中国的乘数效应与实践路径”，最后讲“挑战与建议”。'
  },
  { title: '第1页｜为什么两个主题要放在一起讲？', body: '中国式现代化是“总目标”，回答我们要走向哪里；\n数字中国是“关键抓手”，回答我们如何更快更稳地到达目标。\n\n可以这样理解：现代化告诉我们“方向”，数字化提供“动力系统”。\n所以，两者不是并列关系，而是目标与路径、战略与工具的协同关系。' },
  { title: '第2页｜中国式现代化的核心内涵', body: '中国式现代化具有五个鲜明特征：\n- 人口规模巨大的现代化\n- 全体人民共同富裕的现代化\n- 物质文明和精神文明相协调的现代化\n- 人与自然和谐共生的现代化\n- 走和平发展道路的现代化\n\n这意味着我们追求的不只是“快”，更是“好”、是“可持续”、是“让更多人受益”。' },
  { title: '第3页｜夯实基础：基础到底是什么？', body: '我们组认为，推进现代化至少要夯实四类基础：\n1. 制度基础：治理体系和治理能力现代化\n2. 经济基础：高质量发展与现代化产业体系\n3. 民生基础：教育、医疗、就业、社保等公共服务\n4. 安全基础：粮食、能源、产业链、数据安全\n\n这四块基础像“地基”，决定现代化能不能走得稳、走得远。' },
  { title: '第4页｜全面发力：从“有没有”到“好不好”', body: '在夯实基础的同时，还要全面发力。核心着力点有四个：\n- 创新驱动：科技自立自强，发展新质生产力\n- 协调发展：区域、城乡、产业协同推进\n- 绿色转型：低碳发展与生态价值转化\n- 开放合作：在更高水平开放中提升竞争力\n\n关键是把“潜力”转化为“现实生产力”和“长期竞争力”。' },
  { title: '第5页｜数字中国为什么是“乘数效应”？', body: '数字化不是简单“+1”，而是“×N”。\n因为它可以同时提升效率、降低成本、扩大服务覆盖，并重构生产、流通、治理和生活方式。\n\n我们用一个公式概括：\n数字中国 = 新基础设施 × 数据要素 × 场景应用 × 制度创新\n\n多个环节同步发力，最终形成系统性增益。' },
  { title: '第6页｜推进框架：一底座、两引擎、多场景', body: '数字中国建设可以概括为：\n- 一底座：数字基础设施（算力、网络、平台）\n- 两引擎：数据要素市场化 + 数字技术创新\n- 多场景：数字政府、数字经济、数字社会、数字生态文明\n\n推进逻辑是“先打底、再提能、后扩面”，最终实现规模化落地。' },
  { title: '第7页｜场景一：数字政府（治理更高效）', body: '数字政府最直观的变化是办事体验提升。\n以前群众常常“多头跑、反复交材料”，现在越来越多事项实现“一网通办”。\n这背后是流程再造与数据共享，不只是线下流程搬到线上。\n\n结果是：决策更精准、响应更及时、服务更可及，群众获得感更强。' },
  { title: '第8页｜场景二：数字经济（产业更有竞争力）', body: '数字化正推动产业从“制造”走向“智造”。\n通过工业互联网，生产流程更可视化、柔性化、智能化；\n平台经济与实体经济融合，催生新业态与新模式；\n中小企业“上云用数赋智”，抗风险能力和效率都在提升。\n\n数字经济不是替代实体，而是让实体更强。' },
  { title: '第9页｜场景三：数字社会（生活更便利）', body: '在线教育、互联网医疗、智慧出行等服务持续优化，\n数字化正在改善每个人的日常生活体验。\n但我们也要重视数字鸿沟问题，让老年人、偏远地区群体“会用、敢用、用得好”。\n\n所以数字社会的目标，不只是“能用”，而是“好用、普惠、安全”。' },
  { title: '第10页｜挑战：发展与安全并重', body: '推进数字中国还面临三类挑战：\n1）核心技术能力仍需持续突破；\n2）数据流通与隐私保护要精细平衡；\n3）区域、人群数字能力差异仍然存在。\n\n因此必须在发展中同步治理，在提速中守住安全与公平底线。' },
  { title: '第11页｜建议：政策、技术、人才、治理协同发力', body: '我们组提出四点建议：\n- 政策端：完善数据产权、流通、收益分配和监管机制\n- 技术端：加强关键核心技术攻关，提升自主可控能力\n- 人才端：强化数字素养教育，培养复合型人才\n- 治理端：建立包容审慎、风险可控的数字治理体系\n\n四个方面要形成闭环，避免“单点突破、整体不强”。' },
  { title: '第12页｜结语', body: '总结三句话：\n1）中国式现代化是方向，数字中国是路径；\n2）夯实基础是前提，全面发力是关键；\n3）把发展质量、治理效能与民生温度统一起来，现代化才能行稳致远。\n\n数字中国不是未来时，而是进行时；不是选择题，而是必答题。\n谢谢大家，欢迎批评指正。' }
];

function addTechBackground(slide) {
  slide.background = { color: 'F4F8FF' };

  // 顶部科技渐变感色带（用半透明矩形叠加模拟）
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.3, fill: { color: 'E8F1FF', transparency: 5 }, line: { transparency: 100 } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.3, w: 13.33, h: 0.9, fill: { color: 'DDEBFF', transparency: 25 }, line: { transparency: 100 } });

  // 右上角发光圆
  slide.addShape(pptx.ShapeType.ellipse, { x: 10.8, y: -0.3, w: 3.0, h: 3.0, fill: { color: 'CFE4FF', transparency: 45 }, line: { transparency: 100 } });
  slide.addShape(pptx.ShapeType.ellipse, { x: 11.3, y: 0.2, w: 2.0, h: 2.0, fill: { color: 'B7D6FF', transparency: 60 }, line: { transparency: 100 } });

  // 网格线（科技感）
  for (let x = 0.4; x <= 12.8; x += 1.2) {
    slide.addShape(pptx.ShapeType.line, { x, y: 6.2, w: 0, h: 1.2, line: { color: 'BFD6F6', pt: 0.6, transparency: 45 } });
  }
  for (let y = 6.2; y <= 7.35; y += 0.23) {
    slide.addShape(pptx.ShapeType.line, { x: 0.35, y, w: 12.7, h: 0, line: { color: 'BFD6F6', pt: 0.6, transparency: 45 } });
  }
}

for (const s of slides) {
  const slide = pptx.addSlide();
  addTechBackground(slide);

  slide.addText(s.title, {
    x: 0.6, y: 0.34, w: 12.1, h: 0.75,
    fontFace: 'Microsoft YaHei', fontSize: 32, bold: true, color: '15406B'
  });

  slide.addShape(pptx.ShapeType.line, {
    x: 0.6, y: 1.2, w: 12.1, h: 0,
    line: { color: '2F80ED', pt: 2.2 }
  });

  // 半透明内容板，增强可读性
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.65, y: 1.45, w: 12.0, h: 5.45,
    rectRadius: 0.08,
    fill: { color: 'FFFFFF', transparency: 12 },
    line: { color: 'C6D9F3', pt: 1 }
  });

  slide.addText(s.body, {
    x: 0.9, y: 1.72, w: 11.45, h: 4.95,
    fontFace: 'Microsoft YaHei', fontSize: 24, color: '1F1F1F',
    valign: 'top', breakLine: true, margin: 0.04,
    paraSpaceAfterPt: 9
  });

  slide.addText('动画统一：本页所有文本框按顺序设置“飞入（自底部）”，持续0.5秒，延迟每项+0.1秒', {
    x: 0.68, y: 7.03, w: 12.0, h: 0.2,
    fontFace: 'Microsoft YaHei', fontSize: 10.5, color: '4D6480', align: 'right'
  });
}

pptx.writeFile({ fileName: 'C:\\Users\\damaster\\.openclaw\\workspace\\形式与政策_讨论课_讲稿同款_大字科技版.pptx' });
