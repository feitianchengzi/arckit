/* Composer menus stay attached to their own trigger, including after resize. */
(() => {
 const entries=new Map();
 function position(dialog,selector,limit){
  const anchor=document.querySelector(selector);if(!anchor||!dialog.open)return;
  const r=anchor.getBoundingClientRect(),gap=8,edge=12;
  dialog.style.maxHeight=Math.max(0,Math.min(limit,r.top-gap-edge))+'px';
  dialog.style.bottom=(innerHeight-r.top+gap)+'px';
  dialog.style.left=Math.max(edge,Math.min(r.left,innerWidth-dialog.getBoundingClientRect().width-edge))+'px';
 }
 window.ChatPopup={show(dialog,selector,limit){entries.set(dialog,{selector,limit});dialog.showModal();position(dialog,selector,limit)}};
 const update=()=>entries.forEach(({selector,limit},dialog)=>position(dialog,selector,limit));
 window.addEventListener('resize',update);window.addEventListener('scroll',update,true);
 new ResizeObserver(update).observe(document.getElementById('chat-app'));
})();
