// Ask the renderer to resolve its own editable models before destructive window
// or account transitions. No file contents cross this control channel.
export function createChatFilesLeaveGuard(getWindow) {
  let pending;
  async function request() {
    const window = getWindow();
    if (!window || window.isDestroyed()) return true;
    if (pending) return pending;
    pending = window.webContents.executeJavaScript('Promise.resolve(globalThis.arcorbitChatFiles?.prepareLeave?.() ?? true)').then(value => value === true).catch(() => false);
    try { return await pending; } finally { pending = null; }
  }
  function install(window, {isQuitting = () => false, resumeQuit = () => window.close()} = {}) {
    let allowedClose = false, intent = 'reload';
    window.on('close', event => {
      if (isQuitting()) return;
      if (allowedClose) { allowedClose = false; return; }
      event.preventDefault(); intent = 'close';
      void request().then(allowed => {if(allowed&&!window.isDestroyed()){allowedClose=true;window.close();}else intent='reload';});
    });
    window.webContents.on('will-prevent-unload', () => {
      void request().then(allowed => {
        if(!allowed||window.isDestroyed())return;
        if(isQuitting()) resumeQuit();
        else if(intent==='close'){allowedClose=true;window.close();}else window.webContents.reload();
      });
    });
    window.webContents.on('did-finish-load', () => {intent='reload';});
  }
  return {request, install};
}
