const NAV_GROUPS = [
  { label: "研发流程", items: [
    ["dashboard", "▥", "Dashboard"], ["projects", "□", "项目管理"], ["requirements", "✎", "提交需求"],
    ["workflow", "▤", "流程工作台"], ["reviews", "✓", "审查中心", 3], ["documents", "▧", "文档中心"]
  ]},
  { label: "研发管理", items: [
    ["agents", "◉", "Agent 监控"], ["agentManager", "⚙", "Agent 管理"], ["tasks", "▦", "任务看板"],
    ["codeReview", "⌘", "代码评审"], ["pullRequests", "↗", "MR / PR 看板"]
  ]},
  { label: "质量交付", items: [
    ["tests", "▥", "测试中心"], ["operations", "♧", "运维中心"]
  ]},
  { label: "平台能力", items: [
    ["knowledge", "◇", "知识库"], ["executionLogs", "▧", "执行日志"], ["auditLogs", "▣", "审计日志"],
    ["integrations", "⊙", "集成中心"], ["settings", "⚙", "系统配置"], ["users", "♙", "用户权限"]
  ]}
];

const STORAGE_KEY = "flowmind-prototype-state-v2";
const defaultState = {
  page: "dashboard",
  projectTab: "overview",
  documentTab: "prd",
  taskView: "kanban",
  requirementSource: "idea",
  notificationsRead: false,
  activeProject: "AI 智能客服平台",
  requirements: [
    { id: "REQ-1042", title: "AI 外呼兼容底层供应商功能", project: "智能外呼", owner: "林产品经理", status: "开发中", priority: "P0", progress: 68, updated: "10 分钟前" },
    { id: "REQ-1038", title: "用户中心密码重置与安全策略", project: "统一用户中心", owner: "周产品", status: "待审查", priority: "P1", progress: 46, updated: "32 分钟前" },
    { id: "REQ-1029", title: "客服知识库批量导入", project: "AI 智能客服", owner: "林产品经理", status: "已完成", priority: "P1", progress: 100, updated: "昨天" },
    { id: "REQ-1021", title: "运营数据日报自动生成", project: "数据平台", owner: "陈产品", status: "待澄清", priority: "P2", progress: 8, updated: "2 天前" }
  ],
  tasks: [
    { id: "TASK-201", title: "设计供应商适配层接口", status: "done", owner: "架构师 Agent", priority: "P0", points: 5 },
    { id: "TASK-202", title: "实现供应商配置管理 API", status: "doing", owner: "后端 Agent", priority: "P0", points: 8 },
    { id: "TASK-203", title: "开发供应商配置管理页面", status: "doing", owner: "前端 Agent", priority: "P1", points: 5 },
    { id: "TASK-204", title: "补充呼叫失败降级策略", status: "todo", owner: "后端 Agent", priority: "P1", points: 3 },
    { id: "TASK-205", title: "生成接口与端到端测试", status: "review", owner: "测试 Agent", priority: "P1", points: 5 },
    { id: "TASK-206", title: "更新部署配置和运行手册", status: "todo", owner: "DevOps Agent", priority: "P2", points: 2 }
  ],
  agents: [
    { id: "pm", name: "产品经理 Agent", role: "需求澄清与 PRD", model: "GPT-5", status: "完成", task: "已生成 PRD v1.2", success: 96, cost: 18.4, icon: "P", tone: "" },
    { id: "arch", name: "架构师 Agent", role: "架构、数据与 API", model: "Claude Sonnet", status: "等待", task: "等待技术评审结果", success: 93, cost: 26.8, icon: "A", tone: "blue" },
    { id: "backend", name: "后端工程师 Agent", role: "API 与数据库开发", model: "GPT-5 Codex", status: "执行中", task: "实现供应商配置 API", success: 91, cost: 42.2, icon: "B", tone: "green" },
    { id: "frontend", name: "前端工程师 Agent", role: "页面与交互开发", model: "GPT-5 Codex", status: "执行中", task: "开发配置管理页面", success: 89, cost: 35.1, icon: "F", tone: "blue" },
    { id: "qa", name: "测试工程师 Agent", role: "用例、测试与缺陷", model: "Gemini Pro", status: "等待", task: "等待代码提交", success: 94, cost: 15.7, icon: "Q", tone: "orange" }
  ],
  reviews: [
    { id: "G1", level: "G1", title: "需求评审 · AI 外呼兼容底层供应商", reviewers: "业务专家 + PM + QA", basis: "PRD 完整性、验收标准、范围边界、用户价值", tone: "warning" },
    { id: "G2", level: "G2", title: "技术评审 · 前端-op 后台配置话术模板", reviewers: "架构师 + 后端工程师 + 前端工程师", basis: "API/Schema 合理性、任务拆解完整性、设计覆盖验收标准", tone: "warning" },
    { id: "G3", level: "G3", title: "代码审查 · 通话后异步识别与结果推送", reviewers: "代码审查人 + 架构师", basis: "代码规范、安全漏洞、性能问题、AI 预审结果", tone: "danger" }
  ],
  testRun: { running: false, progress: 78, passed: 186, failed: 4, skipped: 3 },
  deployment: { environment: "预发布", status: "健康", version: "v1.6.0-rc.3", lastDeploy: "今天 09:42" },
  integrations: { github: true, jira: true, feishu: true, gitlab: false, slack: false, vercel: false }
};

let state = loadState();

function loadState() {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return structuredClone(defaultState); }
}
function saveState() {
  const persisted = { page: state.page, projectTab: state.projectTab, documentTab: state.documentTab, taskView: state.taskView, requirements: state.requirements, tasks: state.tasks, agents: state.agents, reviews: state.reviews, integrations: state.integrations, deployment: state.deployment };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}
function esc(value = "") { return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]); }
function icon(text) { return `<span aria-hidden="true">${text}</span>`; }
function statusTone(status) {
  if (["已完成","完成","健康","已通过","通过","在线","成功","已连接"].includes(status)) return "success";
  if (["执行中","开发中","进行中","运行中","已部署"].includes(status)) return "info";
  if (["失败","阻塞","未通过","异常","高风险"].includes(status)) return "danger";
  if (["待审查","待澄清","等待","待审批","警告","未连接"].includes(status)) return "warning";
  return "neutral";
}
function status(statusText) { return `<span class="status ${statusTone(statusText)}">${esc(statusText)}</span>`; }
function tag(text, tone = "") { return `<span class="tag ${tone}">${esc(text)}</span>`; }
function progress(value) { return `<div class="progress"><span style="width:${Math.max(0, Math.min(100, value))}%"></span></div>`; }
function metric(label, value, trend, iconText, tone = "") { return `<div class="metric ${tone}"><span class="metric-icon">${iconText}</span><div class="metric-label">${label}</div><div class="metric-value">${value}${trend ? `<span class="metric-trend">${trend}</span>` : ""}</div></div>`; }
function card(title, body, extra = "", rail = "") { return `<section class="card"><header class="card-head"><h2 class="card-title"><i class="title-rail" ${rail ? `style="background:${rail}"` : ""}></i>${title}</h2><div class="card-extra">${extra}</div></header><div class="card-body">${body}</div></section>`; }
function pageHead(title, description, actions = "") { return `<div class="page-head"><div><h1 class="page-title">${title}</h1><p class="page-desc">${description}</p></div><div class="page-actions">${actions}</div></div>`; }
function btn(label, action, variant = "secondary", extra = "") { return `<button class="btn btn-${variant}" data-action="${action}" ${extra}>${label}</button>`; }
function emptyState(iconText, title, description, action = "") { return `<div class="empty"><div><div class="empty-icon">${iconText}</div><div class="empty-title">${title}</div><p>${description}</p>${action}</div></div>`; }

function renderShell() {
  const current = NAV_GROUPS.flatMap(group => group.items).find(item => item[0] === state.page) || ["dashboard", "▥", "Dashboard"];
  document.querySelector("#app").innerHTML = `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-logo">✦</div><div class="brand-copy"><div class="brand-title">FlowMind</div><span class="brand-subtitle">AI 全栈研发平台</span></div></div>
      <div class="nav-scroll">${NAV_GROUPS.map(group => `<div class="nav-group">${group.label}</div>${group.items.map(item => `<div class="nav-item ${item[0] === state.page ? "active" : ""}" data-nav="${item[0]}"><span class="nav-icon">${item[1]}</span><span class="nav-label">${item[2]}</span>${item[3] ? `<span class="nav-badge">${item[3]}</span>` : ""}</div>`).join("")}`).join("")}</div>
      <div class="sidebar-user"><div class="avatar">林</div><div class="user-copy"><div class="user-name">林产品经理</div><div class="user-role">平台管理员</div></div><span class="more">•••</span></div>
    </aside>
    <section class="workspace">
      <header class="topbar"><div class="topbar-left"><span class="topbar-title">${current[2]}</span><span class="topbar-crumb">/ ${state.activeProject}</span></div><div class="topbar-actions">
        <button class="search-trigger" data-action="open-command">⌕ <span>搜索项目、需求、任务...</span><kbd>Ctrl K</kbd></button>
        <button class="icon-btn" data-action="open-notifications" title="通知">♧${state.notificationsRead ? "" : `<i class="notification-dot"></i>`}</button>
        <button class="icon-btn" data-action="quick-create" title="快速创建">＋</button>
      </div></header>
      <main class="content" id="page-content">${renderCurrentPage()}</main>
    </section>
  </div>`;
  bindPageEvents();
}

function renderCurrentPage() {
  const pages = { dashboard: renderDashboard, projects: renderProjects, projectDetail: renderProjectDetail, requirements: renderRequirements, workflow: renderWorkflow, reviews: renderReviews, documents: renderDocuments, agents: renderAgents, agentManager: renderAgentManager, tasks: renderTasks, codeReview: renderCodeReview, pullRequests: renderPullRequests, tests: renderTests, operations: renderOperations, knowledge: renderKnowledge, executionLogs: renderExecutionLogs, auditLogs: renderAuditLogs, integrations: renderIntegrations, settings: renderSettings, users: renderUsers };
  return (pages[state.page] || pages.dashboard)();
}

