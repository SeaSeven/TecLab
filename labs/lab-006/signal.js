import {seededRandom,checksum} from '../../shared/services/exercises.js';
export const volts=[.1,.2,.5,1,2,5,10],times=[.00005,.0001,.0002,.0005,.001,.002,.005,.01];
const amplitudes=[.5,1,1.5,2,3,4,6],frequencies=[100,200,250,500,1000,2000,5000];
export const types={S:'Sinusoidal',T:'Triangular',Q:'Quadrada',R:'Dent de serra',P:'Polsos PWM',H:'Sinusoide rectificada'};
export function codeOf(mode,seed){
 if(!['A','S','T','Q','D','I','M','N','R','P','H','W','C','F'].includes(mode)||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Paràmetres de codi no vàlids.');
 const body='TL-'+(['D','N'].includes(mode)?'OSC2':['I','M'].includes(mode)?'OSC3':['W','C','F'].includes(mode)?'OSC5':['R','P','H'].includes(mode)?'OSC4':'OSC1')+'-'+mode+'-'+seed.toString(36).toUpperCase();
 return body+'-'+checksum(body);
}
export function readCode(raw){
 const code=String(raw).trim().toUpperCase();
 const match=/^TL-(OSC1|OSC2|OSC3|OSC4|OSC5)-([ASTQDIMNRPHWCF])-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(code);
 if(!match)throw Error('Introdueix un codi TL-OSC1 vàlid.');
 const seed=parseInt(match[3],36),mode=match[2];
 if((['D','N'].includes(mode)?'OSC2':['I','M'].includes(mode)?'OSC3':['W','C','F'].includes(mode)?'OSC5':['R','P','H'].includes(mode)?'OSC4':'OSC1')!==match[1])throw Error('Versió de codi incompatible.');
 if(codeOf(mode,seed)!==code)throw Error('El codi conté un error de transcripció.');
 return {mode,seed,code};
}
export function generate(mode,seed){
 const code=codeOf(mode,seed),rng=seededRandom(seed);
 const pick=a=>a[Math.floor(rng()*a.length)];
 if(mode==='W'){
  return {mode,seed,code,type:'P',amplitude:pick([1,2,3,4]),frequency:pick([100,200,250,500,1000]),duty:pick([15,25,35,45,55,65,75,85])};
 }
 if(mode==='C'){
  return {mode,seed,code,type:'S',amplitude:pick([.5,1,1.5,2]),frequency:pick([100,200,500,1000]),offset:pick([1,2,3,4])};
 }
 if(mode==='F'){
  return {mode,seed,code,type:'S',amplitude:pick([1,2,3]),frequency:pick([200,500,1000]),fault:pick(['clipping','ripple','noise'])};
 }
 if(mode==='M'){
  return {mode,seed,code,type:pick(['S','T','Q']),amplitude:pick([.5,1,1.5,2,3]),frequency:pick([100,200,250,500,1000,2000])};
 }
 if(mode==='I'){
  return {mode,seed,code,type:pick(['S','T','Q']),amplitude:pick([1,2,3,4]),frequency:pick([100,200,250,500,1000,2000])};
 }
 if(mode==='N'){
  const frequency=pick([100,200,250,500,1000,2000]);
  const amp=pick([1,2,3]);
  return {mode,seed,code,type:'S',amplitude:amp,frequency,channel2:{type:'S',amplitude:pick([.5,1,1.5,2,3]),frequency,phase:pick([15,30,45,75,90,135,150])}};
 }
 if(mode==='D'){
  const frequency=pick([100,200,250,500,1000,2000]);
  return {mode,seed,code,type:'S',amplitude:pick([1,2,3,4]),frequency,channel2:{type:'S',amplitude:pick([.5,1,1.5,2,3]),frequency,phase:pick([30,45,60,90,120,180])}};
 }
 const type=mode==='A'?pick(['S','T','Q']):mode;
 const exercise={mode,seed,code,type,amplitude:pick(amplitudes),frequency:pick(frequencies)};
 if(type==='P')exercise.duty=pick([20,30,40,60,70,80]);
 return exercise;
}
export function voltage(ex,t){
 const phase=((t*ex.frequency-(ex.phase||0)/360)%1+1)%1;
 let factor;
 if(ex.type==='Q')factor=phase<.5?1:-1;
 else if(ex.type==='P')factor=phase<(ex.duty??50)/100?1:-1;
 else if(ex.type==='R')factor=2*phase-1;
 else if(ex.type==='H')factor=Math.abs(Math.sin(Math.PI*phase));
 else if(ex.type==='T')factor=1-4*Math.abs(phase-.5);
 else factor=Math.sin(2*Math.PI*phase);
 let value=ex.amplitude*factor;
 if(ex.fault==='clipping')value=Math.max(-ex.amplitude*.55,Math.min(ex.amplitude*.55,value));
 if(ex.fault==='ripple')value+=ex.amplitude*.19*Math.sin(2*Math.PI*t*ex.frequency*6);
 if(ex.fault==='noise')value+=ex.amplitude*.12*(Math.sin(2*Math.PI*t*ex.frequency*17)+.4*Math.sin(2*Math.PI*t*ex.frequency*29));
 return (ex.offset??0)+value;
}
/** Valors extrems i tensió pic a pic, incloent les ones unipolars. */
export function signalLimits(ex){
 const min=ex.type==='H'?0:-ex.amplitude;
 return {min,max:ex.amplitude,peakToPeak:ex.amplitude-min};
}
export function defaultTrigger(ex){
 return ex.type==='H'?ex.amplitude/2:(ex.offset??0);
}
/** Tensió mitjana i lectura en funció de l'acoblament d'entrada. */
export function meanVoltage(ex){
 if(ex.type==='H')return (ex.offset??0)+2*ex.amplitude/Math.PI;
 if(ex.type==='P')return (ex.offset??0)+ex.amplitude*(2*(ex.duty??50)/100-1);
 return ex.offset??0;
}
export function displayVoltage(ex,t,coupling='DC'){
 if(coupling==='GND')return 0;
 const value=voltage(ex,t);
 return coupling==='AC'?value-meanVoltage(ex):value;
}
export function dutyCycle(ex){return ex.type==='P'?(ex.duty??50):null;}
export function faultLabel(fault){
 return {clipping:'Retallament',ripple:'Ondulació periòdica',noise:'Soroll superposat'}[fault]??'Sense avaria';
}
/** Extrems reals de tensió observables, especialment per a senyals amb offset o avaries. */
export function signalBounds(ex,coupling='DC'){
 if(coupling==='GND')return {min:0,max:0};
 const n=1200,period=1/ex.frequency;
 let min=Infinity,max=-Infinity;
 for(let i=0;i<n;i++){const v=displayVoltage(ex,i*period/n,coupling);min=Math.min(min,v);max=Math.max(max,v);}
 return {min,max};
}
export function readingVpp(ex){const {min,max}=signalBounds(ex);return max-min;}
export function state(ex,v,t){
 const periods=10*t*ex.frequency, fits=ex.amplitude<=4*v+1e-12, readable=periods>=2-1e-9&&periods<=4+1e-9;
 return {periods,fits,readable,good:fits&&readable,feedback:!fits?'L’ona queda retallada: augmenta VOLTS/DIV.':periods<2?'Cal mostrar més períodes: augmenta TIME/DIV.':periods>4?'Es veuen massa períodes: redueix TIME/DIV.':'Visualització correcta: ona completa i entre 2 i 4 períodes.'};
}
export function path(ex,v,t,shift=0,position=0,coupling='DC'){
 return Array.from({length:1201},(_,i)=>{const x=i/2,y=160-position*40-displayVoltage(ex,x/60*t+shift,coupling)/v*40;return (i?'L':'M')+x+' '+y.toFixed(3);}).join(' ');
}
export function checkReading(raw,expected){
 const s=String(raw).trim();if(!s)return 'empty';
 const value=Number(s.replace(',','.'));if(!Number.isFinite(value))return 'invalid';
 return Math.abs(value-expected)<=Math.max(Math.abs(expected)*.02,1e-8)?'correct':'incorrect';
}

export function triggerState(ex,level,source='CH1'){
 const channel=source==='CH2'&&ex.channel2?ex.channel2:ex;
 const {min,max}=signalBounds(channel);
 const stable=level>min&&level<max;
 return {stable,feedback:stable?'Trigger actiu: traça estable.':'El nivell de trigger és fora de l’interval de tensió de l’ona; ajusta’l per sincronitzar.'};
}
export function advancedAnswer(ex){return {periodMs:1000/ex.frequency,phase:ex.channel2.phase,delayMs:1000/ex.frequency*ex.channel2.phase/360};}

/** Cerca una transició ascendent del canal seleccionat per fixar l'origen de temps. */
export function triggerOffset(ex,level=0,source='CH1'){
 const channel=source==='CH2'&&ex.channel2?ex.channel2:ex;
 const period=1/channel.frequency;
 const samples=1440;
 let previous=voltage(channel,0);
 for(let i=1;i<=samples;i++){
   const t=i*period/samples, current=voltage(channel,t);
   if(previous<level && current>=level){
     const fraction=(level-previous)/(current-previous||1);
     return ((i-1)+fraction)*period/samples;
   }
   previous=current;
 }
 return null;
}
/** Dos cursors verticals (temps) i dos horitzontals (CH1). */
export function cursorReadings(x1,x2,y1,y2,voltsPerDiv,secondsPerDiv){
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 return {
   deltaMs:Math.abs(clamp(x2,0,600)-clamp(x1,0,600))/60*secondsPerDiv*1000,
   deltaV:Math.abs(clamp(y2,0,320)-clamp(y1,0,320))/40*voltsPerDiv
 };
}
/** Comprova que amb el desplaçament la traça queda dins la zona visible. */
export function channelFits(ex,voltsPerDiv,position=0,coupling='DC'){
 const {min,max}=signalBounds(ex,coupling);
 return Math.max(Math.abs(min/voltsPerDiv+position),Math.abs(max/voltsPerDiv+position))<=4+1e-9;
}
