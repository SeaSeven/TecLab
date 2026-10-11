export const signal={amplitude:3,frequency:1000,offset:0};
export const volts=[.1,.2,.5,1,2,5,10],times=[.00005,.0001,.0002,.0005,.001,.002,.005,.01];
export const voltage=t=>signal.offset+signal.amplitude*Math.sin(2*Math.PI*signal.frequency*t);
export function state(v,t){const periods=10*t*signal.frequency, fits=signal.amplitude<=4*v, readable=periods>=2&&periods<=4;return {periods,fits,readable,good:fits&&readable,feedback:!fits?'L’ona queda retallada: augmenta VOLTS/DIV.':periods<2?'Cal mostrar més períodes: augmenta TIME/DIV.':periods>4?'Es veuen massa períodes: redueix TIME/DIV.':'Visualització correcta: ona completa i entre 2 i 4 períodes.'};}
export function path(v,t){return Array.from({length:301},(_,i)=>{const x=i*2,y=160-voltage(x/60*t)/v*40;return (i?'L':'M')+x+' '+y.toFixed(3);}).join(' ');}
