#!/usr/bin/env node
// Team-key ASC client. No dependencies; Node >=18.
import { readFile } from 'node:fs/promises';
import { createPrivateKey, sign } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const ORIGIN = 'https://api.appstoreconnect.apple.com';
const WRITE_ROUTES = {
  POST: [
    /^\/v1\/(bundleIds|bundleIdCapabilities|certificates|profiles|ciWorkflows|ciBuildRuns|betaGroups|betaTesters|betaBuildLocalizations|betaTesterInvitations)$/,
    /^\/v1\/betaGroups\/[^/]+\/relationships\/(builds|betaTesters)$/
  ],
  PATCH: [
    /^\/v1\/(ciWorkflows|betaGroups|betaBuildLocalizations|buildBetaDetails|builds|bundleIdCapabilities)\/[^/]+$/
  ]
};

export function apiURL(path) {
  if (typeof path !== 'string' || !path || path.includes('\\') || /[\r\n]/.test(path))
    throw new Error('Invalid API path');
  const u = new URL(path, ORIGIN);
  if (u.origin !== ORIGIN || u.username || u.password || u.hash || !/^\/v[12]\//.test(u.pathname))
    throw new Error('Only official ASC v1/v2 URLs are allowed');
  return u;
}

export function validateRequest(method, path, body) {
  const u = apiURL(path);
  if (method === 'GET') {
    if (body !== undefined) throw new Error('GET cannot have a body');
    return;
  }
  if (!WRITE_ROUTES[method]?.some(r => r.test(u.pathname)))
    throw new Error('Write outside internal-delivery scope; use a separately authorized workflow');
  if (u.search) throw new Error('Writes cannot contain query parameters');
  if (!body || typeof body !== 'object' || !body.data)
    throw new Error('JSON:API body.data is required');
  if (/^\/v1\/builds\/[^/]+$/.test(u.pathname)) {
    const d = body.data;
    if (d.type !== 'builds' || d.id !== u.pathname.split('/').at(-1))
      throw new Error('Build type/id must match path');
    if (Object.keys(d).some(k => !['type','id','attributes','relationships'].includes(k)))
      throw new Error('Unsupported build update field');
    if (Object.keys(d.attributes ?? {}).some(k => k !== 'usesNonExemptEncryption'))
      throw new Error('Only encryption attributes may be changed on builds');
    if ('usesNonExemptEncryption' in (d.attributes ?? {}) &&
        typeof d.attributes.usesNonExemptEncryption !== 'boolean')
      throw new Error('usesNonExemptEncryption must be boolean');
    if (Object.keys(d.relationships ?? {}).some(k => k !== 'appEncryptionDeclaration'))
      throw new Error('Only encryption declaration relationships may be changed on builds');
  }
}

export function jwt(env, pem, now = Math.floor(Date.now()/1000)) {
  if (!env.ASC_KEY_ID || !env.ASC_ISSUER_ID) throw new Error('Missing ASC_KEY_ID or ASC_ISSUER_ID');
  const key = createPrivateKey(pem);
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1')
    throw new Error('Expected an ES256/P-256 team private key');
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = b64({alg:'ES256',kid:env.ASC_KEY_ID,typ:'JWT'})+'.'+
    b64({iss:env.ASC_ISSUER_ID,iat:now,exp:now+600,aud:'appstoreconnect-v1'});
  return unsigned+'.'+sign('sha256',Buffer.from(unsigned),{key,dsaEncoding:'ieee-p1363'}).toString('base64url');
}

export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) =>
    [k, /^(authorization|token|accessToken|privateKey|certificateContent|profileContent|csrContent)$/i.test(k) ? '[REDACTED]' : redact(v)]));
  if (typeof value === 'string') return value
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,'[REDACTED PRIVATE KEY]')
    .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[REDACTED JWT]');
  return value;
}

