// Protocol TL-R1: l'identificador R1 fixa la versió del generador.
export function checksum(text) {
  let h=2166136261;
  for(const c of text) h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
  return (h&65535).toString(16).toUpperCase().padStart(4,'0');
}
export function exerciseCode(count,seed) {
  if(![4,5,6].includes(count)||!Number.isInteger(seed)||seed<0||seed>0xffffffff) throw new RangeError('Paràmetres de codi no vàlids.');
  const body=`TL-R1-${count}-${seed.toString(36).toUpperCase()}`;
  return `${body}-${checksum(body)}`;
}
export function readExerciseCode(input) {
  const code=String(input).trim().toUpperCase();
  const m=/^TL-R1-([456])-([0-9A-Z]{1,7})-([0-9A-F]{4})$/.exec(code);
  if(!m) throw new RangeError('Codi no vàlid o versió no compatible. Utilitza un codi TL-R1.');
  const count=Number(m[1]),seed=parseInt(m[2],36);
  if(seed>0xffffffff||exerciseCode(count,seed)!==code) throw new RangeError('El codi conté un error. Comprova tots els caràcters.');
  return {count,seed,code};
}
export function seededRandom(seed) {
  let x=seed>>>0||0x6d2b79f5;
  return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
export function randomSeed() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}
