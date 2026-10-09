import { seededRandom, checksum } from '../../shared/services/exercises.js';
export const number=x=>Number(x).toLocaleString('ca-ES',{maximumSignificantDigits:5});
export function solve(node,voltage){
 const resistance=n=>n.type==='R'?n.value:n.type==='S'?n.children.reduce((s,c)=>s+resistance(c),0):1/n.children.reduce((s,c)=>s+1/resistance(c),0);
 const visit=(n,v)=>{const r=resistance(n),i=v/r;return {...n,resistance:r,voltage:v,current:i,power:v*i,...(n.children?{children:n.children.map(c=>visit(c,n.type==='P'?v:i*resistance(c)))}:{})};};
 if(!Number.isFinite(voltage)||voltage<=0)throw Error('La tensió ha de ser positiva.');
 return visit(node,voltage);
}
export function leaves(n){return n.type==='R'?[n]:n.children.flatMap(leaves);}
export function groups(n){return n.type==='R'?[]:[...n.children.flatMap(groups),n];}
export function codeOf(count,seed){if(!Number.isInteger(count)||count<2||count>10||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Paràmetres no vàlids.');const body=`TL-CC1-${count}-${seed.toString(36).toUpperCase()}`;return body+'-'+checksum(body);}
export function readCode(input){const code=String(input).trim().toUpperCase(),m=/^TL-CC1-(\d+)-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(code);if(!m)throw Error('Utilitza un codi TL-CC1.');const count=+m[1],seed=parseInt(m[2],36);if(codeOf(count,seed)!==code)throw Error('El codi conté un error de transcripció.');return {count,seed};}
export function generate(count,seed){codeOf(count,seed);const rng=seededRandom(seed),pick=a=>a[Math.floor(rng()*a.length)];let serial=0,group=0;
 const build=(n,type,depth=0)=>{if(n===1)return {type:'R',id:'R'+(++serial),value:pick([100,150,220,330,470,680,1000,1500,2200])};const left=1+Math.floor(rng()*(n-1));return {type,id:'G'+(++group),children:[build(left,type==='S'?'P':'S',depth+1),build(n-left,type==='S'?'P':'S',depth+1)]};};
 const voltage=pick([6,9,12,24,36,48]),root=solve(build(count,rng()<.65?'S':'P'),voltage);return {count,seed,voltage,root,code:codeOf(count,seed)};
}
export function checkAnswer(raw,unit,expected){if(String(raw).trim()==='')return 'empty';const value=Number(String(raw).trim().replace(',','.'))*unit;if(!Number.isFinite(value))return 'invalid';const tol=Math.max(Math.abs(expected)*.02+Number.EPSILON*Math.max(1,Math.abs(expected))*8,1e-10);if(Math.abs(value-expected)<=tol)return 'correct';if(Math.abs(value*1000-expected)<=tol||Math.abs(value/1000-expected)<=tol)return 'units';return 'incorrect';}
