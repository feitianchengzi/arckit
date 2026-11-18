import { isMain } from './cli-entry.mjs';
// Upload only operations freshly obtained from the official ASC reservation.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { request, jwt, redact } from './asc-api.mjs';
import { loadProfile } from './asc-auth.mjs';

export function validateOperations(operations, size) {
  if (!Array.isArray(operations) || !operations.length) throw new Error('Missing upload operations');
  let end = 0;
  for (const op of [...operations].sort((a,b) => a.offset-b.offset)) {
    const u = new URL(op.url);
    if (u.protocol !== 'https:' || u.port || u.username || u.password || u.hash ||
        !(u.hostname === 'apple.com' || u.hostname.endsWith('.apple.com')))
      throw new Error('Unexpected upload host; check current Apple documentation before changing allowlist');
    if (op.method !== 'PUT' || !Number.isSafeInteger(op.offset) || !Number.isSafeInteger(op.length) ||
        op.offset !== end || op.length <= 0 || op.offset + op.length > size)
      throw new Error('Invalid or incomplete upload byte ranges');
    for (const h of op.requestHeaders ?? [])
      if (!h.name || typeof h.value !== 'string' || /^(authorization|cookie|host|proxy-authorization)$/i.test(h.name))
        throw new Error('Unsafe upload header');
    end += op.length;
  }
  if (end !== size) throw new Error('Upload ranges do not cover file');
}

export async function uploadScreenshot({ id, bytes, token, execute = false, fetchImpl = fetch }) {
  const path = `/v1/appScreenshots/${encodeURIComponent(id)}`;
  const reservation = await request({ path, token, fetchImpl });
  const r = reservation.body?.data;
  if (r?.id !== id || r.type !== 'appScreenshots' || r.attributes?.fileSize !== bytes.length)
    throw new Error('Reservation identity/file size mismatch');
  if (r.attributes?.assetDeliveryState?.state !== 'AWAITING_UPLOAD')
    throw new Error('Reservation not awaiting upload; reconcile existing asset first');
  const ops = r.attributes.uploadOperations;
  validateOperations(ops, bytes.length);
  const checksum = createHash('md5').update(bytes).digest('hex');
  if (!execute) return { mode: 'plan', screenshotId: id, size: bytes.length, checksum, parts: ops.length };
  for (const op of ops) {
    const headers = Object.fromEntries((op.requestHeaders ?? []).map(h => [h.name, h.value]));
    // No JWT/cookies; never print signed upload URLs, even on failure.
    let response;
    try {
      response = await fetchImpl(op.url, { method: op.method, headers,
        body: bytes.subarray(op.offset, op.offset + op.length), redirect: 'error', signal: AbortSignal.timeout(30000) });
    } catch { throw new Error('Asset transfer outcome unknown; query reservation before retry'); }
    if (!response.ok) throw new Error(`Asset transfer HTTP ${response.status}; query reservation before retry`);
  }
  await request({ method:'PATCH', path, token, scope:'submission', fetchImpl,
    body:{data:{type:'appScreenshots',id,attributes:{uploaded:true,sourceFileChecksum:checksum}}} });
  const readback = await request({ path, token, fetchImpl });
  return { screenshotId:id, state:readback.body?.data?.attributes?.assetDeliveryState,
    note:'Upload commit is not final screenshot processing acceptance; verify COMPLETE before submission' };
}

async function main(args) {
  if (!args.length || args.includes('--help')) {
    console.log('asc-upload.mjs --id SCREENSHOT_ID --file PNG_OR_JPG --profile NAME [--execute]\nReads reservation; transfers bytes only with --execute. No JWT on asset storage requests.'); return;
  }
  const o = {};
  for (let i=0;i<args.length;i++) {
    if (args[i] === '--execute') o.execute = true;
    else if (['--id','--file','--profile'].includes(args[i]) && args[i+1]) o[args[i].slice(2)] = args[++i];
    else throw new Error('Invalid option');
  }
  if (!o.id || !o.file || !o.profile) throw new Error('id, file and profile required');
  const p = await loadProfile(o.profile);
  const token = jwt({ASC_KEY_ID:p.keyId,ASC_ISSUER_ID:p.issuerId},p.privateKey);
  console.log(JSON.stringify(await uploadScreenshot({...o,token,bytes:await readFile(o.file)}),null,2));
}
if (isMain(import.meta.url))
  main(process.argv.slice(2)).catch(e=>{console.error(JSON.stringify(redact(e.result ?? {kind:'local_error',message:e.message})));process.exitCode=1;});
