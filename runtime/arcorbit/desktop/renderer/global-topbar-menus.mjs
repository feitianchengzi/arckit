// Wide layouts expose the contents of the two responsive groups permanently.
// Only compact groups and the nested status popovers participate in dismissal.
export function initializeGlobalTopbarMenus({document, matchMedia}) {
  const compact = matchMedia('(max-width: 760px)');
  const groups = [...document.querySelectorAll('.global-scope-menu,.global-controls-menu')];
  const menus = [...document.querySelectorAll('.global-status-menu,.global-controls-menu,.global-scope-menu')];
  const dismissible = menu => compact.matches || !groups.includes(menu);
  function syncLayout() {
    const focused = document.activeElement;
    for (const menu of menus) if (!groups.includes(menu)) menu.open = false;
    for (const group of groups) {
      group.open = !compact.matches;
      if (group.contains(focused)) {
        if (compact.matches) group.querySelector('summary').focus();
        else if (focused === group.querySelector('summary')) group.querySelector('select,button,.global-status-menu summary')?.focus();
      }
    }
  }
  for (const menu of menus) menu.addEventListener('toggle', () => {
    if (!menu.open || !dismissible(menu)) return;
    for (const other of menus) {
      if (other !== menu && dismissible(other) && !other.contains(menu) && !menu.contains(other)) other.open = false;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const menu = menus.filter(menu => menu.open && dismissible(menu)).at(-1);
    if (!menu) return;
    event.preventDefault();event.stopImmediatePropagation();
    menu.open = false;menu.querySelector('summary').focus();
  }, true);
  document.addEventListener('click', event => {
    for (const menu of menus) if (menu.open && dismissible(menu) && !menu.contains(event.target)) menu.open = false;
  });
  compact.addEventListener('change', syncLayout);
  syncLayout();
}