export class ApiError extends Error {
  constructor(status, body, method, retryAfter) {
    super('ASC HTTP '+status);
    this.result = {kind: status===401?'authentication_failed':status===403?'permission_denied':
      status===409?'conflict_reconcile':status===429?'rate_limited':
      method!=='GET' && status>=500?'outcome_unknown':'api_error',
      status,retryAfter,errors:redact(body?.errors ?? [])};
  }
}

export async function request({method='GET',path,body,token,fetchImpl=fetch}) {
  validateRequest(method,path,body);
  let response;
  try {
    response = await fetchImpl(apiURL(path), {
      method, redirect:'error', signal:AbortSignal.timeout(30000),
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      ...(body === undefined ? {} : {body:JSON.stringify(body)})
    });
  } catch {
    const e = new Error(method==='GET'?'Read failed; retry after checking connectivity':'Write result unknown; reconcile before retry');
    e.result={kind:method==='GET'?'network_error':'outcome_unknown'};
    throw e;
  }
  let data;
  try {
    const text=await response.text();
    data=text?JSON.parse(text):null;
  } catch {
    const e=new Error('Response could not be parsed');
    e.result={kind:method==='GET'?'invalid_response':'outcome_unknown',status:response.status};
    throw e;
  }
  if (!response.ok) throw new ApiError(response.status,data,method,response.headers.get('retry-after'));
  return {status:response.status,body:data};
}

export async function allPages(options) {
  const seen=new Set(), data=[], included=new Map();
  let path=options.path;
  for(let n=0;path;n++) {
    if(n>=1000) throw new Error('Pagination bound reached; result incomplete');
    const url=apiURL(path).href;
    if(seen.has(url)) throw new Error('Pagination cycle; result incomplete');
    seen.add(url);
    const r=await request({...options,method:'GET',path:url,body:undefined});
    if(!Array.isArray(r.body?.data)) throw new Error('--all requires a collection');
    data.push(...r.body.data);
    for(const item of r.body.included ?? []) included.set(item.type+':'+item.id,item);
    path=r.body.links?.next;
  }
  return {status:200,body:{data,included:[...included.values()],meta:{pages:seen.size,complete:true}}};
}

export async function main(args=process.argv.slice(2), env=process.env) {
  if(args.includes('--help') || !args.length) {
    console.log('asc-api.mjs GET|POST|PATCH <path> [--body file.json] [--all] [--execute]\nGET executes; writes default to plan without loading keys. --execute sends an authorized write.\nTeam key env: ASC_KEY_ID ASC_ISSUER_ID ASC_PRIVATE_KEY_PATH. No automatic retries.');
    return;
  }
  const [method,path,...flags]=args;
  let bodyFile,execute=false,all=false;
  for(let i=0;i<flags.length;i++) {
    if(flags[i]==='--body' && flags[i+1]) bodyFile=flags[++i];
    else if(flags[i]==='--execute') execute=true;
    else if(flags[i]==='--all') all=true;
    else throw new Error('Unknown/incomplete option');
  }
  const body=bodyFile?JSON.parse(await readFile(bodyFile,'utf8')):undefined;
  validateRequest(method,path,body);
  if(all && method!=='GET') throw new Error('--all is GET-only');
  if(method!=='GET' && !execute) {
    console.log(JSON.stringify({mode:'plan',method,url:apiURL(path).href,body:redact(body)},null,2));
    return;
  }
  if(!env.ASC_PRIVATE_KEY_PATH) throw new Error('Missing ASC_PRIVATE_KEY_PATH');
  const token=jwt(env,await readFile(env.ASC_PRIVATE_KEY_PATH,'utf8'));
  const opts={method,path,body,token};
  const result=all?await allPages(opts):await request(opts);
  console.log(JSON.stringify(redact(result),null,2));
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  main().catch(e=>{console.error(JSON.stringify(redact(e.result ?? {kind:'local_error',message:e.message})));process.exitCode=1;});
}

