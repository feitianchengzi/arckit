import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, isAbsolute, join } from 'node:path';
import { homedir } from 'node:os';
const exec = promisify(execFile);

// Deterministic execution context; callers/Agents own diagnosis and next-step decisions.
export function buildCommandEnvironment(base = process.env, {pathEntries = [], homeDir = homedir()} = {}) {
  const common = process.platform === 'win32' ? [] : [join(homeDir,'.local','bin'),'/opt/homebrew/bin','/usr/local/bin','/usr/bin','/bin','/usr/sbin','/sbin'];
  const pathKey=process.platform==='win32'?(Object.keys(base).find(k=>k.toUpperCase()==='PATH') || 'PATH'):'PATH';
  const result={...base,PATH:[...new Set([...pathEntries,...String(base[pathKey] || '').split(delimiter),...common].filter(p=>p && isAbsolute(p)))].join(delimiter)};
  if(process.platform==='win32')for(const key of Object.keys(result))if(key!=='PATH'&&key.toUpperCase()==='PATH')delete result[key];
  return result;
}
export function redactCommandText(value, env = {}) {
  let text=String(value || '');
  for(const [key,v] of Object.entries(env))if(/token|secret|password|credential|api.?key|proxy/i.test(key) && String(v).length>=6)text=text.split(String(v)).join('[redacted]');
  return text.replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g,'[redacted]')
    .replace(/(https?:\/\/)[^\s/@]+(?::[^\s/@]*)?@/gi,'$1[redacted]@')
    .replace(/((?:authorization|proxy-authorization)\s*[:=]\s*)(?:bearer|token|basic)?\s*[^\r\n]+/gi,'$1[redacted]')
    .replace(/([?&](?:access_token|token|api_key)=)[^&\s]+/gi,'$1[redacted]').slice(0,3000);
}
export async function resolveCommandExecutable(bin, env) {
  if(isAbsolute(bin))return bin;
  const suffixes=process.platform==='win32'?String(env.PATHEXT || '.EXE;.CMD;.BAT').split(';'):[''];
  for(const dir of String(env.PATH || '').split(delimiter).filter(Boolean))for(const suffix of suffixes){
    const path=join(dir,bin.endsWith(suffix)?bin:bin+suffix);
    try{await access(path,constants.X_OK);return path;}catch{}
  }
  return bin;
}
export function commandDiagnostic(error, {bin,args=[],cwd='',stage='command',env={},executable=bin,started=Date.now()} = {}) {
  return {source:'arcorbit',stage,command:bin,executable:isAbsolute(executable || '')?executable:null,args:args.map(a=>redactCommandText(a,env)),cwd,
    checked_at:new Date().toISOString(),duration_ms:Date.now()-started,exit_code:error?(Number.isInteger(error.code)?error.code:null):0,
    error_code:error?(typeof error.code==='string'?error.code:'PROCESS_ERROR'):null,signal:error?.signal || null,
    timed_out:Boolean(error?.killed && error?.signal==='SIGTERM'),stderr:redactCommandText(error?.stderr || error?.message,env)};
}
export async function runLocalCommand(bin,args,options={}) {
  const env=buildCommandEnvironment({...process.env,...options.env}),executable=await resolveCommandExecutable(bin,env),started=Date.now();
  try {const {stdout}=await exec(executable,args,{timeout:60000,maxBuffer:2_000_000,...options,env});return stdout.trim();}
  catch(error){error.diagnostic=commandDiagnostic(error,{bin,args,cwd:options.cwd || process.cwd(),env,executable,started});error.message=error.diagnostic.stderr;error.stderr=redactCommandText(error.stderr,env);error.stdout=redactCommandText(error.stdout,env);throw error;}
}
export async function describeCommandEnvironment(env) {
  return {source:'arcorbit',path_entries:String(env.PATH || '').split(delimiter),executables:Object.fromEntries(await Promise.all(['git','gh'].map(async bin=>{const p=await resolveCommandExecutable(bin,env);return [bin,isAbsolute(p)?p:null];}))),checked_at:new Date().toISOString()};
}
