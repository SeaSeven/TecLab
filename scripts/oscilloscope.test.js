import test from 'node:test';
import assert from 'node:assert/strict';
import {voltage,state,path,generate,codeOf,readCode,checkReading,triggerState,advancedAnswer} from '../labs/lab-006/signal.js';
test('senyal sinusoidal a quart de període',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.ok(Math.abs(voltage(ex,.00025)-3)<1e-9);assert.ok(Math.abs(voltage(ex,.00075)+3)<1e-9);});
test('ones triangular i quadrada',()=>{for(const type of ['T','Q']){const ex={type,amplitude:2,frequency:1000};assert.ok(Math.abs(voltage(ex,.00025)-2)<1e-8);assert.ok(Math.abs(voltage(ex,.00075)+2)<1e-8);}});
test('configuració correcta',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.equal(state(ex,1,.0002).good,true);assert.equal(state(ex,.5,.0002).good,false);assert.equal(state(ex,1,.001).good,false);assert.equal(state(ex,1,.0001).good,false);});
test('traçat finit',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.match(path(ex,1,.0002),/^M0 /);assert.ok(!path(ex,1,.0002).includes('NaN'));});
test('codis recuperables i validats',()=>{for(const mode of ['A','S','T','Q'])for(const seed of [0,1,123456789,0xffffffff]){const ex=generate(mode,seed);assert.equal(readCode(ex.code).seed,seed);assert.deepEqual(generate(mode,seed),ex);assert.equal(codeOf(mode,seed),ex.code);assert.throws(()=>readCode(ex.code.slice(0,-1)+'Z'));}assert.throws(()=>readCode('TL-OSC1-A-ABC-0000'));});
test('lectures amb coma i tolerància',()=>{assert.equal(checkReading('6,0',6),'correct');assert.equal(checkReading('6.5',6),'incorrect');assert.equal(checkReading('',6),'empty');});

test('el nivell del trigger estabilitza només dins de la tensió del canal 1',()=>{const e={type:'S',amplitude:2,frequency:500};assert.equal(triggerState(e,0).stable,true);assert.equal(triggerState(e,3).stable,false);});
test('exercicis avançats de dos canals reproduïbles',()=>{for(const seed of [0,1,23,9999,0xffffffff]){const ex=generate('D',seed);assert.equal(ex.code.startsWith('TL-OSC2-D-'),true);assert.deepEqual(ex,generate('D',readCode(ex.code).seed));assert.equal(ex.channel2.frequency,ex.frequency);assert.ok(ex.channel2.phase>0);assert.ok(advancedAnswer(ex).delayMs>0);assert.equal(readCode(ex.code).mode,'D');}});
test('els codis de versió OSC1 continuen vàlids',()=>{for(const mode of ['A','S','T','Q']){const c=codeOf(mode,123456);assert.equal(readCode(c).mode,mode);assert.equal(generate(mode,123456).code,c);}});
test('CH2 té un retard respecte de CH1',()=>{const a={type:'S',amplitude:1,frequency:1000},b={...a,phase:90};assert.ok(Math.abs(voltage(a,0))<1e-9);assert.ok(Math.abs(voltage(b,.00025))<1e-9);assert.ok(Math.abs(voltage(b,0)+1)<1e-9);});
