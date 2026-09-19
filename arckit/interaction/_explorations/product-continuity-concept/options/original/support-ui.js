/* Reviewable simulation actions. No remote or filesystem mutations. */
(() => {
  const esc=Conversation.escape;
  const labels={vision:'产品理念',audience:'目标用户',principles:'产品原则',description:'产品说明',iterationName:'迭代名称',iterationGoal:'迭代目标',iterationTag:'关联标签'};
  const button=(id,label,primary=false)=>`<button class="button ${primary?'primary':''}" data-action="${id}">${label}</button>`;
  function action(id,p,h){
    const {modal,render,toast,ui}=h;
    if(id==='refresh-sources'){Object.assign(Support.sources(),{work:true,github:true,feedback:true});Concept.save();render();toast('已重新读取来源（模拟）');return true;}
    if(!p)return false;
    Support.defaults(p);
    const record=text=>Concept.append(p,'system',text,'',Concept.productConversation(p));
    switch(id){
      case 'review-docs':{
        if(p.docs.conflict){modal('核对仓库的新版本',`<p>你的草稿保持不变。仓库中的理念已有更新，请决定本次采用哪份内容。</p><div class="diff-row"><small>仓库最新内容</small><p>${esc(p.docs.remoteVision)}</p><small>你的草稿</small><p>${esc(p.vision)}</p></div><p>核对后仍需再次确认提交。本原型演示单字段冲突。</p>`,button('close-dialog','稍后处理')+button('use-remote-doc','采用仓库理念')+button('keep-local-doc','保留我的理念',true));return true;}
        const keys=Support.changed(p);
        modal(keys.length?'提交产品资料':'仓库资料版本',`<p>${esc(p.repo||'未关联仓库')} · 资料版本 ${p.docs.revision}</p>${keys.length?keys.map(k=>`<div class="diff-row"><strong>${labels[k]}</strong><small>仓库内容</small><p>${esc(p.docs.base?.[k]||'未填写')}</p><small>本次内容</small><p>${esc(p[k]||'未填写')}</p></div>`).join(''):'<p>当前没有待提交修改。</p>'}<details><summary>资料位置与范围</summary><p>沿用仓库资料。示意路径：product/vision.md、product/iterations.md。只提交以上变更，不包含代码、聊天记录或其他未提交文件。</p><p>资料分支可直接写入时提交；受保护分支按仓库规则走 PR，合并前保持待共享状态。</p></details>`,button('close-dialog','返回')+(keys.length?button('publish-docs','确认提交到仓库（模拟）',true):''));return true;
      }
      case 'publish-docs':{
        const error=Support.publish(p);document.querySelector('#dialog').close();render();toast(error||'产品资料已提交到仓库（模拟）');return true;
      }
      case 'keep-local-doc':case 'use-remote-doc':{
        if(id==='use-remote-doc')Concept.edit(p,'vision',p.docs.remoteVision);
        p.docs.base.vision=p.docs.remoteVision;p.docs.conflict=false;p.docs.status=Support.changed(p).length?'draft':'shared';record(id==='use-remote-doc'?'已采用仓库最新理念，其他草稿保留。':'已核对仓库变化，保留本机理念，等待提交。');Concept.emit(p.id);document.querySelector('#dialog').close();render();return true;
      }
      case 'connect-repo':modal('关联已有 GitHub 仓库',`<p>更新当前项目的仓库地址。项目成员权限与仓库写入权限分别管理。</p><label class="field"><span>仓库地址</span><input id="connect-repo-url" placeholder="https://github.com/owner/repo"></label><p>关联成功后，本机资料仍需查看差异并提交才会共享。</p>`,button('close-dialog','取消')+button('save-repo','确认关联（模拟）',true));return true;
      case 'save-repo':{
        const input=document.querySelector('#connect-repo-url'),v=input.value.trim().replace(/\/$/,'');
        if(!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(v)){input.setCustomValidity('请填写完整的 GitHub 仓库 HTTPS 地址');input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});return true;}
        if(!Support.sources().work){toast('项目服务暂不可用，稍后重试。');return true;}
        p.repo=v;p.docs.status='draft';record('已关联现有仓库（模拟）。本机资料尚未提交。');Concept.emit(p.id);document.querySelector('#dialog').close();render();return true;
      }
      case 'tag-work':modal('关联到当前迭代',`<p>为待办 #${esc(p.taskId)} 添加标签 ${esc(p.iterationTag)}，保留原有标签。</p><p>这会更新原待办。产品计划的仓库提交单独处理。</p>`,button('close-dialog','取消')+button('confirm-tag-work','确认关联（模拟）',true));return true;
      case 'confirm-tag-work':if(!Support.sources().work){toast('待办服务暂不可用，未修改标签。');return true;}if(!p.taskTags.includes(p.iterationTag))p.taskTags.push(p.iterationTag);record('当前待办已关联迭代标签（模拟）。');Concept.emit(p.id);document.querySelector('#dialog').close();render();return true;
      case 'read-feedback':if(Support.readFeedback(p)){toast('消息已读；反馈处理状态保留。');render();}return true;
      case 'reply-feedback':{
        const input=document.querySelector('#feedback-reply'),value=input.value.trim();if(!value){input.focus();return true;}if(!Support.sources().feedback){toast('反馈服务暂不可用，回复草稿已保留。');return true;}
        p.feedback.replies.push(value);p.feedback.draft='';p.feedback.unread=false;Concept.emit(p.id);render();toast('回复已发送（模拟）');return true;
      }
      case 'suggest-vision':{
        p.currentConversation=Concept.productConversation(p).id;ui().chatOpen[p.id]=true;
        p.suggestedVision=p.id==='p-ledger'?'让个人和家庭持续看清日常开支，用更少的操作建立记账习惯。':p.description||'让目标用户更轻松地完成最重要的事情。';
        Concept.append(p,'system','你请求 Agent 整理理念草稿。');Concept.append(p,'assistant','基于当前产品说明，我建议：\n'+p.suggestedVision+'\n\n这是预设模拟建议。你可以采用后修改，资料提交仍由你确认。');Concept.emit(p.id);render();
        modal('理念草稿建议',`<p>${esc(p.suggestedVision)}</p><p>采用后更新左侧本机草稿；不会立即共享。</p>`,button('close-dialog','暂不采用')+button('apply-vision','采用为草稿',true));return true;
      }
      case 'apply-vision':Concept.edit(p,'vision',p.suggestedVision,'采用 Agent 建议');document.querySelector('#dialog').close();render();return true;
    }
    return false;
  }
  window.SupportUI={action};
})();
