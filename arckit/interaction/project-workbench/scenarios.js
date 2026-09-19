/* Explicit local evaluation adapter. Active only inside scenarios.html. */
(() => {
  if (new URLSearchParams(location.search).get('scenarioTools') !== 'on') return;
  const M = window.WorkModel;
  function apply(name) {
    const current = M.current();
    if (name === 'account-expired') { window.AccountPrototype.scenario('expired'); return; }
    if (name === 'account-catalog') { window.AccountPrototype.open(); window.AccountPrototype.scenario('catalog-unavailable'); return; }
    if (name === 'reset') { M.reset(); location.reload(); return; }
    if (name === 'offline') M.state.offline = true;
    if (name === 'failure') M.state.failNext = true;
    if (name === 'permission') M.state.permissionDenied = true;
    if (name === 'conflict' && current) current.revision++;
    if (name === 'recover') {
      M.state.offline = false; M.state.failNext = false; M.state.permissionDenied = false; window.AccountPrototype.scenario('recover');
    }
    if (name === 'empty') M.state.query = '没有匹配结果的测试范围';
    if (['failed', 'stopped', 'external', 'paused'].includes(name) && current) {
      current.status = 'progress'; current.mode = name;
      if (name === 'external') current.external = '等待环境负责人恢复测试环境，准备好后重新检查。';
    }
    if (name === 'loading') {
      const region = document.querySelector('.workspace');
      region.setAttribute('aria-busy', 'true');
      region.style.opacity = '.6';
      setTimeout(() => { region.removeAttribute('aria-busy'); region.style.opacity = ''; }, 700);
    }
    M.save();
    if (name !== 'loading') window.WorkPrototype.render();
  }
  window.addEventListener('message', event => {
    if (event.source !== parent || event.data?.type !== 'arcorbit-interaction-scenario') return;
    apply(event.data.name);
  });
  window.WorkScenarios = { apply };
})();
