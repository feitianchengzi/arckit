'use strict';
const data=window.visualData;
const token=key=>data.tokens[key];
const colorVar=key=>`var(--${key.replaceAll('.','-').replaceAll('_','-')})`;
const names=[['内容','semantic.canvas'],['导航','semantic.sidebar'],['文字','semantic.text'],['操作','colors.accent.base'],['完成','colors.success.base'],['待处理','colors.warning.base']];
for(const [name,key] of names){const div=document.createElement('div');div.className='swatch';const sample=document.createElement('div');sample.className='swatch-color';sample.style.background=colorVar(key);const strong=document.createElement('strong');strong.textContent=name;const code=document.createElement('code');code.textContent=key;div.append(sample,strong,code);document.querySelector('#swatches').append(div);}
const statuses=data.components.StatusPill.variants;
const labels={pending_review:'待评审',pending:'待处理',in_progress:'进行中',completed:'已完成',accepted:'已验收',cancelled:'已取消',blocked:'已阻塞'};
for(const [key,v] of Object.entries(statuses)){const pill=document.createElement('span');pill.className='pill';pill.textContent=labels[key];pill.title=key;pill.style.color=colorVar(v.foreground.slice(1,-1));pill.style.background=colorVar(v.background.slice(1,-1));if(v.border)pill.style.border=`1px solid ${colorVar(v.border.slice(1,-1))}`;document.querySelector('#statuses').append(pill);}
for(const [name,c] of Object.entries(data.components)){const item=document.createElement('details');const summary=document.createElement('summary');summary.textContent=`${name} · ${c.role}`;const spec=document.createElement('pre');spec.textContent=JSON.stringify(c,null,2);item.append(summary,spec);document.querySelector('#component-list').append(item);}
document.querySelector('#theme').addEventListener('change',e=>{document.documentElement.dataset.theme=e.target.value;document.documentElement.style.colorScheme=e.target.value==='dark'?'dark':'light';});
document.querySelectorAll('.nav-row').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.nav-row').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));}));
document.querySelector('#context').addEventListener('click',e=>{e.currentTarget.remove();document.querySelector('#draft').focus();});
document.querySelector('#send').addEventListener('click',()=>{const draft=document.querySelector('#draft');document.querySelector('#send-status').textContent=draft.value.trim()?'演示：提交失败，草稿已保留，可继续编辑。':'请先输入补充内容。';draft.focus();});
document.querySelector('#validation').textContent=`${Object.keys(data.components).length} 个组件 · ${data.contrast.length} 项 Token 对比度检查通过 · YAML 生成的样张数据`;
