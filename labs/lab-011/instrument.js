import {baseComponents,componentPower,rms,thd,acquireReal} from './model.js';

// Configuració instrumental independent de l'estat físic del cas.
export function defaultInstrument(scenario,pointId='PCC'){
 const point=scenario.points.find(p=>p.id===pointId);
 if(!point)throw new RangeError('Punt no disponible.');
 const phases=Array.from({length:scenario.phases},(_,i)=>i);
 return {
   pointId,topology:scenario.phases===3?'3P4W':'1P2W',
   voltageChannels:phases.map(i=>({phase:i,enabled:true})),
   currentChannels:phases.map(i=>({
     phase:i,enabled:true,inverted:false,ctRatio:actualCtRatio(pointId)
   })),
   duration:30,interval:1,start:0
 };
}
export function actualCtRatio(pointId){
 return pointId==='PCC'||pointId==='DRIVE'?20:1;
}
function checkConfiguration(scenario,settings){
 if(!scenario.points.some(p=>p.id===settings.pointId))throw new RangeError('Punt de mesura no disponible.');
 if(!['1P2W','3P4W'].includes(settings.topology))throw new RangeError('Topologia instrumental desconeguda.');
 if(!Array.isArray(settings.voltageChannels)||!Array.isArray(settings.currentChannels))
   throw new RangeError('Canals no configurats.');
 for(const channel of settings.voltageChannels){
   if(!Number.isInteger(channel.phase)||channel.phase<0||channel.phase>=scenario.phases)
     throw new RangeError('Canal de tensió no disponible.');
 }
 for(const channel of settings.currentChannels){
   if(!Number.isInteger(channel.phase)||channel.phase<0||channel.phase>=scenario.phases)
     throw new RangeError('Canal de corrent no disponible.');
   if(!Number.isFinite(channel.ctRatio)||channel.ctRatio<=0||channel.ctRatio>10000)
     throw new RangeError('Relació de TC no vàlida.');
 }
}
const scale=(components,factor,shift=0)=>components.map(c=>({...c,rms:c.rms*Math.abs(factor),
 angle:c.angle+shift}));
export function instrumentSnapshot(scenario,settings,time){
 checkConfiguration(scenario,settings);
 const expectedTopology=scenario.phases===3?'3P4W':'1P2W';
 // En topologia incompatible, l'equip no pot reconstruir lectures fiables.
 if(settings.topology!==expectedTopology)
   return {time,pointId:settings.pointId,status:'topology-incompatible',phases:[],
     totalP:null,totalQ1:null,totalS:null,totalPowerFactor:null};
 const rows=[];
 const n=scenario.phases;
 for(let slot=0;slot<n;slot++){
   const vc=settings.voltageChannels[slot];
   const ic=settings.currentChannels[slot];
   const v=vc?.enabled?baseComponents(scenario,settings.pointId,vc.phase,time).voltage:null;
   const physicalI=ic?.enabled?baseComponents(scenario,settings.pointId,ic.phase,time).current:null;
   const ratio=ic?ic.ctRatio/actualCtRatio(settings.pointId):null;
   // Una pinça invertida afegeix 180 graus; la RMS de corrent no canvia.
   const i=physicalI?scale(physicalI,ratio,ic.inverted?Math.PI:0):null;
   const power=v&&i?componentPower(v,i):null;
   rows.push({
     slot,voltagePhase:vc?.enabled?vc.phase:null,currentPhase:ic?.enabled?ic.phase:null,
     voltageRms:v?rms(v):null,currentRms:i?rms(i):null,
     voltageTHD:v?thd(v):null,currentTHD:i?thd(i):null,
     p:power?.p??null,q1:power?.q1??null,s:power?.s??null,
     powerFactor:power?.powerFactor??null
   });
 }
 const complete=rows.every(p=>p.voltageRms!==null&&p.currentRms!==null);
 // No s'inventen dades de canals omesos ni totals elèctrics incomplets.
 const totalP=complete?rows.reduce((s,p)=>s+p.p,0):null;
 const totalQ1=complete?rows.reduce((s,p)=>s+p.q1,0):null;
 const totalS=complete?rows.reduce((s,p)=>s+p.s,0):null;
 return {time,pointId:settings.pointId,status:complete?'measured':'incomplete',
   phases:rows,totalP,totalQ1,totalS,
   totalPowerFactor:totalS?totalP/totalS:null};
}
export function acquireInstrument(scenario,settings){
 checkConfiguration(scenario,settings);
 const base=acquireReal(scenario,{
   pointId:settings.pointId,start:settings.start,duration:settings.duration,interval:settings.interval
 });
 const rows=base.rows.map(row=>instrumentSnapshot(scenario,settings,row.time));
 const usable=rows.some(row=>row.status==='measured');
 return {
   schemaVersion:1,caseCode:scenario.code,pointId:settings.pointId,
   start:settings.start,duration:settings.duration,interval:settings.interval,
   settings:JSON.parse(JSON.stringify(settings)),rows,
   // Els esdeveniments s'observen només amb mostres que els capturen.
   detectedEventIds:usable?base.detectedEventIds:[],
   simulated:true
 };
}
