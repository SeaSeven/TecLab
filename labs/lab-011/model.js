// Motor físic del LAB-011. No accedeix al DOM ni interpreta la conformitat.
// Convenció: v(t)=sqrt(2)*sum(Vh*sin(h*omega*t+phiVh)).
// Les potències són mitjanes de productes de components de la mateixa freqüència.
const TAU=2*Math.PI;
const VALID_POINTS=new Set(['PCC','DRIVE','CTRL']);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const harmonicOrders=[1,3,5,7,11,13];
function ensure(scenario,pointId,time){
 if(!scenario||!Array.isArray(scenario.points)||!Number.isFinite(time)||time<0)throw new RangeError('Cas o instant no vàlid.');
 const point=scenario.points.find(p=>p.id===pointId);
 if(!point||!VALID_POINTS.has(pointId))throw new RangeError('Punt de mesura no disponible.');
 return point;
}
export function activeEvents(scenario,time){
 return scenario.events.filter(e=>time>=e.start&&time<e.start+e.duration);
}
export function baseComponents(scenario,pointId,phase,time){
 const point=ensure(scenario,pointId,time);
 if(!Number.isInteger(phase)||phase<0||phase>=scenario.phases)throw new RangeError('Fase no disponible.');
 const active=activeEvents(scenario,time);
 const sag=active.reduce((x,e)=>x*(e.voltageFactor??1),1);
 const load=active.reduce((x,e)=>x*(e.currentFactor??1),1);
 const angle=-TAU*phase/3;
 const v1=scenario.nominalVoltage*scenario.voltageScale*scenario.phaseScales[phase]*point.voltageRatio*sag;
 const i1=scenario.phaseCurrents[phase]*point.currentFactors[phase]*load;
 const lag=scenario.baseAngle;
 const voltage=[{order:1,rms:v1,angle}];
 const current=[{order:1,rms:i1,angle:angle-lag}];
 const vMultipliers=pointId==='CTRL'?.50:pointId==='DRIVE'?1.12:1;
 const iMultipliers=pointId==='CTRL'?.67:pointId==='DRIVE'?1.4:1;
 for(const order of harmonicOrders.slice(1)){
   const vratio=(scenario.voltageHarmonics[order]??0)*vMultipliers;
   const iratio=(scenario.currentHarmonics[order]??0)*iMultipliers;
   if(vratio)voltage.push({order,rms:v1*vratio,angle:order*angle+.18*order});
   if(iratio)current.push({order,rms:i1*iratio,angle:order*angle+.18*order-.30});
 }
 return {voltage,current,frequency:scenario.frequency,pointId,phase,time};
}
export function rms(components){
 return Math.sqrt(components.reduce((s,h)=>s+h.rms*h.rms,0));
}
export function thd(components){
 const fundamental=components.find(c=>c.order===1);
 if(!fundamental||fundamental.rms<=0)return null;
 return 100*Math.sqrt(components.filter(c=>c.order>=2).reduce((s,h)=>s+h.rms*h.rms,0))/fundamental.rms;
}
export function sampleWave(components,frequency,time){
 return Math.SQRT2*components.reduce((sum,h)=>sum+h.rms*Math.sin(TAU*h.order*frequency*time+h.angle),0);
}
export function componentPower(voltage,current){
 const currentByOrder=new Map(current.map(c=>[c.order,c]));
 let p=0;
 for(const v of voltage){
   const i=currentByOrder.get(v.order);
   if(i)p+=v.rms*i.rms*Math.cos(v.angle-i.angle);
 }
 const v1=voltage.find(x=>x.order===1);
 const i1=currentByOrder.get(1);
 const q1=v1&&i1?v1.rms*i1.rms*Math.sin(v1.angle-i1.angle):null;
 const apparent=rms(voltage)*rms(current);
 return {p,q1,s:apparent,powerFactor:apparent>0?p/apparent:null};
}
export function phaseReading(scenario,pointId,phase,time){
 const components=baseComponents(scenario,pointId,phase,time);
 return {
   voltageRms:rms(components.voltage),currentRms:rms(components.current),
   voltageTHD:thd(components.voltage),currentTHD:thd(components.current),
   frequency:components.frequency,
   ...componentPower(components.voltage,components.current),
   components
 };
}
export function realSnapshot(scenario,pointId,time){
 ensure(scenario,pointId,time);
 const phases=Array.from({length:scenario.phases},(_,phase)=>phaseReading(scenario,pointId,phase,time));
 const totalP=phases.reduce((sum,p)=>sum+p.p,0);
 const totalQ1=phases.reduce((sum,p)=>sum+p.q1,0);
 const totalS=phases.reduce((sum,p)=>sum+p.s,0);
 // Desequilibri educatiu per magnitud RMS respecte a la mitjana: no és el factor V2/V1 de seqüència negativa.
 const v=phases.map(p=>p.voltageRms);
 const mean=v.reduce((sum,x)=>sum+x,0)/v.length;
 const maxDeviation=mean?Math.max(...v.map(x=>Math.abs(x-mean)))/mean*100:0;
 return {
   pointId,time,frequency:scenario.frequency,phases,
   totalP,totalQ1,totalS,totalPowerFactor:totalS?totalP/totalS:null,
   voltageRmsDeviationPercent:scenario.phases===3?maxDeviation:null,
   activeEventIds:activeEvents(scenario,time).map(e=>e.id)
 };
}
export function waveform(scenario,pointId,phase,start,duration,samples=320){
 if(!Number.isFinite(duration)||duration<=0||!Number.isInteger(samples)||samples<2||samples>10000)throw new RangeError('Mostreig no vàlid.');
 // Una captura de forma d'ona ha de ser curta per considerar estàtic el valor durant l'ona.
 return Array.from({length:samples},(_,n)=>{
   const t=start+duration*n/(samples-1);
   const c=baseComponents(scenario,pointId,phase,t);
   return {time:t,voltage:sampleWave(c.voltage,c.frequency,t),current:sampleWave(c.current,c.frequency,t)};
 });
}
export function spectrum(scenario,pointId,phase,time){
 const c=baseComponents(scenario,pointId,phase,time);
 return harmonicOrders.map(order=>({
   order,frequencyHz:order*c.frequency,
   voltageRms:c.voltage.find(h=>h.order===order)?.rms??0,
   currentRms:c.current.find(h=>h.order===order)?.rms??0
 }));
}
// Lectures a instants discrets: un esdeveniment curt pot no coincidir amb els instants capturats.
export function acquireReal(scenario,{pointId='PCC',start=0,duration=30,interval=1}={}){
 if(!Number.isFinite(start)||start<0||!Number.isFinite(duration)||duration<=0||
    !Number.isFinite(interval)||interval<=0||duration/interval>10000||
    start+duration>scenario.horizonSeconds)throw new RangeError('Interval de registre no vàlid.');
 ensure(scenario,pointId,start);
 const rows=[];
 const n=Math.floor(duration/interval);
 for(let k=0;k<=n;k++){
   const time=+(start+k*interval).toFixed(9);
   if(time>start+duration+1e-8)break;
   rows.push(realSnapshot(scenario,pointId,time));
 }
 if(rows.at(-1).time<start+duration-1e-8&&rows.length<10001){
   // No s'afegeix automàticament una lectura al final: s'ha de respectar la cadència configurada.
 }
 const detected=[...new Set(rows.flatMap(r=>r.activeEventIds))];
 return {pointId,start,duration,interval,rows,detectedEventIds:detected};
}
