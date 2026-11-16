import {baseComponents,componentPower,rms,thd,acquireReal} from './model.js';

// Configuració instrumental independent de l'estat físic del cas.
export function defaultInstrument(scenario,pointId='PCC'){
 const point=scenario.points.find(p=>p.id===pointId);
 if(!point)throw new RangeError('Punt no disponible.');
 const phases=Array.from({length:scenario.phases},(_,i)=>i);
 return {
   pointId,topology:scenario.phases===3?'3P4W':'1P2W',
   voltageChannels:phases.map(i=>({phase:i,enabled:false,positive:null,negative:null,positivePoint:null,negativePoint:null})),
   currentChannels:phases.map(i=>({
     phase:i,enabled:false,inverted:false,ctRatio:null,ctPrimary:null,ctSecondary:null,conductor:null,pointId:null
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
   if(channel.ctRatio!==null&&(!Number.isFinite(channel.ctRatio)||channel.ctRatio<=0||channel.ctRatio>10000))
     throw new RangeError('Relació de TC no vàlida.');
 }
}
const scale=(components,factor,shift=0)=>components.map(c=>({...c,rms:c.rms*Math.abs(factor),
 angle:c.angle+shift}));

// Diferència fasorial de tensió de dos terminals. N=referència ideal del model.
function phasorVoltage(scenario,defaultPoint,channel,time){
 const byTerminal=(terminal,pointId)=>{
   // Entrades AC ideals: les components contínues de +24 V i 0 V no es mesuren.
   // Es permet la connexió física sense imposar una decisió "correcta/incorrecta".
   if(pointId==='DC24')return ['+24V','0V'].includes(terminal)?[]:null;
   if(terminal==='N'||terminal==='PE')return []; // PE idealitzat a potencial de referència.
   const match=/^L([1-3])$/.exec(terminal??'');
   if(!match||Number(match[1])>scenario.phases)return null;
   if(!scenario.points.some(p=>p.id===pointId))return null;
   return baseComponents(scenario,pointId,Number(match[1])-1,time).voltage;
 };
 const a=byTerminal(channel.positive,channel.positivePoint??defaultPoint);
 const b=byTerminal(channel.negative,channel.negativePoint??defaultPoint);
 if(!a||!b)return null;
 return [...new Set([...a,...b].map(h=>h.order))].sort((x,y)=>x-y).map(order=>{
   const va=a.find(x=>x.order===order),vb=b.find(x=>x.order===order);
   const re=(va?.rms??0)*Math.cos(va?.angle??0)-(vb?.rms??0)*Math.cos(vb?.angle??0);
   const im=(va?.rms??0)*Math.sin(va?.angle??0)-(vb?.rms??0)*Math.sin(vb?.angle??0);
   return {order,rms:Math.hypot(re,im),angle:Math.atan2(im,re)};
 });
}
function selectedVoltage(scenario,pointId,channel,time){
 if(!channel?.enabled)return null;
 if(Object.hasOwn(channel,'positive')||Object.hasOwn(channel,'negative'))
   return phasorVoltage(scenario,pointId,channel,time);
 return baseComponents(scenario,pointId,channel.phase,time).voltage; // recuperació antiga
}
function selectedCurrent(scenario,pointId,channel,time){
 if(!channel?.enabled||channel.ctRatio===null)return null;
 let phase=channel.phase,shift=channel.inverted?Math.PI:0;
 const point=channel.pointId??pointId;
 if(point==='DC24'){
   // Pinça AC de tipus transformador: no respon al corrent continu estacionari.
   return ['+24V','0V'].includes(channel.conductor)?[{order:1,rms:0,angle:0}]:null;
 }
 if(!scenario.points.some(p=>p.id===point))return null;
 let physical;
 if(Object.hasOwn(channel,'conductor')){
   const match=/^L([1-3])$/.exec(channel.conductor??'');
   if(match&&Number(match[1])<=scenario.phases)phase=Number(match[1])-1;
   else if(channel.conductor==='PE')return [{order:1,rms:0,angle:0}]; // PE sense corrent de defecte simulat
   else if(channel.conductor==='N'){
     const currents=Array.from({length:scenario.phases},(_,p)=>baseComponents(scenario,point,p,time).current);
     const orders=new Set(currents.flatMap(row=>row.map(h=>h.order)));
     physical=[...orders].sort((a,b)=>a-b).map(order=>{
       let re=0,im=0;
       for(const row of currents){
         const h=row.find(x=>x.order===order);
         if(h){re-=h.rms*Math.cos(h.angle);im-=h.rms*Math.sin(h.angle);}
       }
       return {order,rms:Math.hypot(re,im),angle:Math.atan2(im,re)};
     });
   }else return null;
 }
 physical??=baseComponents(scenario,point,phase,time).current;
 return scale(physical,channel.ctRatio/actualCtRatio(point),shift);
}

// Mostres de cada entrada amb les connexions i relacions de TC realment establertes.
export function instrumentChannelComponents(scenario,settings,slot,time){
 checkConfiguration(scenario,settings);
 if(!Number.isInteger(slot)||slot<0||slot>=scenario.phases)throw new RangeError('Canal no disponible.');
 if(settings.topology!==(scenario.phases===3?'3P4W':'1P2W'))
   return {voltage:null,current:null,frequency:scenario.frequency};
 return {
   voltage:selectedVoltage(scenario,settings.pointId,settings.voltageChannels[slot],time),
   current:selectedCurrent(scenario,settings.pointId,settings.currentChannels[slot],time),
   frequency:scenario.frequency
 };
}
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
   const v=selectedVoltage(scenario,settings.pointId,vc,time);
   const i=selectedCurrent(scenario,settings.pointId,ic,time);
   const power=v&&i?componentPower(v,i):null;
   rows.push({
     slot,voltagePhase:vc?.enabled?vc.phase:null,currentPhase:ic?.enabled?ic.phase:null,
     voltageTerminals:vc?{positive:vc.positive??null,negative:vc.negative??null,positivePoint:vc.positivePoint??null,negativePoint:vc.negativePoint??null}:null,
     currentConductor:ic?.conductor??null,currentPoint:ic?.pointId??null,
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
// El detector intern observa les lectures configurades al voltant de les
// transicions temporals, independentment de l'interval de registre escollit.
// Mai no mostra l'etiqueta secreta de l'escenari.
export function captureInstrumentEvents(scenario,settings){
 checkConfiguration(scenario,settings);
 const {start,duration}=settings;
 const end=start+duration,events=[];
 for(const change of scenario.events){
   // Només es detecta una transició si l'equip ja estava adquirint abans de l'inici.
   if(change.start<start)continue;
   const began=Math.max(start,change.start);
   const finished=Math.min(end,change.start+change.duration);
   if(finished<=began||change.duration<.02)continue;
   const probe=Math.min(finished-1e-6,began+.01);
   const referenceTime=Math.max(0,change.start-.001);
   const baseline=instrumentSnapshot(scenario,settings,referenceTime);
   const changed=instrumentSnapshot(scenario,settings,probe);
   if(baseline.status==='topology-incompatible'||changed.status==='topology-incompatible')continue;
   const observed=[];
   for(let slot=0;slot<changed.phases.length;slot++){
     const before=baseline.phases[slot],after=changed.phases[slot];
     for(const [key,unit] of [['voltageRms','V'],['currentRms','A']]){
       const old=before[key],value=after[key];
       if(old===null||value===null||Math.abs(old)<1e-9)continue;
       const delta=100*(value-old)/Math.abs(old);
       if(Math.abs(delta)>=5)observed.push({
         channel:slot+1,quantity:key==='voltageRms'?'Tensió RMS':'Corrent RMS',
         unit,previous:old,observed:value,variationPercent:delta
       });
     }
   }
   if(observed.length)events.push({
     start:began,duration:finished-began,measurements:observed,
     truncatedAtStart:began>change.start,truncatedAtEnd:finished<change.start+change.duration
   });
 }
 return events;
}
export function acquireInstrument(scenario,settings){
 checkConfiguration(scenario,settings);
 const base=acquireReal(scenario,{
   pointId:settings.pointId,start:settings.start,duration:settings.duration,interval:settings.interval
 });
 const rows=base.rows.map(row=>instrumentSnapshot(scenario,settings,row.time));
 const capturedEvents=captureInstrumentEvents(scenario,settings);
 return {
   schemaVersion:1,caseCode:scenario.code,pointId:settings.pointId,
   start:settings.start,duration:settings.duration,interval:settings.interval,
   settings:JSON.parse(JSON.stringify(settings)),rows,
   capturedEvents,
   // Conservem el camp antic, sense codis interns del motor.
   detectedEventIds:[],
   simulated:true
 };
}
