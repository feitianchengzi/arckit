export function registerChatFilesIpc({ ipcMain, assertMainRenderer, files }) {
  ipcMain.handle('arckit:chat-files', (event, action, input) => {
    assertMainRenderer(event);
    return files.command(action, input || {});
  });
}
