// Codificació axial convencional. La sisena banda representa el TCR.
export const COLORS = [
  ['black','Negre','#262626',0,0,null,250],
  ['brown','Marró','#824723',1,1,1,100],
  ['red','Vermell','#c63838',2,2,2,50],
  ['orange','Taronja','#ef8a30',3,3,null,15],
  ['yellow','Groc','#efcf36',4,4,null,25],
  ['green','Verd','#368553',5,5,0.5,20],
  ['blue','Blau','#336cc0',6,6,0.25,10],
  ['violet','Violeta','#9054b0',7,7,0.1,5],
  ['gray','Gris','#8c939b',8,8,0.05,1],
  ['white','Blanc','#f5f5f0',9,9,null,null],
  ['gold','Daurat','#c4a04b',null,-1,5,null],
  ['silver','Platejat','#bdc5cc',null,-2,10,null]
].map(([id,name,hex,digit,exponent,tolerance,tcr])=>({id,name,hex,digit,exponent,tolerance,tcr}));
export const color = id => COLORS.find(c=>c.id===id);
export function roles(count) {
  if (![4,5,6].includes(count)) throw new RangeError('Tria 4, 5 o 6 bandes.');
  return [...Array(count===4?2:3).fill('digit'),'multiplier','tolerance',...(count===6?['tcr']:[])];
}
export function choices(role,index=1) {
  return COLORS.filter(c=>role==='digit'?c.digit!==null&&(index!==0||c.digit!==0):role==='multiplier'?c.exponent!==null:c[role]!==null);
}
export function decode(bands) {
  const rs=roles(bands.length);
  const cs=bands.map((id,i)=>{
    const c=color(id);
    if(!c||!choices(rs[i],i).some(x=>x.id===id)) throw new RangeError(`Color no vàlid a la banda ${i+1}.`);
    return c;
  });
  const digits=cs.filter((c,i)=>rs[i]==='digit').map(c=>c.digit);
  const significant=Number(digits.join(''));
  const exponent=cs[digits.length].exponent;
  const nominal=significant*10**exponent;
  const tolerance=cs[digits.length+1].tolerance;
  return {digits,significant,exponent,nominal,tolerance,minimum:nominal*(1-tolerance/100),maximum:nominal*(1+tolerance/100),tcr:bands.length===6?cs.at(-1).tcr:null};
}
export function encode(nominal,count=4,tolerance='gold',tcr='brown') {
  roles(count);
  const size=count===4?2:3;
  if(!Number.isFinite(nominal)||nominal<=0) throw new RangeError('Introdueix un valor superior a zero.');
  if(!choices('tolerance').some(c=>c.id===tolerance)||count===6&&!choices('tcr').some(c=>c.id===tcr)) throw new RangeError('Tolerància o TCR no vàlids.');
  for(let exponent=-2;exponent<=9;exponent++) {
    const n=nominal/10**exponent,significant=Math.round(n);
    if(significant<10**(size-1)||significant>=10**size||Math.abs(n-significant)>1e-9) continue;
    const bands=String(significant).split('').map(d=>COLORS[Number(d)].id);
    bands.push(COLORS.find(c=>c.exponent===exponent).id,tolerance);
    if(count===6) bands.push(tcr);
    return bands;
  }
  throw new RangeError(`Aquest valor no es pot representar exactament amb ${size} xifres i multiplicadors de 10⁻² a 10⁹. Canvia el valor o el nombre de bandes.`);
}
export function parseNumber(text) {
  const s=String(text).trim().replace(',','.');
  if(!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) throw new RangeError('Escriu un nombre, amb coma o punt decimal i sense separadors de milers.');
  const n=Number(s);
  if(!Number.isFinite(n)||n<=0) throw new RangeError('El valor ha de ser finit i superior a zero.');
  return n;
}
export const number = n=>new Intl.NumberFormat('ca',{maximumSignificantDigits:10}).format(n);
export function ohms(n) {
  const [scale,unit]=n>=1e9?[1e9,'GΩ']:n>=1e6?[1e6,'MΩ']:n>=1e3?[1e3,'kΩ']:[1,'Ω'];
  return `${number(n/scale)} ${unit}`;
}
export const defaults=count=>count===4?['brown','black','red','gold']:['brown','black','black','brown','brown',...(count===6?['brown']:[])];
