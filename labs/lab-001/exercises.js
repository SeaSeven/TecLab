import { seededRandom, exerciseCode, readExerciseCode } from '../../shared/services/exercises.js';
import { COLORS, decode } from './resistor.js';
// Preserveu aquesta funció R1: una actualització diferent requereix un protocol nou.
export function generateExercise(count,seed) {
  exerciseCode(count,seed);
  const random=seededRandom(seed),pick=arr=>arr[Math.floor(random()*arr.length)];
  const digits=[1+Math.floor(random()*9),Math.floor(random()*10)];
  if(count>4) digits.push(Math.floor(random()*10));
  const exponent=pick([-2,-1,0,1,2,3,4,5]);
  const bands=digits.map(d=>COLORS[d].id);
  bands.push(COLORS.find(c=>c.exponent===exponent).id,pick(count===4?['gold','silver','brown','red']:['brown','red','green','blue','violet']));
  if(count===6) bands.push(pick(['brown','red','orange','yellow','green','blue','violet']));
  return {bands,code:exerciseCode(count,seed),count,seed};
}
export function loadExercise(code) {
  const {count,seed}=readExerciseCode(code);
  return generateExercise(count,seed);
}

export function checkAnswer(bands,value,tolerance,tcr=null) {
  if(!Number.isFinite(value)||value<=0) throw new RangeError('La resposta ha de ser un valor finit i superior a zero.');
  const r=decode(bands);
  const nominalOK=Math.abs(value-r.nominal)<=r.nominal*1e-9;
  const toleranceOK=tolerance===r.tolerance;
  const tcrOK=r.tcr===null||tcr===r.tcr;
  return {nominalOK,toleranceOK,tcrOK,correct:nominalOK&&toleranceOK&&tcrOK};
}
