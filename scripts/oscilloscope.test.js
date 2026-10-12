import test from 'node:test';
import assert from 'node:assert/strict';
import {voltage,state,path,generate,codeOf,readCode,checkReading,triggerState,advancedAnswer,triggerOffset,cursorReadings,channelFits,signalLimits,defaultTrigger,dutyCycle,meanVoltage,displayVoltage,signalBounds,readingVpp,faultLabel,exerciseMode} from '../labs/lab-006/signal.js';
test('senyal sinusoidal a quart de període',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.ok(Math.abs(voltage(ex,.00025)-3)<1e-9);assert.ok(Math.abs(voltage(ex,.00075)+3)<1e-9);});
test('ones triangular i quadrada',()=>{for(const type of ['T','Q']){const ex={type,amplitude:2,frequency:1000};if(type==='T'){assert.ok(Math.abs(voltage(ex,.0005)-2)<1e-8);assert.ok(Math.abs(voltage(ex,0)+2)<1e-8);assert.ok(Math.abs(voltage(ex,.001)+2)<1e-8);}else{assert.ok(Math.abs(voltage(ex,.00025)-2)<1e-8);assert.ok(Math.abs(voltage(ex,.00075)+2)<1e-8);}}});
test('configuració correcta',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.equal(state(ex,1,.0002).good,true);assert.equal(state(ex,.5,.0002).good,false);assert.equal(state(ex,1,.001).good,false);assert.equal(state(ex,1,.0001).good,false);});
test('traçat finit',()=>{const ex={type:'S',amplitude:3,frequency:1000};assert.match(path(ex,1,.0002),/^M0 /);assert.ok(!path(ex,1,.0002).includes('NaN'));});
test('codis recuperables i validats',()=>{for(const mode of ['A','S','T','Q'])for(const seed of [0,1,123456789,0xffffffff]){const ex=generate(mode,seed);assert.equal(readCode(ex.code).seed,seed);assert.deepEqual(generate(mode,seed),ex);assert.equal(codeOf(mode,seed),ex.code);assert.throws(()=>readCode(ex.code.slice(0,-1)+'Z'));}assert.throws(()=>readCode('TL-OSC1-A-ABC-0000'));});
test('lectures amb coma i tolerància',()=>{assert.equal(checkReading('6,0',6),'correct');assert.equal(checkReading('6.5',6),'incorrect');assert.equal(checkReading('',6),'empty');});

test('el nivell del trigger estabilitza només dins de la tensió del canal 1',()=>{const e={type:'S',amplitude:2,frequency:500};assert.equal(triggerState(e,0).stable,true);assert.equal(triggerState(e,3).stable,false);});
test('exercicis avançats de dos canals reproduïbles',()=>{for(const seed of [0,1,23,9999,0xffffffff]){const ex=generate('D',seed);assert.equal(ex.code.startsWith('TL-OSC2-D-'),true);assert.deepEqual(ex,generate('D',readCode(ex.code).seed));assert.equal(ex.channel2.frequency,ex.frequency);assert.ok(ex.channel2.phase>0);assert.ok(advancedAnswer(ex).delayMs>0);assert.equal(readCode(ex.code).mode,'D');}});
test('els codis de versió OSC1 continuen vàlids',()=>{for(const mode of ['A','S','T','Q']){const c=codeOf(mode,123456);assert.equal(readCode(c).mode,mode);assert.equal(generate(mode,123456).code,c);}});
test('CH2 té un retard respecte de CH1',()=>{const a={type:'S',amplitude:1,frequency:1000},b={...a,phase:90};assert.ok(Math.abs(voltage(a,0))<1e-9);assert.ok(Math.abs(voltage(b,.00025))<1e-9);assert.ok(Math.abs(voltage(b,0)+1)<1e-9);});

test('nivell intermedi amb codis propis i reproduïbles',()=>{
 for(const seed of [0,1,12345,0xffffffff]){
 const exercise=generate('I',seed);
 assert.equal(exercise.mode,'I');
 assert.ok(exercise.code.startsWith('TL-OSC3-I-'));
 assert.deepEqual(generate(readCode(exercise.code).mode,readCode(exercise.code).seed),exercise);
 assert.equal(readCode(exercise.code).code,exercise.code);
 }
 assert.throws(()=>readCode('TL-OSC2-I-1-0000'));
});
test('trigger ascendent ancorat a la tensió escollida',()=>{
 const e={type:'S',amplitude:2,frequency:1000};
 const offset=triggerOffset(e,1);
 assert.ok(offset>0 && offset<.0005);
 assert.ok(Math.abs(voltage(e,offset)-1)<.02);
 assert.equal(triggerOffset(e,3),null);
});
test('posició vertical i cursors amb escales físiques',()=>{
 const e={type:'S',amplitude:2,frequency:1000};
 assert.equal(channelFits(e,1,0),true);
 assert.equal(channelFits(e,.5,1),false);
 const readings=cursorReadings(120,240,100,180,1,.0005);
 assert.ok(Math.abs(readings.deltaMs-1)<1e-9);
 assert.ok(Math.abs(readings.deltaV-2)<1e-9);
 assert.ok(!path(e,1,.0002,0,2).includes('NaN'));
});

