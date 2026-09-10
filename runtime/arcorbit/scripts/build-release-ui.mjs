import { createRequire } from 'node:module';
import './prepare-native-terminal.mjs';
import { build } from 'esbuild';
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=join(root,'desktop/renderer/vendor');await mkdir(out,{recursive:true});
const worker=await build({absWorkingDir:root,entryPoints:['monaco-editor/editor/editor.worker.js'],bundle:true,format:'iife',write:false,minify:true});
await writeFile(join(out,'worker-source.mjs'),`export default ${JSON.stringify(worker.outputFiles[0].text)};\n`);
await build({absWorkingDir:root,entryPoints:['desktop/renderer/release-vendor.mjs'],bundle:true,splitting:true,format:'esm',outdir:out,entryNames:'release-vendor',chunkNames:'chunk-[hash]',assetNames:'[name]-[hash]',minify:true,loader:{'.ttf':'file'},logLevel:'warning'});
console.error('Release terminal/editor assets built.');

const require=createRequire(import.meta.url);
const packageRoot=name=>name==='monaco-editor'?resolve(dirname(require.resolve('monaco-editor/editor/editor.api.js')),'../../..'):dirname(require.resolve(name+'/package.json'));
const notice=[];
for(const name of ['@xterm/xterm','@xterm/addon-fit','@xterm/addon-search','@xterm/addon-web-links','@xterm/addon-serialize','monaco-editor']){
  const location=packageRoot(name);
  const pkg=JSON.parse(await readFile(join(location,'package.json'),'utf8'));
  let license='';for(const file of ['LICENSE','LICENSE.txt','LICENSE.md']){try{license=await readFile(join(location,file),'utf8');break;}catch{}}
  if(!license&&name.startsWith('@xterm/'))license=await readFile(join(dirname(require.resolve('@xterm/xterm/package.json')),'LICENSE'),'utf8');
  if(!license)throw new Error('Missing license for '+name);
  notice.push(name+' '+pkg.version+'\n'+license);
}
await writeFile(join(out,'THIRD_PARTY_LICENSES.txt'),notice.join('\n\n'));

await copyFile(join(packageRoot('monaco-editor'),'ThirdPartyNotices.txt'),join(out,'MONACO_THIRD_PARTY_NOTICES.txt'));
