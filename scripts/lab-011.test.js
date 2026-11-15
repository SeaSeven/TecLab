import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCase,codeForCase,parseCaseCode,classCases} from '../labs/lab-011/cases.js';
import {baseComponents,phaseReading,realSnapshot,rms,thd,sampleWave,acquireReal} from '../labs/lab-011/model.js';
import {defaultInstrument,instrumentSnapshot,acquireInstrument} from '../labs/lab-011/instrument.js';
import {newSession,recordAcquisition,sessionToJSON,sessionFromJSON} from '../labs/lab-011/session.js';

const nearly=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),a+' ≠ '+b);
test('30 codis individuals, diferents i recuperables',()=>{
 const entries=classCases(30);
 assert.equal(entries.length,30);
 assert.equal(new Set(entries.map(x=>x.code)).size,30);
 for(const entry of entries) assert.equal(codeForCase(parseCaseCode(entry.code).seed),entry.code);
});
test('validació de codi i integritat',()=>{
 const code=codeForCase(201234);
 assert.equal(parseCaseCode(code).seed,201234);
 assert.throws(()=>parseCaseCode(code.slice(0,-1)+'0'));
 assert.throws(()=>parseCaseCode('TL-PQ2-1-1234'));
});
test('mateixa llavor i instant reprodueixen exactament el mateix escenari',()=>{
 const a=generateCase(100001),b=generateCase(100001);
 assert.deepEqual(a,b);
 assert.deepEqual(realSnapshot(a,'PCC',175),realSnapshot(b,'PCC',175));
});
test('RMS i THD concorden amb components del mateix estat',()=>{
 const scenario=generateCase(100001),c=baseComponents(scenario,'PCC',0,42);
 const v1=c.voltage.find(h=>h.order===1).rms;
 const expected=Math.hypot(...c.voltage.filter(h=>h.order>1).map(h=>h.rms))/v1*100;
 nearly(thd(c.voltage),expected);
 const reading=phaseReading(scenario,'PCC',0,42);
 nearly(reading.voltageRms,rms(c.voltage));
 nearly(reading.voltageTHD,expected);
});
test('RMS de la forma d’ona coincideix numèricament amb el model',()=>{
 const s=generateCase(100001),c=baseComponents(s,'PCC',0,40);
 const points=4096,period=1/s.frequency;
 let sum=0;
 for(let n=0;n<points;n++)sum+=sampleWave(c.voltage,s.frequency,period*n/points)**2;
 nearly(Math.sqrt(sum/points),rms(c.voltage),1e-6);
});
test('potència activa, aparent i FP són coherents',()=>{
 const r=phaseReading(generateCase(100000),'PCC',0,5);
 nearly(r.powerFactor,r.p/r.s);
 assert.ok(Math.abs(r.p)<=r.s+1e-9);
});
test('relació de TC errònia escala I i potències però no V',()=>{
 const s=generateCase(100000),correct=defaultInstrument(s);
 const a=instrumentSnapshot(s,correct,3);
 const wrong=structuredClone(correct);wrong.currentChannels[0].ctRatio*=2;
 const b=instrumentSnapshot(s,wrong,3);
 nearly(a.phases[0].voltageRms,b.phases[0].voltageRms);
 nearly(2*a.phases[0].currentRms,b.phases[0].currentRms);
 nearly(2*a.phases[0].p,b.phases[0].p);
});
test('pinça invertida canvia P i Q1, no I ni V',()=>{
 const s=generateCase(100000),settings=defaultInstrument(s);
 const a=instrumentSnapshot(s,settings,3);
 settings.currentChannels[0].inverted=true;
 const b=instrumentSnapshot(s,settings,3);
 nearly(a.phases[0].currentRms,b.phases[0].currentRms);
 nearly(a.phases[0].voltageRms,b.phases[0].voltageRms);
 nearly(a.phases[0].p,-b.phases[0].p);
 nearly(a.phases[0].q1,-b.phases[0].q1);
});
test('fase de corrent intercanviada altera potències sense alterar corrent RMS',()=>{
 const s=generateCase(100005); // Família D: xarxa trifàsica
 assert.equal(s.phases,3);
 const config=defaultInstrument(s);
 const a=instrumentSnapshot(s,config,4);
 config.currentChannels[0].phase=1;
 const b=instrumentSnapshot(s,config,4);
 nearly(a.phases[1].currentRms,b.phases[0].currentRms);
 assert.notEqual(a.phases[0].p,b.phases[0].p);
});
test('canal omès no inventa potència total',()=>{
 const s=generateCase(100005),settings=defaultInstrument(s);
 settings.currentChannels[1].enabled=false;
 const x=instrumentSnapshot(s,settings,5);
 assert.equal(x.status,'incomplete');
 assert.equal(x.phases[1].currentRms,null);
 assert.equal(x.totalP,null);
});
test('captura temporal fora d’un sot de tensió no detecta esdeveniment',()=>{
 const c=Array.from({length:7},(_,i)=>generateCase(100000+i)).find(c=>c.family==='C');
 assert.ok(c);
 const start=c.events[0].start;
 assert.equal(acquireReal(c,{start:0,duration:20,interval:1}).detectedEventIds.length,0);
 assert.ok(acquireReal(c,{start:start-.1,duration:3,interval:.1}).detectedEventIds.includes('EV-SAG'));
});
test('mostreig lent pot perdre una pertorbació breu',()=>{
 const c=Array.from({length:7},(_,i)=>generateCase(100000+i)).find(c=>c.family==='F');
 assert.ok(c);
 const t=c.events[0].start;
 const capture=acquireReal(c,{start:t-.4,duration:2,interval:2});
 assert.equal(capture.detectedEventIds.length,0);
});
test('adquisició conserva configuració i és coherent amb les mostres',()=>{
 const s=generateCase(100000),config=defaultInstrument(s);
 const record=acquireInstrument(s,config);
 assert.equal(record.rows.length,31);
 assert.equal(record.caseCode,s.code);
 nearly(record.rows[0].phases[0].p,instrumentSnapshot(s,config,0).phases[0].p);
});
test('sessió exportada conserva totes les adquisicions',()=>{
 const s=generateCase(100000);
 const first=newSession(s.code);
 const next=recordAcquisition(first);
 assert.equal(first.acquisitions.length,0);
 const restored=sessionFromJSON(sessionToJSON(next));
 assert.deepEqual(restored,next);
 assert.equal(restored.acquisitions.length,1);
 assert.equal(restored.acquisitions[0].rows.length,31);
});
