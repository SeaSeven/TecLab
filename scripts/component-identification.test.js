import test from 'node:test';
import assert from 'node:assert/strict';
import {threeDigit,capacitorBands,axialBands,range,makeComponentCode,readComponentCode,generateComponent,checkComponentAnswer} from '../shared/services/component-identification.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('condensadors: codificació convencional',()=>{
 assert.deepEqual(threeDigit('104'),{value:100000,unit:'pF'});
 assert.equal(threeDigit('473').value,47000);
 assert.throws(()=>threeDigit('10x'));
});
test('bobines: bandes i tolerància',()=>{
 assert.deepEqual(axialBands(['marró','negre','vermell','daurat']),{value:1000,unit:'µH',tolerance:5});
 assert.equal(axialBands(['groc','violeta','taronja','platejat']).value,47000);
 assert.throws(()=>axialBands(['negre','marró','vermell','daurat']));
});
test('intervals de tolerància',()=>{
 assert.deepEqual(range(100,10),{min:90,max:110.00000000000001});
 close(range(47,5).min,44.65);
});
test('codis TL-CI1 exactes i persistents',()=>{
 for(const lab of ['009','010'])for(let level=1;level<=3;level++)for(let seed=1;seed<=400;seed++){
   const q=generateComponent(lab,level,seed),c=readComponentCode(q.code);
   assert.equal(c.lab,lab);assert.equal(c.level,level);assert.equal(c.seed,seed);assert.equal(c.kind,q.kind);
   assert.deepEqual(generateComponent(c.lab,c.level,c.seed,c.kind),q);
   assert.ok(q.visual.component&&q.title&&q.question&&q.solution);
   if(q.choices){assert.ok(q.choices.includes(q.answer));assert.equal(checkComponentAnswer(q.answer,q).ok,true);}
   else{assert.ok(Number.isFinite(q.answer));assert.equal(checkComponentAnswer(String(q.answer),q).ok,true);}
 }
 const x=generateComponent('009',3,4294967295);
 assert.throws(()=>readComponentCode(x.code.slice(0,-1)+(x.code.endsWith('F')?'E':'F')));
 assert.throws(()=>makeComponentCode('008',1,1,1));
});
test('validació de resposta amb tolerància numèrica',()=>{
 const q={answer:100,unit:'nF'};
 assert.equal(checkComponentAnswer('100,2',q).ok,true);
 assert.equal(checkComponentAnswer('110',q).ok,false);
 assert.equal(checkComponentAnswer('abc',q).ok,false);
 const pick={answer:'Inductància toroidal',choices:['Inductància toroidal','Condensador electrolític']};
 assert.equal(checkComponentAnswer('Inductància toroidal',pick).ok,true);
 assert.equal(checkComponentAnswer('Condensador electrolític',pick).ok,false);
});

test('condensadors històrics de tres bandes',()=>{
 assert.deepEqual(capacitorBands(['groc','violeta','taronja']),{value:47000,unit:'pF'});
 assert.throws(()=>capacitorBands(['negre','violeta','taronja']));
 assert.throws(()=>capacitorBands(['groc','violeta','daurat']));
});
test('LAB-009 inclou bandes i associacions als tres nivells i codis recuperables',()=>{
 const kindsByLevel={1:[0,1,2],2:[0,1,2],3:[0,1,2,3,4,5]};
 for(const [level,kinds] of Object.entries(kindsByLevel))for(const kind of kinds)for(let seed=1;seed<=100;seed++){
  const q=generateComponent('009',Number(level),seed,kind);
  assert.equal(q.kind,kind);
  assert.ok(Number.isFinite(q.answer)||q.choices?.includes(q.answer));
  const restored=readComponentCode(q.code);
  assert.deepEqual(generateComponent(restored.lab,restored.level,restored.seed,restored.kind),q);
  if(kind===2&&Number(level)<3||kind===3&&Number(level)===3)assert.equal(q.visual.component,'banded-capacitor');
  if(Number(level)===3&&(kind===4||kind===5)){
   assert.equal(q.visual.component,'capacitor-network');
   const [a,b]=q.visual.values;
   assert.ok(Math.abs(q.answer-(kind===4?a+b:a*b/(a+b)))<1e-8);
  }
 }
});
test('els codis TL-CI1 anteriors continuen generant el mateix enunciat',()=>{
 const prior=[
  {lab:'009',level:1,seed:13,kind:0},
  {lab:'009',level:2,seed:37,kind:1},
  {lab:'009',level:3,seed:251,kind:2},
  {lab:'010',level:3,seed:251,kind:2}
 ];
 for(const x of prior){
  const q=generateComponent(x.lab,x.level,x.seed,x.kind);
  assert.equal(q.code,makeComponentCode(x.lab,x.level,x.kind,x.seed));
 }
});

test('LAB-010: nous exercicis de reconeixement, bandes i associació',()=>{
 const kinds={1:[0,1,2],2:[0,1,2],3:[0,1,2,3,4]};
 for(const [lev,types] of Object.entries(kinds))for(const kind of types)for(let seed=1;seed<=100;seed++){
   const q=generateComponent('010',Number(lev),seed,kind);
   const saved=readComponentCode(q.code);
   assert.deepEqual(generateComponent(saved.lab,saved.level,saved.seed,saved.kind),q);
   assert.ok(q.title&&q.question&&q.visual);
   if(q.choices)assert.ok(q.choices.includes(q.answer));
   else assert.ok(Number.isFinite(q.answer));
   if(Number(lev)===3&&(kind===3||kind===4)){
     assert.equal(q.visual.component,'inductor-network');
     const [a,b]=q.visual.values;
     assert.ok(Math.abs(q.answer-(kind===3?a+b:a*b/(a+b)))<1e-9);
   }
 }
});
