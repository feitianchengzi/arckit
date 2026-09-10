import { readFile, mkdir, writeFile, chmod, access, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));const manifest=JSON.parse(await readFile(join(root,'config/lazygit-distribution.json')));
const localArchive=process.argv[3]||'';
const target=process.argv[2]||`${process.platform}-${process.arch}`;const source=manifest.targets[target];if(!source)throw new Error('Unsupported Lazygit target '+target);
const output=join(root,'build-tools',target);const binary=target.startsWith('win32')?'lazygit.exe':'lazygit';
if(!localArchive)try{const receipt=JSON.parse(await readFile(join(output,'receipt.json')));await access(join(output,binary));if(receipt.archive_sha256===source.sha256){const actual=createHash('sha256').update(await readFile(join(output,binary))).digest('hex');if(actual===receipt.binary_sha256){console.log(join(output,binary));process.exit(0);}}}catch{}
const temporary=await mkdtemp(join(tmpdir(),'arcorbit-lazygit-'));
try{
 let bytes;if(localArchive)bytes=await readFile(localArchive);else {const response=await fetch(source.url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw new Error(`Lazygit download HTTP ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());}if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)throw new Error('Lazygit archive checksum mismatch');
 const archive=join(temporary,target.startsWith('win32')?'lazygit.zip':'lazygit.tar.gz');await writeFile(archive,bytes);
 const exec=promisify(execFile);
 if(target.startsWith('win32')&&process.platform==='win32')await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Expand-Archive -LiteralPath '${archive.replaceAll("'","''")}' -DestinationPath '${temporary.replaceAll("'","''")}'`]);
 else if(target.startsWith('win32'))await exec('unzip',['-q',archive,binary,'LICENSE','-d',temporary]);
 else await exec('tar',['-xzf',archive,'-C',temporary,binary,'LICENSE']);
 await mkdir(output,{recursive:true});await copyFile(join(temporary,binary),join(output,binary));await chmod(join(output,binary),0o755);await copyFile(join(temporary,'LICENSE'),join(output,'LICENSE'));
 const binary_sha256=createHash('sha256').update(await readFile(join(output,binary))).digest('hex');await writeFile(join(output,'receipt.json'),JSON.stringify({version:manifest.version,archive_sha256:source.sha256,binary_sha256,source:source.url}));console.log(join(output,binary));
}finally{await rm(temporary,{recursive:true,force:true});}
