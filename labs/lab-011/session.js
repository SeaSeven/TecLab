import {parseCaseCode,generateCase} from './cases.js';
import {defaultInstrument,acquireInstrument} from './instrument.js';

export const SESSION_SCHEMA_VERSION=1;
const MAX_ACQUISITIONS=250;
const MAX_ROWS=10001;
function copy(value){return JSON.parse(JSON.stringify(value));}
export function newSession(code){
 const {seed}=parseCaseCode(code);
 const scenario=generateCase(seed);
 return {
   schemaVersion:SESSION_SCHEMA_VERSION,caseCode:scenario.code,
   elapsedSeconds:0,settings:defaultInstrument(scenario),
   acquisitions:[],history:[],notes:''
 };
}
export function recordAcquisition(session){
 const scenario=validateSession(session);
 if(session.acquisitions.length>=MAX_ACQUISITIONS)throw new RangeError('Límit de registres de la sessió assolit.');
 const result=acquireInstrument(scenario,session.settings);
 const id='M-'+String(session.acquisitions.length+1).padStart(3,'0');
 const next=copy(session);
 next.acquisitions.push({id,...result});
 next.elapsedSeconds=Math.max(next.elapsedSeconds,result.start+result.duration);
 next.history.push({kind:'acquisition',id,time:result.start,pointId:result.pointId});
 return next;
}
export function setInstrument(session,settings){
 const next=copy(session);
 next.settings=copy(settings);
 validateSession(next);
 next.history.push({kind:'settings',time:next.elapsedSeconds,pointId:settings.pointId});
 return next;
}
export function validateSession(value){
 if(!value||value.schemaVersion!==SESSION_SCHEMA_VERSION||typeof value.caseCode!=='string')
   throw new RangeError('Format de sessió no compatible.');
 const {seed}=parseCaseCode(value.caseCode);
 const scenario=generateCase(seed);
 if(!Number.isFinite(value.elapsedSeconds)||value.elapsedSeconds<0||value.elapsedSeconds>scenario.horizonSeconds)
   throw new RangeError('Temps de sessió no vàlid.');
 if(!Array.isArray(value.acquisitions)||value.acquisitions.length>MAX_ACQUISITIONS||
    !Array.isArray(value.history)||value.history.length>5000||
    typeof value.notes!=='string'||value.notes.length>10000)
   throw new RangeError('Historial o notes no vàlids.');
 if(!value.settings||!scenario.points.some(p=>p.id===value.settings.pointId))
   throw new RangeError('Configuració de sessió no vàlida.');
 for(const record of value.acquisitions){
   if(record.caseCode!==scenario.code||!Array.isArray(record.rows)||record.rows.length>MAX_ROWS||
      !Number.isFinite(record.start)||!Number.isFinite(record.duration)||record.duration<=0||
      record.start<0||record.start+record.duration>scenario.horizonSeconds)
     throw new RangeError('Registre de mesura no vàlid.');
 }
 return scenario;
}
export function sessionToJSON(session){
 validateSession(session);
 return JSON.stringify(session,null,2);
}
export function sessionFromJSON(json){
 if(typeof json!=='string'||json.length>12000000)throw new RangeError('Arxiu de sessió massa gran.');
 const parsed=JSON.parse(json);
 validateSession(parsed);
 return copy(parsed);
}
