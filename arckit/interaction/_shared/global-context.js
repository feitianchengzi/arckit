/* Shared local prototype state. No business service or runtime calls. */
(() => {
  const key='arcorbit-global-prototype-v1';
  const projects=[{id:'orbit',name:'ArcOrbit'},{id:'feedback',name:'Feedback'},{id:'todo',name:'Workshop Todo'}];
  const sets=[{id:'team',name:'团队产品',ids:['orbit','feedback','todo']},{id:'personal',name:'个人产品',ids:['orbit']},{id:'empty',name:'空产品集',ids:[]}];
  const defaultMembers=Object.fromEntries(sets.map(s=>[s.id,[...s.ids]]));
  const pages=[['Today','today-workspace'],['Chat','chat-workspace'],['Thing','project-workbench'],['Product','product-list'],['Idea','idea-workspace'],['Work','task-browser'],['Automation','automation-workspace'],['Release','release-workspace'],['Operations','operations-workspace'],['Feedback','platform-workspace'],['Organization','platform-workspace/collaboration-views.html'],['Engineering','engineering-profile']];
  const initial=()=>({version:1,set:'team',project:'all',sync:'none',time:null,enabled:false,paused:false,selections:{},drafts:{},runs:[{id:'103',project:'feedback',title:'修复反馈图片加载',phase:'running'}]});
  let state;try{state=JSON.parse(localStorage.getItem(key));}catch{}if(state?.version!==1)state=initial();
  for(const set of sets)if(Array.isArray(state.setMembers?.[set.id]))set.ids=state.setMembers[set.id].filter(id=>projects.some(p=>p.id===id));
  const listeners=new Set(),before=new Set();
  const save=()=>localStorage.setItem(key,JSON.stringify(state));
  const scopeKey=()=>state.set+':'+state.project;
  const ids=()=>sets.find(x=>x.id===state.set).ids.filter(id=>state.project==='all'||state.project===id);
  const includes=id=>ids().includes(id);
  const emit=()=>{save();listeners.forEach(fn=>fn());};
  function change(project,set=state.set){before.forEach(fn=>fn());state.set=sets.some(s=>s.id===set)?set:'team';state.project=sets.find(s=>s.id===state.set).ids.includes(project)?project:'all';emit();}
  const href=page=>'../'+(pages.find(p=>p[0]===page)?.[1]||'product-list')+(page==='Organization'?'':'/default.html');
  function select(page,items,current){const stored=state.selections[page+':'+scopeKey()];return items.find(x=>x.id===current)?.id||items.find(x=>x.id===stored)?.id||items[0]?.id||'';}
  function remember(page,id){state.selections[page+':'+scopeKey()]=id||'';save();}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.GlobalContext={projects,sets,pages,key,get state(){return state;},scopeKey,ids,includes,change,select,remember,save,emit,href,esc,on:fn=>listeners.add(fn),before:fn=>before.add(fn),reset(){state=initial();sets.forEach(s=>s.ids=[...defaultMembers[s.id]]);emit();}};
})();
