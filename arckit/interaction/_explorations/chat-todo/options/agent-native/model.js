const STORAGE='arcorbit-chat-todo-agent-native-v4';
const SAMPLE={
 other:'另外帮我记一个待办：给 Chat 增加会话搜索。先记下来，我们继续聊滚动恢复。',
 update:'读取这个待办，把完成标准补充为：切换会话后恢复原阅读位置。',
 execute:'按这个待办继续执行，先检查实现并修复。',
 suggest:'先看看这个待办还遗漏了什么，发现其他事情也告诉我。'
};
function seed(){return {selected:'c1',tab:'sessions',next:203,tasks:[
 {id:'T201',project:'ArcOrbit',title:'恢复会话阅读位置',content:'切换会话后保留用户的阅读位置。',status:'待处理',revision:1,thread:null},
 {id:'T202',project:'ArcOrbit',title:'完善离线草稿恢复',content:'应用重启后保留未发送消息。',status:'待处理',revision:1,thread:null}
],sessions:[{id:'c1',thread:'chat-thread-01',workspace:'ArcOrbit',title:'Chat 的阅读体验',mainTask:null,draft:'',scroll:0,pending:null,messages:[
 {role:'user',text:'切换会话时，希望保留原来的阅读位置。先帮我分析一下。'},
 {role:'agent',text:'可以按会话保存阅读位置，切回来时恢复。新消息到达时，如果你在看历史，就保持位置并提示“回到最新”。\n这段讨论可以继续细化，也可以整理为待办后直接在这里推进。'}
]}]};}
let state;
try{state=JSON.parse(localStorage.getItem(STORAGE))||seed()}catch{state=seed()}
const current=()=>state.sessions.find(s=>s.id===state.selected);
const findTask=id=>state.tasks.find(t=>t.id===id);
function persist(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function createTask(project,title,content,session,primary){
 const task={id:'T'+state.next++,project,title,content,status:'待评审',revision:1,thread:primary?session.thread:null,sourceThread:session.thread};
 state.tasks.push(task);
 if(primary)session.mainTask=task.id;
 return task;
}
