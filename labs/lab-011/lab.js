import {generateCase,codeForCase,parseCaseCode} from './cases.js';
import {defaultInstrument,acquireInstrument} from './instrument.js';
import {realSnapshot,waveform,spectrum} from './model.js';
import {newSession,recordAcquisition,sessionToJSON,sessionFromJSON} from './session.js';
import {openPrintableReport} from './exports.js';
import {randomSeed} from '../../shared/services/exercises.js';

const root=document.querySelector('#pq-app');
const find=id=>root.querySelector('#'+id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,dec=2)=>Number.isFinite(n)?n.toLocaleString('ca-ES',{maximumFractionDigits:dec,minimumFractionDigits:dec}):'—';
const number=(n,dec=2)=>Number.isFinite(n)?fmt(n,dec):'—';
let scenario,session,activeTab='laboratori',screen='instant',selectedRecord=null,message='',armedConnection=null;

function tell(text){message=text;const item=find('pq-message');if(item)item.textContent=text;}
function fresh(seed){scenario=generateCase(seed);session=newSession(scenario.code);selectedRecord=null;screen='instant';message='';armedConnection=null;paint();}
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
function connectionPanel(){
 const s=session.settings;
 const terminals=['N',...Array.from({length:scenario.phases},(_,i)=>'L'+(i+1))];
 const currentOptions=terminals.filter(t=>t!=='N');
 const option=(items,value)=>'<option value="">Sense connexió</option>'+items.map(t=>'<option value="'+t+'" '+(value===t?'selected':'')+'>'+t+'</option>').join('');
 // Els botons del quadre permeten connectar cada extrem sense donar indicacions de correcció.
 return '<section class="panel pq-wiring"><h2>Connexions de l’analitzador</h2>'+
 '<p class="pq-note">Selecciona un extrem de sonda o una pinça i després un conductor. La polaritat i el sentit de la pinça condicionen les lectures.</p>'+
 '<div class="pq-terminal-guide"><p class="pq-note">Selecciona una sonda o pinça, després prem el conductor on la col·loques.</p><div class="pq-conductor-map">'+terminals.map(t=>'<button type="button" class="pq-conductor" data-bus="'+t+'"><span class="pq-bus-line"></span><strong>'+t+'</strong></button>').join('')+'</div></div>'+
 '<div class="pq-form">'+s.voltageChannels.map((v,i)=>'<fieldset class="pq-wire-channel"><legend>Entrada V'+(i+1)+'</legend><div class="pq-action-row"><button type="button" data-arm="v-positive" data-slot="'+i+'" class="'+(armedConnection?.kind==='v-positive'&&armedConnection?.slot===i?'active':'')+'">Sonda V'+(i+1)+' +</button><button type="button" data-arm="v-negative" data-slot="'+i+'" class="'+(armedConnection?.kind==='v-negative'&&armedConnection?.slot===i?'active':'')+'">Sonda V'+(i+1)+' −</button></div><div class="pq-config-row"><label>Sonda positiva<select data-connection="v-positive" data-slot="'+i+'">'+option(terminals,v.positive)+'</select></label><label>Sonda negativa<select data-connection="v-negative" data-slot="'+i+'">'+option(terminals,v.negative)+'</select></label></div></fieldset>').join('')+
 s.currentChannels.map((a,i)=>'<fieldset class="pq-wire-channel"><legend>Pinça I'+(i+1)+'</legend><button type="button" data-arm="i-conductor" data-slot="'+i+'" class="'+(armedConnection?.kind==='i-conductor'&&armedConnection?.slot===i?'active':'')+'">Col·locar pinça I'+(i+1)+'</button><label>Conductor<select data-connection="i-conductor" data-slot="'+i+'">'+option(currentOptions,a.conductor)+'</select></label><label class="pq-switch"><input type="checkbox" data-inverted="'+i+'" '+(a.inverted?'checked':'')+'> Sentit de pinça invertit (fletxa cap a la font)</label></fieldset>').join('')+
 '</div><p class="pq-note">Els borns i les pinces representen connexions exclusivament virtuals.</p></section>';
}
function pointPicker(){
 return '<section class="panel"><h2>Instal·lació simulada</h2>'+scheme()+'<p class="pq-note">Punts de mesura en corrent altern. Les dades són simulades.</p><div class="pq-point-list">'+scenario.points.map(p=>'<button class="pq-point" data-point="'+p.id+'" aria-pressed="'+(session.settings.pointId===p.id)+'"><strong>'+esc(p.id)+'</strong><small>'+esc(p.label)+'</small></button>').join('')+'</div></section>';
}
function casePanel(){
 return '<section class="panel"><h2>Cas i sessió</h2><p class="pq-note">Codi del cas (no inclou l’historial)</p><p class="pq-case-code">'+esc(session.caseCode)+'</p><div class="pq-action-row"><button type="button" id="pq-copy">Copiar codi</button><button type="button" id="pq-new">Nou cas</button></div><div class="pq-form"><label for="pq-code">Recuperar escenari</label><input id="pq-code" autocomplete="off" spellcheck="false" placeholder="TL-PQ1-…"></div><div class="pq-action-row"><button id="pq-open">Obrir codi</button></div><p class="pq-note">Temps de simulació: <span class="pq-time">'+fmt(session.elapsedSeconds,1)+' s</span></p><div class="pq-save"><button id="pq-report">Informe PDF / Imprimir</button><button id="pq-export-json">Exportar sessió JSON</button></div><label class="pq-note" for="pq-import">Importar una sessió JSON</label><input id="pq-import" type="file" accept=".json,application/json" style="font-size:12px;width:100%"></section>';
}
function settingsPanel(){
 const s=session.settings,options=Array.from({length:scenario.phases},(_,i)=>'<option value="'+i+'">L'+(i+1)+'</option>').join('');
 const channelRow=(kind,arr)=>'<h3>'+kind+'</h3>'+arr.map((c,i)=>'<div class="pq-config-row"><label>Canal '+(i+1)+'<select data-channel="'+kind+'" data-slot="'+i+'">'+Array.from({length:scenario.phases},(_,j)=>'<option value="'+j+'" '+(c.phase===j?'selected':'')+'>L'+(j+1)+'</option>').join('')+'</select></label><label class="pq-switch"><input type="checkbox" data-enabled="'+kind+'" data-slot="'+i+'" '+(c.enabled?'checked':'')+'> Actiu</label></div>').join('');
 return '<section class="panel"><h2>Configuració instrumental</h2><div class="pq-form"><label for="pq-topology">Topologia seleccionada</label><select id="pq-topology"><option value="1P2W" '+(s.topology==='1P2W'?'selected':'')+'>Monofàsica · 1P2W</option><option value="3P4W" '+(s.topology==='3P4W'?'selected':'')+'>Trifàsica · 3P4W</option></select><div class="pq-config-row"><label for="pq-start">Inici (s)<input id="pq-start" type="number" step="0.1" min="0" max="899" value="'+s.start+'"></label><label for="pq-duration">Durada (s)<input id="pq-duration" type="number" min="0.1" max="900" step=".1" value="'+s.duration+'"></label></div><label for="pq-interval">Interval de registre (s)</label><select id="pq-interval">'+[.05,.1,.2,.5,1,2,5,10,30].map(v=>'<option value="'+v+'" '+(s.interval===v?'selected':'')+'>'+fmt(v,2)+' s</option>').join('')+'</select><details class="pq-advanced"><summary>Canals, pinces i transformadors de corrent</summary>'+channelRow('V',s.voltageChannels)+channelRow('I',s.currentChannels)+s.currentChannels.map((c,i)=>'<div class="pq-config-row"><label>TC · I'+(i+1)+'<input data-ct="'+i+'" type="number" min="0.1" max="10000" step="0.1" value="'+c.ctRatio+'"></label></div>').join('')+'</details></div></section>';
}
function readingView(){
 const row=selectedRecord?.rows.at(-1);
 const measured=row??null;
 const first=measured?.phases?.[0];
 const metrics=[
 ['Tensió L1',first?.voltageRms,'V'],['Corrent L1',first?.currentRms,'A'],
 ['Potència activa',measured?.totalP,'W'],['Potència aparent',measured?.totalS,'VA'],
 ['Reactiva fonamental',measured?.totalQ1,'var'],['Factor de potència',measured?.totalPowerFactor,''],
 ['THD tensió L1',first?.voltageTHD,'%'],['THD corrent L1',first?.currentTHD,'%'],
 ['Freqüència',selectedRecord?scenario.frequency:null,'Hz']
 ];
 return '<div class="pq-readings">'+metrics.map(([label,v,unit])=>'<div class="pq-reading"><span>'+esc(label)+'</span><strong>'+number(v,label.startsWith('Factor')?3:2)+'</strong><small>'+esc(unit)+'</small></div>').join('')+'</div><p class="pq-note">'+(row?'Lectures de la darrera mostra del registre seleccionat.':'Encara no hi ha cap adquisició. Configura l’equip i prem ADQUIRIR.')+'</p>';
}
function harmonicView(){
 if(!selectedRecord)return '<p>Executa una adquisició per mostrar l’espectre del cas mesurat.</p>';
 const r=selectedRecord.rows.at(-1);
 if(!r||r.status!=='measured')return '<p>Els canals no permeten reconstruir l’espectre complet amb aquesta configuració.</p>';
 // El gràfic mostra només la tensió del punt; la instrumentació per canal s'aplicarà al registre.
 const vChannel=selectedRecord.settings.voltageChannels[0];
 if(!vChannel?.enabled||vChannel.negative!=='N'||!/^L[1-3]$/.test(vChannel.positive??''))
   return '<p>Espectre no disponible per a aquesta connexió en la versió actual de l’instrument.</p>';
 const phase=Number(vChannel.positive.slice(1))-1;
 const t=r.time,values=spectrum(scenario,selectedRecord.pointId,phase,t);
 return '<p class="pq-note">Espectre de tensió per al canal de fase seleccionat, en l’instant de la mostra.</p>'+barSvg(values.map(v=>({order:v.order,value:v.voltageRms})),'V');
}
function waveView(){
 if(!selectedRecord)return '<p>Executa una adquisició per mostrar una forma d’ona.</p>';
 const r=selectedRecord.rows.at(-1),ch=selectedRecord.settings.voltageChannels[0];
 if(!r||r.status!=='measured'||!ch?.enabled)return '<p>El canal de tensió no està disponible.</p>';
 if(ch.negative!=='N'||!/^L[1-3]$/.test(ch.positive??''))
   return '<p>Forma d’ona no disponible per a aquesta connexió en la versió actual de l’instrument.</p>';
 const phase=Number(ch.positive.slice(1))-1;
 const period=1/scenario.frequency,rows=waveform(scenario,selectedRecord.pointId,phase,r.time,period*3,320);
 return '<div class="pq-plot-key"><span>Tensió L'+(ch.phase+1)+' (V)</span></div>'+graphSvg(rows.map(v=>v.voltage),null,'Tensió (V)')+'<p class="pq-note">Representació de tres períodes de la tensió del canal seleccionat. Les formes d’ona de corrent s’incorporaran quan el model apliqui íntegrament les relacions de TC i el sentit de les pinces als senyals mostrats.</p>';
}
function timelineView(){
 if(!selectedRecord)return '<p>No hi ha cap registre temporal seleccionat.</p>';
 const rows=selectedRecord.rows,v=rows.map(r=>r.phases[0]?.voltageRms??NaN);
 if(!v.some(Number.isFinite))return '<p>No hi ha lectures de tensió disponibles.</p>';
 return graphSvg(v,null,'Tensió L1 (V)')+'<p class="pq-note">Inici: '+fmt(selectedRecord.start,1)+' s · Durada: '+fmt(selectedRecord.duration,1)+' s · Interval: '+fmt(selectedRecord.interval,2)+' s · Mostres: '+rows.length+'</p>';
}
function screenContent(){
 if(screen==='instant')return readingView();
 if(screen==='harmonics')return harmonicView();
 if(screen==='wave')return waveView();
 if(screen==='time')return timelineView();
 return '<p>Pantalla no disponible.</p>';
}
function analyzer(){
 const screens=[['instant','Mesures'],['wave','Formes d’ona'],['harmonics','Harmònics'],['time','Registre temporal']];
 return '<section class="pq-analyzer" aria-label="Analitzador de qualitat de xarxa virtual"><div class="pq-bezel"><div class="pq-hud"><span>TECLAB · PQ ANALYZER / MODEL V1</span><span><i class="pq-led '+(selectedRecord?'on':'')+'"></i>'+esc(selectedRecord?.id??'SENSE REGISTRE')+'</span></div><div class="pq-screen-nav">'+screens.map(([id,label])=>'<button data-screen="'+id+'" class="'+(id===screen?'active':'')+'" aria-pressed="'+(id===screen)+'">'+label+'</button>').join('')+'</div><div class="pq-screen" id="pq-screen">'+screenContent()+'</div></div><div class="pq-controls"><span class="pq-status">SIMULACIÓ · '+(scenario.phases===3?'3 FASES':'1 FASE')+'</span><div class="pq-action-row"><button id="pq-prev">◀ Pantalla</button><button class="primary" id="pq-measure">ADQUIRIR</button><button id="pq-next">Pantalla ▶</button></div></div><div id="pq-message" class="pq-message" role="status" aria-live="polite">'+esc(message)+'</div></section>';
}
function historyView(){
 return '<section class="panel pq-data-panel"><h2>Historial de mesures</h2><p class="pq-note">Cada adquisició conserva la configuració, les mostres i els instants simulats.</p><div class="pq-history">'+(session.acquisitions.length?session.acquisitions.map((r,i)=>'<button data-record="'+i+'" class="'+(selectedRecord?.id===r.id?'active':'')+'">'+esc(r.id)+' · '+esc(r.pointId)+' · '+fmt(r.start,1)+'–'+fmt(r.start+r.duration,1)+' s · '+r.rows.length+' mostres</button>').join(''):'<p class="pq-note">No s’han efectuat mesures.</p>')+'</div></section>';
}
function foundations(){
 return '<div class="pq-guide"><section class="panel"><h2>Què mesura un analitzador de qualitat de xarxa?</h2><p>Registra tensions, corrents, freqüència i potències, i pot analitzar la distorsió harmònica i esdeveniments temporals. Aquest instrument és una simulació educativa: cap dada prové d’una instal·lació real.</p></section><section class="panel"><h2>Valors eficaços i potències</h2><p>Els valors RMS inclouen les components fonamental i harmòniques. La potència activa P és la mitjana de la potència instantània. La potència aparent S es calcula amb els RMS i el factor de potència total és P/S.</p><p>La potència reactiva representada com Q1 es refereix exclusivament a la fonamental; en xarxes distorsionades no s’ha d’equiparar sense matisos amb una potència reactiva total.</p></section><section class="panel"><h2>Distorsió harmònica</h2><p>THD de tensió i THD de corrent són magnituds diferents. Es calcula la relació entre l’arrel quadrada de la suma dels quadrats dels valors RMS harmònics i el RMS de la fonamental, expressada en percentatge. Un espectre mostra l’ordre de cada harmònic.</p></section><section class="panel"><h2>Pertorbacions i adquisició</h2><p>Una pertorbació només pot quedar registrada si té lloc durant la finestra de mesura i el mostreig la captura. Per això, durada, interval i punt de mesura condicionen els resultats. Un registre sense cap esdeveniment capturat no prova que la xarxa estigui lliure de pertorbacions.</p></section><section class="panel"><h2>Connexions i transformadors de corrent</h2><p>Els transformadors de corrent requereixen una relació correcta per mostrar la magnitud real. Invertir una pinça de corrent altera el sentit assignat a la mesura, i intercanviar fases pot provocar lectures de potència que no corresponen a la càrrega. L’equip virtual mostra les lectures derivades de la configuració, sense indicar automàticament la configuració adequada.</p></section></div>';
}
function help(){
 return '<div class="pq-guide"><section class="panel"><h2>1. Obre el teu cas</h2><p>Utilitza el codi assignat pel docent. El codi reconstrueix les condicions de la xarxa però no conté les mesures que hagis fet. Per traslladar tota la sessió a un altre ordinador, exporta el fitxer JSON.</p></section><section class="panel"><h2>2. Punts de mesura i connexions</h2>'+scheme()+'<p>Selecciona el punt de mesura a l’esquema de la instal·lació. Connecta cada sonda positiva i negativa a un conductor (L1, L2, L3 o N, segons la topologia) i col·loca cada pinça en un conductor. Pots canviar-ne el sentit. Després configura la topologia, els canals i la relació dels transformadors de corrent. Aquests controls canvien allò que mesura l’instrument.</p></section><section class="panel"><h2>3. Programa una adquisició</h2><p>Introdueix l’instant inicial, la durada i l’interval de mostreig. L’exercici disposa d’un temps simulat que permet repetir o desplaçar captures sense esperes reals. Prem ADQUIRIR.</p><div class="pq-help-example">Inici = 10 s · Durada = 30 s · Interval = 1 s → 31 mostres</div></section><section class="panel"><h2>4. Consulta pantalles</h2><p>Les tecles Mesures, Formes d’ona, Harmònics i Registre temporal permeten passar entre diferents representacions de les dades. Les lectures presentades corresponen al registre seleccionat. Si un canal està desconnectat, les magnituds que en depenen no es poden calcular completament.</p></section><section class="panel"><h2>5. Conserva el treball</h2><p>Genera un informe imprimible amb les mesures i utilitza la funció del navegador per desar-lo com a PDF. Exporta JSON si vols recuperar la sessió i continuar mesurant en un altre ordinador. L’historial inclou cada adquisició independent. El simulador no determina si la teva mesura és correcta ni redacta una conclusió de conformitat.</p></section></div>';
}
function paint(){
 document.querySelectorAll('[data-tab]').forEach(button=>{
   const current=button.dataset.tab===activeTab;
   button.classList.toggle('active',current);button.setAttribute('aria-pressed',String(current));
 });
 if(activeTab==='fonaments'){root.innerHTML=foundations();return;}
 if(activeTab==='ajuda'){root.innerHTML=help();return;}
 root.innerHTML='<div class="pq-layout"><aside class="pq-side">'+casePanel()+pointPicker()+connectionPanel()+settingsPanel()+'</aside><div>'+analyzer()+historyView()+'</div></div>';
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
 root.querySelectorAll('[data-arm]').forEach(button=>button.addEventListener('click',()=>{
   const slot=Number(button.dataset.slot),kind=button.dataset.arm;
   armedConnection={kind,slot};paint();
 }));
 root.querySelectorAll('[data-bus]').forEach(button=>button.addEventListener('click',()=>{
   if(!armedConnection){tell('Selecciona primer l’extrem de sonda o la pinça.');return;}
   const {slot,kind}=armedConnection,terminal=button.dataset.bus;
   if(kind==='v-positive')settings.voltageChannels[slot].positive=terminal;
   else if(kind==='v-negative')settings.voltageChannels[slot].negative=terminal;
   else if(terminal!=='N')settings.currentChannels[slot].conductor=terminal;
   else{tell('Aquesta pinça només admet conductors de fase en el model actual.');return;}
   armedConnection=null;paint();
 }));
 root.querySelectorAll('[data-connection]').forEach(el=>el.addEventListener('change',()=>{
   const slot=Number(el.dataset.slot),kind=el.dataset.connection,terminal=el.value||null;
   if(kind==='v-positive')settings.voltageChannels[slot].positive=terminal;
   if(kind==='v-negative')settings.voltageChannels[slot].negative=terminal;
   if(kind==='i-conductor')settings.currentChannels[slot].conductor=terminal;
 }));
 root.querySelectorAll('[data-channel]').forEach(el=>el.addEventListener('change',()=>{
   const arr=el.dataset.channel==='V'?settings.voltageChannels:settings.currentChannels;
   arr[Number(el.dataset.slot)].phase=Number(el.value);
 }));
 root.querySelectorAll('[data-enabled]').forEach(el=>el.addEventListener('change',()=>{
   const arr=el.dataset.enabled==='V'?settings.voltageChannels:settings.currentChannels;
   arr[Number(el.dataset.slot)].enabled=el.checked;
 }));
 root.querySelectorAll('[data-ct]').forEach(el=>el.addEventListener('change',()=>{
   settings.currentChannels[Number(el.dataset.ct)].ctRatio=Number(el.value);
 }));
 root.querySelectorAll('[data-inverted]').forEach(el=>el.addEventListener('change',()=>{
   settings.currentChannels[Number(el.dataset.inverted)].inverted=el.checked;
 }));
 root.querySelectorAll('[data-screen]').forEach(el=>el.addEventListener('click',()=>{screen=el.dataset.screen;paint();}));
 const screens=['instant','wave','harmonics','time'];
 on('#pq-prev','click',()=>{screen=screens[(screens.indexOf(screen)+3)%4];paint();});
 on('#pq-next','click',()=>{screen=screens[(screens.indexOf(screen)+1)%4];paint();});
 on('#pq-measure','click',()=>{try{session=recordAcquisition(session);selectedRecord=session.acquisitions.at(-1);message='Adquisició '+selectedRecord.id+' registrada.';paint();}catch(e){tell('Adquisició no disponible: '+e.message);}});
 root.querySelectorAll('[data-record]').forEach(el=>el.addEventListener('click',()=>{selectedRecord=session.acquisitions[Number(el.dataset.record)];paint();}));
}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
 activeTab=button.dataset.tab;paint();
}));
fresh(randomSeed());
