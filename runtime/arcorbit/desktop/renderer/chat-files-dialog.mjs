export const fileEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createFileDialog() {
  const node = document.createElement('dialog'); node.className = 'chat-file-dialog'; document.body.append(node);
  let finish, busy = false;
  function close(value) { node.close(); node.replaceChildren(); const done = finish; finish = null; done?.(value); }
  node.addEventListener('cancel', e => {e.preventDefault(); if (!busy) close(false);});
  async function show({title, body = '', actions}) {
    if (node.open) throw Error('请先完成当前文件操作。');
    const focus = document.activeElement;
    node.innerHTML = `<form><h2>${fileEscape(title)}</h2>${body}<p role="alert"></p><footer><button type="button" data-cancel>取消</button>${actions.map((a,i)=>`<button type="${i===0?'submit':'button'}" data-choice="${i}">${fileEscape(a.label)}</button>`).join('')}</footer></form>`;
    const run = async index => {
      if (busy) return; busy = true; node.querySelectorAll('button').forEach(b => b.disabled = true);
      try { await actions[index].run(new FormData(node.querySelector('form'))); close(true); }
      catch (e) { node.querySelector('[role="alert"]').textContent = e.message; }
      finally { busy = false; node.querySelectorAll('button').forEach(b => b.disabled = false); }
    };
    node.querySelector('[data-cancel]').onclick = () => close(false);
    node.querySelector('form').onsubmit = e => {e.preventDefault(); void run(0);};
    node.querySelectorAll('[data-choice]').forEach(b => {if(b.type !== 'submit') b.onclick = () => void run(Number(b.dataset.choice));});
    const result = new Promise(resolve => {finish = resolve;}); node.showModal(); (node.querySelector('input') || node.querySelector('button')).focus();
    const value = await result; if (focus?.isConnected) focus.focus({preventScroll:true}); return value;
  }
  return {show, isOpen: () => node.open};
}
