import test from 'node:test';import assert from 'node:assert/strict';import {measure,isCorrect} from '../labs/lab-007/meter.js';
const base={mode:'VDC',redJack:'VΩ',blackJack:'COM',redNode:'B',blackNode:'C'};
test('R2 = 8 V i configuració correcta',()=>{assert.equal(measure(base).value,8);assert.equal(isCorrect(base),true)});
test('puntes invertides = -8 V',()=>assert.equal(measure({...base,redNode:'C',blackNode:'B'}).value,-8));
test('font completa = 12 V',()=>assert.equal(measure({...base,redNode:'A'}).value,12));
test('punta mateixa node = 0 V',()=>assert.equal(measure({...base,redNode:'C'}).value,0));
test('entrada mA en tensió és un error',()=>assert.equal(measure({...base,redJack:'mA'}).display,'FUSE'));
test('resistència amb alimentació activa és un error',()=>assert.equal(measure({...base,mode:'OHM'}).display,'Err'));
