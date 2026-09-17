/* Local links to existing interaction projections. No production routing. */
(() => {
  const pages = [
    ['Today', '../today-workspace/default.html'], ['Chat', '../chat-workspace/default.html'],
    ['Thing', '../project-workbench/default.html'], ['Product', '../product-list/default.html'], ['Idea', '../idea-workspace/default.html'],
    ['Work', '../task-browser/default.html'], ['Automation', '../automation-workspace/default.html'],
    ['Release', '../release-workspace/default.html'], ['Operations', '../operations-workspace/default.html'],
    ['Feedback', '../platform-workspace/default.html'],
    ['Organization', '../platform-workspace/collaboration-views.html'],
    ['Engineering', '../engineering-profile/default.html']
  ];
  const navHost = window.NavigationHost || window.WorkViews;
  const activePage = navHost.page || 'Thing';
  const groups = [
    ['PERSONAL', ['Today', 'Chat', 'Thing']],
    ['PRODUCT', ['Product']],
    ['PRODUCT LIFECYCLE', ['Idea', 'Work', 'Automation', 'Release', 'Operations', 'Feedback']],
    ['ORGANIZATION', ['Organization', 'Engineering']]
  ];
  function links() {
    return groups.map(([label, titles]) => `<section class="page-nav-group" aria-label="${label}"><h2>${label}</h2>${titles.map(title => {
      const href = pages.find(page => page[0] === title)[1];
      return title === activePage
        ? `<a href="${href}" class="nav-item selected" aria-current="page">${title}</a>`
        : `<a href="${href}" class="nav-item" target="_blank" rel="noopener">${title}</a>`;
    }).join('')}</section>`).join('');
  }
  function closeMenus(returnFocus = false) {
    document.querySelectorAll('.legacy-pages').forEach(host => {
      const menu = host.querySelector('.legacy-menu');
      if (!menu.hidden && returnFocus) host.querySelector('button').focus();
      menu.hidden = true;
      host.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  }
  function menu(compact) {
    const host = document.createElement('div');
    host.className = `legacy-pages${compact ? ' compact-pages' : ''}`;
    host.innerHTML = `<button type="button" aria-expanded="false" aria-label="页面导航" class="${compact ? 'icon-button' : 'quiet'}">${compact ? navHost.icon('grid') : '页面导航'}</button><nav class="legacy-menu" aria-label="页面导航" hidden>${links()}<button type="button" data-account-open>账户与 Runtime</button></nav>`;
    host.querySelector('button').addEventListener('click', () => {
      const open = host.querySelector('.legacy-menu').hidden;
      closeMenus();
      host.querySelector('.legacy-menu').hidden = !open;
      host.querySelector('button').setAttribute('aria-expanded', String(open));
      if (open) host.querySelector('a').focus();
    });
    return host;
  }
  function attach() {
    const nav = document.querySelector('.page-navigation');
    if (nav) nav.innerHTML = links();
    document.querySelector('.top-actions')?.prepend(menu(true));
  }
  document.addEventListener('click', event => {
    if (event.target.closest('a[aria-current=page]')) { event.preventDefault(); closeMenus(); }
    if (!event.target.closest('.legacy-pages') || event.target.closest('.legacy-menu [data-action]')) closeMenus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && [...document.querySelectorAll('.legacy-menu')].some(el => !el.hidden)) {
      event.preventDefault(); event.stopImmediatePropagation(); closeMenus(true);
    }
  }, true);
  const original = navHost.render;
  navHost.render = () => { original(); attach(); };
  attach();
})();
