import {generateCase,codeForCase,parseCaseCode} from './cases.js';
import {defaultInstrument,acquireInstrument} from './instrument.js';
import {harmonicOrders,sampleWave} from './model.js';
import {instrumentChannelComponents} from './instrument.js';
import {foundationsManual,helpManual} from './manual.js';
import {newSession,recordAcquisition,sessionToJSON,sessionFromJSON} from './session.js';
import {openPrintableReport} from './exports.js';
import {mountWiring} from './wiring.js';
import {CT_OPTIONS,ctSelection,applyCtSelection} from './ct-options.js';
import {randomSeed} from '../../shared/services/exercises.js';

const root=document.querySelector('#pq-app');
const find=id=>root.querySelector('#'+id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,dec=2)=>Number.isFinite(n)?n.toLocaleString('ca-ES',{maximumFractionDigits:dec,minimumFractionDigits:dec}):'—';
const number=(n,dec=2)=>Number.isFinite(n)?fmt(n,dec):'—';
let scenario,session,activeTab='laboratori',screen='instant',screenChannel=0,selectedRecord=null,message='';

function tell(text){message=text;const item=find('pq-message');if(item)item.textContent=text;}
function fresh(seed){scenario=generateCase(seed);session=newSession(scenario.code);selectedRecord=null;screen='instant';message='';paint();}
function setSession(restored){scenario=generateCase(parseCaseCode(restored.caseCode).seed);session=restored;selectedRecord=null;screen='instant';message='';paint();}
function download(name,data,mime='application/json'){
 const blob=new Blob([data],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function drawGrid(width=700,height=245){
 let lines='';
 for(let i=0;i<=10;i++){const x=35+i*(width-55)/10;lines+='<line x1="'+x+'" y1="15" x2="'+x+'" y2="'+(height-35)+'" stroke="#31515d" stroke-width=".8"/>';}
 for(let i=0;i<=6;i++){const y=15+i*(height-50)/6;lines+='<line x1="35" y1="'+y+'" x2="'+(width-20)+'" y2="'+y+'" stroke="#31515d" stroke-width=".8"/>';}
 return '<rect width="'+width+'" height="'+height+'" rx="6" fill="#0e2630"/>'+lines;
}
function linePath(vals,{w=700,h=245,low,high}={}){
 if(!vals?.length)return '';
 const min=Number.isFinite(low)?low:Math.min(...vals),max=Number.isFinite(high)?high:Math.max(...vals),span=Math.max(1e-9,max-min);
 return vals.map((v,i)=>(i?'L':'M')+(35+i*(w-55)/Math.max(1,vals.length-1)).toFixed(2)+','+(15+(1-(v-min)/span)*(h-50)).toFixed(2)).join(' ');
}
function graphSvg(a,b,labelA,labelB){
 const all=[...a,...(b??[])].filter(Number.isFinite);
 if(!all.length)return '<p>Sense dades disponibles.</p>';
 const lo=Math.min(...all),hi=Math.max(...all),pad=Math.max((hi-lo)*.15,.001);
 const ylo=lo-pad,yhi=hi+pad;
 return '<svg class="pq-chart" viewBox="0 0 700 245" role="img" aria-label="'+esc(labelA)+(b?' i '+esc(labelB):'')+'">'+drawGrid()+
 '<path d="'+linePath(a,{low:ylo,high:yhi})+'" fill="none" stroke="#f5c469" stroke-width="2.2"/>'+
 (b?'<path d="'+linePath(b,{low:ylo,high:yhi})+'" fill="none" stroke="#76c7e3" stroke-width="1.9"/>':'')+
 '<text x="40" y="234" fill="#b8d4dd" font-size="12">'+esc(labelA)+(b?' · '+esc(labelB):'')+'</text>'+
 '<text x="40" y="27" fill="#b8d4dd" font-size="11">'+fmt(yhi,2)+'</text>'+
 '<text x="40" y="207" fill="#b8d4dd" font-size="11">'+fmt(ylo,2)+'</text></svg>';
}
function barSvg(bars,unit){
 const max=Math.max(1,...bars.map(v=>v.value));
 const gap=(650/Math.max(1,bars.length));
 return '<svg class="pq-chart" viewBox="0 0 700 245" role="img" aria-label="Espectre harmònic '+esc(unit)+'">'+drawGrid()+
 bars.map((v,i)=>{const height=165*v.value/max,x=42+i*gap,y=207-height;return '<rect x="'+x+'" y="'+y+'" width="'+Math.max(12,gap-10)+'" height="'+height+'" fill="'+(i===0?'#e4a34a':'#76c7e3')+'"/><text x="'+(x+5)+'" y="222" fill="#c7dce3" font-size="12">'+v.order+'</text>';}).join('')+
 '<text x="40" y="27" fill="#b8d4dd" font-size="11">Ordre harmònic · RMS ('+esc(unit)+')</text></svg>';
}
function scheme(){
 return '<svg class="pq-scheme" viewBox="0 0 310 118" role="img" aria-label="Esquema de les alimentacions de la instal·lació"><g fill="none" stroke="#89b4bf" stroke-width="2"><path d="M15 54h46m0-13h65v26H61zM126 54h33m0-32v64m0-61h65m-65 29h65m-65 30h65"/><rect x="224" y="15" width="72" height="22" rx="3"/><rect x="224" y="43" width="72" height="22" rx="3"/><rect x="224" y="73" width="72" height="22" rx="3"/></g><g fill="#f1c27d" font-size="10"><text x="16" y="43">CA</text><text x="79" y="57">QG</text><text x="232" y="30">Variador</text><text x="233" y="58">Control</text><text x="233" y="88">Càrregues</text></g></svg>';
}
function casePanel(){
 return '<section class="panel"><h2>Cas i sessió</h2><p class="pq-note">Codi del cas (no inclou l’historial)</p><p class="pq-case-code">'+esc(session.caseCode)+'</p><div class="pq-action-row"><button type="button" id="pq-copy">Copiar codi</button><button type="button" id="pq-new">Nou cas</button></div><div class="pq-form"><label for="pq-code">Recuperar escenari</label><input id="pq-code" autocomplete="off" spellcheck="false" placeholder="TL-PQ1-…"></div><div class="pq-action-row"><button id="pq-open">Obrir codi</button></div><p class="pq-note">Temps de simulació: <span class="pq-time">'+fmt(session.elapsedSeconds,1)+' s</span></p><div class="pq-save"><button id="pq-report">Informe PDF / Imprimir</button><button id="pq-export-json">Exportar sessió JSON</button></div><label class="pq-note" for="pq-import">Importar una sessió JSON</label><input id="pq-import" type="file" accept=".json,application/json" style="font-size:12px;width:100%"></section>';
}
function settingsPanel(){
 const s=session.settings;
 return '<section class="panel"><h2>Configuració instrumental</h2><div class="pq-form"><label for="pq-topology">Topologia seleccionada</label><select id="pq-topology"><option value="1P2W" '+(s.topology==='1P2W'?'selected':'')+'>Monofàsica · 1P2W</option><option value="3P4W" '+(s.topology==='3P4W'?'selected':'')+'>Trifàsica · 3P4W</option></select><div class="pq-config-row"><label for="pq-start">Inici (s)<input id="pq-start" type="number" step="0.1" min="0" max="899" value="'+s.start+'"></label><label for="pq-duration">Durada (s)<input id="pq-duration" type="number" min="0.1" max="900" step=".1" value="'+s.duration+'"></label></div><label for="pq-interval">Interval de registre (s)</label><select id="pq-interval">'+[.05,.1,.2,.5,1,2,5,10,30].map(v=>'<option value="'+v+'" '+(s.interval===v?'selected':'')+'>'+fmt(v,2)+' s</option>').join('')+'</select><p class="pq-note">Les entrades, les pinces i els transformadors de corrent es configuren sota el quadre de connexions.</p></div></section>';
}
function channelControls(){
 const s=session.settings;
 const toggle=(kind,index,enabled)=>'<label class="pq-channel-toggle"><span class="pq-toggle-title">'+kind+(index+1)+'</span><input type="checkbox" role="switch" aria-label="Entrada '+kind+(index+1)+' activa" data-enabled="'+kind+'" data-slot="'+index+'" '+(enabled?'checked':'')+'><span class="pq-toggle-track" aria-hidden="true"></span><span class="pq-toggle-state">'+(enabled?'Activa':'Inactiva')+'</span></label>';
 const voltage='<div class="pq-input-bank"><h3>Sondes de tensió</h3><div class="pq-input-grid">'+s.voltageChannels.map((v,i)=>toggle('V',i,v.enabled)).join('')+'</div><p class="pq-note">El born VN és la referència negativa compartida dels canals de tensió.</p></div>';
 const current='<div class="pq-input-bank"><h3>Pinces de corrent i transformadors de corrent</h3><div class="pq-clamp-grid">'+s.currentChannels.map((i,index)=>{
   const chosen=ctSelection(i),unconfigured=i.ctRatio===null;
   const selectedId=chosen?.id??(unconfigured?'unconfigured':'legacy');
   const placeholder=unconfigured?'<option value="unconfigured" selected disabled>— TC sense configurar —</option>':
     chosen?'':'<option value="legacy" selected disabled>Relació anterior '+fmt(i.ctRatio,2)+':1 · selecciona un TC</option>';
   const opts=CT_OPTIONS.map(o=>'<option value="'+o.id+'" '+(selectedId===o.id?'selected':'')+'>'+o.label+'</option>').join('');
   return '<div class="pq-clamp-channel">'+toggle('I',index,i.enabled)+'<label for="pq-ct-'+index+'">TC de I'+(index+1)+'</label><select id="pq-ct-'+index+'" data-ct="'+index+'">'+legacy+opts+'</select></div>';
 }).join('')+'</div><p class="pq-note">El selector mostra la intensitat primària/secundària nominal. La relació que aplica l’analitzador és primària ÷ secundària. «Sense TC» manté una relació 1:1.</p></div>';
 return '<section class="pq-connection-controls" aria-label="Configuració de les sondes i pinces"><h2>Entrades de mesura</h2><div class="pq-connection-banks">'+voltage+current+'</div></section>';
}
function channelSelector(){
 return '<div class="pq-channel-picker" role="group" aria-label="Canal visualitzat">'+
 Array.from({length:scenario.phases},(_,i)=>'<button type="button" data-screen-channel="'+i+'" aria-pressed="'+(screenChannel===i)+'" class="'+(screenChannel===i?'active':'')+'">Canal '+(i+1)+'</button>').join('')+'</div>';
}
function readingView(){
 if(!selectedRecord)return '<p>Encara no hi ha cap adquisició. Les mesures apareixeran en completar-ne una.</p>';
 const row=selectedRecord.rows.at(-1);
 if(!row)return '<p>Sense mostres.</p>';
 const table='<table class="pq-table"><thead><tr><th>Entrada</th><th>U (V)</th><th>I (A)</th><th>P (W)</th><th>Q1 (var)</th><th>S (VA)</th><th>FP</th><th>THD-U (%)</th><th>THD-I (%)</th></tr></thead><tbody>'+
 row.phases.map(p=>'<tr><td>'+(p.slot+1)+'</td><td>'+fmt(p.voltageRms)+'</td><td>'+fmt(p.currentRms)+'</td><td>'+fmt(p.p)+'</td><td>'+fmt(p.q1)+'</td><td>'+fmt(p.s)+'</td><td>'+fmt(p.powerFactor,3)+'</td><td>'+fmt(p.voltageTHD)+'</td><td>'+fmt(p.currentTHD)+'</td></tr>').join('')+
 '</tbody></table>';
 const totals='<div class="pq-readings">'+[
  ['P total',row.totalP,'W'],['Q1 total',row.totalQ1,'var'],
  ['S total',row.totalS,'VA'],['FP total',row.totalPowerFactor,''],['Freqüència',row.phases.some(p=>Number.isFinite(p.voltageRms)&&p.voltageRms>0)?scenario.frequency:null,'Hz']
 ].map(([label,value,unit])=>'<div class="pq-reading"><span>'+label+'</span><strong>'+fmt(value,label.includes('FP')?3:2)+'</strong><small>'+unit+'</small></div>').join('')+'</div>';
 return '<p class="pq-note">Darrera mostra de '+esc(selectedRecord.id)+' · t = '+fmt(row.time,2)+' s</p><div class="pq-table-wrap">'+table+'</div>'+totals;
}
function harmonicView(){
 if(!selectedRecord)return '<p>Encara no hi ha dades harmòniques adquirides.</p>';
 const last=selectedRecord.rows.at(-1);
 if(!last)return '<p>No hi ha mostres disponibles.</p>';
 const c=instrumentChannelComponents(scenario,selectedRecord.settings,screenChannel,last.time);
 const content=key=>{
   const components=c[key];
   if(!components)return '<p class="pq-note">Canal sense lectura disponible.</p>';
   const bars=harmonicOrders.map(order=>({order,value:components.find(h=>h.order===order)?.rms??0}));
   return barSvg(bars,key==='voltage'?'V':'A');
 };
 return channelSelector()+'<p class="pq-note">Espectres del canal '+(screenChannel+1)+' en la darrera mostra (RMS per ordre).</p>'+
 '<h3 class="pq-screen-heading">Harmònics de tensió</h3>'+content('voltage')+
 '<h3 class="pq-screen-heading">Harmònics de corrent</h3>'+content('current');
}
function waveView(){
 if(!selectedRecord)return '<p>Encara no hi ha cap adquisició per mostrar formes d’ona.</p>';
 const last=selectedRecord.rows.at(-1);
 if(!last)return '<p>No hi ha mostres disponibles.</p>';
 // Tres períodes de la freqüència fonamental, mostrejats visualment.
 const period=1/scenario.frequency,dt=3*period/319;
 const rows=Array.from({length:320},(_,i)=>{
   const t=last.time+i*dt;
   const c=instrumentChannelComponents(scenario,selectedRecord.settings,screenChannel,t);
   return {
     voltage:c.voltage?sampleWave(c.voltage,c.frequency,t):null,
     current:c.current?sampleWave(c.current,c.frequency,t):null
   };
 });
 const plot=(key,unit)=>rows.every(r=>r[key]!==null)?
   graphSvg(rows.map(r=>r[key]),null,key==='voltage'?'Tensió (V)':'Corrent (A)'):
   '<p class="pq-note">No hi ha lectura en aquest canal.</p>';
 return channelSelector()+'<p class="pq-note">Tres períodes simulats del canal '+(screenChannel+1)+'. Cada magnitud té la seva pròpia escala vertical.</p>'+
 '<h3 class="pq-screen-heading">Tensió instantània · V</h3>'+plot('voltage','V')+
 '<h3 class="pq-screen-heading">Corrent instantani · A</h3>'+plot('current','A');
}
function timelineView(){
 if(!selectedRecord)return '<p>Encara no hi ha cap registre temporal seleccionat.</p>';
 const rows=selectedRecord.rows,v=rows.map(r=>r.phases[screenChannel]?.voltageRms);
 if(v.length<2||v.some(value=>!Number.isFinite(value)))return channelSelector()+'<p>No hi ha lectures temporals de tensió per a aquest canal.</p>';
 return channelSelector()+graphSvg(v,null,'Tensió RMS canal '+(screenChannel+1)+' (V)')+
 '<p class="pq-note">Inici: '+fmt(selectedRecord.start,1)+' s · Durada: '+fmt(selectedRecord.duration,1)+' s · Interval: '+fmt(selectedRecord.interval,2)+' s · Mostres: '+rows.length+'</p>';
}
function eventsView(){
 if(!selectedRecord)return '<p>Encara no hi ha cap adquisició per consultar esdeveniments.</p>';
 const events=selectedRecord.capturedEvents??[];
 if(!events.length)return '<p>Sense variacions registrades per la detecció interna en aquesta adquisició.</p>';
 return '<p class="pq-note">Variacions detectades sobre les lectures de l’instrument; no són diagnòstics de conformitat.</p><div class="pq-table-wrap"><table class="pq-table"><thead><tr><th>Inici (s)</th><th>Durada (s)</th><th>Canal</th><th>Magnitud</th><th>Anterior</th><th>Observada</th><th>Variació</th></tr></thead><tbody>'+
 events.flatMap(event=>event.measurements.map(item=>'<tr><td>'+fmt(event.start,3)+'</td><td>'+fmt(event.duration,3)+'</td><td>'+item.channel+'</td><td>'+esc(item.quantity)+'</td><td>'+fmt(item.previous)+' '+esc(item.unit)+'</td><td>'+fmt(item.observed)+' '+esc(item.unit)+'</td><td>'+fmt(item.variationPercent,1)+' %</td></tr>')).join('')+
 '</tbody></table></div><p class="pq-note">La durada es refereix al tram observat dins de la finestra configurada. Els valors de cada fila són magnituds mesurades.</p>';
}
function screenContent(){
 if(screen==='instant')return readingView();
 if(screen==='harmonics')return harmonicView();
 if(screen==='wave')return waveView();
 if(screen==='time')return timelineView();
 if(screen==='events')return eventsView();
 return '<p>Pantalla no disponible.</p>';
}
function analyzer(){
 const screens=[['instant','Mesures'],['wave','Formes d’ona'],['harmonics','Harmònics'],['time','Registre temporal'],['events','Esdeveniments']];
 return '<section class="pq-analyzer" aria-label="Analitzador de qualitat de xarxa virtual"><div class="pq-bezel"><div class="pq-hud"><span>TECLAB · PQ ANALYZER / MODEL V1</span><span><i class="pq-led '+(selectedRecord?'on':'')+'"></i>'+esc(selectedRecord?.id??'SENSE REGISTRE')+'</span></div><div class="pq-screen-nav">'+screens.map(([id,label])=>'<button data-screen="'+id+'" class="'+(id===screen?'active':'')+'" aria-pressed="'+(id===screen)+'">'+label+'</button>').join('')+'</div><div class="pq-screen" id="pq-screen">'+screenContent()+'</div></div><div class="pq-controls"><span class="pq-status">SIMULACIÓ · '+(scenario.phases===3?'3 FASES':'1 FASE')+'</span><div class="pq-action-row"><button id="pq-prev">◀ Pantalla</button><button class="primary" id="pq-measure">ADQUIRIR</button><button id="pq-next">Pantalla ▶</button></div></div><div id="pq-message" class="pq-message" role="status" aria-live="polite">'+esc(message)+'</div></section>';
}
function recordPointSummary(record){
 const points=new Set();
 for(const v of record.settings?.voltageChannels??[]){
   if(v.positivePoint)points.add(v.positivePoint);
   if(v.negativePoint)points.add(v.negativePoint);
 }
 for(const i of record.settings?.currentChannels??[])if(i.pointId)points.add(i.pointId);
 const names={PCC:'P0',DRIVE:'P1',CTRL:'P2',DC24:'24 V CC'};
 return points.size?[...points].map(p=>names[p]??p).join(' / '):'Sense connexions';
}
function historyView(){
 return '<section class="panel pq-data-panel"><h2>Historial de mesures</h2><p class="pq-note">Cada adquisició conserva la configuració, les mostres i els instants simulats.</p><div class="pq-history">'+(session.acquisitions.length?session.acquisitions.map((r,i)=>'<button data-record="'+i+'" class="'+(selectedRecord?.id===r.id?'active':'')+'">'+esc(r.id)+' · '+esc(recordPointSummary(r))+' · '+fmt(r.start,1)+'–'+fmt(r.start+r.duration,1)+' s · '+r.rows.length+' mostres</button>').join(''):'<p class="pq-note">No s’han efectuat mesures.</p>')+'</div></section>';
}
function foundations(){return foundationsManual();}
function help(){return helpManual();}
function paint(){
 document.querySelectorAll('[data-tab]').forEach(button=>{
   const current=button.dataset.tab===activeTab;
   button.classList.toggle('active',current);button.setAttribute('aria-pressed',String(current));
 });
 if(activeTab==='fonaments'){root.innerHTML=foundations();return;}
 if(activeTab==='ajuda'){root.innerHTML=help();return;}
 root.innerHTML='<section class="pq-stage panel"><h2>Quadre de connexions · P0 / P1 / P2</h2><p class="pq-note">Arrossega cada sonda o pinça fins a un conductor de P0, P1 o P2. Els cables continuen units a l’analitzador. Fes doble clic sobre una pinça per invertir-ne el sentit (o prem R amb el focus a la pinça). El circuit de 24 V CC té borns +24 V i 0 V on també pots col·locar sondes i pinces.</p><div id="pq-wiring-canvas"></div><div id="pq-placement" class="pq-placement" aria-live="polite"></div>'+channelControls()+'</section><div class="pq-layout"><aside class="pq-side">'+casePanel()+settingsPanel()+'</aside><div>'+analyzer()+historyView()+'</div></div>';
 const wiringRoot=find('pq-wiring-canvas');
 const updatePlacement=()=>{const target=find('pq-placement');if(!target)return;const s=session.settings;target.textContent=[...s.voltageChannels.map((v,i)=>'V'+(i+1)+': '+(v.positivePoint??'—')+' '+(v.positive??'—')+' / '+(v.negativePoint??'—')+' '+(v.negative??'—')),...s.currentChannels.map((v,i)=>'I'+(i+1)+': '+(v.pointId??'—')+' '+(v.conductor??'—')+(v.inverted?' · invertida':''))].join('   ·   ');};
 mountWiring(wiringRoot,scenario,session.settings,updatePlacement);
 updatePlacement();
 attach();
}
function attach(){
 const on=(selector,event,fn)=>{const target=root.querySelector(selector);if(target)target.addEventListener(event,fn);};
 const settings=session.settings;
 on('#pq-copy','click',()=>{navigator.clipboard?.writeText(session.caseCode).then(()=>tell('Codi copiat.')).catch(()=>tell('No s’ha pogut copiar el codi.'));});
 on('#pq-new','click',()=>{if(confirm('Obrir un cas nou? Exporta la sessió actual si vols conservar-ne l’historial.'))fresh(randomSeed());});
 on('#pq-open','click',()=>{try{const code=find('pq-code').value;const parsed=parseCaseCode(code);if(confirm('Obrir el cas? La sessió actual deixarà d’estar activa.'))fresh(parsed.seed);}catch(e){tell(e.message);}});
 on('#pq-report','click',()=>{try{if(!session.acquisitions.length){tell('Cal fer almenys una adquisició abans de generar l’informe.');return;}openPrintableReport(session);tell('Informe obert. Utilitza Imprimir → Desar com a PDF.');}catch(e){tell('No s’ha pogut generar l’informe: '+e.message);}});
 on('#pq-export-json','click',()=>{try{download('TecLab-LAB011-'+session.caseCode+'.json',sessionToJSON(session));tell('Sessió JSON exportada.');}catch(e){tell(e.message);}});
 on('#pq-import','change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>12000000)throw Error('El fitxer supera el límit admès.');const restored=sessionFromJSON(await file.text());if(confirm('Substituir la sessió actual per la del fitxer?')){setSession(restored);tell('Sessió importada.');}}catch(error){tell('No s’ha pogut importar: '+error.message);}});
 root.querySelectorAll('[data-point]').forEach(el=>el.addEventListener('click',()=>{settings.pointId=el.dataset.point;const freshSettings=defaultInstrument(scenario,settings.pointId);session.settings={...freshSettings,start:settings.start,duration:settings.duration,interval:settings.interval};paint();}));
 on('#pq-topology','change',e=>{settings.topology=e.target.value;});
 for(const id of ['start','duration','interval'])on('#pq-'+id,'change',e=>{const n=Number(e.target.value);if(Number.isFinite(n))settings[id]=n;});
 root.querySelectorAll('[data-enabled]').forEach(el=>el.addEventListener('change',()=>{
   const arr=el.dataset.enabled==='V'?settings.voltageChannels:settings.currentChannels;
   arr[Number(el.dataset.slot)].enabled=el.checked;
   const label=el.closest('.pq-channel-toggle')?.querySelector('.pq-toggle-state');
   if(label)label.textContent=el.checked?'Activa':'Inactiva';
 }));
 root.querySelectorAll('[data-ct]').forEach(el=>el.addEventListener('change',()=>{
   try{applyCtSelection(settings.currentChannels[Number(el.dataset.ct)],el.value);}catch(error){tell(error.message);}
 }));
 root.querySelectorAll('[data-inverted]').forEach(el=>el.addEventListener('change',()=>{
   settings.currentChannels[Number(el.dataset.inverted)].inverted=el.checked;
 }));
 root.querySelectorAll('[data-screen]').forEach(el=>el.addEventListener('click',()=>{screen=el.dataset.screen;paint();}));
 root.querySelectorAll('[data-screen-channel]').forEach(el=>el.addEventListener('click',()=>{screenChannel=Number(el.dataset.screenChannel);paint();}));
 const screens=['instant','wave','harmonics','time','events'];
 on('#pq-prev','click',()=>{screen=screens[(screens.indexOf(screen)+screens.length-1)%screens.length];paint();});
 on('#pq-next','click',()=>{screen=screens[(screens.indexOf(screen)+1)%screens.length];paint();});
 on('#pq-measure','click',()=>{try{session=recordAcquisition(session);selectedRecord=session.acquisitions.at(-1);message='Adquisició '+selectedRecord.id+' registrada.';paint();}catch(e){tell('Adquisició no disponible: '+e.message);}});
 root.querySelectorAll('[data-record]').forEach(el=>el.addEventListener('click',()=>{selectedRecord=session.acquisitions[Number(el.dataset.record)];paint();}));
}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
 activeTab=button.dataset.tab;paint();
}));
fresh(randomSeed());
