/* Local interaction settings. No model catalog or credential service is called. */
(() => {
 const M=ChatModel,dialog=document.getElementById('model-settings'),esc=ChatViews.esc;
 let owner=null;
 const options=(values,selected)=>[...new Set(values)].map(value=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(value)}</option>`).join('');
 function close(){dialog.close();document.querySelector('[data-native-action=model-settings]')?.focus({preventScroll:true})}
 function open(){
  owner=M.owner();
  dialog.innerHTML=`<div class="native-picker-heading"><strong id="model-settings-title">模型能力设置</strong><button type="button" id="model-settings-close">完成</button></div><label>模型<select id="chat-model">${options([owner.model,...(M.state.catalogUnavailable?[]:['gpt-6-astra'])],owner.model)}</select></label><label>推理级别<select id="chat-level">${options([owner.level,...(M.state.catalogUnavailable?[]:['low','medium','high','xhigh','max','ultra'])],owner.level)}</select></label><p class="native-picker-note">仅作用于当前会话，从下一条消息生效。调整后自动保存。</p>${M.state.catalogUnavailable?'<p role="status">模型清单不可用，保留当前配置。</p>':''}`;
  ChatPopup.show(dialog,'[data-native-action=model-settings]',360);document.getElementById('chat-model').focus();
 }
 dialog.addEventListener('change',e=>{
  if(!owner||owner!==M.owner())return;
  if(e.target.id==='chat-model')owner.model=e.target.value;
  if(e.target.id==='chat-level')owner.level=e.target.value;
  M.save();ChatPrototype.render();
 });
 dialog.addEventListener('click',e=>{if(e.target.id==='model-settings-close')close()});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 window.ChatModelSettings={open,close};
})();
