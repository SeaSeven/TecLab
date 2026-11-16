import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCase,codeForCase,parseCaseCode,classCases} from '../labs/lab-011/cases.js';
import {baseComponents,phaseReading,realSnapshot,rms,thd,sampleWave,acquireReal} from '../labs/lab-011/model.js';
import {defaultInstrument,instrumentSnapshot,acquireInstrument,instrumentChannelComponents} from '../labs/lab-011/instrument.js';
import {newSession,recordAcquisition,sessionToJSON,sessionFromJSON} from '../labs/lab-011/session.js';
import {findFreeSocket} from '../labs/lab-011/wiring.js';
import {buildInstrumentReport} from '../labs/lab-011/exports.js';
import {foundationsManual,helpManual} from '../labs/lab-011/manual.js';

const nearly=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),a+' ≠ '+b);
function wiredInstrument(s){
 const settings=defaultInstrument(s);
 settings.voltageChannels.forEach((v,i)=>{v.positive='L'+(i+1);v.negative='N';});
 settings.currentChannels.forEach((v,i)=>{v.conductor='L'+(i+1);});
 return settings;
}
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
 const s=generateCase(100000),correct=wiredInstrument(s);
 const a=instrumentSnapshot(s,correct,3);
 const wrong=structuredClone(correct);wrong.currentChannels[0].ctRatio*=2;
 const b=instrumentSnapshot(s,wrong,3);
 nearly(a.phases[0].voltageRms,b.phases[0].voltageRms);
 nearly(2*a.phases[0].currentRms,b.phases[0].currentRms);
 nearly(2*a.phases[0].p,b.phases[0].p);
});
test('pinça invertida canvia P i Q1, no I ni V',()=>{
 const s=generateCase(100000),settings=wiredInstrument(s);
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
 const config=wiredInstrument(s);
 const a=instrumentSnapshot(s,config,4);
 // La fase la determina la col·locació física de la pinça, no el camp històric phase.
 config.currentChannels[0].conductor='L2';
 const b=instrumentSnapshot(s,config,4);
 nearly(a.phases[1].currentRms,b.phases[0].currentRms);
 assert.notEqual(a.phases[0].p,b.phases[0].p);
});
test('canal omès no inventa potència total',()=>{
 const s=generateCase(100005),settings=wiredInstrument(s);
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
 const s=generateCase(100000),config=wiredInstrument(s);
 const record=acquireInstrument(s,config);
 assert.equal(record.rows.length,31);
 assert.equal(record.caseCode,s.code);
 nearly(record.rows[0].phases[0].p,instrumentSnapshot(s,config,0).phases[0].p);
});
test('sessió exportada conserva totes les adquisicions',()=>{
 const s=generateCase(100000);
 const first=newSession(s.code);
 first.settings=wiredInstrument(s);
 const next=recordAcquisition(first);
 assert.equal(first.acquisitions.length,0);
 const restored=sessionFromJSON(sessionToJSON(next));
 assert.deepEqual(restored,next);
 assert.equal(restored.acquisitions.length,1);
 assert.equal(restored.acquisitions[0].rows.length,31);
});

test('sense sondes ni pinces col·locades no es generen lectures de mesura',()=>{
 const s=generateCase(100005),x=instrumentSnapshot(s,defaultInstrument(s),4);
 assert.equal(x.status,'incomplete');
 assert.equal(x.phases[0].voltageRms,null);
 assert.equal(x.phases[0].currentRms,null);
});
test('invertir el sentit de les sondes canvia el signe de P però no els RMS',()=>{
 const s=generateCase(100005),settings=wiredInstrument(s);
 const a=instrumentSnapshot(s,settings,4).phases[0];
 settings.voltageChannels[0].positive='N';
 settings.voltageChannels[0].negative='L1';
 const b=instrumentSnapshot(s,settings,4).phases[0];
 nearly(a.voltageRms,b.voltageRms);
 nearly(a.p,-b.p);
});
test('sondes fase-fase mostren tensió diferent a fase-neutre',()=>{
 const s=generateCase(100005),settings=wiredInstrument(s);
 const a=instrumentSnapshot(s,settings,4).phases[0].voltageRms;
 settings.voltageChannels[0].negative='L2';
 const b=instrumentSnapshot(s,settings,4).phases[0].voltageRms;
 assert.ok(b>a*1.6&&b<a*1.9);
});
test('pinça absent dona corrent nul de lectura, no valor inventat',()=>{
 const s=generateCase(100005),settings=wiredInstrument(s);
 settings.currentChannels[0].conductor=null;
 const x=instrumentSnapshot(s,settings,4);
 assert.equal(x.phases[0].currentRms,null);
 assert.equal(x.totalP,null);
});

