import test from 'node:test';
import assert from 'node:assert/strict';
import {sample,bounds,verify,codeFor,fromCode,exercise} from '../labs/lab-008/signal.js';
test('ones sinusoidals i valors màxims',()=>{const s={wave:'sin',frequency:1000,vpp:4,offset:1,phase:0,output:true};assert.ok(Math.abs(sample(s,.00025)-3)<1e-8);assert.deepEqual(bounds(s),{min:-1,max:3});s.output=false;assert.equal(sample(s,.00025),0)});
test('polsos amb cicle de treball configurat',()=>{const s={wave:'pulse',frequency:1000,vpp:6,offset:0,duty:30,output:true};assert.equal(sample(s,.0002),3);assert.equal(sample(s,.0004),-3)});
test('exercicis estables de tots els nivells',()=>{for(const level of ['inicial','intermedi','avancat'])for(const seed of [0,1,123456789,4294967295]){const code=codeFor(level,seed,'triangle');const d=fromCode(code);assert.deepEqual(d,{level,seed,wave:'triangle'});assert.deepEqual(exercise(d.level,d.seed,d.wave),exercise(level,seed,'triangle'));assert.throws(()=>fromCode(code.slice(0,-1)+'!'))}});
test('comprovació de paràmetres, sortida i desajust',()=>{const goal=exercise('intermedi',99,'pulse');const state={...goal,output:true};assert.ok(verify(state,goal).every(row=>row[1]));state.frequency*=1.1;assert.equal(verify(state,goal).find(row=>row[0]==='Freqüència')[1],false)});
