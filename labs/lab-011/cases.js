import {checksum,seededRandom} from '../../shared/services/exercises.js';

// Format de cas: TL-PQ1-<llavor base36>-<suma de control>.
export const CASE_FORMAT='PQ1';
export const FAMILY_NAMES={
 A:'Subministrament estable',
 B:'Càrregues no lineals',
 C:'Sot de tensió',
 D:'Desequilibri trifàsic',
 E:'Variació de càrrega',
 F:'Pertorbació esporàdica',
 G:'Combinació de fenòmens'
};
export function codeForCase(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('Llavor fora de rang.');
 const body='TL-'+CASE_FORMAT+'-'+seed.toString(36).toUpperCase();
 return body+'-'+checksum(body);
}
export function parseCaseCode(raw){
 const value=String(raw).trim().toUpperCase();
 const match=/^TL-PQ1-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(value);
 if(!match)throw new RangeError('Codi de cas no vàlid o versió incompatible.');
 const seed=parseInt(match[1],36);
 if(!Number.isSafeInteger(seed)||seed>0xffffffff||codeForCase(seed)!==value)
   throw new RangeError('Codi de cas amb errors de transcripció.');
 return {seed,code:value,format:CASE_FORMAT};
}
const round=(x,n=6)=>Number(x.toFixed(n));
const families=['A','B','C','D','E','F','G'];
function pick(rng,arr){return arr[Math.floor(rng()*arr.length)];}
function makePoint(id,label,ratio,factors){
 return {id,label,voltageRatio:ratio,currentFactors:factors};
}
export function generateCase(seed){
 const rng=seededRandom(seed);
 const family=families[seed%families.length];
 const threePhase=true; // Referència comuna Pt 2.2: CA trifàsica 400/230 V, 50 Hz
 const phases=threePhase?3:1;
 const baseVoltage=230;
 const voltageScale=round(.985+rng()*.03);
 const frequency=round(49.92+rng()*.16,4);
 const baseCurrent=round(3.5+rng()*5.5);
 const baseAngle=round((12+rng()*20)*Math.PI/180);
 const distortion=['B','G'].includes(family);
 const voltageHarmonics=distortion?{5:round(.012+rng()*.016),7:round(.007+rng()*.012)}:{5:round(.002+rng()*.005)};
 const currentHarmonics=distortion?{3:round(.07+rng()*.07),5:round(.13+rng()*.12),7:round(.07+rng()*.09)}:{5:round(.015+rng()*.035)};
 // El model representa magnituds de la tensió i del corrent, no equipara THD-U i THD-I.
 const phaseScales=Array.from({length:phases},(_,i)=>
   family==='D'||family==='G'?round(1+(i===0?-.03:i===1?.023:.009)*(0.7+rng()*.7)):round(1+(rng()-.5)*.008));
 const phaseCurrents=Array.from({length:phases},(_,i)=>
   round(baseCurrent*(family==='D'||family==='G'?[.88,1.12,1.04][i]:1)*(0.95+rng()*.1)));
 const eventStart=round(80+Math.floor(rng()*300));
 const events=[];
 if(['C','G'].includes(family)) events.push({
   id:'EV-SAG',kind:'sag',start:eventStart,duration:round(.4+rng()*1.6),
   voltageFactor:round(.66+rng()*.17),currentFactor:1
 });
 if(family==='E'||family==='G') events.push({
   id:'EV-LOAD',kind:'load',start:eventStart+45,duration:round(45+rng()*70),
   voltageFactor:1,currentFactor:round(1.3+rng()*.45)
 });
 if(family==='F') events.push({
   id:'EV-SHORT',kind:'sag',start:eventStart,duration:round(.08+rng()*.16),
   voltageFactor:round(.75+rng()*.11),currentFactor:1
 });
 const points=[
   makePoint('PCC','Entrada del quadre general',1,Array(phases).fill(1)),
   makePoint('DRIVE','Alimentació del variador de freqüència',.993,Array(phases).fill(.65)),
   makePoint('CTRL','Entrada de la font de control',.997,Array(phases).fill(.24))
 ];
 // Cada punt té el seu propi espectre: les càrregues parcials no són còpies exactes del PCC.
 const code=codeForCase(seed);
 return {
   format:CASE_FORMAT,seed,code,family,phases,nominalVoltage:baseVoltage,
   nominalLineVoltage:threePhase?400:null,frequency,
   voltageScale,baseAngle,phaseScales,phaseCurrents,
   voltageHarmonics,currentHarmonics,points,events,
   horizonSeconds:900
 };
}
export function classCases(count=30){
 if(!Number.isInteger(count)||count<1||count>10000)throw new RangeError('Quantitat no vàlida.');
 // Distribució de famílies per llavor: 30 codis diferents, sense dades personals.
 // La comparabilitat final requereix validació docent amb rúbrica de complexitat.
 return Array.from({length:count},(_,i)=>{
   const seed=100000+i;
   const scenario=generateCase(seed);
   return {number:i+1,code:scenario.code,family:scenario.family,phases:scenario.phases};
 });
}
