import test from 'node:test';
import assert from 'node:assert/strict';
import {threeDigit,axialBands,range,makeComponentCode,readComponentCode,generateComponent,checkComponentAnswer} from '../shared/services/component-identification.js';
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
