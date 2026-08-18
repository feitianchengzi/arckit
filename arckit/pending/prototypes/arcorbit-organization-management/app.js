const organizations = [
  {
    id: "feitian", name: "飞天工作室", description: "面向 AI 原生产品开发的小型多产品团队。", role: "owner", kind: "organization",
    members: [
      { id: "glare", name: "Glare", role: "owner", joined: "2025-06-02", projects: { arcorbit: ["Owner", "产品与平台"], prism: ["Owner", "iOS / 产品"], daylight: ["Admin", "服务端"] } },
      { id: "mina", name: "Mina", role: "admin", joined: "2025-08-16", projects: { prism: ["Admin", "用户研究"], daylight: ["Member", "反馈运营"] } },
      { id: "chen", name: "陈一", role: "member", joined: "2026-01-10", projects: { arcorbit: ["Member", "Desktop"], prism: ["Member", "iOS"] } },
      { id: "zhou", name: "周屿", role: "member", joined: "2026-02-19", projects: { daylight: ["Member", "Web"] } },
      { id: "lin", name: "林夏", role: "member", joined: "2026-04-21", projects: { prism: ["Member", "设计"] } },
      { id: "qi", name: "祁远", role: "member", joined: "2026-07-07", projects: { arcorbit: ["Member", "测试"] } }
    ],
    projects: [
      { id: "arcorbit", name: "ArcOrbit", git: "feitianchengzi/arckit", local: "~/Developer/arckit", workset: true, automation: true, members: 4, role: "owner" },
      { id: "prism", name: "折光", git: "feitianchengzi/prism", local: "~/Developer/prism", workset: true, automation: true, members: 4, role: "owner" },
      { id: "daylight", name: "白昼", git: "feitianchengzi/daylight", local: "未绑定", workset: true, automation: false, members: 3, role: "admin" },
      { id: "north", name: "北辰", git: "feitianchengzi/north", local: "未绑定", workset: false, automation: false, members: 2, role: "member" }
    ]
  },
  {
    id: "lab", name: "协作实验室", description: "外部合作组织；当前账号是普通成员。", role: "member", kind: "organization", limited: true,
    members: [
      { id: "glare", name: "Glare", role: "member", joined: "2026-06-03", projects: { orbitlab: ["Member", "技术顾问"] } },
      { id: "tang", name: "唐予", role: "owner", joined: "2026-01-01", projects: { orbitlab: ["Owner", "负责人"] } },
      { id: "lu", name: "陆白", role: "admin", joined: "2026-01-08", projects: {} }
    ],
    projects: [
      { id: "orbitlab", name: "Orbit Lab", git: "partner/orbit-lab", local: "未绑定", workset: false, automation: false, members: 2, role: "member" }
    ]
  },
  {
    id: "personal", name: "个人项目", description: "不属于任何 Workshop Organization 的项目。", role: "owner", kind: "personal",
    members: [],
    projects: [
      { id: "notes", name: "Notes Playground", git: "glare/notes", local: "~/Developer/notes", workset: false, automation: false, members: 1, role: "owner" }
    ]
  }
];

