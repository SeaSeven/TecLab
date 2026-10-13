import {checksum,seededRandom,randomSeed} from '../../shared/services/exercises.js';
export const levelKinds={
 inicial:[
  ['R2','Caiguda de tensió a R2'],
  ['R1','Caiguda de tensió a R1'],
  ['SOURCE','Tensió de la font'],
  ['ZERO','Dos punts del mateix potencial'],
  ['ANY','Exercici aleatori del nivell']
 ],
 basic:[
  ['REVERSE','Mesura amb polaritat negativa'],
  ['REV_SOURCE','Font amb les puntes invertides'],
  ['RV1','Tensió negativa a R1'],
  ['RV2','Tensió negativa a R2'],
  ['RANGE','Selecció del rang mínim adequat'],
  ['ANY','Exercici aleatori del nivell']
 ],
 intermedi:[
  ['LOW','Recuperar una lectura fora d’escala'],
  ['DIAG','Diagnosi de connexió i escala'],
  ['MID','Potencial del node intermedi'],
  ['REF_A','Tensió del node C respecte a A'],
  ['RATIO','Divisor amb resistències de valors diferents'],
  ['ANY','Exercici aleatori del nivell']
 ],
 avancat:[
  ['MULTI','Mesura entre nodes aleatoris'],
  ['NEG_RANGE','Mesura negativa amb rang òptim'],
  ['MIN_SOURCE','Tensió de la font amb rang òptim'],
  ['COMPARE','Comparar caigudes del divisor'],
  ['POLARITY','Diagnosi de polaritat sense pistes'],
  ['ANY','Exercici aleatori del nivell']
 ]
};
const levels=Object.keys(levelKinds);
export function codeOf(level,kind,seed){
 if(!levels.includes(level)||!levelKinds[level].some(([id])=>id===kind)||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Paràmetres no vàlids.');
 const body='TL-MM1-'+level.toUpperCase()+'-'+kind+'-'+seed.toString(36).toUpperCase();
 return body+'-'+checksum(body);
}
export function fromCode(input){
 const code=String(input).trim().toUpperCase(),m=/^TL-MM1-(INICIAL|BASIC|INTERMEDI|AVANCAT)-([A-Z0-9_]+)-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(code);
 if(!m)throw Error('Codi no vàlid. Exemple: TL-MM1-INICIAL-R2-...');
 const level=m[1].toLowerCase(),kind=m[2],seed=parseInt(m[3],36);
 if(codeOf(level,kind,seed)!==code)throw Error('Codi incorrecte: revisa els caràcters.');
 return {level,kind,seed};
}
export function generate(level='inicial',kind='R2',seed=randomSeed()){
 const code=codeOf(level,kind,seed),rng=seededRandom(seed),pick=a=>a[Math.floor(rng()*a.length)];
 const voltage=pick([6,9,12,15,18,24]),r1=pick([470,680,1000,1500,2200]);
 let r2=pick([680,1000,1500,2200,3300]);
 if(kind==='RATIO'&&r2===r1)r2=r2===3300?680:3300;
 const effective=kind==='ANY'?pick(levelKinds[level].filter(([id])=>id!=='ANY').map(([id])=>id)):kind;
 const endpoints={
  R1:['A','B'],R2:['B','C'],SOURCE:['A','C'],ZERO:['B','B'],
  REVERSE:['C','B'],REV_SOURCE:['C','A'],RV1:['B','A'],RV2:['C','B'],
  RANGE:['B','C'],LOW:['B','C'],DIAG:['A','B'],MID:['B','C'],
  REF_A:['C','A'],RATIO:['A','B'],NEG_RANGE:['C','B'],
  MIN_SOURCE:['A','C'],COMPARE:['B','C'],POLARITY:['B','A']
 };
 const nodes=effective==='MULTI'?pick([['A','B'],['B','C'],['A','C']]):effective==='DIAG'?pick([['A','B'],['B','C']]):endpoints[effective];
 if(!nodes)throw Error('Tipus d’exercici desconegut.');
 const [red,black]=nodes,values={A:voltage,B:voltage*r2/(r1+r2),C:0};
 const expected=values[red]-values[black];
 const range=Math.abs(expected)<=.2?'VDC200m':Math.abs(expected)<=2?'VDC2':Math.abs(expected)<=20?'VDC20':'VDC200';
 const texts={
  R1:'Mesura la caiguda de tensió a R1.',R2:'Mesura la caiguda de tensió a R2.',
  SOURCE:'Mesura la tensió de la font d’alimentació.',
  ZERO:'Comprova la diferència de potencial entre dos contactes del node B.',
  REVERSE:'Mesura la tensió de C respecte de B. La polaritat és important.',
  REV_SOURCE:'Mesura el potencial de C respecte d’A.',
  RV1:'Mesura el potencial de B respecte d’A.',
  RV2:'Mesura la tensió de C respecte de B i interpreta el signe.',
  RANGE:'Mesura R2 amb el rang V⎓ més petit que pugui mostrar tota la lectura.',
  LOW:'Provoca una indicació OL amb una escala de V⎓ massa baixa i, després, mesura R2 correctament.',
  DIAG:'Comprova la caiguda de tensió a '+(red==='A'?'R1':'R2')+' i detecta possibles errors de born o escala.',
  MID:'Determina el potencial de B respecte de C, sense consultar la resolució.',
  REF_A:'Mesura el potencial de C respecte d’A i interpreta el signe.',
  RATIO:'Compara els valors de R1 i R2 i mesura la caiguda de tensió de R1.',
  MULTI:'Mesura V('+red+') − V('+black+') i interpreta el signe.',
  NEG_RANGE:'Mesura V(C) − V(B), amb signe negatiu i el rang mínim adequat.',
  MIN_SOURCE:'Mesura la tensió de la font amb el rang mínim adequat.',
  COMPARE:'Compara R1 i R2 i mesura la tensió a R2.',
  POLARITY:'Mesura V(B) − V(A) i interpreta per què la lectura té aquest signe.'
 };
 const strictRange=['RANGE','NEG_RANGE','MIN_SOURCE'].includes(effective);
 return {level,kind,seed,effective,code,voltage,r1,r2,red,black,expected,range,text:texts[effective],strictRange,requiresOverload:effective==='LOW'};

}
