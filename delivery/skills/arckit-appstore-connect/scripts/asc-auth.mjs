import { isMain } from './cli-entry.mjs';
import { mkdir, lstat, readFile, writeFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createPrivateKey } from 'node:crypto';

export const defaultRoot = () => join(homedir(), '.config', 'arckit', 'appstore-connect');
function profilePath(root, name) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(name || '')) throw Error('Invalid profile name');
  return join(root, name + '.json');
}
async function secure(path, directory = false) {
  const s = await lstat(path);
  if (s.isSymbolicLink() || (directory ? !s.isDirectory() : !s.isFile()) ||
      (s.mode & 0o077) || s.uid !== process.getuid()) throw Error('Unsafe credential storage permissions or owner');
}
function validate(p) {
  if (p.version !== 1 || !/^[A-Za-z0-9]+$/.test(p.keyId || '') ||
      !/^[a-fA-F0-9-]{36}$/.test(p.issuerId || '')) throw Error('Invalid team key metadata');
  let key;
  try { key = createPrivateKey(p.privateKey); } catch { throw Error('Invalid private key'); }
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1')
    throw Error('Expected ES256/P-256 private key');
  return p;
}
export async function registerProfile(name, keyId, issuerId, source, root = defaultRoot()) {
  return storeProfile(name,keyId,issuerId,await readFile(source,'utf8'),root);
}
export async function storeProfile(name, keyId, issuerId, privateKey, root = defaultRoot()) {
  if (typeof process.getuid !== 'function') throw Error('Use an existing secret provider on this platform');
  const target = profilePath(root, name);
  const p = validate({version:1, keyId, issuerId, privateKey});
  await mkdir(root, {recursive:true, mode:0o700});
  await secure(root, true);
  await writeFile(target, JSON.stringify(p), {flag:'wx', mode:0o600});
  return {profile:name, stored:true};
}
export async function loadProfile(name, root = defaultRoot()) {
  const path = profilePath(root, name);
  await secure(root, true);
  await secure(path);
  let p;
  try { p = JSON.parse(await readFile(path, 'utf8')); } catch { throw Error('Cannot parse credential profile'); }
  return validate(p);
}
export async function listProfiles(root = defaultRoot()) {
  try { await secure(root, true); } catch (e) { if(e.code === 'ENOENT') return []; throw e; }
  return (await readdir(root)).filter(n => /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}\.json$/.test(n)).map(n=>n.slice(0,-5));
}
async function main() {
  const [action,...args] = process.argv.slice(2);
  if(action === 'list' && !args.length) console.log(JSON.stringify(await listProfiles()));
  else if(action === 'register' && args.length === 4) console.log(JSON.stringify(await registerProfile(...args)));
  else throw Error('Usage: asc-auth.mjs list | register <profile> <key-id> <issuer-id> <p8-path>');
}
if(isMain(import.meta.url))
  main().catch(e=>{console.error(JSON.stringify({kind:'credential_error',message:e.code || e.message}));process.exitCode=1;});