function renderDashboard() {
  const activity = [
    ["后端工程师 Agent 提交了代码变更", "PR #128 · 10 分钟前"],
    ["技术方案通过 G2 人工审查", "林产品经理 · 32 分钟前"],
    ["测试中心发现 4 个失败用例", "自动化测试 · 1 小时前"],
    ["PRD v1.2 生成并建立基线", "产品经理 Agent · 2 小时前"]
  ];
  return `${pageHead("Dashboard", "系统整体运行概览 · 研发资产、Agent、质量与交付状态", `${btn("＋ 新建需求", "quick-create", "primary")}`)}
    <div class="metrics">
      ${metric("活跃需求", "12", "↑ 20%", "✎")}${metric("进行中的项目", "6", "↑ 8%", "◇", "info")}${metric("Agent 执行中", "8", "成功率 92%", "◉", "success")}${metric("待我审查", "3", "最长 1.6h", "✓", "warning")}
    </div>
    <div class="grid grid-2 section-gap">
      ${card("需求交付趋势", `<div class="chart"><div class="chart-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div class="chart-grid"><svg viewBox="0 0 560 190" preserveAspectRatio="none"><path d="M0 52 C70 60 105 146 170 166 S280 105 340 110 S455 76 560 57 L560 190 L0 190Z" fill="#645cff12"></path><path d="M0 52 C70 60 105 146 170 166 S280 105 340 110 S455 76 560 57" fill="none" stroke="#645cff" stroke-width="3"></path><path d="M0 31 C65 44 112 138 170 169 S270 124 340 88 S460 41 560 30" fill="none" stroke="#12b886" stroke-width="3"></path></svg></div></div><div class="inline" style="justify-content:center;gap:22px;color:#8b98ad;font-size:9px"><span>● 按时交付率</span><span style="color:#12b886">● 需求完成率</span></div>`, `<select class="select" data-change="dashboard-range"><option>最近 7 天</option><option>最近 30 天</option></select>`)}
      ${card("AI 研发流水线", `<div class="timeline">${[
        ["需求分析与 PRD", "产品经理 Agent · 已完成", "success"], ["技术方案设计", "架构师 Agent · 已通过审查", "success"], ["任务拆分与代码开发", "前后端 Agent 并行执行 · 68%", "info"], ["测试与代码审查", "等待开发阶段完成", "neutral"]
      ].map(item => `<div class="timeline-item"><i class="timeline-dot" style="background:var(--${item[2] === "success" ? "success" : item[2] === "info" ? "primary" : "muted"})"></i><div class="timeline-title">${item[0]}</div><div class="timeline-meta">${item[1]}</div></div>`).join("")}</div>`, status("运行良好"))}
    </div>
    <div class="grid grid-2 section-gap">
      ${card("我的待办", `<div class="table-wrap"><table><tbody>${state.reviews.map(review => `<tr><td>${tag(review.level, review.tone === "danger" ? "orange" : "")}</td><td><div class="cell-main">${review.title}</div><div class="cell-sub">${review.reviewers}</div></td><td>${btn("去审查", `review:${review.id}`, "secondary", 'class="btn-sm"')}</td></tr>`).join("")}</tbody></table></div>`, `<span class="link" data-nav="reviews">全部待办（${state.reviews.length}）→</span>`)}
      ${card("项目动态", `<div class="timeline">${activity.map(item => `<div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">${item[0]}</div><div class="timeline-meta">${item[1]}</div></div>`).join("")}</div>`, `<span class="link" data-nav="executionLogs">全部动态 →</span>`)}
    </div>`;
}

function renderProjects() {
  const projects = [
    { name:"AI 智能客服平台", code:"CS-AI", type:"AI 应用", stage:"代码开发", progress:68, owner:"林产品经理", health:"健康", updated:"10 分钟前" },
    { name:"智能外呼平台", code:"CALL-OPS", type:"Web 应用", stage:"技术设计", progress:44, owner:"周产品", health:"警告", updated:"32 分钟前" },
    { name:"统一用户中心", code:"IAM", type:"基础服务", stage:"测试审查", progress:86, owner:"陈技术", health:"健康", updated:"1 小时前" },
    { name:"运营数据平台", code:"DATA-BI", type:"数据应用", stage:"需求分析", progress:18, owner:"赵产品", health:"健康", updated:"昨天" }
  ];
  return `${pageHead("项目管理", "集中管理项目、仓库、成员、里程碑与交付健康度", `${btn("导入 Git 项目", "import-project")}${btn("＋ 新建项目", "new-project", "primary")}`)}
    <section class="card"><div class="filter-row"><input class="input filter-search" placeholder="搜索项目名称或编号" data-filter="project"><select class="select"><option>全部状态</option><option>进行中</option><option>已完成</option></select><select class="select"><option>全部负责人</option><option>林产品经理</option></select><span class="filter-spacer"></span><div class="segmented"><button class="segment active">列表</button><button class="segment">卡片</button></div></div>
    <div class="table-wrap"><table><thead><tr><th>项目</th><th>类型</th><th>当前阶段</th><th>完成度</th><th>负责人</th><th>健康度</th><th>最近更新</th><th></th></tr></thead><tbody>${projects.map(project => `<tr data-search-row="${project.name} ${project.code}"><td><div class="cell-main link" data-action="open-project">${project.name}</div><div class="cell-sub">${project.code}</div></td><td>${tag(project.type, "blue")}</td><td>${project.stage}</td><td style="min-width:130px"><div class="inline" style="gap:8px"><span>${project.progress}%</span><div style="width:80px">${progress(project.progress)}</div></div></td><td>${project.owner}</td><td>${status(project.health)}</td><td>${project.updated}</td><td><button class="btn btn-ghost btn-sm" data-action="open-project">查看 →</button></td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderProjectDetail() {
  const tabContent = {
    overview: renderProjectOverview,
    prd: () => renderDocumentWorkspace("prd"),
    architecture: () => renderDocumentWorkspace("architecture"),
    tasks: renderTasks,
    code: renderCodeReview,
    logs: renderExecutionLogs
  };
  return `${pageHead(`<div class="project-hero"><div class="project-logo">✦</div><div><h1>${state.activeProject} ${status("进行中")}</h1><p>让团队用 AI 更高效地响应和解决客户问题 · 项目编号 CS-AI-2026</p></div></div>`, "", `${btn("⚙ 项目设置", "project-settings")}${btn("▶ 继续执行", "continue-project", "primary")}`)}
    <div class="tabs">${[["overview","项目概览"],["prd","PRD 文档"],["architecture","技术方案"],["tasks","任务拆分"],["code","代码与测试"],["logs","执行日志"]].map(([key,label]) => `<div class="tab ${state.projectTab === key ? "active" : ""}" data-project-tab="${key}">${label}</div>`).join("")}</div>
    <div class="section-gap">${(tabContent[state.projectTab] || renderProjectOverview)()}</div>`;
}

function renderProjectOverview() {
  return `<div class="metrics">${metric("整体完成度","68%","↑ 12%","◔")}${metric("研发周期","第 4 / 7 天","剩余 3 天","◷","info")}${metric("已完成任务","18 / 26","4 项执行中","✓","success")}${metric("测试通过率","92%","4 个失败","▥","warning")}</div>
    <div class="grid grid-2 section-gap"><div class="stack">
      ${card("AI 研发流程", `<div class="stages-wrap"><div class="stages">${[["需求分析","done"],["PRD 确认","done"],["技术设计","done"],["代码开发","current"],["测试审查",""],["发布上线",""]].map((item,index) => `<div class="stage ${item[1]}"><div class="stage-dot">${item[1] === "done" ? "✓" : index + 1}</div><div class="stage-label">${item[0]}</div></div>`).join("")}</div></div>`, `<span class="link" data-nav="workflow">查看流程 →</span>`)}
      ${card("项目资产", `<div class="table-wrap"><table><tbody>${[["✎","产品需求文档 PRD v1.2","产品经理 Agent · 32 分钟前","已确认"],["⌘","技术架构方案 v1.0","架构师 Agent · 1 小时前","已确认"],["▤","研发任务清单 · 26 项","18 项已完成 · 4 项执行中","进行中"],["▥","测试计划与报告","193 项用例 · 4 项失败","待审查"]].map(item => `<tr><td style="width:36px"><span class="agent-avatar" style="width:30px;height:30px">${item[0]}</span></td><td><div class="cell-main">${item[1]}</div><div class="cell-sub">${item[2]}</div></td><td>${status(item[3])}</td><td><button class="btn btn-ghost btn-sm" data-action="open-asset">查看</button></td></tr>`).join("")}</tbody></table></div>`, `<span class="link" data-nav="documents">全部资产 →</span>`)}
    </div><div class="stack">
      ${card("Agent 团队", `<div class="agent-list">${state.agents.slice(0,4).map(agentRow).join("")}</div>`, `<span class="link" data-nav="agents">监控 →</span>`)}
      ${card("项目动态", `<div class="timeline">${[["后端 Agent 提交 API 代码","10 分钟前 · PR #128"],["技术方案通过人工审查","32 分钟前 · 林产品经理"],["PRD v1.2 建立基线","1 小时前 · 产品经理 Agent"]].map(item => `<div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">${item[0]}</div><div class="timeline-meta">${item[1]}</div></div>`).join("")}</div>`)}
      ${card("风险与阻塞", `<div class="review-card danger" style="margin:0"><div class="review-title">${tag("高风险","orange")} 供应商 API 限流策略待确认</div><div class="review-body"><span class="review-label">影响</span><span>可能导致高峰期呼叫失败</span><span class="review-label">负责人</span><span>陈技术负责人</span></div></div>`)}
    </div></div>`;
}

function renderRequirements() {
  return `${pageHead("提交业务需求", "支持从产品想法、Jira 任务或现有 PRD 启动 AI 研发流程", `${btn("保存草稿", "save-draft")}${btn("生成需求草案", "generate-requirement", "primary")}`)}
    <section class="card"><div class="card-body">
      <div class="form-section"><div class="form-section-title">需求来源</div><div class="segmented">${[["idea","从零开始"],["jira","从 Jira 任务导入"],["prd","直接提供 PRD 链接"]].map(([key,label]) => `<button class="segment ${state.requirementSource === key ? "active" : ""}" data-requirement-source="${key}">${label}</button>`).join("")}</div><div class="info-strip" style="margin-top:11px">ⓘ 产品经理 Agent 将从需求生成 PRD：澄清需求 → 撰写用户故事 → 定义验收标准 → 生成交互草稿</div></div>
      <div class="form-section"><div class="form-section-title">需求信息</div><div class="form-grid"><div class="field"><label>需求标题</label><input id="requirement-title" class="input" maxlength="40" placeholder="例如：用户中心重构"><div class="help">作为需求和后续研发资产的统一名称</div></div><div class="field"><label>关联项目</label><select id="requirement-project" class="select"><option>AI 智能客服平台</option><option>智能外呼平台</option><option>统一用户中心</option></select></div><div class="field"><label>优先级</label><select id="requirement-priority" class="select"><option>P0 · 紧急重要</option><option selected>P1 · 重要</option><option>P2 · 常规</option></select></div><div class="field"><label>目标发布日期</label><input class="input" type="date" value="2026-09-15"></div><div class="field full"><label>业务需求描述</label><textarea id="requirement-description" class="textarea" placeholder="请描述业务背景、目标用户、核心功能、成功指标和已知约束...">希望客服团队可以在一个工作台内查看客户会话、知识库推荐和历史工单，并由 AI 自动总结会话和推荐下一步动作。</textarea></div></div></div>
      <div class="form-section"><div class="form-section-title" style="--primary:#f59f32">附件与参考（可选）</div><div class="upload" data-action="upload-file"><div><span class="upload-icon">☁</span>拖拽需求文档、原型图、会议纪要到此，或点击上传<div class="help">支持 PDF、DOCX、PNG、JPG、MD，单文件不超过 20MB</div></div></div></div>
      <div class="form-section" style="margin-bottom:0"><div class="form-section-title">流程配置</div><div class="form-grid"><div class="field full"><label>审查门禁</label><div class="inline" style="gap:20px;flex-wrap:wrap"><label><input type="checkbox" checked> G1 需求评审</label><label><input type="checkbox" checked> G2 技术评审</label><label><input type="checkbox" checked> G3 代码审查</label><label><input type="checkbox" checked> G4 部署审批</label></div></div><div class="field"><label>研发模式</label><select class="select"><option>AI 主执行，人工审批</option><option>人机协作开发</option><option>仅生成文档与任务</option></select></div><div class="field"><label>预算上限</label><input class="input" value="¥ 300 / 需求"></div></div></div>
    </div></section>`;
}

function renderWorkflow() {
  const nodes = [
    ["AUTO","阶段 0 · PRD New 业务确认","角色：PA（Product Agent）","澄清业务需求、初始化任务 PRD、创建 Jira 任务、登记关联关系","prd-generate（自动）",""],
    ["AUTO","阶段 1 · PRD 撰写","角色：PA（Product Agent）","撰写用户故事、定义验收标准、输出 PRD 与变更日志","prd-generate · prototype-generate",""],
    ["GATE","G1 · PRD Review 需求审计","角色：业务专家 + PM + QA","评审 PRD 是否符合业务价值、验收标准与范围约束","prd-review · prototype-review","gate"],
    ["AUTO","阶段 2 · 技术设计","角色：架构师 Agent","生成架构、数据模型、API Schema、安全与测试策略","architecture · api-design · threat-model",""],
    ["GATE","G2 · 技术方案审查","角色：技术负责人 + 前后端工程师","确认技术方案、任务边界和风险处理","architecture-review","gate"],
    ["AUTO","阶段 3 · 任务拆分与开发","角色：项目经理 + 工程师 Agent","拆分依赖图，创建独立工作区并行开发，提交 PR","task-plan · coding · git",""],
    ["AUTO","阶段 4 · 测试与修复","角色：测试 Agent + Review Agent","生成测试、执行质量门禁、自动修复失败用例","test-generate · playwright · code-review",""]
  ];
  return `${pageHead("流程工作台", "查看 AI 研发流程节点、执行状态、输入输出和人工门禁", `${btn("编辑流程", "edit-workflow")}${btn("▶ 从当前节点继续", "continue-workflow", "primary")}`)}
    <div class="grid grid-2" style="grid-template-columns:210px minmax(0,1fr)"><div class="stack">
      ${card("流程概览", `<div class="metrics" style="grid-template-columns:1fr"><div class="metric"><div class="metric-label">流程节点</div><div class="metric-value">12</div></div><div class="metric success"><div class="metric-label">已完成节点</div><div class="metric-value">7 / 12</div></div><div class="metric info"><div class="metric-label">当前状态</div><div class="metric-value" style="font-size:16px">开发执行中</div></div></div>`)}
      ${card("关联信息", `<div class="timeline"><div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">CS-AI-2026</div><div class="timeline-meta">项目编号</div></div><div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">REQ-1042</div><div class="timeline-meta">业务需求</div></div><div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">feature/provider-adapter</div><div class="timeline-meta">开发分支</div></div></div>`)}
    </div><section class="card"><div class="card-head"><h2 class="card-title"><i class="title-rail"></i>AI 外呼 · 兼容底层供应商功能</h2><div>${status("执行中")}</div></div><div class="workflow-canvas">${nodes.map(node => `<div class="workflow-node ${node[5]}"><div class="node-head"><div><span class="node-type">${node[0]}</span><span class="node-title">${node[1]}</span></div>${status(node[5] ? "已通过" : node[1].includes("阶段 3") ? "执行中" : "已完成")}</div><div class="node-desc">${node[2]}<br>执行：${node[3]}</div><div class="node-skills">Skills：${node[4]}</div></div>`).join("")}</div></section></div>`;
}

function renderReviews() {
  return `${pageHead("审查中心", "统一处理 PRD、技术方案、代码、测试和发布审批", `${btn("批量处理", "batch-review")}`)}
    <div class="metrics">${metric("待我审查","3","最长等待 1.6h","✓","warning")}${metric("今日已处理","12","平均 8 分钟","◷","success")}${metric("本周通过率","76%","↑ 4.2%","◔")}${metric("高风险项","1","需要立即处理","!","warning")}</div>
    <div class="grid grid-2 section-gap" style="grid-template-columns:230px minmax(0,1fr)">
      <section class="card"><div class="filter-row" style="display:grid"><input class="input" placeholder="搜索审查单"><select class="select"><option>全部项目</option><option>AI 智能客服平台</option></select></div><div class="card-body">${[["全部待办",3],["需求评审",1],["技术评审",1],["代码审查",1],["测试审查",0],["发布审批",0]].map((item,index) => `<div class="doc-nav-item ${index===0 ? "active" : ""}">${item[0]} <span style="float:right">${item[1]}</span></div>`).join("")}</div></section>
      <div>${state.reviews.length ? state.reviews.map(review => `<section class="review-card ${review.tone}"><div class="review-title">${tag(review.level, review.tone === "danger" ? "orange" : "")} ${review.title}<span style="margin-left:auto">${status(review.tone === "danger" ? "高风险" : "待审批")}</span></div><div class="review-body"><span class="review-label">审查人</span><span>${review.reviewers}</span><span class="review-label">审查依据</span><span>${review.basis}</span><span class="review-label">AI 摘要</span><span>已完成自动预审，发现 2 项建议与 1 项需要人工确认的问题。</span></div><div class="review-actions">${btn("✓ 审查通过", `approve:${review.id}`, "success")}${btn("× 驳回修改", `reject:${review.id}`, "danger")}${btn("◉ 查看产物", `artifact:${review.id}`)}${btn("☵ 评论", `comment:${review.id}`, "ghost")}</div></section>`).join("") : `<section class="card">${emptyState("✓", "所有审查都已处理", "新的审查任务会显示在这里")}</section>`}</div>
    </div>`;
}

function renderDocuments() {
  return `${pageHead("文档中心", "集中管理 PRD、技术方案、API、测试和发布文档", `${btn("导入文档", "import-document")}${btn("＋ 新建文档", "new-document", "primary")}`)}
    <div class="tabs">${[["prd","PRD"],["architecture","技术方案"],["api","API 文档"],["test","测试文档"],["release","发布说明"]].map(([key,label]) => `<div class="tab ${state.documentTab===key ? "active":""}" data-document-tab="${key}">${label}</div>`).join("")}</div><div class="section-gap">${renderDocumentWorkspace(state.documentTab)}</div>`;
}

function renderDocumentWorkspace(type = "prd") {
  const isArchitecture = type === "architecture";
  const titles = { prd:"AI 智能客服平台产品需求文档", architecture:"AI 智能客服平台技术架构方案", api:"智能客服 OpenAPI 接口文档", test:"智能客服测试计划与报告", release:"v1.6.0 发布说明" };
  const nav = isArchitecture ? ["1. 方案摘要","2. 系统架构","3. 模块设计","4. 数据模型","5. API 设计","6. 安全设计","7. 部署方案","8. 风险清单"] : ["1. 背景与目标","2. 用户角色","3. 用户故事","4. 功能需求","5. 业务流程","6. 验收标准","7. 非功能需求","8. 排除范围"];
  return `<section class="card"><div class="document-layout"><aside class="doc-nav"><div class="cell-main" style="margin-bottom:10px">文档目录</div>${nav.map((item,index)=>`<div class="doc-nav-item ${index===0?"active":""}">${item}</div>`).join("")}</aside><article class="doc-page" contenteditable="true" spellcheck="false"><h1>${titles[type] || titles.prd}</h1><p style="color:#929eb0">版本 v1.2 · 最后更新于 2026/08/18 09:42 · AI 生成后经林产品经理修订</p>${isArchitecture ? `<h2>1. 方案摘要</h2><p>本方案采用模块化单体架构作为第一阶段交付形态，通过供应商适配层隔离外部呼叫能力，并预留事件总线用于异步识别与结果推送。</p><h2>2. 系统架构</h2><div class="info-strip">Web Console → API Gateway → Conversation Service → Provider Adapter → 外部供应商</div><h2>3. 模块设计</h2><table><thead><tr><th>模块</th><th>职责</th><th>风险</th></tr></thead><tbody><tr><td>Provider Adapter</td><td>统一供应商调用协议与错误映射</td><td>供应商限流差异</td></tr><tr><td>Conversation Service</td><td>会话生命周期、异步任务和结果推送</td><td>幂等与一致性</td></tr></tbody></table><h2>4. 关键技术决策</h2><ul><li>使用策略模式实现供应商切换。</li><li>所有回调必须进行签名校验和幂等处理。</li><li>失败任务进入重试队列，超过阈值转人工处理。</li></ul>` : `<h2>1. 背景与目标</h2><p>当前客服团队需要在多个系统之间切换，无法快速获取客户历史、知识推荐和工单上下文。本项目希望通过统一工作台和 AI 辅助能力，提高首响速度与一次解决率。</p><h2>2. 核心指标</h2><table><thead><tr><th>指标</th><th>当前值</th><th>目标值</th></tr></thead><tbody><tr><td>平均首响时间</td><td>48 秒</td><td>≤ 20 秒</td></tr><tr><td>一次解决率</td><td>62%</td><td>≥ 78%</td></tr><tr><td>会话总结覆盖率</td><td>0%</td><td>100%</td></tr></tbody></table><h2>3. 用户故事</h2><h3>US-01 客服查看客户上下文</h3><p>作为一名客服，我希望进入会话时自动看到客户信息、历史工单和知识推荐，以便快速理解问题。</p><h3>验收标准</h3><ul><li>Given 客户进入人工会话，When 客服接入，Then 2 秒内展示客户摘要。</li><li>若推荐服务不可用，工作台仍能正常加载并显示降级提示。</li></ul><h2>4. MVP 范围</h2><p>会话工作台、客户摘要、知识推荐、会话自动总结、历史工单关联。</p>`}</article><aside class="doc-side"><div class="cell-main" style="margin-bottom:11px">AI 助手与评论</div><div class="comment"><div class="comment-head"><span>AI 审阅助手</span><span>刚刚</span></div><p>建议为“推荐服务不可用”补充降级验收标准，避免测试范围不完整。</p><button class="btn btn-secondary btn-sm" data-action="accept-suggestion" style="margin-top:8px">接受建议</button></div><div class="comment"><div class="comment-head"><span>陈技术负责人</span><span>32 分钟前</span></div><p>供应商回调签名算法需要在技术方案中明确。</p></div><textarea class="textarea" style="min-height:70px" placeholder="添加评论或 @成员"></textarea><button class="btn btn-primary btn-sm" data-action="add-comment" style="margin-top:7px;width:100%">发表评论</button></aside></div></section>`;
}

function renderAgents() {
  return `${pageHead("Agent 监控", "实时查看 Agent 的运行状态、步骤、工具调用、成本和异常", `${btn("暂停全部", "pause-all")}${btn("＋ 启动 Agent", "start-agent", "primary")}`)}
    <div class="metrics">${metric("在线 Agent","8","5 个执行中","◉","success")}${metric("今日完成任务","46","成功率 92%","✓")}${metric("今日成本","¥ 138.20","预算使用 46%","¥","info")}${metric("需要接管","1","代码冲突","!","warning")}</div>
    <section class="card section-gap"><div class="filter-row"><input class="input filter-search" placeholder="搜索 Agent 或任务" data-filter="agent"><select class="select"><option>全部状态</option><option>执行中</option><option>等待</option></select><select class="select"><option>全部项目</option><option>AI 智能客服平台</option></select></div><div class="table-wrap"><table><thead><tr><th>Agent</th><th>当前任务</th><th>模型</th><th>状态</th><th>运行时长</th><th>成功率</th><th>本次成本</th><th>操作</th></tr></thead><tbody>${state.agents.map(agent => `<tr data-search-row="${agent.name} ${agent.task}"><td><div class="inline" style="gap:9px"><div class="agent-avatar ${agent.tone}">${agent.icon}</div><div><div class="cell-main">${agent.name}</div><div class="cell-sub">${agent.role}</div></div></div></td><td>${agent.task}</td><td>${tag(agent.model,"blue")}</td><td>${status(agent.status)}</td><td>${agent.status === "执行中" ? "18m 42s" : "—"}</td><td>${agent.success}%</td><td>¥ ${agent.cost.toFixed(2)}</td><td>${btn(agent.status === "执行中" ? "暂停" : "查看", `agent:${agent.id}`, "secondary", 'class="btn-sm"')}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function agentRow(agent) {
  return `<div class="agent-row"><div class="agent-avatar ${agent.tone}">${agent.icon}</div><div class="agent-copy"><div class="agent-name">${agent.name}</div><div class="agent-task">${agent.task}</div></div>${status(agent.status)}</div>`;
}

function renderAgentManager() {
  return `${pageHead("Agent 管理", "配置角色目标、模型、提示词、技能、知识和工具权限", `${btn("从模板导入", "import-agent")}${btn("＋ 创建 Agent", "new-agent", "primary")}`)}
    <div class="grid grid-3">${state.agents.map(agent => `<section class="card"><div class="card-body"><div class="inline" style="gap:10px"><div class="agent-avatar ${agent.tone}" style="width:38px;height:38px">${agent.icon}</div><div><div class="cell-main">${agent.name}</div><div class="cell-sub">${agent.role}</div></div><span style="margin-left:auto">${status(agent.status)}</span></div><div style="margin:15px 0 11px"><div class="inline" style="justify-content:space-between"><span class="muted">主模型</span>${tag(agent.model,"blue")}</div><div class="inline" style="justify-content:space-between;margin-top:8px"><span class="muted">成功率</span><span>${agent.success}%</span></div><div style="margin-top:6px">${progress(agent.success)}</div></div><div class="inline" style="gap:7px">${btn("配置", `configure-agent:${agent.id}`, "secondary", 'style="flex:1"')}${btn("复制", `copy-agent:${agent.id}`, "ghost")}</div></div></section>`).join("")}</div>`;
}

function renderTasks() {
  const columns = [["todo","待开始"],["doing","进行中"],["review","待审查"],["done","已完成"]];
  const kanban = `<div class="kanban">${columns.map(([key,label]) => { const tasks = state.tasks.filter(task => task.status===key); return `<div class="kanban-col"><div class="kanban-head"><span>${label}</span><span class="kanban-count">${tasks.length}</span></div>${tasks.length ? tasks.map(task => `<div class="task-card" data-action="task:${task.id}"><div class="inline" style="justify-content:space-between">${tag(task.priority, task.priority === "P0" ? "orange" : "")}<span class="muted">${task.id}</span></div><div class="task-title" style="margin-top:8px">${task.title}</div><div class="task-meta"><span>${task.owner}</span><span>${task.points} SP</span></div></div>`).join("") : `<div class="empty" style="min-height:100px"><div><div class="empty-title">暂无任务</div></div></div>`}</div>`; }).join("")}</div>`;
  const list = `<div class="table-wrap"><table><thead><tr><th>任务</th><th>状态</th><th>负责人</th><th>优先级</th><th>工作量</th><th>操作</th></tr></thead><tbody>${state.tasks.map(task => `<tr><td><div class="cell-main">${task.title}</div><div class="cell-sub">${task.id}</div></td><td>${status({todo:"待开始",doing:"执行中",review:"待审查",done:"已完成"}[task.status])}</td><td>${task.owner}</td><td>${tag(task.priority,task.priority==="P0"?"orange":"")}</td><td>${task.points} SP</td><td>${btn("查看",`task:${task.id}`,"secondary",'class="btn-sm"')}</td></tr>`).join("")}</tbody></table></div>`;
  return `${pageHead("任务看板", "基于 PRD 和技术方案拆分 Epic、Story、Task 与依赖关系", `${btn("AI 重新拆分", "ai-split")}${btn("＋ 新建任务", "new-task", "primary")}`)}<section class="card"><div class="filter-row"><input class="input filter-search" placeholder="搜索任务"><select class="select"><option>当前迭代：Sprint 08</option></select><span class="filter-spacer"></span><div class="segmented"><button class="segment ${state.taskView==="kanban"?"active":""}" data-task-view="kanban">看板</button><button class="segment ${state.taskView==="list"?"active":""}" data-task-view="list">列表</button></div></div><div class="card-body">${state.taskView==="kanban"?kanban:list}</div></section>`;
}

function renderCodeReview() {
  const issues = [["P1","src/services/provider.ts:84","重试逻辑未设置最大次数，可能造成无限重试","阻断"],["P2","src/api/callback.ts:42","回调签名比较应使用常量时间函数","安全"],["P2","src/components/ProviderForm.tsx:126","表单提交缺少重复点击保护","建议"]];
  return `${pageHead("代码评审", "结合需求、架构、Diff、测试和安全规则进行 AI 预审与人工复核", `${btn("重新运行 AI Review", "rerun-review")}${btn("打开 Pull Request", "open-pr", "primary")}`)}
    <div class="grid grid-2"><section class="card"><div class="card-head"><h2 class="card-title"><i class="title-rail"></i>PR #128 · 供应商适配层与配置管理</h2>${status("待审查")}</div><div class="card-body"><div class="inline" style="gap:9px;margin-bottom:13px">${tag("+842","green")}${tag("-126","orange")}${tag("12 个文件","blue")}<span class="muted">feature/provider-adapter → main</span></div><div style="padding:13px;border-radius:8px;background:#172033;color:#d9e2f1;font:10px/1.7 Consolas,monospace"><div style="color:#7fd6a9">+ export class ProviderRegistry {</div><div style="color:#7fd6a9">+ &nbsp;register(name: string, adapter: ProviderAdapter) {</div><div style="color:#ffcf7c">+ &nbsp;&nbsp;this.adapters.set(name, adapter);</div><div style="color:#7fd6a9">+ &nbsp;}</div><div style="color:#7fd6a9">+ }</div></div><div class="section-title"><h2>变更摘要</h2></div><ul style="color:#5b6980;font-size:10px"><li>新增统一供应商适配协议和注册中心。</li><li>新增供应商配置 CRUD API 和管理页面。</li><li>补充回调签名校验、错误映射和基础测试。</li></ul></div></section>
      <section class="card"><div class="card-head"><h2 class="card-title"><i class="title-rail" style="background:#f59f32"></i>AI Review 发现 3 项</h2><span class="muted">可信度 91%</span></div><div class="card-body">${issues.map(issue=>`<div class="review-card ${issue[0]==="P1"?"danger":""}"><div class="review-title">${tag(issue[0],issue[0]==="P1"?"orange":"")} ${issue[2]}</div><div class="review-body"><span class="review-label">位置</span><span>${issue[1]}</span><span class="review-label">类型</span><span>${issue[3]}</span></div><div class="review-actions">${btn("应用修复", "apply-fix", "primary", 'class="btn-sm"')}${btn("标记误报", "mark-false-positive", "ghost", 'class="btn-sm"')}</div></div>`).join("")}</div></section></div>`;
}

function renderPullRequests() {
  const prs = [["#128","feat: 供应商适配层与配置管理","AI 智能客服","待审查","12/13","林产品经理","10 分钟前"],["#124","fix: 会话结果推送幂等处理","智能外呼","检查失败","8/10","后端 Agent","1 小时前"],["#119","feat: 客户历史工单侧边栏","AI 智能客服","可合并","15/15","前端 Agent","昨天"]];
  return `${pageHead("MR / PR 看板", "查看分支、提交、审查、流水线、冲突和合并门禁", `${btn("同步 Git 平台", "sync-git")}${btn("＋ 创建 PR", "create-pr", "primary")}`)}<section class="card"><div class="filter-row"><input class="input filter-search" placeholder="搜索 PR、分支或作者"><select class="select"><option>全部仓库</option><option>customer-service</option></select><select class="select"><option>打开的 PR</option><option>已合并</option></select></div><div class="table-wrap"><table><thead><tr><th>PR</th><th>项目</th><th>状态</th><th>检查</th><th>作者</th><th>更新时间</th><th></th></tr></thead><tbody>${prs.map(pr=>`<tr><td><div class="cell-main link" data-action="open-pr">${pr[0]} ${pr[1]}</div><div class="cell-sub">feature/* → main</div></td><td>${pr[2]}</td><td>${status(pr[3])}</td><td>${pr[4]}</td><td>${pr[5]}</td><td>${pr[6]}</td><td>${btn("查看", "open-pr", "secondary", 'class="btn-sm"')}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderTests() {
  const run = state.testRun;
  const suites = [["单元测试","126","124","2","68%"],["API 集成测试","42","41","1","92%"],["端到端测试","25","21","1","84%"],["安全与依赖扫描","8","8","0","100%"]];
  return `${pageHead("测试中心", "从验收标准和代码变更生成测试，执行质量门禁并管理缺陷", `${btn("生成测试用例", "generate-tests")}${btn(run.running ? "运行中..." : "▶ 运行全部测试", "run-tests", "primary", run.running ? "disabled" : "")}`)}
    <div class="metrics">${metric("测试用例","201","本次新增 18","▥")}${metric("通过","${run.passed}","通过率 96%","✓","success")}${metric("失败","${run.failed}","2 个阻断","!","warning")}${metric("代码覆盖率","84%","↑ 6%","◔","info")}</div>
    <div class="grid grid-2 section-gap"><section class="card"><div class="card-head"><h2 class="card-title"><i class="title-rail"></i>测试套件</h2>${status(run.running ? "运行中" : "待审查")}</div><div class="table-wrap"><table><thead><tr><th>测试类型</th><th>总数</th><th>通过</th><th>失败</th><th>覆盖率</th></tr></thead><tbody>${suites.map(s=>`<tr><td class="cell-main">${s[0]}</td><td>${s[1]}</td><td style="color:var(--success)">${s[2]}</td><td style="color:${s[3]==="0"?"var(--muted)":"var(--danger)"}">${s[3]}</td><td>${s[4]}</td></tr>`).join("")}</tbody></table></div>${run.running ? `<div class="card-body"><div class="inline" style="justify-content:space-between;margin-bottom:6px"><span>正在执行端到端测试...</span><span>${run.progress}%</span></div>${progress(run.progress)}</div>` : ""}</section>
    ${card("失败用例", `<div class="review-card danger"><div class="review-title">TC-E2E-018 · 供应商切换后创建呼叫失败</div><div class="review-body"><span class="review-label">失败原因</span><span>测试环境缺少供应商 B 的回调密钥</span><span class="review-label">归因</span><span>环境配置问题 · 可信度 94%</span></div><div class="review-actions">${btn("自动修复环境", "fix-test-env", "primary", 'class="btn-sm"')}${btn("查看日志", "view-test-log", "secondary", 'class="btn-sm"')}</div></div><div class="review-card"><div class="review-title">TC-API-031 · 重复回调幂等校验</div><div class="review-body"><span class="review-label">失败原因</span><span>第二次请求返回 409，预期应返回 200 与原结果</span><span class="review-label">归因</span><span>代码缺陷 · 可信度 88%</span></div><div class="review-actions">${btn("创建修复任务", "create-bug-task", "primary", 'class="btn-sm"')}</div></div>`)}</div>`;
}

function renderOperations() {
  const environments = [["开发环境","dev.flowmind.local","v1.6.0-dev.18","健康","今天 10:05"],["测试环境","test.flowmind.ai","v1.6.0-rc.3","健康","今天 09:42"],["预发布环境","staging.flowmind.ai","v1.6.0-rc.3","健康","今天 09:42"],["生产环境","app.flowmind.ai","v1.5.2","健康","昨天 18:20"]];
  return `${pageHead("运维中心", "管理环境、发布、回滚、日志、健康检查和线上事件", `${btn("查看运行日志", "runtime-logs")}${btn("发布新版本", "deploy", "primary")}`)}
    <div class="metrics">${metric("服务可用性","99.98%","过去 30 天","◉","success")}${metric("当前版本","v1.5.2","生产环境","◇")}${metric("今日发布","3","全部成功","↗","info")}${metric("活跃告警","1","低风险","!","warning")}</div>
    <div class="grid grid-2 section-gap"><section class="card"><div class="card-head"><h2 class="card-title"><i class="title-rail"></i>环境与部署</h2><span class="card-extra">自动健康检查已开启</span></div><div class="table-wrap"><table><thead><tr><th>环境</th><th>地址</th><th>版本</th><th>状态</th><th>最后部署</th></tr></thead><tbody>${environments.map(env=>`<tr><td class="cell-main">${env[0]}</td><td class="link">${env[1]}</td><td>${tag(env[2],"blue")}</td><td>${status(env[3])}</td><td>${env[4]}</td></tr>`).join("")}</tbody></table></div></section>
    <div class="stack">${card("发布流水线", `<div class="timeline">${[["构建镜像","已完成 · 1m 24s"],["安全扫描","已完成 · 无阻断问题"],["部署预发布","已完成 · 42s"],["冒烟测试","执行中 · 8 / 10"],["人工发布审批","等待中"]].map((item,index)=>`<div class="timeline-item"><i class="timeline-dot" style="background:${index<3?'var(--success)':index===3?'var(--primary)':'var(--muted)'}"></i><div class="timeline-title">${item[0]}</div><div class="timeline-meta">${item[1]}</div></div>`).join("")}</div>`,status("执行中"))}${card("活跃告警", `<div class="review-card" style="margin:0"><div class="review-title">API P95 延迟超过 800ms</div><div class="review-body"><span class="review-label">服务</span><span>conversation-service</span><span class="review-label">持续时间</span><span>6 分钟</span><span class="review-label">AI 初诊</span><span>供应商 B 响应变慢，建议启用熔断降级。</span></div></div>`)}</div></div>`;
}

function renderKnowledge() {
  const items = [["产品知识库","客服业务规则、用户画像、产品术语","128 篇","今天 09:20","组织"],["技术规范库","架构规范、编码规范、安全基线","86 篇","昨天","团队"],["AI 智能客服项目库","PRD、设计、代码索引、测试记录","214 篇","10 分钟前","项目"],["历史项目复盘","发布复盘、故障报告、最佳实践","42 篇","3 天前","组织"]];
  return `${pageHead("知识库", "为 Agent 提供有权限、有来源、可追溯的业务与技术上下文", `${btn("同步数据源", "sync-knowledge")}${btn("＋ 新建知识库", "new-knowledge", "primary")}`)}
    <div class="grid grid-3">${items.map(item=>`<section class="card"><div class="card-body"><div class="inline" style="justify-content:space-between"><div class="agent-avatar">◇</div>${tag(item[4],"blue")}</div><h3 style="margin:13px 0 4px;font-size:13px">${item[0]}</h3><p style="min-height:36px;margin:0;color:var(--muted);font-size:10px">${item[1]}</p><div class="inline" style="justify-content:space-between;margin-top:14px;color:#758297;font-size:9px"><span>${item[2]}</span><span>更新：${item[3]}</span></div><button class="btn btn-secondary btn-sm" data-action="open-knowledge" style="width:100%;margin-top:12px">打开知识库</button></div></section>`).join("")}</div>
    <section class="card section-gap"><div class="card-head"><h2 class="card-title"><i class="title-rail"></i>数据源与索引状态</h2></div><div class="table-wrap"><table><thead><tr><th>数据源</th><th>类型</th><th>文档数</th><th>索引状态</th><th>最近同步</th><th>操作</th></tr></thead><tbody>${[["customer-service 仓库","GitHub","2,846","已完成","10 分钟前"],["产品中心 Wiki","网页","326","已完成","1 小时前"],["飞书需求文档","飞书","184","同步中","正在同步"]].map(row=>`<tr><td class="cell-main">${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${status(row[3])}</td><td>${row[4]}</td><td>${btn("配置","configure-source","secondary",'class="btn-sm"')}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderExecutionLogs() {
  const logs = [["RUN-8831","后端工程师 Agent","实现供应商配置 API","执行中","18m 42s","¥ 12.48","刚刚"],["RUN-8828","产品经理 Agent","生成 PRD v1.2","成功","6m 18s","¥ 4.21","32 分钟前"],["RUN-8824","架构师 Agent","生成技术架构方案","成功","11m 03s","¥ 8.74","1 小时前"],["RUN-8819","测试工程师 Agent","执行 API 测试","失败","4m 56s","¥ 2.16","2 小时前"]];
  return `${pageHead("执行日志", "查看每次 Agent Run 的上下文、步骤、工具调用、产物、成本和错误", `${btn("导出日志", "export-logs")}`)}<section class="card"><div class="filter-row"><input class="input filter-search" placeholder="搜索 Run ID、Agent 或任务"><select class="select"><option>全部状态</option><option>成功</option><option>失败</option></select><input class="input" type="date" value="2026-08-18"></div><div class="table-wrap"><table><thead><tr><th>Run ID</th><th>Agent</th><th>任务</th><th>状态</th><th>耗时</th><th>成本</th><th>时间</th><th></th></tr></thead><tbody>${logs.map(row=>`<tr><td class="cell-main">${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${status(row[3])}</td><td>${row[4]}</td><td>${row[5]}</td><td>${row[6]}</td><td>${btn("详情",`run:${row[0]}`,"secondary",'class="btn-sm"')}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderAuditLogs() {
  const rows = [["林产品经理","人工审批","通过技术方案 G2 审查","AI 智能客服平台","成功","09:42:18"],["后端工程师 Agent","代码操作","提交 Commit 8f3a1c2","customer-service","成功","09:31:04"],["系统","权限拦截","阻止 Agent 读取生产环境密钥","生产环境","成功","09:28:17"],["陈技术负责人","配置修改","更新数据库迁移审批策略","组织级配置","成功","昨天 18:22"]];
  return `${pageHead("审计日志", "不可篡改地记录用户、Agent、系统和外部集成的关键操作", `${btn("导出审计报告", "export-audit")}`)}<section class="card"><div class="filter-row"><input class="input filter-search" placeholder="搜索操作者、资源或操作"><select class="select"><option>全部操作类型</option><option>人工审批</option><option>代码操作</option><option>权限拦截</option></select><select class="select"><option>全部结果</option><option>成功</option><option>失败</option></select></div><div class="table-wrap"><table><thead><tr><th>操作者</th><th>类型</th><th>操作</th><th>资源</th><th>结果</th><th>时间</th></tr></thead><tbody>${rows.map(row=>`<tr><td class="cell-main">${row[0]}</td><td>${tag(row[1],"blue")}</td><td>${row[2]}</td><td>${row[3]}</td><td>${status(row[4])}</td><td>${row[5]}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderIntegrations() {
  const services = [["github","GitHub","仓库、Issue、分支、PR 和 Webhook","GH"],["jira","Jira","Epic、Story、Sprint 与状态同步","JI"],["feishu","飞书","审批、通知、文档和机器人","飞"],["gitlab","GitLab","仓库、MR 与 CI/CD","GL"],["slack","Slack","消息通知与协作","SL"],["vercel","Vercel","前端预览与生产部署","V"]];
  return `${pageHead("集成中心", "连接代码、任务、协作、模型、CI/CD 和云平台", `${btn("查看 MCP 市场", "mcp-market")}${btn("＋ 自定义集成", "custom-integration", "primary")}`)}<div class="grid grid-3">${services.map(service=>{ const connected=state.integrations[service[0]]; return `<section class="card"><div class="card-body"><div class="inline" style="gap:10px"><div class="agent-avatar ${connected?'green':''}" style="width:38px;height:38px">${service[3]}</div><div style="flex:1"><div class="cell-main">${service[1]}</div><div class="cell-sub">${service[2]}</div></div>${status(connected?"已连接":"未连接")}</div><button class="btn ${connected?'btn-secondary':'btn-primary'} btn-sm" data-action="toggle-integration:${service[0]}" style="width:100%;margin-top:15px">${connected?'管理配置':'连接服务'}</button></div></section>`}).join("")}</div>`;
}

function renderSettings() {
  return `${pageHead("系统配置", "配置模型、预算、执行策略、审批规则和安全边界", `${btn("重置演示数据", "reset-demo")}${btn("恢复默认", "reset-settings")}${btn("保存配置", "save-settings", "primary")}`)}
    <div class="grid grid-2" style="grid-template-columns:220px minmax(0,1fr)"><section class="card"><div class="card-body">${["模型与供应商","Agent 默认配置","预算与配额","审批策略","安全策略","通知设置","数据保留"].map((item,index)=>`<div class="doc-nav-item ${index===0?'active':''}">${item}</div>`).join("")}</div></section><section class="card"><div class="card-head"><h2 class="card-title"><i class="title-rail"></i>模型与供应商</h2></div><div class="card-body"><div class="form-grid"><div class="field"><label>默认主模型</label><select class="select"><option>GPT-5</option><option>Claude Sonnet</option><option>Gemini Pro</option></select></div><div class="field"><label>默认编码模型</label><select class="select"><option>GPT-5 Codex</option><option>Claude Sonnet</option></select></div><div class="field"><label>失败备用模型</label><select class="select"><option>Claude Sonnet</option><option>GPT-5</option></select></div><div class="field"><label>单次任务最大成本</label><input class="input" value="¥ 80"></div><div class="field full"><label>上下文策略</label><select class="select"><option>仅加载任务相关代码和知识</option><option>加载完整项目上下文</option></select><div class="help">推荐最小上下文策略，以降低成本和敏感数据暴露。</div></div></div><div class="section-title"><h2>已配置供应商</h2></div><div class="table-wrap"><table><tbody>${[["OpenAI","可用","4 个模型"],["Anthropic","可用","3 个模型"],["Google Gemini","可用","2 个模型"],["本地模型网关","未配置","—"]].map(row=>`<tr><td class="cell-main">${row[0]}</td><td>${status(row[1])}</td><td>${row[2]}</td><td>${btn("配置","provider-config","secondary",'class="btn-sm"')}</td></tr>`).join("")}</tbody></table></div></div></section></div>`;
}

function renderUsers() {
  const users = [["林产品经理","lin@flowmind.ai","产品经理 / 项目管理员","3 个项目","正常"],["陈技术负责人","chen@flowmind.ai","技术负责人 / Reviewer","5 个项目","正常"],["周测试工程师","zhou@flowmind.ai","测试工程师","2 个项目","正常"],["外部顾问","guest@example.com","访客","1 个项目","待激活"]];
  return `${pageHead("用户权限", "管理组织、团队、角色、项目权限和环境访问范围", `${btn("角色与权限", "roles")}${btn("＋ 邀请成员", "invite-user", "primary")}`)}
    <div class="metrics">${metric("组织成员","28","本月新增 3","♙")}${metric("项目管理员","6","覆盖 8 个项目","◇","info")}${metric("待激活","1","邀请 2 天后过期","◷","warning")}${metric("高权限账号","4","已开启 MFA","✓","success")}</div>
    <section class="card section-gap"><div class="filter-row"><input class="input filter-search" placeholder="搜索姓名或邮箱"><select class="select"><option>全部角色</option><option>产品经理</option><option>技术负责人</option></select><select class="select"><option>全部状态</option><option>正常</option><option>待激活</option></select></div><div class="table-wrap"><table><thead><tr><th>成员</th><th>角色</th><th>项目范围</th><th>状态</th><th>最近登录</th><th></th></tr></thead><tbody>${users.map((user,index)=>`<tr><td><div class="inline" style="gap:9px"><div class="avatar">${user[0].slice(0,1)}</div><div><div class="cell-main">${user[0]}</div><div class="cell-sub">${user[1]}</div></div></div></td><td>${user[2]}</td><td>${user[3]}</td><td>${status(user[4])}</td><td>${index===3?'—':'今天 09:'+(42-index*8)}</td><td>${btn("管理","manage-user","secondary",'class="btn-sm"')}</td></tr>`).join("")}</tbody></table></div></section>`;
}

function bindPageEvents() {
  document.querySelectorAll("[data-nav]").forEach(element => element.addEventListener("click", () => navigate(element.dataset.nav)));
  document.querySelectorAll("[data-action]").forEach(element => element.addEventListener("click", event => handleAction(element.dataset.action, event)));
  document.querySelectorAll("[data-project-tab]").forEach(element => element.addEventListener("click", () => { state.projectTab = element.dataset.projectTab; saveState(); renderShell(); }));
  document.querySelectorAll("[data-document-tab]").forEach(element => element.addEventListener("click", () => { state.documentTab = element.dataset.documentTab; saveState(); renderShell(); }));
  document.querySelectorAll("[data-task-view]").forEach(element => element.addEventListener("click", () => { state.taskView = element.dataset.taskView; saveState(); renderShell(); }));
  document.querySelectorAll("[data-requirement-source]").forEach(element => element.addEventListener("click", () => { state.requirementSource = element.dataset.requirementSource; renderShell(); }));
  document.querySelectorAll("[data-filter]").forEach(input => input.addEventListener("input", () => {
    const keyword = input.value.trim().toLowerCase();
    document.querySelectorAll("[data-search-row]").forEach(row => row.style.display = row.dataset.searchRow.toLowerCase().includes(keyword) ? "" : "none");
  }));
  document.querySelectorAll(".doc-nav-item").forEach(item => item.addEventListener("click", () => {
    const parent = item.parentElement;
    parent.querySelectorAll(".doc-nav-item").forEach(node => node.classList.remove("active"));
    item.classList.add("active");
  }));
}

function navigate(page) {
  state.page = page;
  saveState();
  renderShell();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleAction(action) {
  const [type, id] = action.split(":");
  const handlers = {
    "quick-create": showQuickCreate,
    "open-command": showCommandPalette,
    "open-notifications": showNotifications,
    "new-project": showNewProject,
    "import-project": () => showUploadModal("导入 Git 项目", "粘贴 GitHub / GitLab 仓库地址，平台将分析目录、技术栈和运行方式。"),
    "open-project": () => navigate("projectDetail"),
    "project-settings": showProjectSettings,
    "continue-project": showContinueProject,
    "save-draft": () => toast("需求草稿已保存", "success"),
    "generate-requirement": generateRequirement,
    "upload-file": () => showUploadModal("上传需求附件", "选择需求文档、原型图、会议纪要或业务流程图。"),
    "continue-workflow": () => { toast("流程已从“任务拆分与开发”节点继续执行", "success"); navigate("agents"); },
    "edit-workflow": showWorkflowEditor,
    "batch-review": () => toast("请选择需要批量处理的审查单"),
    "new-document": () => showSimpleForm("新建文档", [{label:"文档名称",id:"name"},{label:"文档类型",id:"type",type:"select",options:["PRD","技术方案","API 文档","测试报告"]}], () => toast("文档已创建", "success")),
    "import-document": () => showUploadModal("导入文档", "上传现有 PRD、技术方案或 Markdown 文档。"),
    "accept-suggestion": () => toast("AI 建议已写入文档，形成一个待保存变更", "success"),
    "add-comment": () => toast("评论已发布并通知相关成员", "success"),
    "pause-all": pauseAllAgents,
    "start-agent": showStartAgent,
    "import-agent": () => toast("Agent 模板已载入，可选择角色后导入"),
    "new-agent": showNewAgent,
    "ai-split": () => { toast("项目经理 Agent 正在重新分析任务依赖", "success"); setTimeout(() => toast("任务拆分完成：新增 2 项任务，发现 1 个依赖冲突"), 1200); },
    "new-task": showNewTask,
    "rerun-review": () => toast("AI Review 已重新运行，预计 2 分钟完成", "success"),
    "open-pr": showPullRequest,
    "apply-fix": () => toast("修复补丁已生成并应用到当前分支", "success"),
    "mark-false-positive": () => toast("已标记为误报，并用于优化审查规则"),
    "sync-git": () => toast("Git 平台数据同步完成", "success"),
    "create-pr": showCreatePullRequest,
    "generate-tests": () => toast("测试 Agent 正在从验收标准生成 18 条新用例", "success"),
    "run-tests": runTests,
    "fix-test-env": () => toast("已补充测试密钥并重新运行失败用例", "success"),
    "view-test-log": () => showLogDrawer("测试执行日志", ["09:51:02 启动 Playwright Chromium", "09:51:05 登录测试账号成功", "09:51:08 切换供应商 B", "09:51:09 ERROR: CALLBACK_SECRET is missing"]),
    "create-bug-task": () => { state.tasks.unshift({id:`TASK-${207+state.tasks.length}`,title:"修复重复回调幂等返回状态",status:"todo",owner:"后端 Agent",priority:"P0",points:3}); saveState(); toast("缺陷任务已创建并关联失败用例", "success"); },
    "runtime-logs": () => showLogDrawer("运行日志", ["10:02:31 GET /health 200 18ms", "10:02:32 POST /conversation 201 124ms", "10:02:34 WARN provider-b latency=842ms", "10:02:36 circuit_breaker threshold=80%"]),
    "deploy": showDeployModal,
    "sync-knowledge": () => toast("所有知识源已进入增量同步队列", "success"),
    "new-knowledge": () => showSimpleForm("新建知识库", [{label:"知识库名称",id:"name"},{label:"权限范围",id:"scope",type:"select",options:["组织","团队","项目","个人"]}], () => toast("知识库已创建", "success")),
    "open-knowledge": () => showDrawer("知识库详情", renderKnowledgeDrawer()),
    "configure-source": () => toast("数据源配置已打开"),
    "export-logs": () => toast("执行日志 CSV 已生成", "success"),
    "export-audit": () => toast("审计报告已生成，等待下载", "success"),
    "mcp-market": () => toast("MCP 工具市场已打开"),
    "custom-integration": () => showSimpleForm("自定义集成", [{label:"集成名称",id:"name"},{label:"Webhook 地址",id:"url"}], () => toast("自定义集成已保存", "success")),
    "save-settings": () => toast("系统配置已保存并写入审计日志", "success"),
    "reset-settings": () => toast("已恢复默认配置，保存后生效"),
    "reset-demo": resetDemoData,
    "provider-config": () => showSimpleForm("模型供应商配置", [{label:"API Base URL",id:"url"},{label:"API Key",id:"key",type:"password"}], () => toast("供应商配置已更新", "success")),
    "invite-user": showInviteUser,
    "roles": () => showDrawer("角色与权限矩阵", renderRoleMatrix()),
    "manage-user": () => showDrawer("成员权限", renderMemberPermissions()),
    "open-asset": () => { state.page="documents"; state.documentTab="prd"; saveState(); renderShell(); },
    "artifact": () => navigate("documents"),
    "comment": showReviewComment,
    "configure-agent": showAgentConfig,
    "copy-agent": () => toast("Agent 配置副本已创建", "success"),
    "task": showTaskDrawer,
    "agent": toggleAgent,
    "run": showRunDrawer,
    "toggle-integration": toggleIntegration,
    "approve": approveReview,
    "reject": rejectReview
  };
  const handler = handlers[type] || handlers[action];
  if (handler) handler(id);
  else toast("该交互已记录，将进入下一步流程");
}

function showModal(title, body, footer = "", large = false) {
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop" data-action="close-overlay"><section class="modal ${large ? "large" : ""}" role="dialog" aria-modal="true"><header class="modal-head"><h2 class="modal-title">${title}</h2><button class="modal-close" data-action="close-modal">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-foot">${footer}</footer>` : ""}</section></div>`;
  document.querySelector("[data-action='close-modal']").onclick = closeModal;
  document.querySelector("[data-action='close-overlay']").addEventListener("click", event => { if (event.target === event.currentTarget) closeModal(); });
}
function closeModal() { document.querySelector("#modal-root").innerHTML = ""; }
function showDrawer(title, body) {
  document.querySelector("#modal-root").innerHTML = `<div class="drawer-backdrop" data-action="close-overlay"><aside class="drawer"><header class="modal-head"><h2 class="modal-title">${title}</h2><button class="modal-close" data-action="close-modal">×</button></header><div class="modal-body">${body}</div></aside></div>`;
  document.querySelector("[data-action='close-modal']").onclick = closeModal;
  document.querySelector("[data-action='close-overlay']").addEventListener("click", event => { if (event.target === event.currentTarget) closeModal(); });
}
function toast(message, tone = "") {
  const element = document.createElement("div");
  element.className = `toast ${tone}`;
  element.textContent = message;
  document.querySelector("#toast-root").appendChild(element);
  setTimeout(() => element.remove(), 3200);
}

function showQuickCreate() {
  showModal("快速创建", `<div class="grid grid-3">${[["✎","业务需求","从想法生成 PRD 和研发流程","requirements"],["□","项目","创建项目并连接代码仓库","projects"],["▤","研发任务","创建任务并分配 Agent","tasks"],["◇","知识库","添加业务或技术知识源","knowledge"],["◉","Agent Run","选择 Agent 并下发任务","agents"],["↗","发布单","从已通过的 PR 创建发布","operations"]].map(item => `<div class="task-card" data-quick-nav="${item[3]}" style="margin:0"><div class="agent-avatar">${item[0]}</div><div class="task-title" style="margin-top:8px">${item[1]}</div><div class="cell-sub">${item[2]}</div></div>`).join("")}</div>`);
  document.querySelectorAll("[data-quick-nav]").forEach(item => item.onclick = () => { closeModal(); navigate(item.dataset.quickNav); });
}
function showCommandPalette() {
  showModal("搜索与命令", `<input id="command-search" class="input" style="width:100%;margin-bottom:10px" autofocus placeholder="搜索页面或输入命令"><div class="command-list" id="command-list">${NAV_GROUPS.flatMap(group=>group.items).map(item=>`<div class="command-item" data-command-nav="${item[0]}"><span class="nav-icon">${item[1]}</span><span>${item[2]}</span><span class="command-key">打开</span></div>`).join("")}</div>`);
  const input = document.querySelector("#command-search");
  input.focus();
  input.oninput = () => document.querySelectorAll("[data-command-nav]").forEach(item => item.style.display = item.textContent.toLowerCase().includes(input.value.toLowerCase()) ? "flex" : "none");
  document.querySelectorAll("[data-command-nav]").forEach(item => item.onclick = () => { closeModal(); navigate(item.dataset.commandNav); });
}
function showNotifications() {
  state.notificationsRead = true; saveState();
  showDrawer("通知中心", `<div class="timeline">${[["测试中心发现 4 个失败用例","需要测试负责人确认失败归因 · 5 分钟前"],["G2 技术方案等待你的审查","AI 智能客服平台 · 32 分钟前"],["后端 Agent 请求人工接管","合并时发现文件冲突 · 1 小时前"],["预发布环境部署成功","v1.6.0-rc.3 · 2 小时前"]].map(item=>`<div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">${item[0]}</div><div class="timeline-meta">${item[1]}</div></div>`).join("")}</div>`);
}

function showNewProject() {
  showSimpleForm("新建项目", [{label:"项目名称",id:"name"},{label:"项目类型",id:"type",type:"select",options:["Web 应用","AI 应用","API 服务","移动端","数据应用"]},{label:"默认仓库地址",id:"repo"},{label:"项目负责人",id:"owner",type:"select",options:["林产品经理","陈技术负责人","周产品"]}], () => { closeModal(); toast("项目已创建，可继续连接仓库和配置 Agent", "success"); });
}
function showProjectSettings() { showSimpleForm("项目设置", [{label:"项目名称",id:"name",value:state.activeProject},{label:"默认分支",id:"branch",value:"main"},{label:"默认工作目录",id:"dir",value:"workspace/project"},{label:"单项目预算",id:"budget",value:"¥ 2,000 / 月"}], () => toast("项目设置已保存", "success")); }
function showContinueProject() { showModal("继续执行 AI 研发流程", `<div class="info-strip">当前节点：阶段 3 · 任务拆分与代码开发</div><div class="field" style="margin-top:14px"><label>补充本轮执行要求</label><textarea id="continue-note" class="textarea" placeholder="例如：优先完成供应商配置 API，并补充异常响应测试。">优先完成供应商配置 API，并确保所有回调处理具备幂等性。</textarea></div><div class="form-grid" style="margin-top:12px"><div class="field"><label>最大执行时长</label><select class="select"><option>60 分钟</option><option>120 分钟</option></select></div><div class="field"><label>本轮预算</label><input class="input" value="¥ 80"></div></div>`, `${btn("取消","close","secondary")}${btn("开始执行","confirm-continue","primary")}`); document.querySelector("[data-action='close']").onclick=closeModal; document.querySelector("[data-action='confirm-continue']").onclick=()=>{closeModal(); state.agents.find(a=>a.id==="backend").status="执行中"; saveState(); toast("任务已下发，Agent 开始执行", "success");}; }
function showWorkflowEditor() { showModal("编辑研发流程", `<div class="info-strip">拖拽编排将在正式产品中实现。本原型支持开关阶段和人工门禁。</div>${["需求澄清","PRD 生成","G1 需求评审","技术设计","G2 技术评审","任务拆分","代码开发","自动测试","G3 代码审查","G4 发布审批"].map((item,index)=>`<label class="agent-row"><input type="checkbox" checked ${[2,4,8,9].includes(index)?'data-gate="true"':''}><span class="agent-copy"><span class="agent-name">${item}</span><span class="agent-task">${[2,4,8,9].includes(index)?'人工门禁':'自动执行节点'}</span></span></label>`).join("")}`, `${btn("取消","close","secondary")}${btn("保存流程","save-workflow","primary")}`); document.querySelector("[data-action='close']").onclick=closeModal; document.querySelector("[data-action='save-workflow']").onclick=()=>{closeModal();toast("流程模板已保存", "success")}; }

function generateRequirement() {
  const title = document.querySelector("#requirement-title")?.value.trim();
  if (!title) { toast("请先填写需求标题", "danger"); document.querySelector("#requirement-title")?.focus(); return; }
  state.requirements.unshift({ id:`REQ-${1043+state.requirements.length}`, title, project:document.querySelector("#requirement-project").value, owner:"林产品经理", status:"待澄清", priority:document.querySelector("#requirement-priority").value.slice(0,2), progress:5, updated:"刚刚" });
  saveState();
  showModal("需求草案已生成", `<div class="info-strip">产品经理 Agent 已识别核心目标，并生成 4 个待澄清问题。</div><h3>需求摘要</h3><p style="color:#5b6980">${esc(document.querySelector("#requirement-description").value)}</p><h3>需要确认</h3><ol style="color:#5b6980;font-size:11px"><li>首个版本是否必须支持多租户？</li><li>知识推荐的响应时间目标是多少？</li><li>是否需要接入现有工单系统？</li><li>会话数据的保留周期和合规要求是什么？</li></ol>`, `${btn("继续补充","close","secondary")}${btn("进入 PRD 生成","go-prd","primary")}`);
  document.querySelector("[data-action='close']").onclick=closeModal;
  document.querySelector("[data-action='go-prd']").onclick=()=>{closeModal(); state.page="documents"; state.documentTab="prd"; saveState(); renderShell(); toast("PRD 草稿已生成", "success");};
}

function approveReview(id) { state.reviews = state.reviews.filter(item=>item.id!==id); saveState(); toast(`${id} 审查已通过，流程进入下一阶段`, "success"); renderShell(); }
function rejectReview(id) { showModal("驳回修改", `<div class="field"><label>驳回原因</label><textarea id="reject-reason" class="textarea" placeholder="请说明需要修改的内容">请补充供应商限流场景和失败降级的验收标准。</textarea></div><label><input type="checkbox" checked> 自动创建修订任务并通知相关 Agent</label>`, `${btn("取消","close","secondary")}${btn("确认驳回","confirm-reject","danger")}`); document.querySelector("[data-action='close']").onclick=closeModal; document.querySelector("[data-action='confirm-reject']").onclick=()=>{closeModal(); toast(`${id} 已驳回并创建修订任务`, "success")}; }
function showReviewComment() { showSimpleForm("添加审查评论", [{label:"评论内容",id:"comment",type:"textarea"}], () => toast("评论已发送并 @相关成员", "success")); }

function pauseAllAgents() { state.agents = state.agents.map(agent=>({...agent,status:agent.status==="执行中"?"等待":agent.status})); saveState(); toast("所有执行中的 Agent 已安全暂停", "success"); renderShell(); }
function showStartAgent() { showSimpleForm("启动 Agent", [{label:"Agent",id:"agent",type:"select",options:state.agents.map(a=>a.name)},{label:"任务指令",id:"task",type:"textarea"},{label:"最大预算",id:"budget",value:"¥ 50"}], () => { closeModal(); toast("Agent Run 已创建", "success"); }); }
function showNewAgent() { showSimpleForm("创建 Agent", [{label:"Agent 名称",id:"name"},{label:"角色类型",id:"role",type:"select",options:["产品经理","架构师","前端工程师","后端工程师","测试工程师","DevOps"]},{label:"主模型",id:"model",type:"select",options:["GPT-5","GPT-5 Codex","Claude Sonnet","Gemini Pro"]},{label:"角色目标与边界",id:"prompt",type:"textarea"}], () => { closeModal(); toast("Agent 已创建，接下来可配置技能和权限", "success"); }); }
function toggleAgent(id) { const agent=state.agents.find(item=>item.id===id); if(!agent)return; if(agent.status==="执行中"){agent.status="等待";toast(`${agent.name} 已暂停`,"success");}else{showDrawer(agent.name,renderAgentRun(agent));return;} saveState(); renderShell(); }
function showAgentConfig(id) { const agent=state.agents.find(item=>item.id===id); showSimpleForm(`配置 ${agent?.name||"Agent"}`, [{label:"主模型",id:"model",type:"select",options:["GPT-5","GPT-5 Codex","Claude Sonnet","Gemini Pro"]},{label:"单次预算上限",id:"budget",value:"¥ 80"},{label:"允许工具",id:"tools",value:"文件、终端、Git、浏览器"},{label:"System Prompt",id:"prompt",type:"textarea"}], () => toast("Agent 配置已保存", "success")); }
function renderAgentRun(agent) { return `<div class="inline" style="gap:10px"><div class="agent-avatar ${agent.tone}" style="width:42px;height:42px">${agent.icon}</div><div><div class="cell-main">${agent.name}</div><div class="cell-sub">${agent.model} · 本次成本 ¥ ${agent.cost}</div></div><span style="margin-left:auto">${status(agent.status)}</span></div><div class="section-title"><h2>当前任务</h2></div><p style="color:#59677e">${agent.task}</p><div class="section-title"><h2>执行步骤</h2></div><div class="timeline">${[["读取任务与技术方案","已完成"],["搜索相关代码和依赖","已完成"],["修改 API 与数据模型",agent.status==="执行中"?"执行中":"已暂停"],["运行测试与提交代码","等待中"]].map(item=>`<div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">${item[0]}</div><div class="timeline-meta">${item[1]}</div></div>`).join("")}</div><div class="inline" style="gap:8px;margin-top:14px">${btn("人工接管","takeover","danger")}${btn("查看完整日志","run:RUN-8831","secondary")}</div>`; }

function showNewTask() { showSimpleForm("新建任务", [{label:"任务标题",id:"title"},{label:"负责人",id:"owner",type:"select",options:state.agents.map(a=>a.name)},{label:"优先级",id:"priority",type:"select",options:["P0","P1","P2"]},{label:"验收标准",id:"acceptance",type:"textarea"}], values => { state.tasks.push({id:`TASK-${207+state.tasks.length}`,title:values.title||"新研发任务",status:"todo",owner:values.owner||"全栈 Agent",priority:values.priority||"P1",points:3}); saveState(); closeModal(); renderShell(); toast("任务已创建", "success"); }); }
function showTaskDrawer(id) { const task=state.tasks.find(item=>item.id===id); if(!task)return; const statusMap={todo:"待开始",doing:"进行中",review:"待审查",done:"已完成"}; showDrawer(`${task.id} · 任务详情`, `<div class="inline" style="justify-content:space-between">${status(statusMap[task.status])}${tag(task.priority,task.priority==="P0"?"orange":"")}</div><h2 style="font-size:16px">${task.title}</h2><p style="color:#66758b">实现对应功能并满足 PRD 验收标准，提交代码、测试和变更说明。</p><div class="form-section"><div class="form-section-title">任务属性</div><div class="form-grid"><div class="field"><label>负责人</label><input class="input" value="${task.owner}"></div><div class="field"><label>工作量</label><input class="input" value="${task.points} SP"></div></div></div><div class="form-section"><div class="form-section-title">验收标准</div><ul style="color:#5b6980"><li>功能行为符合 PRD 和技术方案。</li><li>单元和接口测试全部通过。</li><li>无阻断级安全或代码质量问题。</li></ul></div><div class="inline" style="gap:8px"><button class="btn btn-primary" id="advance-task">推进到下一状态</button><button class="btn btn-secondary" id="assign-agent">重新分配</button></div>`); document.querySelector("#advance-task").onclick=()=>{ const order=["todo","doing","review","done"]; task.status=order[Math.min(order.indexOf(task.status)+1,3)]; saveState(); closeModal(); renderShell(); toast("任务状态已更新", "success"); }; document.querySelector("#assign-agent").onclick=()=>toast("已打开 Agent 分配器"); }

function runTests() { state.testRun.running=true; state.testRun.progress=12; renderShell(); toast("测试运行已启动", "success"); let ticks=0; const timer=setInterval(()=>{ ticks++; state.testRun.progress=Math.min(100,state.testRun.progress+22); if(state.page==="tests") renderShell(); if(state.testRun.progress>=100||ticks>=5){clearInterval(timer);state.testRun.running=false;state.testRun.progress=100;state.testRun.passed=190;state.testRun.failed=2;if(state.page==="tests")renderShell();toast("测试完成：190 通过，2 失败", "success");}},700); }
function showPullRequest() { showDrawer("PR #128 · 供应商适配层与配置管理", `<div class="inline" style="gap:8px">${status("待审查")}${tag("12 个文件","blue")}${tag("+842","green")}</div><div class="section-title"><h2>合并门禁</h2></div>${[["构建通过",true],["单元测试通过",true],["API 测试通过",true],["无阻断安全问题",false],["至少 1 人批准",false]].map(item=>`<div class="agent-row"><div class="agent-avatar ${item[1]?'green':'orange'}">${item[1]?'✓':'!'}</div><div class="agent-copy"><div class="agent-name">${item[0]}</div></div>${status(item[1]?'通过':'等待')}</div>`).join("")}<button class="btn btn-primary" style="width:100%;margin-top:15px" disabled>合并 Pull Request</button>`); }
function showCreatePullRequest() { showSimpleForm("创建 Pull Request", [{label:"标题",id:"title",value:"feat: 完成供应商适配与配置管理"},{label:"源分支",id:"source",value:"feature/provider-adapter"},{label:"目标分支",id:"target",value:"main"},{label:"变更说明",id:"description",type:"textarea"}], () => toast("Pull Request 已创建并触发 CI", "success")); }

function showDeployModal() { showModal("发布新版本", `<div class="info-strip">发布单已自动汇总 3 个 PR、193 项测试和 1 个数据库迁移。</div><div class="form-grid" style="margin-top:14px"><div class="field"><label>目标环境</label><select id="deploy-env" class="select"><option>预发布环境</option><option>生产环境</option></select></div><div class="field"><label>版本号</label><input class="input" value="v1.6.0-rc.4"></div><div class="field full"><label>发布策略</label><select class="select"><option>滚动发布</option><option>灰度 10%</option><option>蓝绿发布</option></select></div><div class="field full"><label>发布说明</label><textarea class="textarea">新增供应商适配层、配置管理和回调幂等处理。</textarea></div></div><label><input type="checkbox" checked> 发布后自动执行健康检查和冒烟测试</label>`, `${btn("取消","close","secondary")}${btn("确认发布","confirm-deploy","primary")}`); document.querySelector("[data-action='close']").onclick=closeModal; document.querySelector("[data-action='confirm-deploy']").onclick=()=>{closeModal();state.deployment.status="部署中";saveState();toast("发布流水线已启动", "success");setTimeout(()=>{state.deployment.status="健康";saveState();toast("预发布环境部署成功，健康检查通过", "success");},1800);}; }
function showLogDrawer(title, lines) { showDrawer(title, `<div style="padding:13px;border-radius:8px;background:#172033;color:#d9e2f1;font:10px/1.9 Consolas,monospace">${lines.map(line=>`<div>${esc(line)}</div>`).join("")}</div>`); }
function showRunDrawer(id) { showDrawer(`${id} · 执行详情`, `<div class="inline" style="justify-content:space-between">${status(id==="RUN-8819"?"失败":"执行中")}<span class="muted">Trace ID: tr_84db21</span></div><div class="section-title"><h2>步骤与工具调用</h2></div><div class="timeline">${[["加载任务上下文","读取 PRD、技术方案和相关代码"],["搜索代码引用","rg ProviderAdapter src/"],["修改文件","编辑 4 个文件，新增 186 行"],["执行测试","npm test -- provider"],["提交代码","等待测试通过"]].map(item=>`<div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">${item[0]}</div><div class="timeline-meta">${item[1]}</div></div>`).join("")}</div><div class="section-title"><h2>资源消耗</h2></div><table><tbody><tr><td>模型</td><td>GPT-5 Codex</td></tr><tr><td>Token</td><td>42,680</td></tr><tr><td>成本</td><td>¥ 12.48</td></tr></tbody></table>`); }

function toggleIntegration(id) { const connected=state.integrations[id]; if(connected){showDrawer("集成配置", `<p style="color:#5b6980">当前集成连接正常，最近同步时间：10 分钟前。</p>${btn("立即同步","sync-now","primary")}${btn("断开连接","disconnect","danger")}`);return;} state.integrations[id]=true; saveState(); toast("连接成功，正在进行首次数据同步", "success"); renderShell(); }
function showUploadModal(title, description) { showModal(title, `<div class="upload"><div><span class="upload-icon">☁</span>${description}<div class="help">点击此区域模拟选择文件</div></div></div>`, `${btn("取消","close","secondary")}${btn("确认上传","confirm-upload","primary")}`); document.querySelector("[data-action='close']").onclick=closeModal; document.querySelector("[data-action='confirm-upload']").onclick=()=>{closeModal();toast("文件已上传并开始解析", "success")}; }

function showSimpleForm(title, fields, onSubmit) {
  showModal(title, `<div class="form-grid">${fields.map(field=>`<div class="field ${field.type==="textarea"?'full':''}"><label>${field.label}</label>${field.type==="select"?`<select id="form-${field.id}" class="select">${field.options.map(option=>`<option>${option}</option>`).join("")}</select>`:field.type==="textarea"?`<textarea id="form-${field.id}" class="textarea">${field.value||""}</textarea>`:`<input id="form-${field.id}" class="input" type="${field.type||'text'}" value="${field.value||""}">`}</div>`).join("")}</div>`, `${btn("取消","form-cancel","secondary")}${btn("确认","form-submit","primary")}`);
  document.querySelector("[data-action='form-cancel']").onclick=closeModal;
  document.querySelector("[data-action='form-submit']").onclick=()=>{ const values={}; fields.forEach(field=>values[field.id]=document.querySelector(`#form-${field.id}`)?.value||""); onSubmit(values); if(document.querySelector("#modal-root").innerHTML) closeModal(); };
}
function showInviteUser() { showSimpleForm("邀请成员", [{label:"姓名",id:"name"},{label:"邮箱",id:"email",type:"email"},{label:"组织角色",id:"role",type:"select",options:["产品经理","开发工程师","测试工程师","技术负责人","访客"]},{label:"项目范围",id:"scope",type:"select",options:["AI 智能客服平台","全部项目","暂不分配"]}], () => toast("邀请邮件已发送", "success")); }
function renderRoleMatrix() { return `<table><thead><tr><th>角色</th><th>项目</th><th>代码</th><th>审查</th><th>发布</th><th>系统</th></tr></thead><tbody>${[["产品经理","管理","只读","需求","无","无"],["开发工程师","参与","读写","代码","无","无"],["技术负责人","管理","读写","技术/代码","预发","无"],["平台管理员","全部","全部","全部","生产","全部"]].map(row=>`<tr>${row.map((cell,index)=>`<td class="${index===0?'cell-main':''}">${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`; }
function renderMemberPermissions() { return `<div class="form-grid"><div class="field"><label>组织角色</label><select class="select"><option>产品经理</option><option>项目管理员</option></select></div><div class="field"><label>项目范围</label><select class="select"><option>3 个指定项目</option><option>全部项目</option></select></div><div class="field full"><label>环境权限</label><div class="inline" style="gap:15px"><label><input type="checkbox" checked> 开发</label><label><input type="checkbox" checked> 测试</label><label><input type="checkbox"> 预发布</label><label><input type="checkbox"> 生产</label></div></div></div><button class="btn btn-primary" style="margin-top:14px">保存权限</button>`; }
function renderKnowledgeDrawer() { return `<div class="inline" style="justify-content:space-between">${status("索引完成")}<span class="muted">214 篇文档</span></div><p style="color:#5b6980">包含项目 PRD、架构、任务、代码索引、测试记录和发布复盘。Agent 检索时会附带来源和版本。</p><div class="section-title"><h2>最近引用</h2></div><div class="timeline">${[["供应商适配层设计规范","架构师 Agent · 18 次引用"],["客服会话数据模型","后端 Agent · 12 次引用"],["前端组件设计规范","前端 Agent · 8 次引用"]].map(item=>`<div class="timeline-item"><i class="timeline-dot"></i><div class="timeline-title">${item[0]}</div><div class="timeline-meta">${item[1]}</div></div>`).join("")}</div>`; }
function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  renderShell();
  toast("演示数据已恢复到初始状态", "success");
}

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); showCommandPalette(); }
  if (event.key === "Escape") closeModal();
});

renderShell();
