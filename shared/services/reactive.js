// TecLab · LAB-002/003 · motor físic ideal i protocol de codis TL-RE1
import {seededRandom, randomSeed, checksum} from './exercises.js';
export const MODES=['002','003'];
const choose=(r,a)=>a[Math.floor(r()*a.length)];
const round=(n,d=6)=>Number(n.toFixed(d));
export function parseNumber(text){
  const raw=String(text).trim().replace(/\s/g,'').replace(',', '.');
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw))return NaN;
  return Number(raw);
}
export function capacitorCode(code){
  if(!/^\d{3}$/.test(String(code)))throw new RangeError('Codi de condensador no vàlid');
  const digits=String(code);
  return Number(digits.slice(0,2))*10**Number(digits[2]); // pF
}
export function inductorCode(code){
  if(!/^\d{3}$/.test(String(code)))throw new RangeError('Codi d’inductància no vàlid');
  const digits=String(code);
  return Number(digits.slice(0,2))*10**Number(digits[2]); // µH, convention explicitly specified
}
export function equivalent(kind,values,connection){
  if(!values.length||values.some(v=>!Number.isFinite(v)||v<=0))throw new RangeError('Valors no vàlids');
  const sum=values.reduce((a,b)=>a+b,0),harmonic=1/values.reduce((a,b)=>a+1/b,0);
  if(!['C','L'].includes(kind)||!['series','parallel'].includes(connection))throw new RangeError('Associació no vàlida');
  return (kind==='C')===(connection==='parallel')?sum:harmonic;
}
export const tauRC=(r,c)=>r*c, tauRL=(r,l)=>l/r;
export const capacitorCharge=(volts,t,tau)=>volts*(1-Math.exp(-t/tau));
export const capacitorDischarge=(volts,t,tau)=>volts*Math.exp(-t/tau);
export const inductorRise=(volts,ohms,t,tau)=>volts/ohms*(1-Math.exp(-t/tau));
export const xc=(f,c)=>1/(2*Math.PI*f*c);
export const xl=(f,l)=>2*Math.PI*f*l;
export function seriesAC({R=0,L=0,C=0,f,voltage}){
  if(!(f>0&&voltage>=0&&R>=0&&L>=0&&C>=0))throw new RangeError('Dades no vàlides');
  const reactance=(L?xl(f,L):0)-(C?xc(f,C):0);
  const impedance=Math.hypot(R,reactance);
  const current=impedance?voltage/impedance:Infinity;
  const phase=Math.atan2(reactance,R)*180/Math.PI;
  return {reactance,impedance,current,phase,pf:impedance?R/impedance:0,realPower:current*current*R};
}
export function makeCode(mode,level,seed,kind){
  if(!MODES.includes(mode)||![1,2,3].includes(level)||!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(kind)||kind<0||kind>99)throw new RangeError('Paràmetres del codi no vàlids');
  const body=`TL-RE1-${mode}-${level}-${String(kind).padStart(2,'0')}-${seed.toString(36).toUpperCase()}`;
  return body+'-'+checksum(body);
}
export function readCode(raw){
  const value=String(raw).trim().toUpperCase();
  const m=/^TL-RE1-(002|003)-([123])-(\d{2})-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(value);
  if(!m)throw new RangeError('Format incorrecte. Utilitza un codi TL-RE1.');
  const mode=m[1],level=Number(m[2]),kind=Number(m[3]),seed=parseInt(m[4],36);
  if(seed>0xffffffff||makeCode(mode,level,seed,kind)!==value)throw new RangeError('El codi té un error de transcripció.');
  return {mode,level,kind,seed};
}
const cValues=[10,22,33,47,68,100,220,330,470,680]; // nF
const lValues=[10,22,33,47,68,100,220,330,470]; // mH
function question002(level,kind,r){
  if(level===1){
    if(kind===0){
      const first=choose(r,[10,22,33,47,68]),exp=choose(r,[2,3,4]);
      const code=String(first)+exp;
      return {title:'Lectura del marcatge',statement:`Un condensador ceràmic està marcat amb el codi ${code}. Quina és la seva capacitat en nF?`,parts:[{type:'C',label:code}],expected:capacitorCode(code)/1000,unit:'nF',formula:`C = ${first} × 10^${exp} pF = ${round(capacitorCode(code)/1000)} nF`,type:'code'};
    }
    if(kind===1){
      const first=choose(r,[10,22,33,47,68]),exp=choose(r,[1,2,3]);
      const code=String(first)+exp;
      return {title:'Codificació d’inductàncies',statement:`Una bobina axial segueix el marcatge de tres dígits en µH (dues xifres i multiplicador) i porta el codi ${code}. Quina inductància té en µH?`,parts:[{type:'L',label:code}],expected:inductorCode(code),unit:'µH',formula:`L = ${first} × 10^${exp} µH = ${inductorCode(code)} µH`,type:'code'};
    }
    const cap=kind===2,vals=Array.from({length:2},()=>choose(r,cap?cValues:lValues));const conn=choose(r,['series','parallel']);
    const result=equivalent(cap?'C':'L',vals,conn);
    return {title:'Associació de components',statement:`Calcula ${cap?'la capacitat':'la inductància'} equivalent de ${vals.length} components ideals connectats en ${conn==='series'?'sèrie':'paral·lel'}.`,parts:vals.map(v=>({type:cap?'C':'L',label:v+(cap?' nF':' mH')})),connection:conn,expected:result,unit:cap?'nF':'mH',formula:conn==='parallel'&&cap||conn==='series'&&!cap?`Equivalent = ${vals.join(' + ')} = ${round(result)}`:`Equivalent = 1 / (${vals.map(v=>`1/${v}`).join(' + ')}) = ${round(result)}`,type:'association'};
  }
  const isRC=kind%2===0, R=choose(r,[1000,2200,4700,10000]), value=choose(r,isRC?[100,220,470,1000]:[100,220,470,680]); // C µF L mH
  const physical=isRC?value*1e-6:value*1e-3;
  const tau=isRC?tauRC(R,physical):tauRL(R,physical);
  const voltage=choose(r,[5,9,12,15]);
  const multiple=choose(r,[1,2,3]);
  if(level===2){
    return {title:'Constant de temps',statement:`En el circuit ${isRC?'RC':'RL'} indicat, calcula la constant de temps τ en mil·lisegons. Considera components ideals.`,parts:[{type:'R',label:R+' Ω'},{type:isRC?'C':'L',label:value+(isRC?' µF':' mH')}],connection:'series',expected:tau*1000,unit:'ms',formula:isRC?`τ = R·C = ${R} × ${physical} s = ${round(tau*1000)} ms`:`τ = L/R = ${physical}/${R} s = ${round(tau*1000)} ms`,type:'transient',graph:{family:isRC?'RC':'RL',R,value,voltage,tau}};
  }
  const t=tau*multiple;
  const answer=isRC?capacitorCharge(voltage,t,tau):inductorRise(voltage,R,t,tau)*1000;
  return {title:isRC?'Càrrega d’un condensador':'Establiment de corrent',statement:`En tancar l’interruptor a t = 0, calcula ${isRC?'la tensió al condensador en V':'el corrent de la bobina en mA'} quan t = ${round(t*1000,4)} ms. Inicialment, ${isRC?'el condensador està descarregat':'el corrent és nul'}. Model ideal.`,parts:[{type:'V',label:voltage+' V'},{type:'R',label:R+' Ω'},{type:isRC?'C':'L',label:value+(isRC?' µF':' mH')}],connection:'series',expected:answer,unit:isRC?'V':'mA',formula:isRC?`V_C(t) = ${voltage}(1 − e^(−t/τ)); τ = ${round(tau*1000,5)} ms; V_C = ${round(answer)} V`:`i_L(t) = (${voltage}/${R})(1 − e^(−t/τ)); τ = ${round(tau*1000,5)} ms; i_L = ${round(answer)} mA`,type:'transient',graph:{family:isRC?'RC':'RL',R,value,voltage,tau}};
}
function question003(level,kind,r){
  const f=choose(r,[50,100,200,500,1000,2000]);
  const R=choose(r,[100,220,470,1000]);
  const c=choose(r,[100,220,470,1000])*1e-9;
  const l=choose(r,[10,22,47,100,220])*1e-3;
  const voltage=choose(r,[5,10,12]);
  if(level===1){
    const isCap=kind%2===0;
    const react=isCap?xc(f,c):xl(f,l);
    return {title:isCap?'Reactància capacitiva':'Reactància inductiva',statement:`Calcula el mòdul de la reactància del component a ${f} Hz, en Ω. Considera la capacitat o inductància ideal.`,parts:[{type:'V',label:'~'},{type:isCap?'C':'L',label:isCap?round(c*1e9)+' nF':round(l*1e3)+' mH'}],connection:'series',expected:react,unit:'Ω',formula:isCap?`X_C = 1/(2πfC) = ${round(react)} Ω`:`X_L = 2πfL = ${round(react)} Ω`,type:'ac',graph:{R:0,C:isCap?c:0,L:isCap?0:l,f,voltage}};
  }
  if(level===2){
    const isCap=kind%2===0;
    const data=seriesAC({R,C:isCap?c:0,L:isCap?0:l,f,voltage});
    return {title:'Impedància d’un circuit en sèrie',statement:`Troba el mòdul de la impedància total |Z| en Ω per a aquest circuit en règim sinusoidal de ${f} Hz. Components ideals.`,parts:[{type:'V',label:voltage+' V RMS'},{type:'R',label:R+' Ω'},{type:isCap?'C':'L',label:isCap?round(c*1e9)+' nF':round(l*1e3)+' mH'}],connection:'series',expected:data.impedance,unit:'Ω',formula:`X = ${round(data.reactance)} Ω; |Z| = √(R² + X²) = ${round(data.impedance)} Ω`,type:'ac',graph:{R,C:isCap?c:0,L:isCap?0:l,f,voltage}};
  }
  // RLC with sinusoidal source. Every exercise has one unambiguous target.
  const data=seriesAC({R,L:l,C:c,f,voltage});
  if(kind===0){
    const freq=1/(2*Math.PI*Math.sqrt(l*c));
    return {title:'Freqüència de ressonància',statement:'Calcula la freqüència de ressonància ideal f₀ en Hz del circuit RLC en sèrie.',parts:[{type:'R',label:R+' Ω'},{type:'L',label:round(l*1000)+' mH'},{type:'C',label:round(c*1e9)+' nF'}],connection:'series',expected:freq,unit:'Hz',formula:`f₀ = 1 / (2π√(LC)) = ${round(freq)} Hz`,type:'ac',graph:{R,L:l,C:c,f,voltage}};
  }
  if(kind===1){
    return {title:'Desfasament tensió-corrent',statement:`Calcula l’angle de fase de la impedància (en graus, amb signe) del circuit RLC en sèrie a ${f} Hz. Positiu = inductiu; negatiu = capacitiu.`,parts:[{type:'V',label:voltage+' V RMS'},{type:'R',label:R+' Ω'},{type:'L',label:round(l*1000)+' mH'},{type:'C',label:round(c*1e9)+' nF'}],connection:'series',expected:data.phase,unit:'°',formula:`φ = atan((X_L − X_C)/R) = ${round(data.phase)}°`,type:'ac',graph:{R,L:l,C:c,f,voltage}};
  }
  return {title:'Corrent eficaç del circuit RLC',statement:`Calcula el corrent eficaç total en mA a ${f} Hz amb una font de ${voltage} V RMS. Components ideals en sèrie.`,parts:[{type:'V',label:voltage+' V RMS'},{type:'R',label:R+' Ω'},{type:'L',label:round(l*1000)+' mH'},{type:'C',label:round(c*1e9)+' nF'}],connection:'series',expected:data.current*1000,unit:'mA',formula:`|Z| = ${round(data.impedance)} Ω; I = V/|Z| = ${round(data.current*1000)} mA`,type:'ac',graph:{R,L:l,C:c,f,voltage}};
}
export function generate(mode,level,seed=randomSeed(),forcedKind=null){
  if(!MODES.includes(mode)||![1,2,3].includes(level))throw new RangeError('Laboratori o nivell invàlid');
  const r=seededRandom(seed);
  const kinds=level===1?(mode==='002'?3:2):level===2?2:3;
  const kind=forcedKind===null?Math.floor(r()*kinds):forcedKind;
  if(!Number.isInteger(kind)||kind<0||kind>=kinds)throw new RangeError('Tipus d’exercici no vàlid');
  const q=mode==='002'?question002(level,kind,r):question003(level,kind,r);
  return {...q,mode,level,seed,kind,code:makeCode(mode,level,seed,kind)};
}
export function checkAnswer(input,expected){
  const actual=parseNumber(input);
  if(!Number.isFinite(actual))return {ok:false,message:'Introdueix un nombre vàlid (pots fer servir coma decimal).'};
  // Tolerància de precisió: 0,5% o mitja unitat de la segona xifra decimal;
  // com a mínim dues xifres significatives per magnituds petites.
  const tolerance=Math.max(Math.abs(expected)*0.005,0.005);
  const ok=Math.abs(actual-expected)<=tolerance+1e-12;
  return {ok,message:ok?'Correcte. La resposta és dins de la tolerància.':'La resposta no coincideix. Revisa les unitats, la fórmula i l’arrodoniment.',actual,tolerance};
}
