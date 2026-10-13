// Model CC ideal. Les connexions de puntes són entre nodes; no simulem encara càrrega de l'instrument.
export const ranges=[
{id:'OFF',label:'OFF',mode:'OFF',limit:0},
{id:'VDC200m',label:'200m',mode:'VDC',limit:.2},
{id:'VDC2',label:'2',mode:'VDC',limit:2},
{id:'VDC20',label:'20',mode:'VDC',limit:20},
{id:'VDC200',label:'200',mode:'VDC',limit:200},
{id:'VDC600',label:'600',mode:'VDC',limit:600},
{id:'VAC200',label:'200~',mode:'VAC',limit:200},
{id:'OHM200',label:'200Ω',mode:'OHM',limit:200},
{id:'OHM2k',label:'2kΩ',mode:'OHM',limit:2000},
{id:'OHM20k',label:'20kΩ',mode:'OHM',limit:20000},
{id:'OHM200k',label:'200kΩ',mode:'OHM',limit:200000},
{id:'ADC20m',label:'20mA',mode:'ADC',limit:.02},
{id:'ADC200m',label:'200mA',mode:'ADC',limit:.2}
];
export const nodeVoltages=Object.freeze({A:12,B:8,C:0});
export function measure(s){
 const range=ranges.find(r=>r.id===s.range)||ranges[3];
 const {mode,limit}=range, voltage=s.voltage??12, r1=s.r1??1000, r2=s.r2??2000;
 const node={A:voltage,B:voltage*r2/(r1+r2),C:0};
 if(mode==='OFF')return {display:'OFF',unit:'',status:'Instrument apagat.'};
 if(!s.redNode||!s.blackNode)return {display:'----',unit:'',status:'Connecta les dues puntes al circuit.'};
 if(s.blackJack!=='COM')return {display:'Err',unit:'',status:'La punta negra ha de connectar-se a COM.'};
 if(s.redJack==='mA'&&mode!=='ADC')return {display:'RISC',unit:'',status:'Connexió potencialment perillosa: l’entrada mA no s’ha de connectar en paral·lel a una font. No es calcula cap lectura.'};
 if(mode==='ADC')return {display:'—',unit:'mA',status:'Per mesurar intensitat cal obrir el circuit i inserir l’amperímetre en sèrie. Encara no està simulat.'};
 if(mode==='OHM')return {display:'—',unit:'Ω',status:'Cal desconnectar la font i aïllar el component abans de mesurar resistència. Funció reservada a una ampliació.'};
 if(s.redJack!=='VΩ')return {display:'Err',unit:'',status:'Per mesurar tensió, usa el connector VΩ.'};
 if(mode==='VAC')return {display:'0.00',unit:'V ~',value:0,status:'Model de font CC ideal: component alterna nul·la. No és un model d’un multímetre real.'};
 const value=node[s.redNode]-node[s.blackNode];
 if(!Number.isFinite(value))return {display:'Err',unit:'',status:'Node no reconegut.'};
 if(Math.abs(value)>limit+1e-9)return {display:'OL',unit:'V ⎓',status:'Fora d’escala. Selecciona un rang de tensió superior.'};
 const decimals=limit<=.2?4:limit<=2?3:limit<=20?2:1;
 return {display:value.toFixed(decimals),unit:'V ⎓',value,status:value<0?'Polaritat invertida: tensió negativa.':value===0?'Els dos punts tenen el mateix potencial.':'Lectura obtinguda entre els nodes seleccionats.'};
}
export function isCorrect(s,exercise){
 if(!exercise)return s.range==='VDC20'&&s.redJack==='VΩ'&&s.blackJack==='COM'&&s.redNode==='B'&&s.blackNode==='C';
 const m=measure(s);
 return Number.isFinite(m.value)&&s.redJack==='VΩ'&&s.blackJack==='COM'&&ranges.find(r=>r.id===s.range)?.mode==='VDC'&&s.redNode===exercise.red&&s.blackNode===exercise.black;
}
