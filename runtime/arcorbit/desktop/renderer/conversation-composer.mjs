// The same interaction contract is used by free Chat and product scene Chat.
export function createConversationComposer({input,sendButton,stopButton,hint,onInput,onSend,onStop,performAction=fn=>fn()}) {
  const inputListener=()=>onInput(input.value);
  const keyListener=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!sendButton.disabled)performAction(onSend);}};
  const sendListener=()=>performAction(onSend);const stopListener=()=>performAction(onStop);
  input.addEventListener('input',inputListener);input.addEventListener('keydown',keyListener);sendButton.addEventListener('click',sendListener);stopButton.addEventListener('click',stopListener);
  return {render({draft='',hasContext=false,available=true,active=false,sending=false,stopping=false,waiting=false,allowSupplement=false,placeholder='说明你希望 Agent 帮你完成什么…'}){
    if(input.value!==draft)input.value=draft;input.disabled=!available;input.placeholder=placeholder;
    sendButton.disabled=!available||(active&&!allowSupplement)||sending||(!draft.trim()&&!hasContext);sendButton.classList.toggle('hidden',active&&!allowSupplement);
    stopButton.classList.toggle('hidden',!active);stopButton.disabled=stopping;
    sendButton.textContent=allowSupplement?'补充信息':'发送';
    stopButton.textContent=allowSupplement?'暂停并接管':'停止';
    hint.textContent=allowSupplement?'Auto 正在执行；补充信息将送入当前执行，接管后可继续讨论。':active?(waiting?'Agent 正在等待你的审批；也可以停止。':'回答进行中；停止后保留已有内容。'):'Enter 发送 · Shift+Enter 换行';
  },destroy(){input.removeEventListener('input',inputListener);input.removeEventListener('keydown',keyListener);sendButton.removeEventListener('click',sendListener);stopButton.removeEventListener('click',stopListener);}};
}