test('dos allotjaments físics del mateix conductor eviten la superposició',()=>{
 const nodes=[{point:'PCC',conductor:'L1',socket:0},{point:'PCC',conductor:'L1',socket:1}];
 const wires=[{id:'V1',kind:'v',index:0},{id:'V2',kind:'v',index:1},{id:'I1',kind:'i',index:0}];
 const settings={
   voltageChannels:[{positive:'L1',positivePoint:'PCC',positiveSocket:0},{positive:null,positivePoint:null}],
   currentChannels:[{conductor:null,pointId:null}]
 };
 assert.equal(findFreeSocket(nodes,wires,settings,wires[1],'PCC','L1',0).socket,1);
 settings.voltageChannels[1]={positive:'L1',positivePoint:'PCC',positiveSocket:1};
 assert.equal(findFreeSocket(nodes,wires,settings,wires[2],'PCC','L1',0),null);
 // Reposicionar un cable al seu propi allotjament no l'ocupa dues vegades.
 assert.equal(findFreeSocket(nodes,wires,settings,wires[0],'PCC','L1',0).socket,0);
});

test('les sondes es poden col·locar als dos borns de 24 V CC sense mesura AC fictícia',()=>{
 const s=generateCase(100005),settings=wiredInstrument(s);
 settings.voltageChannels[0].positive='+24V';
 settings.voltageChannels[0].positivePoint='DC24';
 settings.voltageChannels[0].negative='0V';
 settings.voltageChannels[0].negativePoint='DC24';
 const reading=instrumentSnapshot(s,settings,4).phases[0];
 assert.equal(reading.voltageRms,0);
 assert.equal(reading.voltageTHD,null);
});
test('una pinça AC sobre +24 V CC no registra corrent estacionari',()=>{
 const s=generateCase(100005),settings=wiredInstrument(s);
 settings.currentChannels[0].pointId='DC24';
 settings.currentChannels[0].conductor='+24V';
 const reading=instrumentSnapshot(s,settings,4).phases[0];
 assert.equal(reading.currentRms,0);
 assert.equal(reading.p,0);
});
test('les connexions a 24 V CC queden documentades a la sessió per a l’informe',()=>{
 const s=generateCase(100005),settings=wiredInstrument(s);
 settings.voltageChannels[0].positivePoint='DC24';
 settings.voltageChannels[0].positive='+24V';
 settings.voltageChannels[0].negativePoint='DC24';
 settings.voltageChannels[0].negative='0V';
 settings.currentChannels[0].pointId='DC24';
 settings.currentChannels[0].conductor='+24V';
 const session=newSession(s.code);
 session.settings=settings;
 const restored=sessionFromJSON(sessionToJSON(recordAcquisition(session)));
 assert.equal(restored.acquisitions[0].settings.voltageChannels[0].positivePoint,'DC24');
 assert.equal(restored.acquisitions[0].settings.currentChannels[0].conductor,'+24V');
});

