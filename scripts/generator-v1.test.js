import test from 'node:test';
import assert from 'node:assert/strict';
import {sample,bounds,rmsAC,verify,codeFor,fromCode,exercise,limitStatus} from '../labs/lab-008/signal.js';

test('senyals i mesures bàsiques',()=>{
 const s={wave:'sin',frequency:1000,vpp:4,offset:1,phase:0,duty:50,output:true,load:'highz'};
 assert.ok(Math.abs(sample(s,.00025)-3)<1e-8);
 assert.deepEqual(bounds(s),{min:-1,max:3});
 assert.ok(Math.abs(rmsAC(s)-Math.SQRT2)<1e-9);
 s.output=false;assert.equal(sample(s,.00025),0);
});
test('PWM, període i amplitud',()=>{
 const s={wave:'pulse',frequency:1000,vpp:6,offset:0,duty:30,phase:0,output:true,load:'highz'};
 assert.equal(sample(s,.0002),3);assert.equal(sample(s,.0004),-3);
 assert.equal(rmsAC({ ...s, wave:'square'}),3);
});
test('codis recuperables i límits correctes en 11.000 exercicis',()=>{
 let count=0;
 for(const level of ['inicial','intermedi','avancat'])
 for(const kind of ['direct','peak','bounds','period','rms','load'])
 for(let seed=0;seed<1000;seed++){
  if(level==='inicial'&&kind!=='direct')continue;
  if(level==='intermedi'&&!['direct','peak','bounds','period'].includes(kind))continue;
  const goal=exercise(level,seed,'random',kind);
  const code=codeFor(level,seed,'random',kind);
  const decoded=fromCode(code);
  assert.deepEqual(exercise(decoded.level,decoded.seed,decoded.wave,decoded.kind),goal);
  assert.equal(limitStatus(goal).ok,true);
  assert.equal(verify({...goal,output:true},goal).every(c=>c[1]),true);
  count++;
 }
 assert.equal(count,11000);
});
test('codis GEN1 anteriors i detecció d’errors',()=>{
 const original=codeFor('intermedi',12345,'square','direct');
 assert.ok(original.startsWith('TL-GEN1-'));
 assert.deepEqual(fromCode(original),{level:'intermedi',seed:12345,wave:'square',kind:'direct'});
 assert.throws(()=>fromCode(original.replace(/.$/,'!')));
});
test('restriccions de tensió segons càrrega',()=>{
 const s={wave:'sin',frequency:1000,vpp:8,offset:2,duty:50,phase:0,output:true,load:'highz'};
 assert.equal(limitStatus(s).ok,true);s.load='50ohm';assert.equal(limitStatus(s).ok,false);
 s.vpp=4;s.offset=0;assert.equal(limitStatus(s).ok,true);
});
