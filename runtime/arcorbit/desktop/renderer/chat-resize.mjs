// Local layout preferences never alter session state or interrupt a running turn.
export function installChatResize(doc) {
  const view = doc.getElementById('chatView');
  const win = doc.defaultView;
  const workspace = view.querySelector('.chat-workspace');
  const main = view.querySelector('.chat-main');
  const input = doc.getElementById('chatInput');
  const sidebar = view.querySelector('.chat-sidebar');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let width = 300, height = 90;
  try {
    width = Number(win.localStorage.getItem('arcorbit.chat.sidebarWidth')) || width;
    height = Number(win.localStorage.getItem('arcorbit.chat.inputHeight')) || height;
  } catch { /* Layout remains usable when storage is unavailable. */ }
  const widthMax = () => Math.max(220, Math.min(560, workspace.clientWidth - 360));
  const heightMax = () => Math.max(66, Math.min(420, main.clientHeight * 0.5));
  function apply() {
    if (!workspace.clientWidth) return;
    const w = clamp(width, 220, widthMax()), h = clamp(height, 66, heightMax());
    view.style.setProperty('--chat-sidebar-width', `${w}px`);
    input.style.height = `${h}px`;
    for (const [id, value, min, max] of [['chatSidebarResize', w, 220, widthMax()], ['chatComposerResize', h, 66, heightMax()]]) {
      const handle = doc.getElementById(id);
      handle.setAttribute('aria-valuenow', String(Math.round(value)));
      handle.setAttribute('aria-valuemin', String(min));
      handle.setAttribute('aria-valuemax', String(Math.round(max)));
    }
  }
  function persist() {
    try {
      win.localStorage.setItem('arcorbit.chat.sidebarWidth', String(width));
      win.localStorage.setItem('arcorbit.chat.inputHeight', String(height));
    } catch { /* Optional preference persistence. */ }
  }
  for (const [id, horizontal] of [['chatSidebarResize', true], ['chatComposerResize', false]]) {
    const handle = doc.getElementById(id);
    let drag = null;
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      drag = { id: event.pointerId, origin: horizontal ? event.clientX : event.clientY,
        size: horizontal ? sidebar.getBoundingClientRect().width : input.getBoundingClientRect().height };
      handle.setPointerCapture(event.pointerId);
      handle.classList.add('is-resizing');
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const value = drag.size + drag.origin - (horizontal ? event.clientX : event.clientY);
      if (horizontal) width = clamp(value, 220, widthMax());
      else height = clamp(value, 66, heightMax());
      apply();
    });
    const finish = () => { drag = null; handle.classList.remove('is-resizing'); persist(); };
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
    handle.addEventListener('lostpointercapture', finish);
    handle.addEventListener('keydown', event => {
      const increase = horizontal ? 'ArrowLeft' : 'ArrowUp';
      const decrease = horizontal ? 'ArrowRight' : 'ArrowDown';
      if (![increase, decrease, 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const min = horizontal ? 220 : 66, max = horizontal ? widthMax() : heightMax();
      const current = horizontal ? sidebar.getBoundingClientRect().width : input.getBoundingClientRect().height;
      const next = event.key === 'Home' ? min : event.key === 'End' ? max : clamp(current + (event.key === increase ? 20 : -20), min, max);
      if (horizontal) width = next; else height = next;
      apply(); persist();
    });
  }
  new win.ResizeObserver(apply).observe(workspace);
  apply();
}
