export function normalizeChatContext(value = {}) {
 const item=x=>x && typeof x==='object' ? {id:String(x.id||'').slice(0,2000),kind:String(x.kind||''),label:String(x.label||'').slice(0,300),project_id:String(x.project_id||''),path:String(x.path||'').slice(0,2000)}:null;
 const capability=item(value?.capability);
 return {capability:capability&&['native','skill'].includes(capability.kind)?capability:null,refs:(Array.isArray(value?.refs)?value.refs:[]).slice(0,30).map(item).filter(x=>x&&['file','task'].includes(x.kind))};
}
