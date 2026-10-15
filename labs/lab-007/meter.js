// Multímetre educatiu: tensió en paral·lel, corrent en una interrupció en sèrie,
// i resistència amb la font desconnectada i la peça aïllada.
export const jackNames=['10A','COM','VΩmA'];
export const ranges=[
 {id:'OFF',label:'OFF',mode:'OFF',group:'OFF',limit:0},
 {id:'VDC200m',label:'200m',mode:'VDC',group:'V⎓',limit:.2},
 {id:'VDC2',label:'2',mode:'VDC',group:'V⎓',limit:2},
 {id:'VDC20',label:'20',mode:'VDC',group:'V⎓',limit:20},
 {id:'VDC200',label:'200',mode:'VDC',group:'V⎓',limit:200},
 {id:'VDC600',label:'600',mode:'VDC',group:'V⎓',limit:600},
 {id:'VAC200',label:'200',mode:'VAC',group:'V~',limit:200},
 {id:'VAC600',label:'600',mode:'VAC',group:'V~',limit:600},
 {id:'ADC200u',label:'200µ',mode:'ADC',group:'A⎓',limit:.0002},
 {id:'ADC2m',label:'2m',mode:'ADC',group:'A⎓',limit:.002},
 {id:'ADC20m',label:'20m',mode:'ADC',group:'A⎓',limit:.02},
 {id:'ADC200m',label:'200m',mode:'ADC',group:'A⎓',limit:.2},
 {id:'ADC10',label:'10A',mode:'ADC',group:'A⎓',limit:10},
 {id:'OHM200',label:'200',mode:'OHM',group:'Ω',limit:200},
 {id:'OHM2k',label:'2k',mode:'OHM',group:'Ω',limit:2000},
 {id:'OHM20k',label:'20k',mode:'OHM',group:'Ω',limit:20000},
 {id:'OHM200k',label:'200k',mode:'OHM',group:'Ω',limit:200000},
 {id:'OHM2M',label:'2M',mode:'OHM',group:'Ω',limit:2000000}
];
export const nodeVoltages=Object.freeze({A:12,B:8,C:0});
export function measure(s){
 const range=ranges.find(r=>r.id===s.range)||ranges[3];
 const {mode,limit}=range,voltage=s.voltage??12,r1=s.r1??1000,r2=s.r2??2000;
 // Amb la interrupció D–E oberta o una resistència desmuntada, no hi circula corrent.
 const node={A:s.powered===false?0:voltage,B:(s.seriesOpen||s.isolated||s.powered===false)?0:voltage*r2/(r1+r2),C:0};
 if(mode==='OFF')return {display:'OFF',unit:'',status:'Instrument apagat.'};
 const blackJack=s.blackJack===undefined?'COM':s.blackJack,redJack=s.redJack===undefined?'VΩmA':s.redJack;
 if(!blackJack||!redJack)return {display:'----',unit:'',status:'Connecta les dues clavilles als borns del multímetre.'};
 if(blackJack===redJack)return {display:'Err',unit:'',status:'Cada cable ha d’anar a un born diferent.'};
 if(blackJack!=='COM')return {display:'Err',unit:'',status:'Per aquesta pràctica, el cable negre ha d’anar al born COM.'};
 if(['VDC','VAC','OHM'].includes(mode)&&redJack==='10A')
  return {display:'RISC',unit:'',status:'No connectis el born 10A per mesurar tensió o resistència. Perill de curtcircuit si es connecta en paral·lel.'};
 if(mode==='ADC'){
  if(range.id==='ADC10'&&redJack!=='10A')return {display:'Err',unit:'A⎓',status:'En el rang de 10 A, vermell a 10A i negre a COM.'};
  if(range.id!=='ADC10'&&redJack!=='VΩmA')return {display:'Err',unit:'A⎓',status:'Per a µA i mA, vermell a VΩmA i negre a COM.'};
  if(s.isolated)return {display:'----',unit:'A⎓',status:'Torna a muntar R1 i R2 abans de mesurar la intensitat del divisor.'};
  if(!s.seriesOpen)return {display:'RISC',unit:'A⎓',status:'No connectis un amperímetre en paral·lel. Desconnecta la font, obre el punt de mesura i insereix-lo en sèrie.'};
  const direction=s.redNode==='D'&&s.blackNode==='E'?1:s.redNode==='E'&&s.blackNode==='D'?-1:0;
  if(!direction)return {display:'----',unit:'A⎓',status:'Connecta les dues puntes als terminals D i E de la interrupció.'};
  if(!s.powered)return {display:'0.000',unit:'A⎓',value:0,status:'Circuit desalimentat. Activa la font per mesurar intensitat un cop feta la connexió en sèrie.'};
  const value=direction*voltage/(r1+r2);
  if(Math.abs(value)>limit+1e-12)return {display:'OL',unit:'A⎓',status:'Intensitat fora d’escala. Selecciona un rang superior del grup A⎓.'};
  const scaled=limit<=.0002?value*1e6:limit<=.2?value*1e3:value;
  const unit=limit<=.0002?'µA':limit<=.2?'mA':'A';
  const decimals=limit<=.0002?1:limit<=.002?3:limit<=.02?2:limit<=.2?1:3;
  return {display:scaled.toFixed(decimals),unit,value,status:direction<0?'Amperímetre en sèrie amb les puntes invertides: intensitat negativa.':'Amperímetre correctament inserit en sèrie: I = U/(R1 + R2).'};
 }
 if(redJack!=='VΩmA')return {display:'Err',unit:'',status:'Per a tensió i resistència usa VΩmA amb COM.'};
 if(mode==='OHM'){
  if(s.powered!==false)return {display:'RISC',unit:'Ω',status:'Desconnecta la font abans de mesurar resistència.'};
  if(!['R1','R2'].includes(s.isolated))return {display:'----',unit:'Ω',status:'Aïlla R1 o R2 abans de mesurar: els camins paral·lels alteren la lectura.'};
  const target=s.isolated==='R1'?['A','B']:['B','C'];
  if(!s.redNode||!s.blackNode)return {display:'----',unit:'Ω',status:'Posa una punta a cada extrem de la resistència aïllada.'};
  if(![target[0],target[1]].includes(s.redNode)||![target[0],target[1]].includes(s.blackNode)||s.redNode===s.blackNode)
   return {display:'OL',unit:'Ω',status:'Col·loca les puntes als dos extrems de '+s.isolated+' per formar un camí de mesura.'};
  const value=s.isolated==='R1'?r1:r2;
  if(value>limit+1e-9)return {display:'OL',unit:'Ω',status:'Resistència fora d’escala: puja el rang Ω.'};
  const scaled=limit>=2000?value/1000:value,unit=limit>=2000?'kΩ':'Ω';
  return {display:scaled.toFixed(limit>=2000?3:1),unit,value,status:'Resistència '+s.isolated+' aïllada i font desconnectada.'};
 }
 if(!s.redNode||!s.blackNode)return {display:'----',unit:'',status:'Connecta les dues puntes al circuit.'};
 if(mode==='VAC')return {display:'0.00',unit:'V~',value:0,status:'El circuit és un model de font CC ideal. No hi ha component alterna en aquest model.'};
 if(s.powered===false)return {display:'0.00',unit:'V⎓',value:0,status:'La font és desconnectada.'};
 const value=node[s.redNode]-node[s.blackNode];
 if(!Number.isFinite(value))return {display:'Err',unit:'',status:'Node no reconegut.'};
 if(Math.abs(value)>limit+1e-9)return {display:'OL',unit:'V⎓',status:'Fora d’escala: tria un rang més alt dins del grup V⎓.'};
 const decimals=limit<=.2?4:limit<=2?3:limit<=20?2:1;
 return {display:value.toFixed(decimals),unit:'V⎓',value,status:value<0?'Polaritat invertida: tensió negativa.':value===0?'Els dos punts tenen el mateix potencial.':'Lectura de tensió contínua entre els nodes seleccionats.'};
}
export function isCorrect(s,exercise){
 const m=measure(s),mode=exercise?.mode||'VDC';
 if(!Number.isFinite(m.value)||s.blackJack!=='COM')return false;
 if(ranges.find(r=>r.id===s.range)?.mode!==mode)return false;
 const same=s.redNode===(exercise?.red||'B')&&s.blackNode===(exercise?.black||'C');
 const reverse=s.redNode===exercise?.black&&s.blackNode===exercise?.red;
 if(mode==='OHM')return (same||reverse)&&s.powered===false&&s.isolated===exercise?.resistor&&s.redJack==='VΩmA';
 if(!same)return false;
 if(mode==='ADC')return s.seriesOpen===true&&s.powered===true&&s.redJack===(s.range==='ADC10'?'10A':'VΩmA');
 return s.redJack==='VΩmA';
}
