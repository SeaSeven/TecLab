import test from 'node:test';
import assert from 'node:assert/strict';
import {capacitorCode,inductorCode,equivalent,tauRC,tauRL,capacitorCharge,inductorRise,xc,xl,seriesAC,makeCode,readCode,generate,checkAnswer,parseNumber} from '../shared/services/reactive.js';
const close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('codificació de condensadors i inductàncies',()=>{
 assert.equal(capacitorCode('104'),100000);
 assert.equal(inductorCode('101'),100);
 assert.throws(()=>capacitorCode('10A'));
 assert.throws(()=>inductorCode('AB3'));
});
test('associacions ideals correctes',()=>{
 close(equivalent('C',[100,100],'series'),50);
 close(equivalent('C',[100,200],'parallel'),300);
 close(equivalent('L',[100,200],'series'),300);
 close(equivalent('L',[100,100],'parallel'),50);
});
test('transitoris RC i RL',()=>{
 close(tauRC(10000,100e-6),1);
 close(tauRL(100,100e-3),0.001);
 close(capacitorCharge(12,1,1),12*(1-1/Math.E));
 close(inductorRise(12,100,0.001,0.001),0.12*(1-1/Math.E));
});
test('reactància i fase en circuits CA',()=>{
 close(xl(50,0.1),Math.PI*10);
 close(xc(50,100e-6),1/(Math.PI*0.01));
 const rl=seriesAC({R:100,L:0.1,f:50,voltage:10});
 assert.ok(rl.phase>0);
 const rc=seriesAC({R:100,C:100e-6,f:50,voltage:10});
 assert.ok(rc.phase<0);
 const rlc=seriesAC({R:100,L:0.1,C:100e-6,f:50,voltage:10});
 close(rlc.current,10/rlc.impedance);
});
test('codis recuperables i checksum',()=>{
 for(const mode of ['002','003'])for(let level=1;level<=3;level++){
   const q=generate(mode,level,123456);
   const parsed=readCode(q.code);
   assert.equal(parsed.mode,mode);assert.equal(parsed.level,level);
   const recovered=generate(parsed.mode,parsed.level,parsed.seed,parsed.kind);
   assert.deepEqual(recovered,q);
   assert.throws(()=>readCode(q.code.slice(0,-1)+'Z'));
 }
 assert.throws(()=>makeCode('004',1,2,0));
});
test('tots els exercicis tenen un resultat vàlid i recuperable',()=>{
 for(const mode of ['002','003'])for(let level=1;level<=3;level++)for(let seed=1;seed<=450;seed++){
   const q=generate(mode,level,seed);
   assert.ok(Number.isFinite(q.expected),`invalid ${mode} ${level} ${seed}`);
   assert.ok(q.parts.length>0);
   assert.ok(q.title&&q.statement&&q.formula&&q.unit);
   assert.equal(checkAnswer(q.expected.toPrecision(9),q.expected).ok,true);
   const t=readCode(q.code);assert.equal(t.seed,seed);
 }
});
test('entrada amb coma i errors',()=>{
 assert.equal(parseNumber('1,25'),1.25);
 assert.equal(parseNumber('3e-5'),0.00003);
 assert.ok(Number.isNaN(parseNumber('1.2.3')));
 assert.equal(checkAnswer('invalida',100).ok,false);
 assert.equal(checkAnswer('100,1',100).ok,true);
 assert.equal(checkAnswer('110',100).ok,false);
});
