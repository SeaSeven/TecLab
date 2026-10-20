// LAB-008 v1.0. Model de senyals i codis deterministes.
export const waves={sin:'Sinusoidal',square:'Quadrada',triangle:'Triangular',pulse:'Polsos PWM'};
export const modes={direct:'Configuració directa',peak:'Amplitud de pic',bounds:'Límits de tensió',period:'Període indicat',rms:'Valor eficaç (AC)',load:'Càrrega de 50 Ω'};
export const levels=['inicial','intermedi','avancat'];
const mod=x=>((x%1)+1)%1;
const relative=(a,b)=>Math.abs(a-b)<=Math.max(1e-7,Math.abs(b)*.005);
export const close=relative;
export function sample(s,t){
 if(!s.output)return 0;
 const p=mod(t*s.frequency+(s.phase||0)/360),duty=(s.wave==='square'?50:(s.duty??50))/100;
 let v=0;
 if(s.wave==='square'||s.wave==='pulse')v=p<duty?1:-1;
 else if(s.wave==='triangle')v=1-4*Math.abs(p-.5);
 else v=Math.sin(2*Math.PI*p);
 return s.offset+s.vpp*v/2;
}
export const bounds=s=>({min:s.offset-s.vpp/2,max:s.offset+s.vpp/2});
export const rmsAC=s=>s.wave==='sin'?s.vpp/(2*Math.SQRT2):s.wave==='triangle'?s.vpp/(2*Math.sqrt(3)):s.wave==='square'?s.vpp/2: s.vpp*Math.sqrt((s.duty/100)*(1-s.duty/100));
export function limitStatus(s){
 const limit=s.load==='50ohm'?5:10;
 const b=bounds(s);
 const errors=[];
 if(!Number.isFinite(s.frequency)||s.frequency<1||s.frequency>100000)errors.push('Freqüència fora d’1 Hz – 100 kHz.');
 if(!Number.isFinite(s.vpp)||s.vpp<=0||s.vpp>20)errors.push('L’amplitud ha de ser superior a 0 i no pot excedir 20 Vpp.');
 if(!Number.isFinite(s.offset))errors.push('Offset no vàlid.');
 if(b.min< -limit-1e-8||b.max>limit+1e-8)errors.push('Els nivells de sortida superen ±'+limit+' V per a '+(s.load==='50ohm'?'50 Ω':'High-Z')+'.');
 if(!Number.isFinite(s.duty)||s.duty<5||s.duty>95)errors.push('Cicle de treball fora del 5–95 %.');
 if(!Number.isFinite(s.phase)||s.phase<0||s.phase>359)errors.push('La fase ha de ser entre 0 i 359°.');
 return {ok:errors.length===0,errors,limit};
}
export function verify(s,goal){
 const checks=[['Forma d’ona',s.wave===goal.wave],['Freqüència',relative(s.frequency,goal.frequency)],['Tensió pic a pic',relative(s.vpp,goal.vpp)],['Sortida activada',s.output],['Offset',relative(s.offset,goal.offset)]];
 if(goal.wave==='pulse')checks.push(['Cicle de treball',relative(s.duty,goal.duty)]);
 if(goal.wave==='sin')checks.push(['Fase',relative(s.phase,goal.phase)]);
 if(goal.mode==='load')checks.push(['Impedància de càrrega',s.load===goal.load]);
 checks.push(['Límits de sortida',limitStatus(s).ok]);
 return checks;
}
function checksum(x){let h=2166136261;for(const c of x){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36).toUpperCase().padStart(7,'0')}
const waveCodes={random:'R',sin:'S',square:'Q',triangle:'T',pulse:'P'};
const codeWaves=Object.fromEntries(Object.entries(waveCodes).map(([k,v])=>[v,k]));
const kindCodes={direct:'D',peak:'A',bounds:'B',period:'T',rms:'E',load:'L'};
const codeKinds=Object.fromEntries(Object.entries(kindCodes).map(([k,v])=>[v,k]));
export function codeFor(level,seed,wave='random',kind='direct'){
 const n=levels.indexOf(level);if(n<0||!Number.isInteger(seed)||seed<0||seed>0xFFFFFFFF)throw Error('Dades de codi invàlides');
 const base=(n+1)+'-'+seed.toString(36).toUpperCase()+'-'+(waveCodes[wave]||'R');
 const body=kind==='direct'?base:base+'-'+kindCodes[kind];
 if(kind!=='direct'&&!kindCodes[kind])throw Error('Modalitat invàlida');
 return (kind==='direct'?'TL-GEN1-':'TL-GEN2-')+body+'-'+checksum(body);
}
export function fromCode(raw){
 const code=String(raw||'').trim().toUpperCase();
 const match=/^TL-GEN([12])-([123])-([0-9A-Z]+)-([RSQTP])(?:-([DABTEL]))?-([0-9A-Z]{7})$/.exec(code);
 if(!match||match[1]==='1'&&match[5]||match[1]==='2'&&!match[5])throw Error('Format de codi no reconegut.');
 const body=match[2]+'-'+match[3]+'-'+match[4]+(match[5]?'-'+match[5]:'');
 if(checksum(body)!==match[6])throw Error('El codi conté un error de transcripció.');
 const seed=parseInt(match[3],36);
 if(!Number.isSafeInteger(seed)||seed>0xFFFFFFFF)throw Error('Llavor incorrecta.');
 return match[5]?{level:levels[Number(match[2])-1],seed,wave:codeWaves[match[4]],kind:codeKinds[match[5]]}:{level:levels[Number(match[2])-1],seed,wave:codeWaves[match[4]]};
}
function prng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
export function exercise(level,seed,requested='random',kind='direct'){
 if(!levels.includes(level))throw Error('Nivell desconegut');
 const r=prng(seed);
 const choices=level==='inicial'?['sin','square','triangle']:['sin','square','triangle','pulse'];
 const wave=choices.includes(requested)?requested:pick(r,choices);
 let frequency=pick(r,[100,200,250,500,1000,2000,2500,5000,10000]);
 let vpp=pick(r,[1,2,3,4,5,6,8,10]);
 let offset=level==='inicial'?0:pick(r,[-2,-1,-.5,0,.5,1,2]);
 let duty=wave==='pulse'?pick(r,[20,25,30,40,60,70,75,80]):50;
 let phase=level==='avancat'&&wave==='sin'?pick(r,[0,30,45,90,120,180,270]):0;
 const load=kind==='load'?'50ohm':'highz';
 if(kind==='load'){vpp=pick(r,[1,2,3,4,6]);offset=pick(r,[-1,-.5,0,.5,1]);}
 if(kind==='bounds'){vpp=pick(r,[2,4,6,8]);offset=pick(r,[-1,0,1]);}
 if(kind==='rms'&&wave==='pulse')kind='peak';
 if(kind==='rms'&&vpp%2!==0)vpp=pick(r,[2,4,6,8]);
 if(kind==='period')frequency=pick(r,[100,200,250,500,1000,2000,2500,5000]);
 const ex={level,seed,wave,frequency,vpp,offset,duty,phase,load,mode:kind};
 if(!limitStatus(ex).ok){ex.vpp=4;ex.offset=0;}
 return ex;
}
