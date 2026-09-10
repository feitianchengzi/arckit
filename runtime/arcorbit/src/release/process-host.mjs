import { spawn, execFile } from 'node:child_process';
import { userInfo } from 'node:os';
const parent=process.parentPort;
const send=value=>{if(parent)parent.postMessage(value);else if(process.connected)process.send(value);};
const jobs=new Map();
const shell=()=>process.platform==='win32'?(process.env.COMSPEC||'cmd.exe'):(userInfo().shell||process.env.SHELL||'/bin/zsh');
function flush(job){if(job.buffer){send({type:'data',id:job.id,data:job.buffer});job.buffer='';}}
function output(job,data){if(job.buffer.length+data.length>262144){flush(job);}job.buffer=data.length>262144?'\r\n[输出过快，已截断较早内容]\r\n'+data.slice(-262144):job.buffer+data;if(!job.timer)job.timer=setTimeout(()=>{job.timer=null;flush(job);},32);}
function terminate(job){
 if(job.terminal){try{job.process.kill();}catch{}}
 if(process.platform==='win32'){execFile('taskkill',['/pid',String(job.process.pid),'/T','/F'],()=>{});}
 else {try{process.kill(-job.process.pid,'SIGTERM');}catch{try{job.process.kill('SIGTERM');}catch{}}setTimeout(()=>{if(job.ended)return;try{process.kill(-job.process.pid,'SIGKILL');}catch{}},700).unref();}
}
async function receive(message){const {request,action,id,input={}}=message;
 try{
  let result={};
  if(action==='start'){
   if(jobs.has(id))throw new Error('Execution already exists');
   const job={id,buffer:'',timer:null,terminal:input.kind==='terminal'};
   if(job.terminal){const pty=await import('node-pty');const bin=input.program&&input.program!=='lazygit'?input.program:shell();const args=input.program==='lazygit'?(process.platform==='win32'?['/d','/s','/c','lazygit']:['-l','-c','exec lazygit']):input.program?[]:process.platform==='win32'?[]:['-l'];job.process=pty.spawn(bin,args,{name:'xterm-256color',cols:input.cols||100,rows:input.rows||28,cwd:input.cwd,env:{...process.env,...input.env,TERM:'xterm-256color'}});job.process.onData(data=>output(job,data));job.process.onExit(({exitCode,signal})=>end(job,exitCode,signal));}
   else {const args=process.platform==='win32'?['/d','/s','/c',input.command]:['-l','-c',input.command];job.process=spawn(shell(),args,{cwd:input.cwd,env:{...process.env,...input.env},detached:process.platform!=='win32',stdio:['pipe','pipe','pipe']});job.process.stdout.setEncoding('utf8');job.process.stderr.setEncoding('utf8');job.process.stdout.on('data',data=>output(job,data));job.process.stderr.on('data',data=>output(job,data));job.process.on('error',e=>output(job,e.message+'\n'));job.process.on('close',(code,signal)=>end(job,code,signal));}
   jobs.set(id,job);result={pid:job.process.pid};
  }else{
   const job=jobs.get(id);if(!job)throw new Error('Execution is no longer running');
   if(action==='write'){if(!job.terminal)throw new Error('Task output is read-only');job.process.write(input.data);}
   else if(action==='resize'){if(job.terminal)job.process.resize(input.cols,input.rows);}
   else if(action==='interrupt'){if(job.terminal)job.process.write('\x03');else terminate(job);}
   else if(action==='stop')terminate(job);
   else throw new Error('Unknown host action');
  }
  send({request,result});
 }catch(e){send({request,error:e.message});}
}
function end(job,code,signal){job.ended=true;clearTimeout(job.timer);flush(job);jobs.delete(job.id);send({type:'exit',id:job.id,code,signal});}
if(parent)parent.on('message',e=>receive(e.data));else process.on('message',receive);
const close=()=>{for(const job of jobs.values())terminate(job);setTimeout(()=>process.exit(),900).unref();};
process.on('disconnect',close);process.on('SIGTERM',close);parent?.on('close',close);