test('formes d’ona i harmònics corresponen a les sondes i pinces connectades',()=>{
 const s=generateCase(100005),settings=wiredInstrument(s);
 const components=instrumentChannelComponents(s,settings,0,5);
 assert.ok(components.voltage.length>=1);
 assert.ok(components.current.length>=1);
 settings.currentChannels[0].inverted=true;
 const flipped=instrumentChannelComponents(s,settings,0,5);
 nearly(components.current[0].rms,flipped.current[0].rms);
 const difference=Math.abs(Math.cos(components.current[0].angle-flipped.current[0].angle));
 nearly(difference,1);
 settings.currentChannels[0].ctRatio*=2;
 const doubled=instrumentChannelComponents(s,settings,0,5);
 nearly(doubled.current[0].rms,components.current[0].rms*2);
});
test('la captura interna troba un sot observable que el registre lent pot ometre',()=>{
 const s=Array.from({length:7},(_,i)=>generateCase(100000+i)).find(c=>c.family==='C');
 const settings=wiredInstrument(s);
 const event=s.events.find(e=>e.kind==='sag');
 Object.assign(settings,{start:event.start-.2,duration:3,interval:2});
 const result=acquireInstrument(s,settings);
 assert.ok(result.capturedEvents.length>0);
 assert.ok(result.capturedEvents[0].measurements.some(x=>x.quantity==='Tensió RMS'));
});
test('no es generen esdeveniments amb les sondes i pinces sense connectar',()=>{
 const s=Array.from({length:7},(_,i)=>generateCase(100000+i)).find(c=>c.family==='C');
 const settings=defaultInstrument(s),event=s.events[0];
 Object.assign(settings,{start:event.start-.2,duration:3,interval:1});
 assert.deepEqual(acquireInstrument(s,settings).capturedEvents,[]);
});
test('l’informe conserva codi, esdeveniments, gràfics i configuració',()=>{
 const s=Array.from({length:7},(_,i)=>generateCase(100000+i)).find(c=>c.family==='C');
 const settings=wiredInstrument(s),event=s.events[0];
 Object.assign(settings,{start:event.start-.2,duration:3,interval:1});
 const session=newSession(s.code);
 session.settings=settings;
 const result=recordAcquisition(session);
 const html=buildInstrumentReport(result,{generatedAt:new Date('2026-11-16T12:00:00Z')});
 assert.ok(html.includes(s.code));
 assert.ok(html.includes('Formes d’ona i espectres mesurats'));
 assert.ok(html.includes('Registre d’esdeveniments capturats'));
 assert.ok(html.includes('Sondes V (+ / −)'));
});
test('el manual descriu l’equip sense revelar famílies o respostes dels casos',()=>{
 const foundations=foundationsManual(),help=helpManual();
 assert.ok(foundations.includes('THD-U')&&foundations.includes('Q1'));
 assert.ok(help.includes('ADQUIRIR')&&help.includes('PDF'));
 assert.ok(!help.includes('EV-SAG'));
 assert.ok(!foundations.includes('família G'));
});

test('auditoria de la sèrie docent: 30 casos amb escenaris mesurables i reproduïbles',()=>{
 const entries=classCases(30);
 assert.equal(entries.length,30);
 const fingerprints=new Set(),distribution={};
 for(const entry of entries){
   const {seed}=parseCaseCode(entry.code);
   const s=generateCase(seed);
   assert.equal(entry.code,s.code);
   assert.deepEqual(s,generateCase(seed));
   assert.equal(s.phases,3);
   assert.equal(s.nominalVoltage,230);
   assert.equal(s.nominalLineVoltage,400);
   assert.ok(s.frequency>=49.9&&s.frequency<=50.1);
   distribution[s.family]=(distribution[s.family]??0)+1;
   const states=[];
   for(const point of ['PCC','DRIVE','CTRL']){
     const config=defaultInstrument(s,point);
     config.voltageChannels.forEach((v,i)=>Object.assign(v,{
       positive:'L'+(i+1),negative:'N',positivePoint:point,negativePoint:point
     }));
     config.currentChannels.forEach((i,n)=>Object.assign(i,{conductor:'L'+(n+1),pointId:point}));
     const now=instrumentSnapshot(s,config,0);
     assert.equal(now.status,'measured');
     assert.equal(now.phases.length,3);
     assert.ok(now.phases.every(v=>v.voltageRms>100&&v.voltageRms<300));
     assert.ok(now.phases.every(v=>v.currentRms>0&&Number.isFinite(v.p)));
     states.push(now.phases.map(v=>[v.voltageRms,v.currentRms,v.voltageTHD,v.currentTHD]));
     for(const event of s.events){
       const start=event.start-.2,duration=Math.min(s.horizonSeconds-start,event.duration+1);
       Object.assign(config,{start,duration,interval:1});
       const result=acquireInstrument(s,config);
       assert.ok(result.capturedEvents.length>=1,'Cap variació observable: '+s.code+' '+point);
       assert.ok(result.capturedEvents.some(e=>e.start===event.start));
       assert.ok(result.capturedEvents.every(e=>!('id' in e)&&!('kind' in e)));
     }
   }
   fingerprints.add(JSON.stringify({states,events:s.events}));
 }
 assert.equal(fingerprints.size,30);
 assert.deepEqual(Object.keys(distribution).sort(),['A','B','C','D','E','F','G']);
 assert.ok(Object.values(distribution).every(n=>n>=4&&n<=5));
});