test('ona triangular contínua als extrems i linear per trams',()=>{const ex={type:'T',amplitude:3,frequency:500};for(let i=0;i<=100;i++){const t=i/100*.002;assert.ok(Math.abs(voltage(ex,t)-voltage(ex,t+.002))<1e-7);}assert.ok(Math.abs(voltage(ex,.002-1e-9)-voltage(ex,.002+1e-9))<1e-4);});
test('noves activitats reproduïbles per nivell',()=>{for(const mode of ['M','N'])for(const seed of [0,1,997,0xffffffff]){const ex=generate(mode,seed);assert.equal(readCode(ex.code).mode,mode);assert.deepEqual(generate(mode,seed),ex);if(mode==='N')assert.ok(ex.channel2);}});

test('ones periòdiques aplicades: dent de serra, PWM i rectificada',()=>{
 for(const mode of ['R','P','H'])for(const seed of [0,1,1234,0xffffffff]){
  const ex=generate(mode,seed);
  assert.equal(ex.type,mode);
  assert.equal(readCode(ex.code).mode,mode);
  assert.deepEqual(generate(mode,seed),ex);
  assert.equal(ex.code.startsWith('TL-OSC4-'),true);
 }
 const saw={type:'R',amplitude:2,frequency:1000};
 assert.ok(Math.abs(voltage(saw,.00025)+1)<1e-8);
 assert.ok(Math.abs(voltage(saw,.00075)-1)<1e-8);
 const pwm={type:'P',amplitude:3,frequency:1000,duty:30};
 assert.equal(voltage(pwm,.0002),3);
 assert.equal(voltage(pwm,.0006),-3);
 const rect={type:'H',amplitude:4,frequency:1000};
 assert.equal(signalLimits(rect).peakToPeak,4);
 assert.ok(Math.abs(voltage(rect,.0005)-4)<1e-8);
 assert.ok(Math.abs(voltage(rect,0))<1e-8);
 assert.equal(defaultTrigger(rect),2);
 assert.equal(triggerState(rect,2).stable,true);
 assert.equal(triggerState(rect,-1).stable,false);
});

test('els modes de la versió 1.5 es recuperen sense alterar exercicis antics',()=>{
 for(const mode of ['W','C','F'])for(const seed of [0,1,12345,0xffffffff]){
  const e=generate(mode,seed),parsed=readCode(e.code);
  assert.equal(parsed.mode,mode);
  assert.equal(e.code.startsWith('TL-OSC5-'),true);
  assert.deepEqual(e,generate(parsed.mode,parsed.seed));
 }
 for(const mode of ['S','A','T','Q','I','M','N','D','P','R','H']){
  const e=generate(mode,5678);
  assert.deepEqual(e,generate(readCode(e.code).mode,readCode(e.code).seed));
 }
});
test('PWM mesura el cicle de treball variable',()=>{
 const ex={type:'P',amplitude:2,frequency:1000,duty:25};
 assert.equal(dutyCycle(ex),25);
 assert.equal(voltage(ex,.0002),2);
 assert.equal(voltage(ex,.0005),-2);
 assert.equal(meanVoltage(ex),-1);
});
test('acoblament AC/DC/GND conserva o elimina la mitjana',()=>{
 const e={type:'S',amplitude:1,frequency:1000,offset:3};
 assert.ok(Math.abs(displayVoltage(e,.00025,'DC')-4)<1e-9);
 assert.ok(Math.abs(displayVoltage(e,.00025,'AC')-1)<1e-9);
 assert.equal(displayVoltage(e,.00025,'GND'),0);
 assert.ok(Math.abs(meanVoltage(e)-3)<1e-9);
 assert.ok(Math.abs(readingVpp(e)-2)<.02);
 assert.equal(defaultTrigger(e),3);
 assert.equal(channelFits(e,1,0,'DC'),true);
 assert.equal(channelFits(e,1,0,'AC'),true);
});
test('avaries deterministes amb formes de senyal reconeixibles',()=>{
 for(const fault of ['clipping','ripple','noise']){
  const e={type:'S',amplitude:2,frequency:1000,fault};
  assert.equal(typeof faultLabel(fault),'string');
  assert.ok(Number.isFinite(readingVpp(e)));
  assert.equal(voltage(e,.000375),voltage(e,.000375));
 }
 const clipped={type:'S',amplitude:2,frequency:1000,fault:'clipping'};
 assert.ok(Math.abs(voltage(clipped,.00025)-1.1)<1e-8);
 const base={type:'S',amplitude:2,frequency:1000};
 const ripple={...base,fault:'ripple'};
 assert.ok(Math.abs(voltage(base,.0001)-voltage(ripple,.0001))>.05);
});

test('exercicis aleatoris per nivell: es manté el mode i el variant',()=>{
 const expected={J:['I','M'],K:['D','N'],L:['R','P','H','W','C','F']};
 for(const [mode,options] of Object.entries(expected)){
  const found=new Set();
  for(let seed=0;seed<64;seed++){
   const e=generate(mode,seed);
   assert.equal(e.mode,mode);
   assert.ok(options.includes(e.variant));
   assert.equal(exerciseMode(e),e.variant);
   assert.equal(readCode(e.code).mode,mode);
   assert.deepEqual(generate(mode,seed),e);
   found.add(e.variant);
  }
  assert.ok(found.size>1);
 }
 for(const mode of ['A','S','T','Q','I','M','D','N','R','P','H','W','C','F'])assert.equal(exerciseMode(generate(mode,42)),mode);
});
