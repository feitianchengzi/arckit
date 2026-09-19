/* Settings capability projection from desktop/renderer/index.html and renderer.js.
 * Local fixtures only; never calls authentication, Runtime or network services. */
(() => {
  const M = window.AccountHost || window.WorkModel;
  const dialog = document.createElement('dialog');
  dialog.id = 'account-dialog';
  dialog.setAttribute('aria-labelledby', 'account-dialog-title');
  document.body.append(dialog);
  const markup = `
<header class="dialog-heading"><div><h2 id="account-dialog-title">账户与 Runtime</h2><p>管理 Workshop 账户、任务源与本地 Runtime。</p></div><button type="button" id="accountClose" aria-label="关闭设置">×</button></header>
        <div class="settings-sections">
          <section class="codex-settings-section"><h3>工作空间</h3><div class="pw-settings-actions"><button id="workbenchSyncSettings" class="secondary-button" type="button">同步项目与事情</button><a id="workbenchFeedbackSettings" class="secondary-button" href="../product-feedback-center/default.html" target="_blank" rel="noopener">产品反馈</a></div></section>
          <section class="account-settings-section">
            <h3>Workshop 账户</h3>
            <div class="account-card">
              <div class="account-summary"><span id="authStatusPill" class="account-status logged-out">未登录</span><div><strong id="authIdentity">登录后同步你的项目和待办</strong><small id="authDescription">验证码和令牌仅由主进程处理。</small></div></div>
              <div id="authLoginPanel" class="auth-form">
                <div class="auth-type" role="group" aria-label="验证码类型"><button class="auth-type-button is-active" data-auth-type="email" type="button">邮箱</button><button class="auth-type-button" data-auth-type="sms" type="button">手机号</button></div>
                <label class="field"><span id="authTargetLabel">邮箱</span><input id="authTarget" type="text" autocomplete="username" placeholder="name@example.com"></label>
                <div class="verification-row"><label class="field"><span>验证码</span><input id="authCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="输入验证码"></label><button id="sendVerificationButton" class="secondary-button" type="button">获取验证码</button></div>
                <button id="loginButton" class="primary-button" type="button">登录并同步</button>
              </div>
              <div id="authSessionPanel" class="auth-session hidden"><button id="logoutButton" class="secondary-button" type="button">退出登录</button></div>
              <p id="authFeedback" class="auth-feedback" aria-live="polite"></p>
            </div>
            <details class="settings-advanced">
              <summary>高级任务源设置</summary>
              <div class="settings-advanced-content"><label class="toggle-row"><input id="taskSourceEnabled" type="checkbox"><span><strong>启用任务源</strong><small>通过主进程同步当前用户项目与待办</small></span></label><label class="field"><span>服务根地址</span><input id="taskSourceBaseUrl" type="url" placeholder="https://api.feitianchengzi.com"></label><div class="field-grid"><label class="field"><span>服务名</span><input id="taskSourceServiceName" type="text" placeholder="workshop"></label><label class="field"><span>认证模式</span><select id="taskSourceAuthMode"><option value="nebula">Workshop 登录</option><option value="bearer">Bearer Token（调试）</option><option value="headers">用户请求头（调试）</option></select></label></div><div id="tokenAuthFields"><label class="field"><span>访问令牌</span><input id="taskSourceToken" type="password" placeholder="保留为空则不修改现有令牌"></label></div><div id="headerAuthFields" class="field-grid"><label class="field"><span>用户 ID</span><input id="taskSourceUserId" type="text"></label><label class="field"><span>用户名</span><input id="taskSourceUsername" type="text"></label><label class="field"><span>App ID</span><input id="taskSourceAppId" type="text"></label><label class="field"><span>Session ID</span><input id="taskSourceSessionId" type="text"></label></div></div>
            </details>
          </section>
          <section class="codex-settings-section"><h3>Codex Runtime</h3>
            <label class="toggle-row"><input id="codexYoloMode" type="checkbox"><span><strong>YOLO 模式</strong><small>跳过命令审批并解除 Codex 沙箱限制。覆盖各处 Agent 调用，应用业务确认仍然有效。</small></span></label>
            <p class="settings-lead">默认关闭。保存后用于后续消息、新 Run 和终端接力；正在执行的调用保持原配置。</p>
            <h4>Chat 默认值</h4><div class="field-grid">
              <label class="field"><span>Model</span><input id="codexChatModel" type="text" list="codexChatModelOptions" maxlength="200" autocomplete="off" aria-describedby="codexCatalogFeedback"><datalist id="codexChatModelOptions"></datalist></label>
              <label class="field"><span>Level（推理级别）</span><input id="codexChatEffort" type="text" list="codexChatEffortOptions" maxlength="200" autocomplete="off" aria-describedby="codexCatalogFeedback"><datalist id="codexChatEffortOptions"></datalist></label>
            </div>
            <h4>Automation 默认值</h4><div class="field-grid">
              <label class="field"><span>Model</span><input id="codexAutomationModel" type="text" list="codexAutomationModelOptions" maxlength="200" autocomplete="off" aria-describedby="codexCatalogFeedback"><datalist id="codexAutomationModelOptions"></datalist></label>
              <label class="field"><span>Level（推理级别）</span><input id="codexAutomationEffort" type="text" list="codexAutomationEffortOptions" maxlength="200" autocomplete="off" aria-describedby="codexCatalogFeedback"><datalist id="codexAutomationEffortOptions"></datalist></label>
            </div>
            <p class="settings-lead">两种场景分别默认为 gpt-6-astra / high。Chat 默认值用于新对话；当前对话可在输入框旁单独调整。Automation 默认值用于下一次 Run，正在运行的任务保持启动时配置。</p>
            <p id="codexCatalogFeedback" class="auth-feedback" role="status" aria-live="polite"></p>
            <div class="settings-actions"><button id="refreshCodexModelsButton" class="secondary-button" type="button">刷新清单</button><button id="saveCodexSettingsButton" class="primary-button" type="button">保存 Codex 配置</button></div>
            <p id="codexSettingsFeedback" class="auth-feedback" role="status" aria-live="polite"></p>
            <label class="toggle-row"><input id="codexProxyEnabled" type="checkbox"><span><strong>使用代理</strong><small>仅注入新启动的 Codex app-server run</small></span></label><label class="field"><span>代理地址</span><input id="codexProxyUrl" type="text" placeholder="http://127.0.0.1:7890"></label></section>
        </div>
        <div class="settings-actions"><button id="saveSettingsButton" class="primary-button" type="button">保存并同步</button></div>
<p id="accountResult" role="status" aria-live="polite"></p>
<section id="logoutConfirmation" hidden><h3>退出 Workshop？</h3><p id="logoutImpact"></p><button type="button" id="cancelLogout">取消</button><button type="button" id="confirmLogout">确认退出</button></section>`;
  const defaults = {
    taskSourceEnabled: true, taskSourceBaseUrl: 'https://api.feitianchengzi.com',
    taskSourceServiceName: 'workshop', taskSourceAuthMode: 'nebula',
    taskSourceUserId: '', taskSourceUsername: '', taskSourceAppId: '',
    codexYoloMode: false, codexChatModel: 'gpt-6-astra', codexChatEffort: 'high',
    codexAutomationModel: 'gpt-6-astra', codexAutomationEffort: 'high',
    codexProxyEnabled: false, codexProxyUrl: 'http://127.0.0.1:7890'
  };
  const codexFields = ['codexYoloMode', 'codexChatModel', 'codexChatEffort', 'codexAutomationModel', 'codexAutomationEffort'];
  let authenticated = true, expired = false, authType = 'email', opener, epoch = 0, cooldown = 0, cooldownTimer, busy = false;
  const q = id => dialog.querySelector('#' + id);
  const wait = () => new Promise(resolve => setTimeout(resolve, 280));
  function setStatus(id, text) { q(id).textContent = text; }
  function authView() {
    q('authLoginPanel').classList.toggle('hidden', authenticated);
    q('authSessionPanel').classList.toggle('hidden', !authenticated);
    q('authStatusPill').textContent = authenticated ? '已登录' : expired ? '登录已过期' : '未登录';
    q('authIdentity').textContent = authenticated ? 'Glare' : expired ? '请重新登录 Workshop' : '登录后同步你的项目和待办';
    q('authDescription').textContent = authenticated ? '项目和待办将按当前账户同步。' : '验证身份后恢复项目与待办同步。';
    q('authTargetLabel').textContent = authType === 'email' ? '邮箱' : '手机号';
    q('authTarget').placeholder = authType === 'email' ? 'name@example.com' : '+86 13800000000';
    dialog.querySelectorAll('[data-auth-type]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.authType === authType)));
    q('accountClose').hidden = !authenticated && !expired;
    q('sendVerificationButton').textContent = cooldown ? `${cooldown} 秒后重试` : '获取验证码';
    q('sendVerificationButton').disabled = busy || cooldown > 0;
    dialog.classList.toggle('account-login-gate', !authenticated && !expired);
  }
  function authMode() {
    q('tokenAuthFields').hidden = q('taskSourceAuthMode').value !== 'bearer';
    q('headerAuthFields').hidden = q('taskSourceAuthMode').value !== 'headers';
  }
  function efforts() {
    for (const name of ['Chat', 'Automation']) {
      const list = q(`codex${name}EffortOptions`);
      list.innerHTML = q(`codex${name}Model`).value === 'gpt-6-astra'
        ? ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'].map(value => `<option value="${value}"></option>`).join('') : '';
    }
  }
  async function catalog() {
    const generation = epoch;
    q('refreshCodexModelsButton').disabled = true;
    setStatus('codexCatalogFeedback', '正在获取 Codex 清单；仍可编辑和保存。');
    await wait();
    if (generation !== epoch || !dialog.open) return;
    const unavailable = M.state.offline || M.state.accountCatalogUnavailable;
    for (const name of ['Chat', 'Automation']) q(`codex${name}ModelOptions`).innerHTML = unavailable ? '' : '<option value="gpt-6-astra"></option>';
    efforts();
    if (unavailable) for (const name of ['Chat', 'Automation']) q(`codex${name}EffortOptions`).innerHTML = '';
    setStatus('codexCatalogFeedback', unavailable ? '暂无可用清单；当前输入保留，可手动保存或重试。' : '已获取候选；Level 候选随 Model 更新，当前输入保持不变。');
    q('refreshCodexModelsButton').disabled = false;
  }
  function open() {
    if (dialog.open) return;
    opener = document.activeElement; epoch++;
    dialog.innerHTML = markup;
    const saved = { ...defaults, ...M.state.accountSettings };
    for (const [id, value] of Object.entries(saved)) {
      const input = q(id); if (!input) continue;
      if (input.type === 'checkbox') input.checked = value; else input.value = value;
    }
    q('taskSourceToken').placeholder = M.state.accountTokenConfigured ? '已配置；保留为空不修改' : '输入访问令牌';
    authView(); authMode();
    dialog.showModal();
    if (authenticated) catalog(); else q('authTarget').focus();
  }
  function close() {
    if ((!authenticated && !expired) || busy) return;
    epoch++; dialog.close(); dialog.innerHTML = '';
    const target = opener?.isConnected ? opener : document.querySelector('.account-trigger');
    target?.focus({ preventScroll: true });
  }
  function read(ids) {
    return Object.fromEntries(ids.map(id => [id, q(id).type === 'checkbox' ? q(id).checked : q(id).value.trim()]));
  }
  function validateCodex(value) {
    for (const id of codexFields.slice(1)) if (!value[id] || value[id].length > 200) throw new Error('Model 和 Level 需为 1–200 个字符的非空文本；输入已保留。');
  }
  async function action(status, operation) {
    if (busy) return;
    busy = true;
    const controls = [...dialog.querySelectorAll('input,select,button')];
    const disabled = controls.map(el => el.disabled);
    controls.forEach(el => el.disabled = true);
    setStatus(status, '正在处理…');
    try {
      await wait();
      if (M.state.failNext) { M.state.failNext = false; throw new Error('操作失败，输入已保留，请重试。'); }
      await operation();
    } catch (error) { setStatus(status, error.message); }
    finally {
      busy = false;
      controls.forEach((el, i) => el.disabled = disabled[i]);
      if (dialog.open) authView();
    }
  }
  async function save(all) {
    const value = read(all ? Object.keys(defaults) : codexFields);
    const tokenEntered = q('taskSourceToken').value.trim();
    return action(all ? 'accountResult' : 'codexSettingsFeedback', () => {
      validateCodex(value);
      if (all) {
        if (!/^https?:\/\//.test(value.taskSourceBaseUrl) || !value.taskSourceServiceName) throw new Error('请填写有效服务根地址和服务名；输入已保留。');
        if (value.codexProxyEnabled && !/^(https?|socks5):\/\//.test(value.codexProxyUrl)) throw new Error('请填写有效代理地址；输入已保留。');
        // Token and session values never enter fixture persistence.
        if (tokenEntered) M.state.accountTokenConfigured = true;
      }
      M.state.accountSettings = { ...defaults, ...M.state.accountSettings, ...value }; M.save();
      if (all) {
        q('taskSourceToken').value = ''; q('taskSourceSessionId').value = '';
        setStatus('accountResult', M.state.offline ? '设置已保存，但任务同步未完成。恢复连接后可重试同步。' : '设置已保存并完成同步。');
      } else setStatus('codexSettingsFeedback', '已保存。新对话使用 Chat 默认值，下一次 Run 使用 Automation 默认值；YOLO 用于后续调用，活动调用保持原配置。');
    });
  }
  function confirmLogout() {
    return action('authFeedback', () => {
      if (M.state.offline) throw new Error('退出失败，请恢复连接后重试；当前账户保留。');
      for (const task of M.state.tasks) if (['auto', 'queued'].includes(task.mode)) task.mode = 'stopped';
      authenticated = false; expired = false; q('logoutConfirmation').hidden = true;
      q('authCode').value = ''; q('taskSourceToken').value = ''; q('taskSourceSessionId').value = '';
      setStatus('authFeedback', '已退出 Workshop，请重新登录。');
      authView(); q('authTarget').focus();
    });
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-account-open]')) {
      document.querySelectorAll('.legacy-menu').forEach(el => el.hidden = true);
      document.querySelectorAll('.legacy-pages > button').forEach(el => el.setAttribute('aria-expanded', 'false'));
      open();
    }
  });
  dialog.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (event.target === dialog) { close(); return; }
    if (!button) return;
    if (button.dataset.authType) { authType = button.dataset.authType; authView(); return; }
    switch (button.id) {
      case 'accountClose': close(); break;
      case 'refreshCodexModelsButton': catalog(); break;
      case 'saveCodexSettingsButton': save(false); break;
      case 'saveSettingsButton': save(true); break;
      case 'workbenchSyncSettings': action('accountResult', () => {
        if (M.state.offline) throw new Error('同步失败，已有内容保留。恢复连接后重试。');
        setStatus('accountResult', '项目与事情已同步。');
      }); break;
      case 'logoutButton': {
        const active = M.state.tasks.filter(t => t.mode === 'auto');
        if (!active.length) { confirmLogout(); break; }
        q('logoutImpact').textContent = `退出会安全停止 ${active.length} 条活动执行，并清空远端项目快照。`;
        q('logoutConfirmation').hidden = false; q('cancelLogout').focus(); break;
      }
      case 'cancelLogout': q('logoutConfirmation').hidden = true; q('logoutButton').focus(); break;
      case 'confirmLogout': confirmLogout(); break;
      case 'sendVerificationButton': action('authFeedback', () => {
        const target = q('authTarget').value.trim();
        if (authType === 'email' ? !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target) : !/^\+?[\d\s]{6,20}$/.test(target)) throw new Error('请填写有效的邮箱或手机号。');
        if (M.state.offline) throw new Error('验证码发送失败，请恢复连接后重试。');
        cooldown = 60; setStatus('authFeedback', '验证码已发送至目标账户。');
        clearInterval(cooldownTimer);
        cooldownTimer = setInterval(() => { cooldown = Math.max(0, cooldown - 1); if (dialog.open) authView(); if (!cooldown) clearInterval(cooldownTimer); }, 1000);
      }); break;
      case 'loginButton': action('authFeedback', () => {
        if (!q('authTarget').value.trim() || q('authCode').value !== '123456') throw new Error('账号或验证码不正确，请检查后重试。');
        if (M.state.offline) throw new Error('登录失败，请恢复连接后重试。');
        authenticated = true; expired = false; q('authCode').value = '';
        setStatus('authFeedback', '登录成功，已同步项目与待办。'); authView(); catalog();
      }); break;
    }
  });
  dialog.addEventListener('change', event => { if (event.target.id === 'taskSourceAuthMode') authMode(); });
  dialog.addEventListener('input', event => { if (/^codex(Chat|Automation)Model$/.test(event.target.id)) efforts(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  document.addEventListener('keydown', event => {
    if (dialog.open && event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation();
      if (!q('logoutConfirmation').hidden) { q('logoutConfirmation').hidden = true; q('logoutButton').focus(); }
      else close();
    }
  }, true);
  window.AccountPrototype = { open, scenario(name) {
    if (name === 'expired') { authenticated = false; expired = true; if (!dialog.open) open(); authView(); }
    if (name === 'catalog-unavailable') { M.state.accountCatalogUnavailable = true; if (dialog.open) catalog(); }
    if (name === 'recover') { M.state.accountCatalogUnavailable = false; if (dialog.open && authenticated) catalog(); }
  }};
})();
