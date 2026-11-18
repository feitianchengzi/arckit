import { isMain } from './cli-entry.mjs';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { storeProfile } from './asc-auth.mjs';
import { jwt, request } from './asc-api.mjs';

// Private UI-to-helper pipe. Raw input and Apple responses never reach stdout.
export async function saveConnection(input, {root, fetchImpl} = {}) {
  try {
    const {profile, keyId, issuerId, keyPath} = input;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(profile || ''))
      return {status:'error',code:'invalid_profile'};
    const pem=await readFile(keyPath,'utf8');
    const token=jwt({ASC_KEY_ID:keyId,ASC_ISSUER_ID:issuerId},pem);
    await request({path:'/v1/apps?limit=1',token,fetchImpl});
    await storeProfile(profile,keyId,issuerId,pem,root);
    return {status:'saved',profile,connectionVerified:true};
  } catch(e) {
    const code=e.code==='EEXIST'?'profile_exists':
      ['authentication_failed','permission_denied','network_error','rate_limited'].includes(e.result?.kind)
      ?e.result.kind:'configuration_failed';
    return {status:'error',code};
  }
}
async function main() {
  if(process.argv[2]==='--receive') {
    let input='';for await(const part of process.stdin) {
      input+=part;if(input.length>16384)throw Error('invalid_input');
    }
    let result;
    try{result=await saveConnection(JSON.parse(input));}
    catch{result={status:'error',code:'invalid_input'};}
    console.log(JSON.stringify(result));return;
  }
  if(process.argv.length!==2 || process.platform!=='darwin') {
    console.log(JSON.stringify({status:'unavailable',code:'macos_gui_required'}));return;
  }
  const child=spawn('/usr/bin/swift',[
    fileURLToPath(new URL('./asc-setup.swift',import.meta.url)),
    process.execPath,fileURLToPath(import.meta.url)
  ],{stdio:['ignore','pipe','ignore']});
  let output='';child.stdout.on('data',b=>{if(output.length<4096)output+=b;});
  child.on('error',()=>{});
  child.on('close',()=>{
    let result={status:'error',code:'ui_failed'};
    try{
      const p=JSON.parse(output);
      if(p.status==='cancelled')result={status:'cancelled'};
      if(p.status==='saved' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(p.profile) && p.connectionVerified===true)
        result={status:'saved',profile:p.profile,connectionVerified:true};
    }catch{}
    console.log(JSON.stringify(result));
  });
}
if(isMain(import.meta.url))
  main().catch(()=>{console.log(JSON.stringify({status:'error',code:'setup_failed'}));process.exitCode=1;});
