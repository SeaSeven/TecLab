import {checksum,seededRandom,randomSeed} from '../../shared/services/exercises.js';
export const levelKinds={
 inicial:[['R2','Tensió als extrems de R2'],['R1','Tensió als extrems de R1'],['ANY','Exercici aleatori']],
 basic:[['SOURCE','Tensió de la font'],['REVERSE','Polaritat invertida'],['ANY','Exercici aleatori']],
 intermedi:[['LOW','Selecció correcta del rang'],['DIAG','Diagnosi de connexions'],['ANY','Exercici aleatori']],
 avancat:[['MULTI','Mesura entre nodes'],['RANGE','Tria del rang més petit vàlid'],['ANY','Exercici aleatori']]
};
const levels=Object.keys(levelKinds);
export function codeOf(level,kind,seed){
 if(!levels.includes(level)||!levelKinds[level].some(([id])=>id===kind)||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Paràmetres no vàlids.');
 const body='TL-MM1-'+level.toUpperCase()+'-'+kind+'-'+seed.toString(36).toUpperCase();
 return body+'-'+checksum(body);
}
export function fromCode(input){
 const code=String(input).trim().toUpperCase(),m=/^TL-MM1-(INICIAL|BASIC|INTERMEDI|AVANCAT)-([A-Z0-9]+)-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(code);
 if(!m)throw Error('Codi no vàlid. Exemple: TL-MM1-INICIAL-R2-...');
 const level=m[1].toLowerCase(),kind=m[2],seed=parseInt(m[3],36);
 if(codeOf(level,kind,seed)!==code)throw Error('Codi incorrecte: revisa els caràcters.');
 return {level,kind,seed};
}
export function generate(level='inicial',kind='R2',seed=randomSeed()){
 const code=codeOf(level,kind,seed),rng=seededRandom(seed),pick=a=>a[Math.floor(rng()*a.length)];
 const voltage=pick([6,9,12,15,18,24]),r1=pick([470,680,1000,1500,2200]),r2=pick([680,1000,1500,2200,3300]);
 const effective=kind==='ANY'?pick(levelKinds[level].filter(([id])=>id!=='ANY').map(([id])=>id)):kind;
 const nodes=effective==='R1'?['A','B']:effective==='REVERSE'?['C','B']:effective==='SOURCE'?['A','C']:effective==='MULTI'?pick([['A','B'],['B','C'],['A','C']]):effective==='DIAG'?pick([['A','B'],['B','C']]):['B','C'];
 const [red,black]=nodes;const values={A:voltage,B:voltage*r2/(r1+r2),C:0},expected=values[red]-values[black];
 const range= Math.abs(expected)<=.2?'VDC200m':Math.abs(expected)<=2?'VDC2':Math.abs(expected)<=20?'VDC20':'VDC200';
 const texts={R1:'Mesura la tensió als extrems de R1.',R2:'Mesura la tensió als extrems de R2.',SOURCE:'Mesura la tensió de la font.',REVERSE:'Mesura la tensió de C respecte de B. Observa el signe de la lectura.',LOW:'Mesura R2. Comença amb un rang baix i ajusta’l fins a obtenir lectura.',DIAG:'Localitza els nodes correctes, selecciona l’entrada VΩ i mesura la tensió indicada.',MULTI:'Determina la diferència de potencial indicada entre els nodes.',RANGE:'Mesura R2 utilitzant el rang de tensió continu més petit que admeti el valor.'};
 return {level,kind,seed,effective,code,voltage,r1,r2,red,black,expected,range,text:texts[effective],strictRange:effective==='RANGE'};
}
