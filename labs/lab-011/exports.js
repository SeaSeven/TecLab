import {validateSession} from './session.js';
import {parseCaseCode,generateCase} from './cases.js';
import {instrumentChannelComponents} from './instrument.js';
import {sampleWave,harmonicOrders} from './model.js';

// Informe instrumentat, sense valors ocults ni conclusions automàtiques.
// El navegador permet imprimir-lo en paper o triar "Desar com a PDF".
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=2)=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('ca-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const phaseName=i=>Number.isInteger(i)?'L'+(i+1):'—';
const pointName=p=>({PCC:'P0',DRIVE:'P1',CTRL:'P2',DC24:'24 V CC'})[p]??p??'—';
function physicalPointSummary(settings){
 const points=new Set();
 for(const v of settings?.voltageChannels??[]){
   if(v.positivePoint)points.add(v.positivePoint);
   if(v.negativePoint)points.add(v.negativePoint);
 }
 for(const ch of settings?.currentChannels??[])if(ch.pointId)points.add(ch.pointId);
 return points.size?[...points].map(pointName).join(' / '):'Sense connexions';
}
function settingTable(r){
 const s=r.settings;
 const lines=[];
 for(let i=0;i<Math.max(s.voltageChannels?.length??0,s.currentChannels?.length??0);i++){
   const v=s.voltageChannels?.[i],c=s.currentChannels?.[i];
   lines.push('<tr><td>'+esc('Canal '+(i+1))+'</td><td>'+esc(v?.enabled?(Object.hasOwn(v,'positive')?(pointName(v.positivePoint)+' '+(v.positive??'—')+' / '+pointName(v.negativePoint)+' '+(v.negative??'—')):phaseName(v.phase)+' / N'):'Desactivat')+'</td><td>'+esc(c?.enabled?(Object.hasOwn(c,'conductor')?(pointName(c.pointId)+' '+(c.conductor??'—')):phaseName(c.phase)):'Desactivat')+'</td><td>'+esc(c?.ctRatio??'—')+'</td><td>'+esc(c?.inverted?'Invertida':'Normal')+'</td></tr>');
 }
 return '<table><thead><tr><th>Canal</th><th>Sondes V (+ / −)</th><th>Pinça I (conductor)</th><th>TC configurat</th><th>Pinça</th></tr></thead><tbody>'+lines.join('')+'</tbody></table>';
}
function graphForRecord(record){
 const rows=record.rows.filter(r=>Number.isFinite(r.phases?.[0]?.voltageRms));
 if(rows.length<2)return '<p class="muted">No hi ha prou lectures per representar un registre temporal.</p>';
 const vals=rows.map(r=>r.phases[0].voltageRms),min=Math.min(...vals),max=Math.max(...vals);
 const delta=Math.max(1,max-min),lo=min-delta*.15,hi=max+delta*.15;
 const x0=45,y0=15,w=640,h=155;
 const path=vals.map((value,i)=>(i?'L':'M')+(x0+i*w/(vals.length-1)).toFixed(2)+','+(y0+h-(value-lo)/(hi-lo)*h).toFixed(2)).join(' ');
 return '<figure><svg viewBox="0 0 730 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Evolució temporal de la tensió RMS del primer canal">'+
 '<rect x="45" y="15" width="640" height="155" fill="#f6fafc" stroke="#b6c8d1"/>'+
 Array.from({length:5},(_,i)=>'<path d="M45 '+(15+i*155/4)+' H685" stroke="#e1e9ed"/>').join('')+
 '<path d="'+path+'" fill="none" stroke="#13647c" stroke-width="2.3"/>'+
 '<text x="45" y="194" font-size="13" fill="#2d4652">Temps simulat: '+num(record.start,1)+'–'+num(record.start+record.duration,1)+' s</text>'+
 '<text x="47" y="29" font-size="12" fill="#2d4652">'+num(hi)+' V</text>'+
 '<text x="47" y="167" font-size="12" fill="#2d4652">'+num(lo)+' V</text></svg><figcaption>Registre de tensió RMS del primer canal instrumentat (V).</figcaption></figure>';
}
function waveformAndHarmonics(record,scenario){
 const last=record.rows.at(-1);
 if(!last||last.status==='topology-incompatible')return '';
 const time=last.time,period=1/scenario.frequency;
 let out='';
 for(let channel=0;channel<scenario.phases;channel++){
   const comp=instrumentChannelComponents(scenario,record.settings,channel,time);
   for(const [kind,label,unit] of [['voltage','Tensió','V'],['current','Corrent','A']]){
     const harmonics=comp[kind];
     if(!harmonics)continue;
     const vals=Array.from({length:240},(_,i)=>sampleWave(harmonics,scenario.frequency,time+3*period*i/239));
     const lo=Math.min(...vals),hi=Math.max(...vals),span=Math.max(1e-9,hi-lo),pad=span*.08;
     const line=vals.map((v,i)=>(i?'L':'M')+(40+650*i/239).toFixed(1)+','+(170-130*(v-lo+pad)/(span+2*pad)).toFixed(1)).join(' ');
     const bars=harmonicOrders.map(order=>({order,rms:harmonics.find(h=>h.order===order)?.rms??0}));
     const max=Math.max(.001,...bars.map(b=>b.rms));
     out+='<div class="mini-plot"><h4>Canal '+(channel+1)+' · '+label+' · '+unit+'</h4>'+
       '<svg viewBox="0 0 730 200" role="img" aria-label="Forma d’ona '+label+' del canal '+(channel+1)+'">'+
       '<rect x="40" y="15" width="650" height="158" fill="#f5f8fa" stroke="#b6c8d1"/>'+
       '<path d="'+line+'" fill="none" stroke="#11647d" stroke-width="2"/>'+
       '<text x="45" y="191" fill="#365162" font-size="12">Tres períodes · '+unit+'</text></svg>'+
       '<svg viewBox="0 0 730 180" role="img" aria-label="Espectre '+label+' del canal '+(channel+1)+'">'+
       bars.map((b,i)=>{const x=48+i*107,h=120*b.rms/max;return '<rect x="'+x+'" y="'+(140-h)+'" width="38" height="'+h+'" fill="#b98b48"/><text x="'+x+'" y="160" font-size="12" fill="#365162">'+b.order+'</text>';}).join('')+
       '<text x="45" y="17" font-size="12" fill="#365162">Espectre RMS · Ordres harmònics · '+unit+'</text></svg></div>';
   }
 }
 return out?'<h3>Formes d’ona i espectres mesurats</h3>'+out:'';
}
function eventRows(record){
 const events=record.capturedEvents??[];
 if(!events.length)return '<p>Sense variacions registrades per la detecció interna.</p>';
 return '<h3>Registre d’esdeveniments capturats</h3><table><thead><tr><th>Inici (s)</th><th>Durada (s)</th><th>Canal</th><th>Magnitud</th><th>Anterior</th><th>Observada</th><th>Variació</th></tr></thead><tbody>'+
 events.flatMap(event=>event.measurements.map(item=>'<tr><td>'+num(event.start,3)+'</td><td>'+num(event.duration,3)+'</td><td>'+item.channel+'</td><td>'+esc(item.quantity)+'</td><td>'+num(item.previous)+' '+esc(item.unit)+'</td><td>'+num(item.observed)+' '+esc(item.unit)+'</td><td>'+num(item.variationPercent,1)+' %</td></tr>')).join('')+'</tbody></table>';
}
function measureSection(record,scenario){
 const last=record.rows.at(-1);
 const status=last?.status==='measured'?'Lectura disponible':last?.status==='incomplete'?'Canals incomplets':last?.status==='topology-incompatible'?'Topologia incompatible':'Sense lectura';
 const phaseRows=(last?.phases??[]).map(p=>'<tr><td>'+esc('Canal '+(p.slot+1))+'</td><td>'+num(p.voltageRms)+' V</td><td>'+num(p.currentRms)+' A</td><td>'+num(p.voltageTHD)+' %</td><td>'+num(p.currentTHD)+' %</td><td>'+num(p.p)+' W</td><td>'+num(p.q1)+' var</td><td>'+num(p.s)+' VA</td></tr>').join('');
 const ev=(record.capturedEvents??[]).length?String(record.capturedEvents.length)+' registre(s)':'Cap esdeveniment capturat amb aquesta configuració';
 return '<section class="record"><h2>'+esc(record.id)+' · '+esc(physicalPointSummary(record.settings))+'</h2><p><strong>Codi de l’exercici:</strong> '+esc(record.caseCode)+'</p>'+
 '<p><strong>Temps simulat:</strong> '+num(record.start,2)+'–'+num(record.start+record.duration,2)+' s · <strong>Interval:</strong> '+num(record.interval,2)+' s · <strong>Mostres:</strong> '+record.rows.length+
 ' · <strong>Topologia configurada:</strong> '+esc(record.settings.topology)+'</p>'+
 '<p><strong>Estat instrumental:</strong> '+esc(status)+' · <strong>Esdeveniments capturats:</strong> '+esc(ev)+'</p>'+
 '<h3>Configuració dels canals</h3>'+settingTable(record)+
 '<h3>Lectures de la darrera mostra</h3>'+
 '<table><thead><tr><th>Canal</th><th>U RMS</th><th>I RMS</th><th>THD-U</th><th>THD-I</th><th>P</th><th>Q1</th><th>S</th></tr></thead><tbody>'+phaseRows+'</tbody></table>'+
 '<p><strong>Totals calculables:</strong> P = '+num(last?.totalP)+' W · Q1 = '+num(last?.totalQ1)+' var · S = '+num(last?.totalS)+' VA · FP = '+num(last?.totalPowerFactor,3)+'</p>'+
 graphForRecord(record)+eventRows(record)+waveformAndHarmonics(record,scenario)+'</section>';
}
export function buildInstrumentReport(session,{generatedAt=new Date()}={}){
 validateSession(session);
 if(!(generatedAt instanceof Date)||!Number.isFinite(generatedAt.getTime()))throw new RangeError('Data d’informe no vàlida.');
 const generated=generatedAt.toLocaleString('ca-ES');
 const scenario=generateCase(parseCaseCode(session.caseCode).seed);
 const records=session.acquisitions.map(record=>measureSection(record,scenario)).join('');
 return '<!doctype html><html lang="ca"><head><meta charset="utf-8"><title>Informe LAB-011 · '+esc(session.caseCode)+'</title>'+
 '<style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:11px/1.45 system-ui,Arial,sans-serif;color:#1d303b;margin:0}header{border-bottom:3px solid #c88c42;padding-bottom:12px;margin-bottom:15px}h1{font-size:21px;margin:6px 0}h2{font-size:16px;border-bottom:1px solid #becbd1;padding-bottom:5px}h3{font-size:12px;margin-bottom:5px}p{margin:7px 0}table{width:100%;border-collapse:collapse;font-size:9px;margin:8px 0 14px;table-layout:fixed}th,td{padding:6px 4px;border:1px solid #cbd5da;text-align:right;overflow-wrap:anywhere}th:first-child,td:first-child{text-align:left}th{background:#ecf1f3}.mini-plot{break-inside:avoid;page-break-inside:avoid;margin:12px 0;padding:9px;border:1px solid #cedce0}.mini-plot h4{font-size:11px;margin:3px 0}.mini-plot svg{max-height:150px}.record{break-before:page;page-break-before:always}.record:first-of-type{break-before:auto;page-break-before:auto}figure{margin:14px 0}svg{width:100%;height:auto;max-height:205px}figcaption,.muted{color:#61717b;font-size:10px}.case-id{font-size:15px;padding:10px 12px;border:1.5px solid #324955;background:#f2f5f7}.notice{border:1px solid #abbcc6;padding:8px 10px;background:#f4f7f8}footer{margin-top:22px;border-top:1px solid #cbd5da;padding-top:10px;color:#667780;font-size:9px}@media screen{body{max-width:210mm;margin:22px auto;padding:22px;box-shadow:0 0 18px #0002;background:#fff}.actions{margin:16px 0 22px}.actions button{padding:10px 16px;cursor:pointer}}@media print{.actions{display:none}body{padding:0;margin:0}thead{display:table-header-group}tr,figure{break-inside:avoid;page-break-inside:avoid}}</style>'+
 '</head><body><div class="actions"><button onclick="window.print()">Imprimir o desar com a PDF</button></div>'+
 '<header><strong>TECLAB · LAB-011</strong><h1>Informe de mesures de qualitat de xarxa</h1><p>Analitzador virtual · Registre instrumental simulat</p></header>'+
 '<p class="case-id"><strong>Codi de l’exercici:</strong> '+esc(session.caseCode)+'</p><p><strong>Data de generació:</strong> '+esc(generated)+' · <strong>Adquisicions:</strong> '+session.acquisitions.length+'</p>'+
 '<p class="notice">Totes les dades corresponen a una simulació educativa. Aquest informe registra mesures instrumentals i configuracions utilitzades; no acredita la conformitat d’una instal·lació real ni avalua el procediment de l’alumne.</p>'+
 (records||'<p>Encara no s’ha realitzat cap adquisició.</p>')+
 '<footer>TecLab · Creat per Albert Marcet i Valdés · Condicions de reutilització pendents de publicació. Informe generat localment al navegador.</footer>'+
 '</body></html>';
}
export function openPrintableReport(session){
 const html=buildInstrumentReport(session);
 const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob);
 const win=window.open(url,'_blank');
 if(!win){URL.revokeObjectURL(url);throw new Error('El navegador ha bloquejat la finestra de l’informe.');}
 // No revocar immediatament perquè Safari pot carregar el document més tard.
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 return true;
}
