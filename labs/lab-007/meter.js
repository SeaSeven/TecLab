export const nodeVoltages=Object.freeze({A:12,B:8,C:0});
export function measure({mode,redJack,blackJack,redNode,blackNode}){
 if(mode==='OFF')return {display:'OFF',unit:'',status:'Apagat'};
 if(!redNode||!blackNode)return {display:'----',unit:'',status:'Connecta les dues puntes a nodes del circuit.'};
 if(blackJack!=='COM')return {display:'Err',unit:'',status:'El cable negre ha d’anar al connector COM.'};
 if(redJack==='mA'&&mode!=='ADC')return {display:'FUSE',unit:'',status:'Entrada d’intensitat seleccionada: una connexió en paral·lel pot provocar un curtcircuit. No s’ha produït cap mesura.'};
 if(mode==='ADC')return {display:'—',unit:'A',status:'Mesurar intensitat exigeix obrir el circuit. Aquesta funció arribarà en una versió posterior.'};
 if(mode==='OHM')return {display:'Err',unit:'Ω',status:'No es pot mesurar la resistència amb aquesta font de 12 V connectada. Desconnecta l’alimentació i aïlla el component.'};
 if(redJack!=='VΩ')return {display:'Err',unit:'',status:'Per mesurar tensió, connecta el cable vermell a VΩ.'};
 if(mode==='VAC')return {display:'0.00',unit:'V ~',status:'El circuit és de corrent continu ideal. El valor AC d’aquest model simplificat és 0 V.'};
 const value=nodeVoltages[redNode]-nodeVoltages[blackNode];
 return {display:value.toFixed(2),unit:'V ⎓',value,status:redNode===blackNode?'Les puntes comparteixen node: diferència de potencial nul·la.':value<0?'Polaritat invertida: la lectura és negativa.':'Mesura de tensió contínua entre els dos nodes.'};
}
export function isCorrect(s){return s.mode==='VDC'&&s.redJack==='VΩ'&&s.blackJack==='COM'&&s.redNode==='B'&&s.blackNode==='C';}
