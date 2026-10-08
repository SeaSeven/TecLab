import { readdir, readFile, writeFile } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const dirs=(await readdir(new URL('labs/',root))).sort();
const labs=await Promise.all(dirs.map(d=>readFile(new URL(`labs/${d}/metadata.json`,root),'utf8').then(JSON.parse)));
if(new Set(labs.map(l=>l.id)).size!==labs.length) throw new Error('Identificadors duplicats');
await writeFile(new URL('data/laboratories.json',root),JSON.stringify(labs,null,2)+'\n');
console.log(`Catàleg: ${labs.length} laboratoris`);
