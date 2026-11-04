// TecLab · Laboratoris d'identificació de components · CI1
import {seededRandom,randomSeed,checksum} from './exercises.js';
const digits=['negre','marró','vermell','taronja','groc','verd','blau','violeta','gris','blanc'];
const colorNumber={negre:0,marró:1,vermell:2,taronja:3,groc:4,verd:5,blau:6,violeta:7,gris:8,blanc:9};
const tolerance={J:5,K:10,M:20};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const rand=(r,a,b)=>a+Math.floor(r()*(b-a+1));
export function threeDigit(code,base='pF'){
 if(!/^\d{3}$/.test(String(code)))throw Error('Marcatge de tres dígits invàlid');
 const n=Number(String(code).slice(0,2))*10**Number(String(code)[2]);
 return {value:n,unit:base};
}
// Codificació històrica de condensadors de pel·lícula: 3 bandes de valor,
// dues xifres significatives i multiplicador en picofarads.
// No s'infereixen tolerància ni tensió a partir de bandes addicionals,
// perquè els sistemes canvien segons fabricant i tecnologia.
export function capacitorBands(bands){
 if(!Array.isArray(bands)||bands.length!==3)throw Error('Calen tres bandes de valor');
 const [a,b,m]=bands;
 if(!(a in colorNumber)||!(b in colorNumber)||!(m in colorNumber)||colorNumber[a]===0)
  throw Error('Colors de capacitat no vàlids');
 return {value:(10*colorNumber[a]+colorNumber[b])*10**colorNumber[m],unit:'pF'};
}
export function axialBands(bands){
 if(!Array.isArray(bands)||bands.length!==4)throw Error('Calen quatre bandes');
 const [a,b,m,t]=bands;
 if(!(a in colorNumber)||!(b in colorNumber)||!(m in colorNumber)||!['daurat','platejat'].includes(t))throw Error('Colors incorrectes');
 if(colorNumber[a]===0)throw Error('Primera banda invàlida');
 return {value:(10*colorNumber[a]+colorNumber[b])*10**colorNumber[m],unit:'µH',tolerance:t==='daurat'?5:10};
}
export function range(value,pct){return {min:value*(1-pct/100),max:value*(1+pct/100)};}
const fmt=n=>Number(n.toPrecision(8)).toString();
export function makeComponentCode(lab,level,kind,seed){
 if(!['009','010'].includes(lab)||![1,2,3].includes(level)||!Number.isInteger(kind)||kind<0||kind>9||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Dades del codi incorrectes');
 const body='TL-CI1-'+lab+'-'+level+'-'+kind+'-'+seed.toString(36).toUpperCase();
 return body+'-'+checksum(body);
}
export function readComponentCode(text){
 const m=/^TL-CI1-(009|010)-([123])-([0-9])-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(String(text).trim().toUpperCase());
 if(!m)throw Error('Codi no reconegut. Cal un codi TL-CI1.');
 const lab=m[1],level=Number(m[2]),kind=Number(m[3]),seed=parseInt(m[4],36);
 if(seed>0xffffffff||makeComponentCode(lab,level,kind,seed)!==m[0])throw Error('El codi té un error de transcripció.');
 return {lab,level,kind,seed};
}
function capacitor(level,kind,r){
 const pair=pick(r,[10,12,15,22,33,47,68]),exp=rand(r,1,5),code=String(pair)+exp, pf=threeDigit(code).value,nf=pf/1000;
 const mark=pick(r,['J','K','M']), tol=tolerance[mark];
 const body={component:'ceramic',mark:code,tag:mark,unit:'nF'};
 if(level===1&&kind===2){
  const colors=[digits[Math.floor(pair/10)],digits[pair%10],digits[exp]];
  return {title:'Lectura de bandes de colors',question:'En aquest condensador de pel·lícula amb codi històric de tres bandes, quina capacitat nominal indica, en nF? Les bandes representen dues xifres i multiplicador en pF.',visual:{component:'banded-capacitor',bands:colors},answer:capacitorBands(colors).value/1000,unit:'nF',solution:colors.join(' · ')+' = '+pair+' × 10^'+exp+' pF = '+fmt(nf)+' nF. Aquestes tres bandes no indiquen ni la tolerància ni la tensió nominal.'};
 }
 if(level===2&&kind===2){
  const colors=[digits[Math.floor(pair/10)],digits[pair%10],digits[exp]];
  return {title:'Bandes i conversió d’unitats',question:'Calcula la capacitat d’aquest condensador codificat per tres bandes, en µF. Fes servir dues xifres significatives i el multiplicador en pF.',visual:{component:'banded-capacitor',bands:colors},answer:capacitorBands(colors).value/1e6,unit:'µF',solution:colors.join(' · ')+' = '+fmt(pf)+' pF = '+fmt(pf/1e6)+' µF.'};
 }
 if(level===3&&kind===3){
  const colors=[digits[Math.floor(pair/10)],digits[pair%10],digits[exp]];
  return {title:'Identificació d’un marcatge per bandes',question:'Un condensador amb tres bandes de valor indica quants picofarads? No assumeixis cap codi de tolerància o tensió.',visual:{component:'banded-capacitor',bands:colors},answer:capacitorBands(colors).value,unit:'pF',solution:'Primera banda = '+Math.floor(pair/10)+', segona = '+pair%10+', tercera = ×10^'+exp+'. C = '+fmt(pf)+' pF.'};
 }
 if(level===3&&(kind===4||kind===5)){
  const base=pick(r,[10,22,47,100,220,470]);
  const other=pick(r,[10,22,47,100,220,470]);
  const conn=kind===4?'parallel':'series';
  const result=conn==='parallel'?base+other:base*other/(base+other);
  return {title:'Associació bàsica de condensadors',question:'Calcula la capacitat equivalent de C1 i C2 en '+(conn==='parallel'?'paral·lel':'sèrie')+', en nF. Considera components ideals sense càrrega inicial.',visual:{component:'capacitor-network',connection:conn,values:[base,other]},answer:result,unit:'nF',solution:conn==='parallel'?'Ceq = C1 + C2 = '+base+' + '+other+' = '+fmt(result)+' nF.':'Ceq = (C1 × C2)/(C1 + C2) = ('+base+' × '+other+')/('+base+' + '+other+') = '+fmt(result)+' nF.'};
 }
 if(level===1&&kind===0)return {title:'Lectura d’un condensador ceràmic',question:'Quina capacitat té aquest condensador, en nF? El codi de tres dígits s’expressa en pF.',visual:body,answer:nf,unit:'nF',solution:code+' = '+pair+' × 10^'+exp+' pF = '+fmt(nf)+' nF.'};
 if(level===1)return {title:'Conversió d’unitats',question:'Expressa en pF el valor nominal del condensador indicat.',visual:{component:'film',mark:fmt(nf)+' nF'},answer:pf,unit:'pF',solution:fmt(nf)+' nF = '+fmt(pf)+' pF.'};
 if(level===2&&kind===0)return {title:'Marcatge de tolerància',question:'Quina tolerància percentual correspon a la lletra indicada? Adopta la convenció J = ±5 %, K = ±10 %, M = ±20 %.',visual:body,answer:tol,unit:'%',solution:'La lletra '+mark+' correspon a una tolerància de ±'+tol+' %.'};
 if(level===2)return {title:'Límit inferior de capacitat',question:'Calcula la capacitat mínima admissible en nF segons el valor nominal i la tolerància indicats.',visual:body,answer:range(nf,tol).min,unit:'nF',solution:'C mínima = '+fmt(nf)+' × (1 − '+tol+'/100) = '+fmt(range(nf,tol).min)+' nF.'};
 if(kind===0){const rating=pick(r,[16,25,35,50,63]);return {title:'Tensió nominal',question:'Quina tensió màxima de treball en V s’indica en aquest condensador electrolític? La inscripció és explícita; no cal deduir-la de la capacitat.',visual:{component:'electro',mark:pick(r,[47,100,220,470])+' µF',tag:rating+' V',polarity:'−'},answer:rating,unit:'V',solution:'La tensió nominal indicada és '+rating+' V. Cal respectar també la polaritat.'};}
 if(kind===1)return {title:'Límit superior de capacitat',question:'Calcula la capacitat màxima en nF dins de la tolerància indicada.',visual:body,answer:range(nf,tol).max,unit:'nF',solution:'C màxima = '+fmt(nf)+' × (1 + '+tol+'/100) = '+fmt(range(nf,tol).max)+' nF.'};
 const value=pick(r,[10,22,47,100,220]);return {title:'Polaritat d’un condensador',question:'En un condensador electrolític d’alumini convencional, què identifica la franja amb el símbol «−»?',visual:{component:'electro',mark:value+' µF',tag:'25 V',polarity:'−'},choices:['Terminal positiu','Terminal negatiu','Valor de tolerància'],answer:'Terminal negatiu',solution:'En aquest tipus de condensador la franja amb «−» assenyala el terminal negatiu. No tots els condensadors són polaritzats.'};
}
function inductor(level,kind,r){
 const pair=pick(r,[10,12,15,22,33,47,68]),exp=rand(r,0,3),code=String(pair)+exp, micro=threeDigit(code,'µH').value;
 const first=Math.floor(pair/10),second=pair%10;
 const band=[digits[first],digits[second],digits[exp],pick(r,['daurat','platejat'])];
 const decoded=axialBands(band);
 if(level===1&&kind===0)return {title:'Marcatge numèric d’una inductància',question:'Amb la convenció de tres dígits en µH, quina inductància nominal indica el codi?',visual:{component:'axial',mark:code},answer:micro,unit:'µH',solution:code+' = '+pair+' × 10^'+exp+' µH = '+fmt(micro)+' µH.'};
 if(level===1)return {title:'Conversió d’inductància',question:'Converteix el valor nominal indicat de µH a mH.',visual:{component:'axial',mark:fmt(micro)+' µH'},answer:micro/1000,unit:'mH',solution:fmt(micro)+' µH / 1000 = '+fmt(micro/1000)+' mH.'};
 if(level===2&&kind===0)return {title:'Lectura de bandes de colors',question:'Calcula la inductància nominal en µH. Bandes llegides d’esquerra a dreta: dues xifres, multiplicador i tolerància.',visual:{component:'axial',bands:band},answer:decoded.value,unit:'µH',solution:band.slice(0,3).join(', ')+' → '+fmt(decoded.value)+' µH.'};
 if(level===2)return {title:'Tolerància de la bobina',question:'Quina tolerància percentual correspon a la quarta banda? Daurat = ±5 % i platejat = ±10 %.',visual:{component:'axial',bands:band},answer:decoded.tolerance,unit:'%',solution:'La banda '+band[3]+' correspon a ±'+decoded.tolerance+' %.'};
 if(kind===0)return {title:'Inductància mínima',question:'Calcula el límit inferior d’inductància en µH segons les bandes i la tolerància.',visual:{component:'axial',bands:band},answer:range(decoded.value,decoded.tolerance).min,unit:'µH',solution:'L mínima = '+fmt(decoded.value)+' × (1 − '+decoded.tolerance+'/100) = '+fmt(range(decoded.value,decoded.tolerance).min)+' µH.'};
 if(kind===1)return {title:'Inductància màxima',question:'Calcula el límit superior d’inductància en µH segons les bandes i la tolerància.',visual:{component:'axial',bands:band},answer:range(decoded.value,decoded.tolerance).max,unit:'µH',solution:'L màxima = '+fmt(decoded.value)+' × (1 + '+decoded.tolerance+'/100) = '+fmt(range(decoded.value,decoded.tolerance).max)+' µH.'};
 return {title:'Reconeixement d’una bobina toroidal',question:'Quina construcció representa el component dibuixat?',visual:{component:'toroid',mark:fmt(micro)+' µH'},choices:['Inductància toroidal','Condensador electrolític','Resistència axial'],answer:'Inductància toroidal',solution:'El bobinatge sobre un nucli en forma d’anell correspon a una inductància toroidal. El corrent nominal no es pot deduir de l’aspecte.'};
}
export function generateComponent(lab,level,seed=randomSeed(),forcedKind=null){
 if(!['009','010'].includes(lab)||![1,2,3].includes(level))throw Error('Laboratori o nivell no vàlid');
 const r=seededRandom(seed);
 const oldCount=level===3?3:2;
 const count=lab==='009'?(level===3?6:3):oldCount;
 // Una sola extracció aleatòria: els codis TL-CI1 existents amb kind
 // explícit conserven exactament els mateixos valors d'exercici.
 const selected=Math.floor(r()*count);
 const kind=forcedKind===null?selected:forcedKind;
 if(!Number.isInteger(kind)||kind<0||kind>=count)throw Error('Tipus d’exercici no vàlid');
 const q=lab==='009'?capacitor(level,kind,r):inductor(level,kind,r);
 return {...q,lab,level,kind,seed,code:makeComponentCode(lab,level,kind,seed)};
}
export function checkComponentAnswer(text,q){
 if(q.choices)return {ok:text===q.answer,message:text===q.answer?'Correcte.':'Revisa la identificació del component.'};
 const n=Number(String(text).trim().replace(',','.'));
 if(!String(text).trim()||!Number.isFinite(n))return {ok:false,message:'Introdueix un nombre vàlid.'};
 const toleranceValue=Math.max(0.005,Math.abs(q.answer)*0.005);
 return {ok:Math.abs(n-q.answer)<=toleranceValue,message:Math.abs(n-q.answer)<=toleranceValue?'Correcte. El valor és dins la tolerància.':'Comprova el codi, les unitats i l’arrodoniment.'};
}