const state = { organizationId: "feitian", section: "overview", selected: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const currentOrganization = () => organizations.find(item => item.id === state.organizationId);
const allProjects = () => organizations.flatMap(item => item.projects);

function render() {
  renderOrganizations();
  renderHeader();
  renderTabs();
  renderContent();
  renderWorksetLabel();
}

function renderOrganizations() {
  $("#organizationList").innerHTML = organizations.map(item => `
    <button class="organization-item ${item.id === state.organizationId ? "active" : ""}" data-organization="${item.id}" type="button">
      <i>${item.kind === "personal" ? "⌂" : item.name.slice(0, 1)}</i>
      <span><strong>${item.name}</strong><small>${item.projects.length} ${item.kind === "personal" ? "个项目" : "个可见项目"}</small></span>
      <em>${item.role}</em>
    </button>`).join("");
  $$('[data-organization]').forEach(button => button.addEventListener("click", () => {
    state.organizationId = button.dataset.organization;
    state.section = currentOrganization().kind === "personal" ? "projects" : "overview";
    state.selected = null;
    render();
    clearInspector();
  }));
}

function renderHeader() {
  const organization = currentOrganization();
  $("#organizationAvatar").textContent = organization.kind === "personal" ? "⌂" : organization.name.slice(0, 1);
  $("#organizationKind").textContent = organization.kind === "personal" ? "PERSONAL PROJECTS · NOT AN ORGANIZATION" : "ORGANIZATION";
  $("#organizationName").textContent = organization.name;
  $("#organizationDescription").textContent = organization.description;
  $("#organizationRole").textContent = organization.role[0].toUpperCase() + organization.role.slice(1);
  $("#organizationMenu").classList.toggle("hidden", organization.kind === "personal");
  $("#scopeNotice").classList.toggle("hidden", !organization.limited);
  $("#scopeNotice").textContent = organization.limited ? "你是普通组织成员：这里只显示你参与的项目。组织 owner/admin 才能查看组织全部项目。" : "";
}

function renderTabs() {
  const organization = currentOrganization();
  $("#sectionTabs").classList.toggle("hidden", organization.kind === "personal");
  $("#memberCount").textContent = organization.members.length;
  $("#projectCount").textContent = organization.projects.length;
  $$('#sectionTabs button').forEach(button => button.classList.toggle("active", button.dataset.section === state.section));
}

function renderContent() {
  const organization = currentOrganization();
  if (organization.kind === "personal") return renderPersonalProjects(organization);
  if (state.section === "members") return renderMembers(organization);
  if (state.section === "projects") return renderProjects(organization);
  renderOverview(organization);
}

function renderOverview(organization) {
  const worksetProjects = organization.projects.filter(project => project.workset).length;
  $("#contentHost").innerHTML = `
    <div class="metric-grid">
      ${metric("组织成员", organization.members.length, organization.role === "owner" ? "可管理角色与邀请" : "成员可见")}
      ${metric(organization.limited ? "我参与的项目" : "组织项目", organization.projects.length, organization.limited ? "不是组织全部项目" : "管理范围完整")}
      ${metric("当前产品集", worksetProjects, "仅本地显示范围")}
      ${metric("可自动执行", organization.projects.filter(project => project.automation && project.local !== "未绑定").length, "另受本地绑定与授权控制")}
    </div>
    <section class="panel">
      <header><div><h2>成员 × 项目全貌</h2><p>先看谁在组织中，再看每个人参与哪些产品；矩阵本身只读。</p></div><button data-open-section="members" type="button">管理成员</button></header>
      ${relationshipMatrix(organization)}
    </section>
    <section class="panel">
      <header><div><h2>组织项目</h2><p>Workshop 项目事实、本地绑定、产品集显示和 Automation 授权保持分离。</p></div><button data-open-section="projects" type="button">管理项目</button></header>
      <div class="data-list project-list">${organization.projects.map(projectRow).join("")}</div>
    </section>`;
  bindSharedRows();
  $$('[data-open-section]').forEach(button => button.addEventListener("click", () => { state.section = button.dataset.openSection; render(); }));
}

function relationshipMatrix(organization) {
  return `<table class="matrix"><thead><tr><th>组织成员</th><th>组织角色</th>${organization.projects.map(project => `<th>${project.name}</th>`).join("")}</tr></thead><tbody>${organization.members.map(member => `<tr data-member-row="${member.id}"><td><strong>${member.name}</strong>${member.id === "glare" ? " · 我" : ""}<small>加入于 ${member.joined}</small></td><td>${member.role}</td>${organization.projects.map(project => member.projects[project.id] ? `<td class="membership" title="${member.projects[project.id].join(" · ")}">●<small>${member.projects[project.id][0]}</small></td>` : '<td class="none">—</td>').join("")}</tr>`).join("")}</tbody></table>`;
}

function renderMembers(organization) {
  const canManage = ["owner", "admin"].includes(organization.role);
  $("#contentHost").innerHTML = `<section class="panel"><header><div><h2>组织成员</h2><p>组织角色与项目职责是两层关系，不互相覆盖。</p></div>${canManage ? '<button id="inviteMember" type="button">生成组织邀请</button>' : ""}</header><div class="data-list">${organization.members.map(member => `<button data-member="${member.id}" type="button"><span><strong>${member.name}${member.id === "glare" ? " · 我" : ""}</strong><small>加入于 ${member.joined}</small></span><span><strong>${Object.keys(member.projects).length} 个项目</strong><small>${Object.values(member.projects).map(value => value[1]).join(" · ") || "暂无项目职责"}</small></span><em>${member.role}</em><span>${member.id === "glare" ? "当前账号" : canManage ? "可管理" : "只读"}</span><b>›</b></button>`).join("")}</div></section>`;
  $$('[data-member]').forEach(button => button.addEventListener("click", () => showMember(button.dataset.member)));
  $("#inviteMember")?.addEventListener("click", () => openActionModal("生成组织邀请", "邀请不是直接添加成员。受邀者使用邀请码加入组织。", "生成邀请码"));
}

function renderProjects(organization) {
  const canCreate = organization.kind === "personal" || ["owner", "admin", "member"].includes(organization.role);
  $("#contentHost").innerHTML = `<section class="panel"><header><div><h2>${organization.limited ? "我参与的项目" : "组织项目"}</h2><p>${organization.limited ? "服务端不会向普通成员暴露组织全部项目。" : "组织治理范围，不受当前 Workset 裁剪。"}</p></div>${canCreate ? '<button id="createProject" type="button">创建项目</button>' : ""}</header><div class="data-list project-list">${organization.projects.map(projectRow).join("")}</div></section><section class="panel"><header><div><h2>安全加入项目</h2><p>使用 Workshop 已有邀请码加入；不调用缺少权限保护的直接加成员接口。</p></div><button id="joinProject" type="button">输入项目邀请码</button></header></section>`;
  bindSharedRows();
  $("#createProject")?.addEventListener("click", () => openActionModal(`在「${organization.name}」创建项目`, "项目在创建时确定组织归属；创建后不提供不安全的跨组织移动。", "创建项目", true));
  $("#joinProject")?.addEventListener("click", () => openActionModal("使用邀请码加入项目", "支持无效、过期、已用尽和已加入等真实服务状态。", "加入项目", true));
}

function renderPersonalProjects(organization) {
  $("#contentHost").innerHTML = `<div class="personal-empty"><span class="section-kicker">PERSONAL SCOPE</span><h2>个人项目不是组织</h2><p>这里只管理不属于任何 Workshop Organization 的项目，不显示虚假的组织成员关系。</p><button id="createPersonalProject" class="panel-action" type="button">创建个人项目</button></div><section class="panel"><header><div><h2>个人项目</h2><p>仍可绑定本地 repository、加入 Workset 和授权 Automation。</p></div></header><div class="data-list project-list">${organization.projects.map(projectRow).join("")}</div></section>`;
  bindSharedRows();
  $("#createPersonalProject").addEventListener("click", () => openActionModal("创建个人项目", "项目不归属于任何组织，创建者成为项目 owner。", "创建项目", true));
}

function projectRow(project) {
  return `<button data-project="${project.id}" type="button"><span><strong>${project.name}</strong><small>${project.git}</small></span><span><strong>${project.local}</strong><small>${project.local === "未绑定" ? "不可本地执行" : "本地工作锚点"}</small></span><em class="state-dot ${project.workset ? "" : "off"}">${project.workset ? "产品集中" : "未展示"}</em><span>${project.automation ? "Automation 已授权" : "未授权自动领取"}</span><b>›</b></button>`;
}

function bindSharedRows() {
  $$('[data-project]').forEach(button => button.addEventListener("click", () => showProject(button.dataset.project)));
  $$('[data-member-row]').forEach(row => row.addEventListener("click", () => showMember(row.dataset.memberRow)));
}

function showMember(memberId) {
  const organization = currentOrganization();
  const member = organization.members.find(item => item.id === memberId);
  if (!member) return;
  const canManage = organization.role === "owner" && member.role !== "owner";
  $("#inspector").innerHTML = `<div class="inspector-content"><header><small>ORGANIZATION MEMBER</small><h2>${member.name}</h2><p>${member.role}${member.id === "glare" ? " · 当前账号" : ""}</p></header><div class="inspector-section"><small>组织关系</small><div class="fact-row"><span>角色</span><strong>${member.role}</strong></div><div class="fact-row"><span>加入时间</span><strong>${member.joined}</strong></div><div class="fact-row"><span>参与项目</span><strong>${Object.keys(member.projects).length}</strong></div></div><div class="inspector-section"><small>项目参与</small>${Object.entries(member.projects).map(([projectId, value]) => `<button class="relation-card relation-link" data-member-project="${projectId}" type="button"><span><strong>${organization.projects.find(project => project.id === projectId)?.name || projectId}</strong><small>${value[0]} · ${value[1]}</small></span><b>查看项目 ›</b></button>`).join("") || '<p>尚未加入项目。</p>'}<p style="color:var(--muted)">成员详情只呈现已经建立的项目关系。新增关系需进入明确的项目上下文，由项目 owner/admin 创建通用邀请码。</p></div><div class="inspector-actions">${canManage ? '<button class="primary" data-inspector-action="role">调整组织角色</button>' : ""}<button class="danger" data-inspector-action="remove">${member.id === "glare" ? "退出组织" : "移出组织"}</button></div></div>`;
  $$('[data-member-project]').forEach(button => button.addEventListener("click", () => showProject(button.dataset.memberProject)));
  bindInspectorActions(member.name);
}

function showProject(projectId) {
  const project = allProjects().find(item => item.id === projectId);
  if (!project) return;
  const canInvite = ["owner", "admin"].includes(project.role);
  $("#inspector").innerHTML = `<div class="inspector-content"><header><small>PRODUCT WORKSPACE</small><h2>${project.name}</h2><p>Workshop Project · ${project.role}</p></header><div class="inspector-section"><small>四层事实</small><div class="fact-row"><span>远端项目</span><strong>${project.git}</strong></div><div class="fact-row"><span>本地绑定</span><strong>${project.local}</strong></div><div class="fact-row"><span>当前 Workset</span><strong>${project.workset ? "显示" : "不显示"}</strong></div><div class="fact-row"><span>Automation</span><strong>${project.automation ? "已授权" : "未授权"}</strong></div></div><div class="inspector-section"><small>项目成员</small><div class="fact-row"><span>成员数量</span><strong>${project.members}</strong></div><p style="color:var(--muted)">${canInvite ? "邀请会为当前项目创建通用邀请码，不会自动发送给某个成员。" : "只有项目 owner/admin 可以创建项目邀请码。"}</p></div><div class="inspector-section"><small>组织归属</small><p>项目创建后不提供普通跨组织移动；当前服务字段是临时迁移契约。</p></div><div class="inspector-actions"><button class="primary" data-inspector-action="open-work">进入产品推进</button><button data-inspector-action="edit-project">编辑项目事实</button>${canInvite ? '<button data-project-invite>邀请成员加入此项目</button>' : ""}<button data-inspector-action="binding">管理本地绑定</button></div></div>`;
  $('[data-project-invite]')?.addEventListener("click", () => openProjectInvitation(project));
  bindInspectorActions(project.name);
}

function bindInspectorActions(name) {
  $$('[data-inspector-action]').forEach(button => button.addEventListener("click", () => showToast(`${name} · ${button.textContent.trim()}（候选交互）`)));
}

function clearInspector() {
  $("#inspector").innerHTML = '<div class="empty-inspector"><span>↗</span><strong>选择成员或项目</strong><p>在不离开组织全貌的情况下查看和管理详细关系。</p></div>';
}

function metric(label, value, note) {
  return `<div class="metric"><small>${label}</small><strong>${value}</strong><span>${note}</span></div>`;
}

function renderWorksetLabel() {
  const selected = allProjects().filter(project => project.workset);
  $("#worksetLabel").textContent = `核心推进 · ${selected.length} 个产品`;
}

function openWorksetModal() {
  openModal("编辑当前产品集", "产品集只决定推进页面同时展示哪些产品，不改变组织、成员、本地绑定或 Automation 授权。", allProjects().map(project => `<label><input type="checkbox" data-workset-option="${project.id}" ${project.workset ? "checked" : ""}><span><strong>${project.name}</strong><small>${organizations.find(item => item.projects.includes(project)).name} · ${project.local}</small></span></label>`).join(""), "应用产品集", () => {
    $$('[data-workset-option]').forEach(input => { const project = allProjects().find(item => item.id === input.dataset.worksetOption); project.workset = input.checked; });
    closeModal(); render(); showToast("当前产品集已更新；组织管理范围未改变。");
  });
}

function openActionModal(title, lead, confirmLabel, input = false) {
  openModal(title, lead, input ? '<label><input type="text" placeholder="输入名称或邀请码"></label>' : '<p>实际实现将展示角色、有效期、使用次数和服务端错误状态。</p>', confirmLabel, () => { closeModal(); showToast(`${title} · 已模拟完成`); });
}

function openProjectInvitation(project) {
  const form = `
    <div class="invite-context" data-invite-project="${project.id}">
      <small>邀请加入项目</small>
      <strong>${project.name}</strong>
      <span>${project.git}</span>
    </div>
    <div class="invite-warning"><strong>这不是给某位成员的定向邀请</strong><span>系统只生成属于「${project.name}」的通用邀请码；需要你复制后自行发送。</span></div>
    <div class="invite-form-grid">
      <label><span>加入后的项目角色</span><select id="inviteRole"><option value="member">Member</option><option value="admin">Admin</option></select></label>
      <label><span>有效期</span><select id="inviteExpiry"><option value="24">24 小时</option><option value="72">3 天</option><option value="168">7 天</option><option value="0">永不过期</option></select></label>
      <label><span>最多使用次数</span><input id="inviteMaxUses" type="number" min="1" value="1"></label>
    </div>
    <p class="service-limit">当前 Workshop 尚不能查询或撤销已经生成的项目邀请。生成结果离开后无法在平台中重新找回，请先复制。</p>`;
  openModal(`邀请加入「${project.name}」`, "先确认项目和权限，再生成一次性可分享的加入凭证。", form, "生成邀请码", () => showProjectInvitationResult(project));
}

function showProjectInvitationResult(project) {
  const role = $("#inviteRole").value;
  const expiry = $("#inviteExpiry").value;
  const maxUses = Math.max(1, Number.parseInt($("#inviteMaxUses").value, 10) || 1);
  const code = `AO-${project.id.toUpperCase()}-7K4M`;
  const expiryText = expiry === "0" ? "永不过期" : `${expiry} 小时后过期`;
  $("#modalTitle").textContent = `「${project.name}」邀请已生成`;
  $("#modalBody").innerHTML = `
    <div class="invite-result" data-invite-result>
      <small>PROJECT INVITE CODE</small>
      <strong class="invite-code">${code}</strong>
      <div class="invite-result-actions"><button data-copy-code type="button">复制邀请码</button><button data-copy-link type="button">复制加入链接</button></div>
    </div>
    <div class="invite-summary"><span><small>目标项目</small><strong>${project.name}</strong></span><span><small>加入角色</small><strong>${role}</strong></span><span><small>有效范围</small><strong>${expiryText} · 最多 ${maxUses} 次</strong></span></div>
    <ol class="flow-steps"><li>复制邀请码或加入链接，并通过你选择的渠道发送。</li><li>接收者在 ArcOrbit 的“输入项目邀请码”入口完成加入。</li><li>加入成功后重新同步「${project.name}」成员；系统不会把邀请码绑定到你刚才查看的某位成员。</li></ol>
    <p class="service-limit critical"><strong>离开前请复制</strong>：当前服务没有邀请列表与撤销接口，ArcOrbit 无法重新查询、停用或追踪这个邀请码。</p>`;
  $("#confirmModal").textContent = "完成";
  $("#confirmModal").onclick = () => { closeModal(); showToast(`${project.name} · 邀请结果已关闭`); };
  $$('[data-copy-code], [data-copy-link]').forEach(button => button.addEventListener("click", () => showToast(`${project.name} · ${button.textContent.trim()}（候选交互）`)));
}

function openModal(title, lead, body, confirmLabel, onConfirm) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = `<p>${lead}</p>${body}`;
  $("#confirmModal").textContent = confirmLabel;
  $("#confirmModal").onclick = onConfirm;
  $("#modalBackdrop").classList.remove("hidden");
}

function closeModal() { $("#modalBackdrop").classList.add("hidden"); }
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.remove("hidden"); window.setTimeout(() => toast.classList.add("hidden"), 2200); }

$$('#sectionTabs button').forEach(button => button.addEventListener("click", () => { state.section = button.dataset.section; state.selected = null; render(); clearInspector(); }));
$("#worksetButton").addEventListener("click", openWorksetModal);
$("#createOrganization").addEventListener("click", () => openActionModal("创建组织", "创建者自动成为组织 owner。", "创建组织", true));
$("#joinOrganization").addEventListener("click", () => openActionModal("使用邀请码加入组织", "复用 Workshop 已有加入接口，并呈现无效、过期、已用尽和已加入状态。", "加入组织", true));
$("#organizationMenu").addEventListener("click", () => openActionModal("组织设置", "组织编辑、删除与退出根据当前 Workshop 角色开放。", "保存"));
$("#closeModal").addEventListener("click", closeModal);
$("#cancelModal").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", event => { if (event.target.id === "modalBackdrop") closeModal(); });
render();
