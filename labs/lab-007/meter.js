// Multímetre educatiu de tres borns. Model DC ideal; la mesura d'intensitat
// requereix inserció en sèrie i no queda habilitada en aquest prototip.
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
 const node={A:voltage,B:voltage*r2/(r1+r2),C:0};
 if(mode==='OFF')return {display:'OFF',unit:'',status:'Instrument apagat.'};
 const blackJack=s.blackJack||'COM',redJack=s.redJack||'VΩmA';
 if(blackJack===redJack)return {display:'Err',unit:'',status:'Cada cable ha d’anar a un born diferent.'};
 if(blackJack!=='COM')return {display:'Err',unit:'',status:'Per aquesta pràctica, el cable negre ha d’anar al born COM.'};
 if(['VDC','VAC','OHM'].includes(mode)&&redJack==='10A')
  return {display:'RISC',unit:'',status:'No connectis el born 10A per mesurar tensió o resistència. Perill de curtcircuit si es connecta en paral·lel.'};
 if(mode==='ADC'){
  if(range.id==='ADC10'&&redJack!=='10A')return {display:'Err',unit:'A',status:'A l’escala 10A cal utilitzar el born 10A i COM.'};
  if(range.id!=='ADC10'&&redJack!=='VΩmA')return {display:'Err',unit:'A',status:'Per a intensitats petites, utilitza VΩmA i COM.'};
  return {display:'—',unit:'A⎓',status:'Cal obrir el circuit i inserir l’amperímetre en sèrie, sense alimentació durant el muntatge. La mesura de corrent no està implementada encara.'};
 }
 if(redJack!=='VΩmA')return {display:'Err',unit:'',status:'Per a tensió i resistència usa VΩmA amb COM.'};
 if(mode==='OHM')return {display:'—',unit:'Ω',status:'Cal desconnectar l’alimentació i aïllar el component abans de mesurar resistència. Funció pendent d’ampliació.'};
 if(!s.redNode||!s.blackNode)return {display:'----',unit:'',status:'Connecta les dues puntes al circuit.'};
 if(mode==='VAC')return {display:'0.00',unit:'V~',value:0,status:'El circuit és un model de font CC ideal. No hi ha component alterna en aquest model.'};
 const value=node[s.redNode]-node[s.blackNode];
 if(!Number.isFinite(value))return {display:'Err',unit:'',status:'Node no reconegut.'};
 if(Math.abs(value)>limit+1e-9)return {display:'OL',unit:'V⎓',status:'Fora d’escala: tria un rang més alt dins del grup V⎓.'};
 const decimals=limit<=.2?4:limit<=2?3:limit<=20?2:1;
 return {display:value.toFixed(decimals),unit:'V⎓',value,status:value<0?'Polaritat invertida: tensió negativa.':value===0?'Els dos punts tenen el mateix potencial.':'Lectura de tensió contínua entre els nodes seleccionats.'};
}
export function isCorrect(s,exercise){
 const m=measure(s);
 return Number.isFinite(m.value)&&s.redJack==='VΩmA'&&s.blackJack==='COM'&&ranges.find(r=>r.id===s.range)?.mode==='VDC'&&s.redNode===(exercise?.red||'B')&&s.blackNode===(exercise?.black||'C');
}
