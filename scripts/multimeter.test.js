import test from 'node:test';
import assert from 'node:assert/strict';
import {measure,isCorrect,ranges} from '../labs/lab-007/meter.js';
import {dialLayout,dialPositions,validateDialLayout} from '../labs/lab-007/dial-layout.js';
import {generate,fromCode,codeOf,levelKinds} from '../labs/lab-007/exercises.js';
const base={range:'VDC20',redJack:'VΩmA',blackJack:'COM',redNode:'B',blackNode:'C',voltage:12,r1:1000,r2:2000};
test('R2 val 8 V amb el rang de 20 V',()=>{assert.equal(measure(base).value,8);assert.equal(isCorrect(base),true)});
test('les puntes invertides indiquen -8 V',()=>assert.equal(measure({...base,redNode:'C',blackNode:'B'}).value,-8));
test('la font completa val 12 V',()=>assert.equal(measure({...base,redNode:'A'}).value,12));
test('el mateix node dona 0 V',()=>assert.equal(measure({...base,redNode:'C'}).value,0));
test('el rang 2 V és insuficient per 8 V',()=>assert.equal(measure({...base,range:'VDC2'}).display,'OL'));
test('el rang 20 V és suficient',()=>assert.equal(measure({...base,range:'VDC20'}).display,'8.00'));
test('el born 10A en mode tensió indica risc',()=>assert.equal(measure({...base,redJack:'10A'}).display,'RISC'));
test('l’ohmímetre avisa si la font està alimentada',()=>assert.equal(measure({...base,range:'OHM2k',powered:true}).display,'RISC'));
test('comprovació de connexions correctes i incorrectes',()=>{let e={red:'B',black:'C'};assert.ok(isCorrect(base,e));assert.ok(!isCorrect({...base,range:'VDC2'},e));assert.ok(!isCorrect({...base,redNode:'A'},e));});
test('el codi de l’exercici es recupera',()=>{let x=generate('inicial','R2',123456);let p=fromCode(x.code);assert.equal(generate(p.level,p.kind,p.seed).expected,x.expected);assert.equal(p.kind,'R2')});
test('hi ha opció aleatòria a tots els nivells',()=>{for(let level of Object.keys(levelKinds)){assert.ok(levelKinds[level].some(([id])=>id==='ANY'));let e=generate(level,'ANY',98765);assert.ok(Number.isFinite(e.expected));}});
test('el generador produeix circuits coherents per 250 llavors i nivell',()=>{for(let level of Object.keys(levelKinds))for(let i=1;i<=250;i++){let e=generate(level,'ANY',i);assert.ok(e.r1>0&&e.r2>0);assert.ok(Math.abs(e.expected)<=e.voltage+1e-9);assert.equal(fromCode(e.code).seed,i);assert.equal(codeOf(e.level,e.kind,e.seed),e.code);}});

test('selector organitzat per grups de magnitud',async()=>{
 const {ranges}=await import('../labs/lab-007/meter.js');
 assert.deepEqual([...new Set(ranges.map(r=>r.group))],['OFF','V⎓','V~','A⎓','Ω']);
 for(const group of ['V⎓','V~','A⎓','Ω']){
  const indices=ranges.flatMap((r,i)=>r.group===group?[i]:[]);
  assert.deepEqual(indices,Array.from({length:indices.length},(_,i)=>indices[0]+i));
 }
});
test('10A ha d’utilitzar el born 10A',()=>{
 assert.equal(measure({...base,range:'ADC10',redJack:'VΩmA'}).display,'Err');
 assert.equal(measure({...base,range:'ADC10',redJack:'10A'}).display,'RISC');
});
test('escales petites de corrent amb VΩmA',()=>{
 assert.equal(measure({...base,range:'ADC20m'}).display,'RISC');
 assert.equal(measure({...base,range:'ADC20m',redJack:'10A'}).display,'Err');
});
test('els cables no comparteixen un únic born',()=>{
 assert.equal(measure({...base,redJack:'COM'}).display,'Err');
});

test('geometria dels sectors i posicions: cap escala sobre un límit',()=>{
 assert.equal(validateDialLayout(),true);
 const positions=dialPositions();
 assert.equal(positions.length,ranges.length);
 assert.deepEqual(new Set(positions.map(p=>p.id)),new Set(ranges.map(r=>r.id)));
 for(const group of dialLayout){
  for(const angle of group.positions){
   assert.ok(angle>group.start&&angle<group.end);
  }
 }
});
test('recuperació de tots els tipus nous incloent guions baixos',()=>{
 for(const [level,types] of Object.entries(levelKinds)){
  for(const [kind] of types){
   for(let seed=1;seed<=50;seed++){
    const e=generate(level,kind,seed),restored=fromCode(e.code);
    assert.deepEqual(restored,{level,kind,seed});
    assert.equal(generate(level,kind,seed).expected,e.expected);
    const s={range:e.range,redJack:e.range==='ADC10'?'10A':'VΩmA',blackJack:'COM',redNode:e.red,blackNode:e.black,voltage:e.voltage,r1:e.r1,r2:e.r2,seriesOpen:e.mode==='ADC',powered:e.mode!=='OHM',isolated:e.resistor||''};
    assert.equal(isCorrect(s,e),true);
   }
  }
 }
});
test('repte de comparació amb resistències diferents',()=>{
 for(let seed=1;seed<=100;seed++){
  const e=generate('intermedi','RATIO',seed);
  assert.notEqual(e.r1,e.r2);
 }
});

test('amperímetre connectat en sèrie: 12 V / 3 kΩ = 4 mA',()=>{
 const cfg={...base,range:'ADC20m',redNode:'D',blackNode:'E',seriesOpen:true,powered:true};
 assert.equal(measure(cfg).value,0.004);
 assert.equal(measure(cfg).display,'4.00');
 assert.equal(measure({...cfg,seriesOpen:false}).display,'RISC');
 assert.equal(measure({...cfg,powered:false}).value,0);
 assert.equal(measure({...cfg,range:'ADC2m'}).display,'OL');
 assert.equal(measure({...cfg,range:'ADC10',redJack:'10A'}).value,0.004);
});
test('resistència: component aïllat, font desconnectada i rang correcte',()=>{
 const cfg={...base,powered:false,isolated:'R2',range:'OHM20k',redNode:'B',blackNode:'C'};
 assert.equal(measure(cfg).value,2000);
 assert.equal(measure({...cfg,range:'OHM200'}).display,'OL');
 assert.equal(measure({...cfg,powered:true}).display,'RISC');
 assert.equal(measure({...cfg,isolated:''}).display,'----');
 assert.equal(measure({...cfg,redNode:'A'}).display,'OL');
 const e=generate('intermedi','OHM_R2',345);
 assert.equal(isCorrect({...cfg,r1:e.r1,r2:e.r2},e),true);
});
test('intensitat i ohms a tots els nivells amb codis recuperables',()=>{
 const modes={inicial:'CURRENT',basic:'OHM_R1',intermedi:'I_RANGE',avancat:'OHM_RANGE'};
 for(const [level,kind] of Object.entries(modes)){
  const e=generate(level,kind,41737);
  assert.equal(fromCode(e.code).kind,kind);
  const s={range:e.range,redJack:e.range==='ADC10'?'10A':'VΩmA',blackJack:'COM',redNode:e.red,blackNode:e.black,voltage:e.voltage,r1:e.r1,r2:e.r2,seriesOpen:e.mode==='ADC',powered:e.mode!=='OHM',isolated:e.resistor||''};
  assert.equal(isCorrect(s,e),true);
  assert.ok(Math.abs(measure(s).value-e.expected)<1e-9);
 }
});
