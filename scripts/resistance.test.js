import test from 'node:test';
import assert from 'node:assert/strict';
import { resistance } from '../shared/services/resistance.js';
test('Marró, negre, vermell: 1 kΩ',()=>assert.equal(resistance(1,0,2),1000));
test('Groc, violeta, taronja: 47 kΩ',()=>assert.equal(resistance(4,7,3),47000));
test('Primera banda nul·la invàlida',()=>assert.throws(()=>resistance(0,1,2),RangeError));
