#!/usr/bin/env python3
"""
DDD 依赖关系图生成器 — 完全对齐参考 HTML「架构可视化 Demo」设计风格 v0.3.0

用途：根据输入的 JSON 数据（子域/限界上下文/聚合/关系），生成交互式 HTML 依赖关系图。

参数：
  --input   输入 JSON 文件路径（必需），包含 subdomains/contexts/aggregates/relations 等字段
  --output  输出 HTML 文件路径（默认 ddd-dependency-graph.html）

输出：
  - 单个 HTML 文件，内嵌 CSS/JS，浏览器直接打开即可交互查看战略/战术依赖关系
"""
import json, sys, argparse

HTML = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DDD 领域依赖关系图</title>
<style>
:root{
  --bg:#f6f8fc;--panel:#ffffff;--card:#f4f6fb;--outline:#e2e8f0;
  --accent:#2ecf9c;--accent-2:#6b8cff;--accent-3:#f39c5a;
  --text:#1f2a44;--muted:#627086;--danger:#e76f7b;--success:#22b07d;--warning:#f5a524;
  --shadow:0 20px 45px rgba(15,23,42,0.08);--radius:14px;--radius-sm:8px;
  --font:"Avenir Next","Segoe UI Variable","Helvetica Neue","Segoe UI",system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
}
*{box-sizing:border-box;}
body{
  margin:0;padding:32px;font-family:var(--font);
  background:
    radial-gradient(circle at 20% 20%,rgba(46,207,156,.14),transparent 30%),
    radial-gradient(circle at 80% 10%,rgba(107,140,255,.15),transparent 26%),
    radial-gradient(circle at 30% 80%,rgba(243,156,90,.12),transparent 28%),
    var(--bg);
  color:var(--text);min-height:100vh;
}
main{max-width:1400px;margin:0 auto;display:grid;gap:18px;}
/* hero */
header.hero{
  background:linear-gradient(135deg,rgba(46,207,156,.12),rgba(107,140,255,.12));
  border:1px solid var(--outline);border-radius:18px;padding:22px 24px;
  position:relative;overflow:hidden;box-shadow:var(--shadow);
}
header.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.05),transparent 40%);pointer-events:none;}
.hero h1{margin:0 0 6px;font-size:26px;letter-spacing:.2px;}
.hero p{margin:0;color:var(--muted);max-width:840px;line-height:1.6;}
/* grid */
.grid{display:grid;grid-template-columns:360px 1fr;gap:16px;align-items:start;}
/* panel & board shared */
.panel,.board,.layer{background:var(--panel);border:1px solid var(--outline);border-radius:var(--radius);box-shadow:var(--shadow);}
.panel{padding:18px;position:sticky;top:18px;}
.panel h3{margin:0 0 8px;font-size:15px;letter-spacing:.3px;text-transform:uppercase;color:#2f3d57;}
.control-group{margin-bottom:14px;}
.control-group:last-child{margin-bottom:0;}
/* btn */
.btn{border:1px solid var(--outline);background:linear-gradient(135deg,rgba(94,240,198,.12),rgba(128,167,255,.12));
  color:var(--text);padding:10px 12px;border-radius:var(--radius-sm);cursor:pointer;
  transition:all .2s;font-weight:600;letter-spacing:.3px;font-family:var(--font);}
.btn:hover{transform:translateY(-1px);border-color:rgba(94,240,198,.6);}
.btn.secondary{background:var(--card);color:var(--muted);}
.stack{display:flex;gap:8px;flex-wrap:wrap;}
/* pill & legend */
.pill{padding:6px 10px;border-radius:999px;font-size:12px;border:1px solid var(--outline);color:var(--text);
  background:var(--card);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.legend{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;}
.dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
/* view toggle */
.view-toggle{display:inline-flex;background:var(--card);border-radius:999px;border:1px solid var(--outline);overflow:hidden;}
.view-toggle button{border:none;background:transparent;padding:10px 14px;color:var(--muted);cursor:pointer;
  font-weight:600;letter-spacing:.2px;font-family:var(--font);transition:all .2s;}
.view-toggle button.active{color:var(--text);background:rgba(94,240,198,.14);}
/* board */
.board{padding:18px;background:var(--panel);position:relative;}
.board-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
.summary{border:1px solid var(--outline);background:var(--card);padding:12px 14px;border-radius:var(--radius-sm);color:var(--muted);line-height:1.5;}
.progress{height:6px;border-radius:999px;background:#e8edf5;overflow:hidden;margin-top:6px;}
.progress span{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-2));border-radius:999px;box-shadow:0 0 12px rgba(94,240,198,.3);transition:width .4s;}
/* architecture */
.architecture{display:grid;gap:12px;}
.layer{padding:14px;position:relative;overflow:visible;z-index:1;}
.layer h4{margin:0 0 10px;font-size:14px;letter-spacing:.4px;text-transform:uppercase;color:#2f3d57;display:flex;align-items:center;gap:8px;}
.layer .side{font-size:11px;color:var(--muted);background:#eef2f7;padding:3px 8px;border-radius:999px;border:1px solid var(--outline);}
.modules{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;}
/* module */
.module{border:1px solid var(--outline);background:#fdfefe;border-radius:var(--radius-sm);padding:12px;
  position:relative;z-index:3;overflow:hidden;transition:all .2s;min-height:130px;}
.module h5{margin:0 0 6px;font-size:15px;letter-spacing:.2px;color:var(--text);}
.module p{margin:0 0 8px;font-size:12px;color:var(--muted);line-height:1.5;}
.module .io{display:flex;gap:8px;flex-wrap:wrap;}
.module .io span{font-size:11px;color:var(--text);border:1px dashed var(--outline);padding:4px 7px;border-radius:8px;background:#eef2f7;}
.module .methods{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;}
.module .methods span{background:rgba(46,207,156,.12);color:var(--text);font-size:11px;padding:4px 7px;border-radius:6px;border:1px solid rgba(46,207,156,.32);}
.module:hover{transform:translateY(-1px);border-color:rgba(128,167,255,.3);}
.module.selected{border-color:rgba(46,207,156,.55);box-shadow:0 0 0 2px rgba(46,207,156,.18);}
/* impact badge */
.impact{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;gap:5px;
  font-size:11px;padding:4px 8px;border-radius:999px;font-weight:700;letter-spacing:.3px;border:1px solid var(--outline);}
.impact.core{background:rgba(251,191,36,.14);color:#92400e;border-color:rgba(251,191,36,.45);}
.impact.support{background:rgba(107,140,255,.14);color:#2c3a9c;border-color:rgba(107,140,255,.45);}
.impact.generic{background:rgba(148,163,184,.14);color:#445566;border-color:rgba(148,163,184,.45);}
.impact.aggregate{background:rgba(46,207,156,.14);color:#065f46;border-color:rgba(46,207,156,.45);}
.impact-note{font-size:12px;color:var(--text);background:rgba(31,42,68,.04);padding:6px 8px;border-radius:8px;border:1px solid var(--outline);margin-top:6px;line-height:1.4;}
/* svg overlay */
.link-layer{position:absolute;inset:0;pointer-events:none;overflow:visible;width:100%;height:100%;mix-blend-mode:normal;z-index:2;}
.link-layer .dep-line{stroke:rgba(107,140,255,.6);stroke-width:2.2;fill:none;
  filter:drop-shadow(0 0 6px rgba(107,140,255,.25));stroke-linecap:round;stroke-linejoin:round;
  opacity:.22;transition:opacity .18s ease,stroke .18s ease;}
.link-layer .dep-line.active{stroke:var(--accent-2);opacity:.95;}
/* rel list */
.impact-list{margin-top:10px;border:1px dashed var(--outline);border-radius:var(--radius-sm);padding:12px;background:#f8fafc;}
.impact-list h4{margin:0 0 8px;font-size:13px;letter-spacing:.2px;color:#2f3d57;display:flex;align-items:center;gap:8px;}
.impact-item{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;
  border:1px solid var(--outline);border-radius:10px;margin-bottom:8px;background:#f8fafc;cursor:pointer;}
.impact-item:last-child{margin-bottom:0;}
.impact-item:hover{border-color:rgba(128,167,255,.3);}
.impact-item .small{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;}
/* stat */
.stat-row{display:flex;gap:8px;flex-wrap:wrap;}
.stat-card{flex:1;min-width:60px;background:var(--card);border:1px solid var(--outline);
  border-radius:var(--radius-sm);padding:10px 8px;text-align:center;}
.stat-card .num{font-size:22px;font-weight:800;
  background:linear-gradient(135deg,var(--accent),var(--accent-2));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.stat-card .lbl{font-size:10px;color:var(--muted);margin-top:2px;letter-spacing:.3px;}
/* detail */
.detail-panel{margin-top:10px;border:1px solid var(--outline);border-radius:var(--radius);padding:12px;background:var(--panel);box-shadow:var(--shadow);display:none;animation:rise .2s ease;}
.detail-panel.show{display:block;}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.detail-panel .head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.detail-panel h4{margin:0;font-size:14px;color:#2f3d57;letter-spacing:.3px;flex:1;}
.detail-panel .close{margin-left:auto;background:transparent;border:1px solid var(--outline);color:var(--muted);border-radius:8px;padding:4px 8px;cursor:pointer;font-family:var(--font);}
.drow{margin-bottom:7px;}
.dkey{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;}
.dval{font-size:13px;line-height:1.5;}
.dtags{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;}
.dtag{padding:4px 7px;border-radius:6px;font-size:11px;background:rgba(46,207,156,.12);color:var(--text);border:1px solid rgba(46,207,156,.32);}
.tiny{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4;}
@media(max-width:1080px){body{padding:20px;}.grid{grid-template-columns:1fr;}.panel{position:relative;top:0;}}
</style>
</head>
<body>
<main>
  <header class="hero">
    <h1>DDD 领域依赖关系图</h1>
    <p>战略设计（子域 / 限界上下文） + 战术设计（聚合 / 实体） · 悬停模块卡片查看依赖连线 · 点击锁定详情</p>
  </header>
  <section class="grid">
    <aside class="panel">
      <div class="control-group">
        <h3>视图切换</h3>
        <div class="view-toggle" id="viewToggle">
          <button data-view="strategic" class="active">战略设计</button>
          <button data-view="tactical">战术设计</button>
          <button data-view="all">全部</button>
        </div>
        <p class="tiny">战略视图：子域与限界上下文的分布和集成。战术视图：聚合、实体与内部依赖。</p>
      </div>
      <div class="control-group">
        <h3>总览</h3>
        <div class="stat-row" id="statsRow"></div>
      </div>
      <div class="control-group">
        <h3>图例</h3>
        <div class="legend">
          <span class="pill"><span class="dot" style="background:#fbbf24"></span>核心域</span>
          <span class="pill"><span class="dot" style="background:#6b8cff"></span>支撑域</span>
          <span class="pill"><span class="dot" style="background:#94a3b8"></span>通用域</span>
          <span class="pill"><span class="dot" style="background:var(--accent)"></span>聚合</span>
        </div>
        <div class="legend">
          <span class="pill"><span style="display:inline-block;width:22px;height:2px;background:#6b8cff;border-radius:1px;vertical-align:middle"></span>ACL</span>
          <span class="pill"><span style="display:inline-block;width:22px;border-top:2px dashed #f39c5a;vertical-align:middle"></span>OHS</span>
          <span class="pill"><span style="display:inline-block;width:22px;border-top:2px dotted #e76f7b;vertical-align:middle"></span>共享内核</span>
        </div>
      </div>
      <div class="control-group" id="detailArea">
        <h3>模块详情</h3>
        <div class="detail-panel" id="detailPanel">
          <div class="head">
            <h4 id="dName"></h4>
            <button class="close" id="dClose">✕</button>
          </div>
          <div id="dBody"></div>
        </div>
        <p class="tiny" id="detailHint">点击任意模块卡片查看详情。</p>
      </div>
    </aside>
    <section class="board" id="board">
      <div class="board-head">
        <div>
          <div class="summary" id="summaryText">当前视图：<strong>战略设计</strong>。展示子域与限界上下文的集成关系。</div>
          <div class="progress"><span id="coverageBar" style="width:30%"></span></div>
        </div>
        <div class="view-toggle" id="inlineToggle">
          <button data-view="strategic" class="active">战略</button>
          <button data-view="tactical">战术</button>
          <button data-view="all">全部</button>
        </div>
      </div>
      <div id="architecture" class="architecture"></div>
      <div class="impact-list" id="impactList">
        <h4>集成关系清单</h4>
        <p class="tiny">暂无集成关系。</p>
      </div>
    </section>
  </section>
</main>
<script>
const RAW=__DATA_PLACEHOLDER__;
const COLORS={
  '核心域':{accent:'#fbbf24',css:'var(--warning)',borderLeft:'#fbbf24'},
  '支撑域':{accent:'#6b8cff',css:'var(--accent-2)',borderLeft:'#6b8cff'},
  '通用域':{accent:'#94a3b8',css:'var(--muted)',borderLeft:'#94a3b8'},
};
const AGG_COL={accent:'#2ecf9c',css:'var(--accent)',borderLeft:'#2ecf9c'};
const subTypeMap={};(RAW.subdomains||[]).forEach(s=>{subTypeMap[s.name]=s.type||'支撑域';});
const ctxSubMap={};(RAW.contexts||[]).forEach(c=>{if(c.subdomain)ctxSubMap[c.name]=c.subdomain;});
let selectedId=null,view='strategic';

function getCol(sub){return COLORS[subTypeMap[sub]||'支撑域']||COLORS['支撑域'];}
function eid(s){return s.replace(/[^a-zA-Z0-9_-]/g,'_');}

function renderAll(){
  const arch=document.getElementById('architecture');arch.innerHTML='';
  if(view==='strategic'||view==='all') renderStrategic(arch);
  if(view==='tactical'||view==='all')  renderTactical(arch);
  renderRelList();renderStats();
  const labels={strategic:'战略设计',tactical:'战术设计',all:'全部'};
  const descs={strategic:'展示子域与限界上下文的集成关系。',tactical:'展示聚合与内部依赖关系。',all:'完整展示战略设计与战术设计。'};
  document.getElementById('summaryText').innerHTML=`当前视图：<strong>${labels[view]}</strong>。${descs[view]}`;
  const total=(RAW.contexts||[]).length+(RAW.aggregates||[]).length;
  const pct=total?Math.round(((RAW.relations||[]).length+(RAW.aggregateRelations||[]).length)/total*100):30;
  document.getElementById('coverageBar').style.width=Math.min(100,Math.max(10,pct))+'%';
  requestAnimationFrame(drawDependencies);
}

function renderStrategic(arch){
  const bySub={};(RAW.subdomains||[]).forEach(s=>{bySub[s.name]={info:s,ctxs:[]};});
  (RAW.contexts||[]).forEach(c=>{if(c.subdomain&&bySub[c.subdomain])bySub[c.subdomain].ctxs.push(c);});
  Object.values(bySub).forEach(({info,ctxs})=>{
    const col=getCol(info.name);
    const layer=el('div','layer');
    layer.style.borderLeft=`3px solid ${col.accent}`;
    layer.innerHTML=`<h4>${info.name} <span class="side">${info.type||'子域'}</span>${info.strategy?`<span class="side" style="margin-left:auto">${info.strategy}</span>`:''}</h4>
      <p class="tiny">${info.description||''}</p>`;
    const mods=el('div','modules');
    ctxs.forEach(c=>{
      const m=el('div','module');m.dataset.moduleId='ctx_'+c.name;m.dataset.layerId=info.name;
      let html=`<span class="impact ${cls4type(info.type)}">${info.type||'限界上下文'}</span>`;
      html+=`<h5>${c.name}</h5><p>${c.description||'限界上下文'}</p>`;
      const io=document.createElement('div');io.className='io';
      if(c.exposedModels&&c.exposedModels.length)io.innerHTML=`<span>OUT: ${c.exposedModels.join(', ')}</span>`;
      m.innerHTML=html;m.appendChild(io);
      if(c.team){const note=el('div','impact-note');note.textContent='👥 '+c.team;m.appendChild(note);}
      bindModule(m,'ctx_'+c.name,info.name);
      mods.appendChild(m);
    });
    layer.appendChild(mods);arch.appendChild(layer);
  });
}

function renderTactical(arch){
  const byCtx={};(RAW.contexts||[]).forEach(c=>{byCtx[c.name]={info:c,aggs:[]};});
  (RAW.aggregates||[]).forEach(a=>{if(a.context&&byCtx[a.context])byCtx[a.context].aggs.push(a);});
  Object.values(byCtx).forEach(({info,aggs})=>{
    if(!aggs.length)return;
    const col=getCol(info.subdomain);
    const layer=el('div','layer');
    layer.style.borderLeft=`3px solid ${AGG_COL.accent}`;
    layer.innerHTML=`<h4>${info.name} <span class="side">限界上下文</span></h4><p class="tiny">${info.description||''}</p>`;
    const mods=el('div','modules');
    aggs.forEach(a=>{
      const m=el('div','module');m.dataset.moduleId='agg_'+a.name;m.dataset.layerId=info.name;
      let html=`<span class="impact aggregate">聚合</span><h5>${a.name}</h5><p>${a.description||'聚合根'}</p>`;
      m.innerHTML=html;
      const io=el('div','io');
      if(a.entities&&a.entities.length)io.innerHTML=`<span>IN: ${a.entities.join(', ')}</span>`;
      m.appendChild(io);
      if(a.context){const note=el('div','impact-note');note.textContent='📦 '+a.context;m.appendChild(note);}
      bindModule(m,'agg_'+a.name,info.name);
      mods.appendChild(m);
    });
    layer.appendChild(mods);arch.appendChild(layer);
  });
}

function bindModule(m,id,layerId){
  m.addEventListener('mouseenter',()=>{if(!selectedId)highlightDeps(id);});
  m.addEventListener('mouseleave',()=>{if(!selectedId)clearHighlight();});
  m.addEventListener('click',()=>{
    if(selectedId===id){selectedId=null;clearHighlight();hideDetail();return;}
    selectedId=id;
    document.querySelectorAll('.module').forEach(x=>x.classList.remove('selected'));
    m.classList.add('selected');
    highlightDeps(id,true);
    showDetail(id);
  });
}

function highlightDeps(id,lock=false){
  if(lock)selectedId=id;
  document.querySelectorAll('.dep-line').forEach(l=>{
    const active=l.dataset.from===id||l.dataset.to===id;
    l.classList.toggle('active',active);
    l.style.opacity=active?'0.95':'0.10';
  });
  document.querySelectorAll('.module').forEach(m=>{
    const active=m.dataset.moduleId===id;
    if(active&&!m.classList.contains('selected'))m.classList.add('selected');
  });
}

function clearHighlight(){
  selectedId=null;
  document.querySelectorAll('.module').forEach(m=>m.classList.remove('selected'));
  document.querySelectorAll('.dep-line').forEach(l=>{l.classList.remove('active');l.style.opacity='';});
}

function showDetail(id){
  const panel=document.getElementById('detailPanel');
  const hint=document.getElementById('detailHint');
  const prefix=id.startsWith('ctx_')?'ctx_':'agg_';
  const name=id.slice(prefix.length);
  let data;
  if(prefix==='ctx_'){
    data=(RAW.contexts||[]).find(c=>c.name===name);
  }else{
    data=(RAW.aggregates||[]).find(a=>a.name===name);
  }
  if(!data){panel.className='detail-panel';hint.style.display='';return;}
  document.getElementById('dName').textContent=data.name;
  let body='';
  if(data.description)body+=`<div class="drow"><div class="dkey">描述</div><div class="dval">${data.description}</div></div>`;
  if(data.subdomain)body+=`<div class="drow"><div class="dkey">所属子域</div><div class="dval">${data.subdomain}</div></div>`;
  if(data.context)body+=`<div class="drow"><div class="dkey">所属上下文</div><div class="dval">${data.context}</div></div>`;
  if(data.team)body+=`<div class="drow"><div class="dkey">团队</div><div class="dval">👥 ${data.team}</div></div>`;
  if(data.strategy)body+=`<div class="drow"><div class="dkey">策略</div><div class="dval">${data.strategy}</div></div>`;
  if(data.exposedModels&&data.exposedModels.length)body+=`<div class="drow"><div class="dkey">暴露模型</div><div class="dtags">${data.exposedModels.map(m=>`<span class="dtag">${m}</span>`).join('')}</div></div>`;
  if(data.entities&&data.entities.length)body+=`<div class="drow"><div class="dkey">实体</div><div class="dtags">${data.entities.map(e=>`<span class="dtag">${e}</span>`).join('')}</div></div>`;
  // Related relations
  const rels=[...(RAW.relations||[]),...(RAW.aggregateRelations||[])];
  const fromMe=rels.filter(r=>r.from===name);
  const toMe=rels.filter(r=>r.to===name);
  if(fromMe.length)body+=`<div class="drow"><div class="dkey">依赖下游</div><div class="dval">${fromMe.map(r=>`${r.to} (${r.type||'依赖'})`).join('、')}</div></div>`;
  if(toMe.length)body+=`<div class="drow"><div class="dkey">被上游依赖</div><div class="dval">${toMe.map(r=>`${r.from} (${r.type||'依赖'})`).join('、')}</div></div>`;
  document.getElementById('dBody').innerHTML=body;
  panel.className='detail-panel show';hint.style.display='none';
}

function hideDetail(){
  document.getElementById('detailPanel').className='detail-panel';
  document.getElementById('detailHint').style.display='';
}

document.getElementById('dClose').addEventListener('click',()=>{selectedId=null;clearHighlight();hideDetail();});

function renderRelList(){
  const el=document.getElementById('impactList');
  const rels=[...(RAW.relations||[]),...(RAW.aggregateRelations||[])];
  if(!rels.length){el.innerHTML='<h4>集成关系清单</h4><p class="tiny">暂无集成关系。</p>';return;}
  el.innerHTML='<h4>集成关系清单</h4>'+rels.map(r=>{
    const tc=r.type||'default';
    const typeLabel=tc==='ACL'?'防腐层':tc==='OHS'?'开放主机服务':tc==='SharedKernel'?'共享内核':tc;
    return`<div class="impact-item" data-from="${r.from}" data-to="${r.to}"><div><div style="font-weight:600">${r.from} → ${r.to}</div><div class="small">${typeLabel}</div></div><span class="pill">${tc}</span></div>`;
  }).join('');
  el.querySelectorAll('.impact-item').forEach(item=>{
    item.addEventListener('mouseenter',()=>{
      const f='ctx_'+item.dataset.from,t='ctx_'+item.dataset.to;
      document.querySelectorAll('.dep-line').forEach(l=>{
        const active=(l.dataset.from===f&&l.dataset.to===t);
        l.classList.toggle('active',active);l.style.opacity=active?'0.95':'0.10';
      });
    });
    item.addEventListener('mouseleave',()=>{if(!selectedId)clearHighlight();});
    item.addEventListener('click',()=>{
      const f=item.dataset.from,t=item.dataset.to;
      selectedId='ctx_'+f;
      highlightDeps('ctx_'+f,true);
      showDetail('ctx_'+f);
    });
  });
}

function renderStats(){
  const el=document.getElementById('statsRow');
  const stats=[
    {num:(RAW.subdomains||[]).length,lbl:'子域'},
    {num:(RAW.contexts||[]).length,lbl:'上下文'},
    {num:(RAW.aggregates||[]).length,lbl:'聚合'},
    {num:((RAW.relations||[]).length+(RAW.aggregateRelations||[]).length),lbl:'关系'},
  ];
  el.innerHTML=stats.map(s=>`<div class="stat-card"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>`).join('');
}

/* ── SVG dependency overlay ── */
function drawDependencies(){
  const board=document.getElementById('board');
  let svg=document.getElementById('linkLayer');
  if(!svg){
    svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.id='linkLayer';svg.classList.add('link-layer');
    board.insertBefore(svg,board.firstChild);
  }
  const br=board.getBoundingClientRect();
  svg.setAttribute('width',br.width);svg.setAttribute('height',br.height);
  svg.setAttribute('viewBox',`0 0 ${br.width} ${br.height}`);
  svg.querySelectorAll('path.dep-line').forEach(p=>p.remove());

  const pos={};
  board.querySelectorAll('[data-module-id]').forEach(el=>{
    const r=el.getBoundingClientRect();
    pos[el.dataset.moduleId]={x:r.left-br.left+r.width/2,y:r.top-br.top+r.height/2,
      cx:r.left-br.left+r.width/2,w:r.width,h:r.height,
      bot:r.bottom-br.top,top:r.top-br.top,left:r.left-br.left,right:r.right-br.left};
  });

  function anchor(from,to){
    const start={x:from.cx,y:from.bot-8};
    const end={x:to.cx,y:to.top+8};
    if(from.y>to.y){start.y=from.top+8;end.y=to.bot-8;}
    const bnd=Math.max(26,Math.abs(end.x-start.x)*.25);
    const my=(start.y+end.y)/2;
    return{start,c1:{x:start.x,y:my-bnd},c2:{x:end.x,y:my+bnd},end};
  }

  (RAW.relations||[]).forEach(r=>{
    const fromId='ctx_'+r.from,toId='ctx_'+r.to;
    const f=pos[fromId],t=pos[toId];if(!f||!t)return;
    const{start,c1,c2,end}=anchor(f,t);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('class','dep-line');path.dataset.from=fromId;path.dataset.to=toId;path.dataset.relType=r.type||'ACL';
    path.setAttribute('d',`M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`);
    if(selectedId&&(selectedId===fromId||selectedId===toId))path.classList.add('active');
    svg.appendChild(path);
  });

  (RAW.aggregateRelations||[]).forEach(r=>{
    const fromId='agg_'+r.from,toId='agg_'+r.to;
    const f=pos[fromId],t=pos[toId];if(!f||!t)return;
    const{start,c1,c2,end}=anchor(f,t);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('class','dep-line');path.dataset.from=fromId;path.dataset.to=toId;path.dataset.relType='aggregate';
    path.setAttribute('d',`M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`);
    if(selectedId&&(selectedId===fromId||selectedId===toId))path.classList.add('active');
    svg.appendChild(path);
  });

  if(selectedId)highlightDeps(selectedId,true);
}

function el(tag,cls){const e=document.createElement(tag);if(cls)e.className=cls;return e;}
function cls4type(t){return t==='核心域'?'core':t==='支撑域'?'support':t==='通用域'?'generic':'support';}

/* ── Init ── */
function bindToggles(){
  [document.getElementById('viewToggle'),document.getElementById('inlineToggle')].forEach(group=>{
    if(!group)return;
    group.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>{        view=btn.dataset.view;
        document.querySelectorAll('.view-toggle button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
        renderAll();
      });
    });
  });
}

window.addEventListener('resize',()=>requestAnimationFrame(drawDependencies));
bindToggles();
renderAll();
</script>
</body>
</html>
"""

def gen_html(data, output):
    html = HTML.replace('__DATA_PLACEHOLDER__', json.dumps(data, ensure_ascii=False, indent=2))
    with open(output, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"✅ 生成依赖关系图: {output}")

def main():
    p = argparse.ArgumentParser(description='生成 DDD 依赖关系图 HTML v0.3.0')
    p.add_argument('--input', required=True, help='输入 JSON 文件')
    p.add_argument('--output', default='ddd-dependency-graph.html', help='输出 HTML 文件')
    args = p.parse_args()
    try:
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"错误：文件不存在: {args.input}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"错误：JSON解析失败: {e}", file=sys.stderr)
        sys.exit(1)
    gen_html(data, args.output)

if __name__ == '__main__':
    main()
