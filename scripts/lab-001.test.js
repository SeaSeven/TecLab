import test from 'node:test';
import assert from 'node:assert/strict';
import { COLORS, decode, encode, parseNumber, ohms, choices, defaults } from '../labs/lab-001/resistor.js';
import { exerciseCode, readExerciseCode } from '../shared/services/exercises.js';
import { generateExercise, loadExercise, checkAnswer } from '../labs/lab-001/exercises.js';

test('Exemple de 4 bandes: 4,7 kΩ ±5 %, interval 4 465–4 935 Ω',()=>{
 const r=decode(['yellow','violet','red','gold']);
 assert.deepEqual(r,{digits:[4,7],significant:47,exponent:2,nominal:4700,tolerance:5,minimum:4465,maximum:4935,tcr:null});
});
test('5 bandes: 475 kΩ ±1 %',()=>{const r=decode(['yellow','violet','green','orange','brown']);assert.equal(r.nominal,475000);assert.equal(r.tolerance,1);});
test('6 bandes: 68 MΩ ±5 %, TCR 250 ppm/K',()=>{const r=decode(['blue','gray','black','green','gold','black']);assert.equal(r.nominal,68000000);assert.equal(r.tcr,250);});
test('Multiplicadors daurat i platejat',()=>{assert.equal(decode(['yellow','violet','gold','gold']).nominal,4.7);assert.equal(decode(['brown','black','silver','silver']).nominal,.1);});
test('Bandes invàlides i nombre de bandes fora de rang',()=>{
 for(const b of [['black','black','red','gold'],['gold','black','red','gold'],['brown','black','red','black'],['brown','black','red'],['brown','black','black','red','gold','silver']]) assert.throws(()=>decode(b),RangeError);
});
test('Conversió exacta i límits de representació',()=>{
 assert.deepEqual(encode(.1,4),['brown','black','silver','gold']);
 assert.deepEqual(encode(4700,4),['yellow','violet','red','gold']);
 assert.deepEqual(encode(475000,5,'brown'),['yellow','violet','green','orange','brown']);
 assert.deepEqual(encode(68000000,6,'gold','black'),['blue','gray','black','green','gold','black']);
 assert.equal(decode(encode(99e9,4)).nominal,99e9);
 assert.equal(decode(encode(999e9,6)).nominal,999e9);
 for(const value of [0,-1,Infinity,NaN,.01,1234,1e12]) assert.throws(()=>encode(value,4),RangeError);
 assert.throws(()=>encode(.1,5),RangeError);
 assert.throws(()=>encode(1e3,6,'gold','silver'),RangeError);
});
test('Anada i tornada de les xifres i els multiplicadors',()=>{
 for(const count of [4,5,6]) for(let sig=count===4?10:100;sig<=(count===4?99:999);sig+=count===4?1:7) for(let n=-2;n<=9;n++){
  const value=sig*10**n;assert.ok(Math.abs(decode(encode(value,count,'brown','red')).nominal-value)<=value*1e-12);
 }
});
test('Entrada decimal catalana, científica i errors',()=>{
 assert.equal(parseNumber(' 4,7 '),4.7);assert.equal(parseNumber('4.7'),4.7);assert.equal(parseNumber('1e3'),1000);
 for(const s of ['','0','-1','1 000','4,7,2','4.7.0','<script>','Infinity','1e999']) assert.throws(()=>parseNumber(s),RangeError);
 assert.equal(ohms(.1),'0,1 Ω');assert.equal(ohms(4700),'4,7 kΩ');assert.equal(ohms(68e6),'68 MΩ');assert.equal(ohms(99e9),'99 GΩ');
});
test('Totes les toleràncies i TCR seleccionables es descodifiquen',()=>{
 for(const c of choices('tolerance')) assert.equal(decode(encode(4700,4,c.id)).tolerance,c.tolerance);
 for(const c of choices('tcr')) assert.equal(decode(encode(4700,6,'brown',c.id)).tcr,c.tcr);
 for(const n of [4,5,6]) assert.equal(decode(defaults(n)).nominal,1000);
});
test('Codis reproduïbles: majúscules, espais i llavors límit',()=>{
 for(const n of [4,5,6]) for(const seed of [0,1,123456,0xffffffff]){
  const code=exerciseCode(n,seed);assert.deepEqual(readExerciseCode(' '+code.toLowerCase()+' '),{count:n,seed,code});
  assert.deepEqual(generateExercise(n,seed),loadExercise(code));assert.ok(decode(loadExercise(code).bands).nominal>0);
 }
});
test('Errors de codi, versió desconeguda i checksum',()=>{
 const code=exerciseCode(4,123);
 for(const s of ['',code.replace('R1','R2'),code.replace('-4-','-5-'),code.slice(0,-1)+'Z','TL-R1-4-ZZZZZZZ-0000']) assert.throws(()=>loadExercise(s),RangeError);
 assert.throws(()=>exerciseCode(4,-1),RangeError);assert.throws(()=>exerciseCode(4,0x100000000),RangeError);
});
test('El generador R1 crea 1 500 activitats vàlides',()=>{
 for(const count of [4,5,6])for(let seed=0;seed<500;seed++){const ex=generateExercise(count,seed);assert.equal(ex.bands.length,count);decode(ex.bands);assert.deepEqual(loadExercise(ex.code),ex);}
});

test('La seqüència R1 no canvia per a un codi publicat',()=>assert.deepEqual(generateExercise(6,123456),{bands:['violet','black','brown','orange','green','violet'],code:'TL-R1-6-2N9C-48C1',count:6,seed:123456}));

test('Respostes nominals equivalents i límits de la tolerància',()=>{
 const bands=['yellow','violet','red','gold'];
 assert.equal(checkAnswer(bands,4.7*1000,5).correct,true);
 assert.equal(checkAnswer(bands,4465,5).nominalOK,false);
 assert.equal(checkAnswer(bands,4700,10).toleranceOK,false);
 assert.equal(checkAnswer(['brown','black','black','red','brown','red'],10000,1,50).correct,true);
 assert.equal(checkAnswer(['brown','black','black','red','brown','red'],10000,1,100).tcrOK,false);
 assert.throws(()=>checkAnswer(bands,Infinity,5),RangeError);
});
