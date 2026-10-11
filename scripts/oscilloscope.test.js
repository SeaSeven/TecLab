import test from 'node:test';
import assert from 'node:assert/strict';
import {voltage,state,path,generate,codeOf,readCode,checkReading} from '../labs/lab-006/signal.js';
test('senyal sinusoidal a quart de període',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.ok(Math.abs(voltage(ex,.00025)-3)<1e-9);assert.ok(Math.abs(voltage(ex,.00075)+3)<1e-9);});
test('ones triangular i quadrada',()=>{for(const type of ['T','Q']){const ex={type,amplitude:2,frequency:1000};assert.ok(Math.abs(voltage(ex,.00025)-2)<1e-8);assert.ok(Math.abs(voltage(ex,.00075)+2)<1e-8);}});
test('configuració correcta',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.equal(state(ex,1,.0002).good,true);assert.equal(state(ex,.5,.0002).good,false);assert.equal(state(ex,1,.001).good,false);assert.equal(state(ex,1,.0001).good,false);});
test('traçat finit',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.match(path(ex,1,.0002),/^M0 /);assert.ok(!path(ex,1,.0002).includes('NaN'));});
test('codis recuperables i validats',()=>{for(const mode of ['A','S','T','Q'])for(const seed of [0,1,123456789,0xffffffff]){const ex=generate(mode,seed);assert.equal(readCode(ex.code).seed,seed);assert.deepEqual(generate(mode,seed),ex);assert.equal(codeOf(mode,seed),ex.code);assert.throws(()=>readCode(ex.code.slice(0,-1)+'Z'));}assert.throws(()=>readCode('TL-OSC1-A-ABC-0000'));});
test('lectures amb coma i tolerància',()=>{assert.equal(checkReading('6,0',6),'correct');assert.equal(checkReading('6.5',6),'incorrect');assert.equal(checkReading('',6),'empty');});
