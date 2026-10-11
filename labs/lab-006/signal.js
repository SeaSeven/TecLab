import {seededRandom,checksum} from '../../shared/services/exercises.js';
export const volts=[.1,.2,.5,1,2,5,10],times=[.00005,.0001,.0002,.0005,.001,.002,.005,.01];
const amplitudes=[.5,1,1.5,2,3,4,6],frequencies=[100,200,250,500,1000,2000,5000];
export const types={S:'Sinusoidal',T:'Triangular',Q:'Quadrada'};
export function codeOf(mode,seed){
 if(!['A','S','T','Q','D'].includes(mode)||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Paràmetres de codi no vàlids.');
 const body='TL-'+(mode==='D'?'OSC2':'OSC1')+'-'+mode+'-'+seed.toString(36).toUpperCase();
 return body+'-'+checksum(body);
}
export function readCode(raw){
 const code=String(raw).trim().toUpperCase();
 const match=/^TL-(OSC1|OSC2)-([ASTQD])-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(code);
 if(!match)throw Error('Introdueix un codi TL-OSC1 vàlid.');
 const seed=parseInt(match[3],36),mode=match[2];
 if((mode==='D')!==(match[1]==='OSC2'))throw Error('Versió de codi incompatible.');
 if(codeOf(mode,seed)!==code)throw Error('El codi conté un error de transcripció.');
 return {mode,seed,code};
}
export function generate(mode,seed){
 const code=codeOf(mode,seed),rng=seededRandom(seed);
 const pick=a=>a[Math.floor(rng()*a.length)];
 if(mode==='D'){
  const frequency=pick([100,200,250,500,1000,2000]);
  return {mode,seed,code,type:'S',amplitude:pick([1,2,3,4]),frequency,channel2:{type:'S',amplitude:pick([.5,1,1.5,2,3]),frequency,phase:pick([30,45,60,90,120,180])}};
 }
 const type=mode==='A'?pick(['S','T','Q']):mode;
 return {mode,seed,code,type,amplitude:pick(amplitudes),frequency:pick(frequencies)};
}
export function voltage(ex,t){
 const phase=((t*ex.frequency-(ex.phase||0)/360)%1+1)%1;
 let factor;
 if(ex.type==='Q')factor=phase<.5?1:-1;
 else if(ex.type==='T')factor=1-4*Math.abs(phase-.25);
 else factor=Math.sin(2*Math.PI*phase);
 return ex.amplitude*factor;
}
export function state(ex,v,t){
 const periods=10*t*ex.frequency, fits=ex.amplitude<=4*v+1e-12, readable=periods>=2-1e-9&&periods<=4+1e-9;
 return {periods,fits,readable,good:fits&&readable,feedback:!fits?'L’ona queda retallada: augmenta VOLTS/DIV.':periods<2?'Cal mostrar més períodes: augmenta TIME/DIV.':periods>4?'Es veuen massa períodes: redueix TIME/DIV.':'Visualització correcta: ona completa i entre 2 i 4 períodes.'};
}
export function path(ex,v,t,shift=0){
 return Array.from({length:1201},(_,i)=>{const x=i/2,y=160-voltage(ex,x/60*t+shift)/v*40;return (i?'L':'M')+x+' '+y.toFixed(3);}).join(' ');
}
export function checkReading(raw,expected){
 const s=String(raw).trim();if(!s)return 'empty';
 const value=Number(s.replace(',','.'));if(!Number.isFinite(value))return 'invalid';
 return Math.abs(value-expected)<=Math.max(Math.abs(expected)*.02,1e-8)?'correct':'incorrect';
}

export function triggerState(ex,level,source='CH1'){
 const amplitude=source==='CH2'&&ex.channel2?ex.channel2.amplitude:ex.amplitude;
 return {stable:Math.abs(level)<amplitude,feedback:Math.abs(level)<amplitude?'Trigger actiu: traça estable.':'No hi ha creuament del nivell de trigger: traça sense sincronitzar.'};
}
export function advancedAnswer(ex){return {periodMs:1000/ex.frequency,phase:ex.channel2.phase,delayMs:1000/ex.frequency*ex.channel2.phase/360};}
