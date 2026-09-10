import { createRequire } from 'node:module';
import { readdir, chmod } from 'node:fs/promises';
import { dirname, join } from 'node:path';
const require=createRequire(import.meta.url);
const root=dirname(require.resolve('node-pty/package.json'));
// Published prebuilt spawn helpers can lack executable bits. Preserve a usable
// helper in dev and in the dependency tree copied into signed app packages.
for(const dir of [join(root,'prebuilds'),join(root,'build')]){
 async function visit(path){for(const e of await readdir(path,{withFileTypes:true}).catch(()=>[])){const file=join(path,e.name);if(e.isDirectory())await visit(file);else if(e.name==='spawn-helper')await chmod(file,0o755);}}
 await visit(dir);
}