test('30 casos: finestres comunes de 450 s cobreixen el mateix horitzó temporal',()=>{
 const entries=classCases(30);
 for(const entry of entries){
   const scenario=generateCase(parseCaseCode(entry.code).seed);
   const settings=defaultInstrument(scenario);
   settings.voltageChannels.forEach((ch,i)=>Object.assign(ch,{
     positive:'L'+(i+1),negative:'N',positivePoint:'PCC',negativePoint:'PCC'
   }));
   settings.currentChannels.forEach((ch,i)=>Object.assign(ch,{conductor:'L'+(i+1),pointId:'PCC'}));
   const acquisitions=[];
   for(const start of [0,450]){
     Object.assign(settings,{start,duration:450,interval:10});
     const record=acquireInstrument(scenario,settings);
     assert.equal(record.rows.length,46,entry.code);
     assert.ok(record.rows.every(row=>row.status==='measured'),entry.code);
     assert.ok(record.rows.every(row=>row.phases.every(p=>p.voltageRms>0&&p.currentRms>0)),entry.code);
     acquisitions.push(record);
   }
   const caught=acquisitions.flatMap(a=>a.capturedEvents);
   assert.equal(caught.length,scenario.events.length,entry.code);
   assert.ok(caught.every(event=>event.start>=0&&event.start<900),entry.code);
 }
});

test('historial i informe reflecteixen els punts de connexió físics, no el punt predeterminat',()=>{
 const s=generateCase(100000),session=newSession(s.code),settings=wiredInstrument(s);
 for(const v of settings.voltageChannels){
   v.positivePoint='DRIVE';
   v.negativePoint='DRIVE';
 }
 for(const i of settings.currentChannels)i.pointId='DRIVE';
 session.settings=settings;
 const recorded=recordAcquisition(session);
 const report=buildInstrumentReport(recorded);
 assert.ok(report.includes('M-001 · P1'));
 assert.ok(!report.includes('M-001 · P0'));
});
test('els 30 casos produeixen JSON i informes traçables amb dues adquisicions',()=>{
 for(const entry of classCases(30)){
   const s=generateCase(parseCaseCode(entry.code).seed),session=newSession(entry.code);
   session.settings=wiredInstrument(s);
   Object.assign(session.settings,{start:0,duration:450,interval:10});
   const first=recordAcquisition(session);
   first.settings.start=450;
   const second=recordAcquisition(first);
   const restored=sessionFromJSON(sessionToJSON(second));
   const html=buildInstrumentReport(restored,{generatedAt:new Date('2026-11-16T12:00:00Z')});
   assert.ok(html.includes(entry.code),entry.code);
   assert.ok(html.includes('M-002'),entry.code);
   assert.ok(html.includes('Formes d’ona i espectres mesurats'),entry.code);
   assert.equal(restored.acquisitions.length,2);
   assert.equal(restored.acquisitions.reduce((n,r)=>n+r.capturedEvents.length,0),s.events.length);
 }
});
