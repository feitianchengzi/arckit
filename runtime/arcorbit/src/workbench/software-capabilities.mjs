// Product capability adapters; independent from the Runtime's skill manifest.
// Existing owners remain responsible for their validation and actual side effects.
export function createSoftwareCapabilities({platform,release,product,engineering,confirm,getAccountScope}) {
  const readRelease=['files.list','files.read','files.search','git.snapshot','git.diff','git.history','execution.read'];
  const writeRelease=['files.save','git.execute','terminal.start','task.start','execution.control','artifact.open'];
  const productCommands=['create','attach','save','plan','review','accept','approve','execute','sync','writeLocal','environment'];
  const feedbackMethods={messages:'getFeedbackV2Messages',reply:'sendFeedbackV2Reply',read:'markFeedbackV2Read',ignore:'ignoreFeedbackV2',restore:'restoreFeedbackV2',update:'updateFeedbackV2',delete:'deleteFeedbackV2',convert_to_task:'convertFeedbackV2ToTask'};
  const list=()=>[
    ...platform().listActions().filter(action=>!['task.update','task.delete','task.replace_project','task.replace_project.retry_delete','task.replace_project.keep_both'].includes(action)).map(action=>({name:`platform.${action}`,description:`Workshop ${action}`,input:{...platformContract(action)},requires_confirmation:!action.endsWith('.list')&&!action.endsWith('.candidates'),scope:'current_project'})),
    ...[...readRelease,...writeRelease].map(action=>({name:`release.${action}`,description:`Release ${action}`,input:{path:'relative workspace path, where applicable',action:'operation, where applicable',input:'operation arguments',command:'task.start only',id:'execution id, where applicable'},requires_confirmation:writeRelease.includes(action),scope:'current_project'})),
    ...Object.keys(feedbackMethods).map(action=>({name:`feedback_v2.${action}`,description:`Feedback V2 ${action}`,input:{feedback_id:'feedback id in current project',content:'reply text where applicable',data:'metadata for update'},requires_confirmation:action!=='messages',scope:'current_project'})),
    {name:'product.read',description:'读取当前项目产品资料',input:{},requires_confirmation:false,scope:'current_project'},
    ...productCommands.map(action=>({name:`product.${action}`,description:`Product ${action}`,input:{patch:'product record patch for save',revision:'current record revision',plan:'接入方案 for plan',name:'new Idea name for create',kind:'product | temporary for create',action:'sync operation where applicable'},requires_confirmation:true,scope:'current_project'})),
    {name:'engineering.read',description:'读取内置技能场景配置',input:{},requires_confirmation:false,scope:'device'},
    {name:'engineering.update',description:'更新内置技能场景配置',input:{expectedRevision:'integer',scene:'chat | automation',changes:'skill selection changes'},requires_confirmation:true,scope:'device'}
  ];
  async function call(name,input,{task,scope}) {
    const capability=list().find(c=>c.name===name);if(!capability)throw new Error('软件能力未注册。');
    if(await getAccountScope()!==scope)throw new Error('账号已变化，请重新发起。');
    if(input.project_id && String(input.project_id)!==String(task.project_id))throw new Error('此能力调用超出了当前事情的项目。');
    if(input.task_id && String(input.task_id)!==String(task.id))throw new Error('此能力调用超出了当前事情。');
    if(capability.requires_confirmation && !await confirm({name,project_id:task.project_id,task_id:task.id,input}))throw new Error('用户未批准该软件操作。');
    if(await getAccountScope()!==scope)throw new Error('账号已变化。');
    const action=name.slice(name.indexOf('.')+1);
    if(name.startsWith('platform.')) {
      if(['task.update','task.delete','task.replace_project','task.replace_project.retry_delete','task.replace_project.keep_both'].includes(action))throw new Error('事情变更必须使用事情台对应命令，保留验收与并发约束。');
      // Attachment IDs do not carry project identity; check the task before forwarding.
      if(action==='task.attachment.update'||action==='task.attachment.delete') {
        const attachments=await platform().executeAction('task.attachments.list',{task_id:task.id});
        if(!Array.isArray(attachments)||!attachments.some(a=>String(a.id)===String(input.attachment_id)))throw new Error('附件不属于当前事情。');
      }
      // Other business owners retain their authenticated resource validation.
      return platform().executeAction(action,{...input,project_id:task.project_id,...(action.startsWith('task.')?{task_id:task.id}:{})});
    }
    if(name.startsWith('feedback_v2.'))return platform()[feedbackMethods[action]]({...input,project_id:task.project_id});
    if(name.startsWith('release.'))return release().command(action,{...input,project_id:task.project_id});
    if(name==='engineering.read')return engineering().snapshot();
    if(name==='engineering.update')return engineering().update(input);
    if(name.startsWith('product.')) {
      if(action==='create')return product().command(action,input);
      if(action==='attach')return product().command(action,{...input,project_id:task.project_id});
      const snapshot=await product().snapshot();
      const p=[...(snapshot.records||[]),...(snapshot.ideas||[])].find(p=>String(p.remote_project_id)===String(task.project_id));
      if(!p)throw new Error('当前项目没有可访问的产品资料绑定。');
      return action==='read'?product().detail(p.id):product().command(action,{...input,id:p.id});
    }
    throw new Error('未知软件能力。');
  }
  return {list,call};
}
function platformContract(action) {
  if(action.includes('attachment'))return {attachment_id:'existing attachment id for update/delete',type:'text | url | file for create',content:'string'};
  if(action.startsWith('task.'))return {content:'Markdown',father_id:'optional parent id',executor_id:'member id',priority:'integer',state:'task state'};
  if(action.includes('member'))return {target_user_id:'user id',role:'role supported by service',duty:'optional responsibility'};
  if(action.startsWith('feedback.'))return {feedback_id:'id for existing feedback',content:'feedback content',data:'metadata'};
  return {name:'name where applicable',description:'description where applicable',organization_id:'organization id where applicable',code:'invitation code where applicable'};
}
