import {measure,ranges,isCorrect} from './meter.js';
import {generate,fromCode,levelKinds} from './exercises.js';
import {dialLayout,polar,sectorPath,dialPositions} from './dial-layout.js';
const $=id=>document.getElementById(id);
const fmt=(n,d=2)=>Number(n).toLocaleString('ca-ES',{maximumFractionDigits:d});
let ex=generate('inicial','R2',12345);
let seenOverload=false;
// Els fusibles representen un estat físic persistent, independent de l’exercici.
const fuseState={mA:true,'10A':true};
let s={range:'VDC20',redJack:'VΩmA',blackJack:'COM',redNode:null,blackNode:null,probe:'red',view:'schema',powered:true,seriesOpen:false,isolated:''};
const points=[['A',75,44],['B',405,44],['C',405,246],['D',146,44],['E',194,44]];
function markings(){
 return points.map(([id,x,y])=>['red','black'].filter(p=>s[p+'Node']===id).map((p,i)=>{
 const color=p==='red'?'#ff6666':'#101820',dx=p==='red'?-19:19;
 return '<path d="M'+x+' '+y+'l'+dx+' -28" stroke="'+color+'" stroke-width="5"/><circle cx="'+(x+dx)+'" cy="'+(y-28)+'" r="6" fill="'+color+'" stroke="white"/>';
 }).join('')+'<g class="node" data-node="'+id+'" role="button" tabindex="0" aria-label="Connectar al node '+id+'"><circle cx="'+x+'" cy="'+y+'" r="11"/><text x="'+(x+16)+'" y="'+(y+5)+'">'+id+'</text></g>').join('');
}
function circuit(){
 const labels='<g fill="#eaf2f5" font-size="16"><text x="88" y="139">'+fmt(ex.voltage)+' V</text><text x="203" y="21">R1 '+fmt(ex.r1,0)+' Ω</text><text x="304" y="187">R2 '+fmt(ex.r2,0)+' Ω</text></g>';
 const schema='<path class="wire" d="M75 44H146M194 44H220M264 44H405V164M405 208V246H75V167M75 104V44"/><path d="M75 104v18m-15 0h30m-24 12h18m-9 0v33" stroke="#e4ca84" stroke-width="4" fill="none"/><rect class="resistor" x="220" y="30" width="44" height="28" rx="3"/><rect class="resistor" x="390" y="164" width="30" height="44" rx="3"/>';
 const holes=Array.from({length:7},(_,i)=>Array.from({length:5},(_,j)=>'<circle cx="'+(207+j*52)+'" cy="'+(34+i*36)+'" r="4" fill="#89979a"/>').join('')).join('');
 const physical='<rect x="180" y="15" width="278" height="266" rx="14" fill="#eee6d0" stroke="#b8ab89" stroke-width="4"/>'+holes+
 '<rect x="12" y="98" width="136" height="100" rx="11" fill="#475963" stroke="#adc4cc" stroke-width="3"/><text x="30" y="122" fill="#eecb86">FONT CC</text><text x="29" y="155" fill="white" font-size="24">'+fmt(ex.voltage)+' V</text>'+
 '<circle cx="53" cy="178" r="7" fill="#fa5c5c"/><circle cx="111" cy="178" r="7" fill="#111"/>'+
 '<path d="M53 178C53 17 118 44 146 44M194 44H220M264 44H405M111 178C111 270 206 246 405 246" fill="none" stroke="#ed5858" stroke-width="5"/><path d="M405 44V164M405 208V246" stroke="#455a60" stroke-width="5" fill="none"/>'+
 '<rect x="220" y="32" width="44" height="24" rx="9" fill="#e8c18c" stroke="#795b40"/><rect x="392" y="164" width="26" height="44" rx="9" fill="#e8c18c" stroke="#795b40"/>';
 const meterInserted=s.seriesOpen&&((s.redNode==='D'&&s.blackNode==='E')||(s.redNode==='E'&&s.blackNode==='D'))&&ranges.find(r=>r.id===s.range)?.mode==='ADC';
 const bridge=s.seriesOpen?(meterInserted?
 '<path d="M146 44H152M188 44H194" stroke="#e1c185" stroke-width="4"/><circle cx="170" cy="44" r="18" stroke="#ffce77" stroke-width="3" fill="#203843"/><text x="170" y="51" text-anchor="middle" fill="#ffffff" font-size="20">A</text><text x="170" y="85" text-anchor="middle" fill="#b8f0c8" font-size="12">EN SÈRIE</text>':
 '<path d="M146 44v14m48-14v14" stroke="#f1d27f" stroke-width="3"/><text x="170" y="84" text-anchor="middle" fill="#f6d38a" font-size="14">OBERT</text>'):
 '<path d="M146 44H194" stroke="#88d7b7" stroke-width="5"/>';
 const isolated=s.isolated?'<rect x="'+(s.isolated==='R1'?'217':'386')+'" y="'+(s.isolated==='R1'?'27':'160')+'" width="'+(s.isolated==='R1'?'51':'38')+'" height="'+(s.isolated==='R1'?'36':'51')+'" rx="4" fill="none" stroke="#ffcf75" stroke-width="4" stroke-dasharray="5 4"/><text x="284" y="226" fill="#ffcf75" font-size="14">'+s.isolated+' aïllada</text>':'';
 const off=s.powered?'':'<text x="22" y="278" fill="#ffcf75" font-size="15">FONT DESCONNECTADA</text>';
 const fault=(!fuseState.mA||!fuseState['10A'])?
 '<g class="circuit-fault-symbol"><path d="M13 208h24l-9 15h15l-27 36 6-24H9z" fill="#ff974a" stroke="#fff0aa" stroke-width="2"/><text x="51" y="230" fill="#ffb5a0" font-size="14" font-weight="bold">FUSIBLE FOS</text></g>':'';
 return '<svg viewBox="0 0 500 300" role="group" aria-label="Circuit divisor de tensió">'+(s.view==='schema'?schema:physical)+bridge+isolated+off+fault+labels+markings()+'</svg>';
}
function dial(){
 const pos=(angle,r)=>polar(angle,r).map(n=>n/4);
 const background='<svg class="dial-backdrop" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="198" fill="#152733" stroke="#8499a4" stroke-width="4"/>'+
 dialLayout.map(g=>'<path d="'+sectorPath(g.start,g.end)+'" fill="'+g.color+'" stroke="#9badb6" stroke-width="1.5"/>').join('')+
 '<circle cx="200" cy="200" r="70" fill="#293d48" stroke="#8499a4" stroke-width="3"/></svg>';
 const names=dialLayout.filter(g=>g.group!=='OFF').map(g=>{
  const [x,y]=pos((g.start+g.end)/2,97);
  return '<span class="dial-group" aria-hidden="true" style="left:'+x+'%;top:'+y+'%;color:'+g.ink+'">'+g.group+'</span>';
 }).join('');
 const buttons=dialPositions().map(p=>{
  const item=ranges.find(r=>r.id===p.id),[x,y]=pos(p.angle,163);
  return '<button type="button" data-range="'+p.id+'" class="dial-choice '+(s.range===p.id?'chosen':'')+'" aria-label="'+p.group+' · escala '+item.label+'" aria-pressed="'+(s.range===p.id)+'" style="left:'+x+'%;top:'+y+'%">'+item.label+'</button>';
 }).join('');
 const selected=dialPositions().find(p=>p.id===s.range);
 return '<div class="dial-surface">'+background+names+buttons+'<div class="dial-body" style="--turn:'+(selected?.angle??-163)+'deg"><span class="dial-arrow"></span></div></div>';
}
function renderJacks(){
 document.querySelectorAll('[data-jack]').forEach(b=>{
  const j=b.dataset.jack,red=s.redJack===j,black=s.blackJack===j;
  b.classList.toggle('plug-red',red);b.classList.toggle('plug-black',black);
  b.setAttribute('aria-pressed',String((s.probe==='red'?red:black)));
  b.setAttribute('aria-label','Born '+j+(red?', clavilla vermella connectada':black?', clavilla negra connectada':', lliure'));
  b.title=(red?'Clavilla vermella':black?'Clavilla negra':'Born lliure')+' · '+j;
  const occupant=b.querySelector('.socket-occupant');
  if(occupant)occupant.textContent=red?'VERMELLA':black?'NEGRA':'LLIURE';
 });
 for(const p of ['red','black']){
  const lead=$(p+'Lead'),jack=s[p+'Jack'];
  lead.classList.toggle('lead-selected',s.probe===p);
  lead.classList.toggle('lead-unplugged',!jack);
  lead.setAttribute('aria-pressed',String(s.probe===p));
  $(p+'LeadLocation').textContent=jack?'→ '+jack:'SENSE BORN';
 }
 $('jackStatus').textContent='Vermella: '+(s.redJack||'desendollada')+' · Negra: '+(s.blackJack||'desendollada')+'.';
}
function connectJack(jack,probe=s.probe){
 const other=probe==='red'?'black':'red';
 if(s[other+'Jack']===jack){
  feedback('El born '+jack+' ja està ocupat per la clavilla '+(other==='red'?'vermella':'negra')+'. Mou primer l’altra clavilla.','error');
  return;
 }
 s.probe=probe;
 s[probe+'Jack']=jack;
 renderJacks();
 feedback('Clavilla '+(probe==='red'?'vermella':'negra')+' connectada a '+jack+'. '+reading().status);
}
function unplugJack(probe=s.probe){
 s[probe+'Jack']=null;
 renderJacks();
 feedback('Clavilla '+(probe==='red'?'vermella':'negra')+' desendollada. Selecciona un born lliure.');
}

function feedback(message,type=''){const el=$('feedback');el.textContent=message;el.className='feedback '+(type?'feedback-'+type:'');}
function updateWiring(){
 $('powerToggle').textContent='Font: '+(s.powered?'connectada':'desconnectada');
 $('powerToggle').setAttribute('aria-pressed',String(s.powered));
 $('seriesToggle').textContent='Circuit: '+(s.seriesOpen?'obert (D–E)':'tancat');
 $('seriesToggle').setAttribute('aria-pressed',String(s.seriesOpen));
 $('isolation').value=s.isolated;
 $('wiringStatus').textContent=(s.powered?'Font connectada':'Font desconnectada')+' · '+(s.seriesOpen?'interrupció D–E oberta':'circuit tancat')+' · '+(s.isolated?s.isolated+' aïllada':'resistències muntades')+'.';
}
function renderFuses(){
 for(const [id,name,elId,buttonId] of [['mA','fuseMaState','fuseMa','replaceMa'],['10A','fuse10State','fuse10','replace10']]){
  const ok=fuseState[id],panel=$(elId);
  panel.classList.toggle('fuse-blown',!ok);
  $(name).textContent=ok?'Correcte':'FOS';
  $(buttonId).hidden=ok;
 }
 $('circuit').classList.toggle('circuit-fuse-fault',!Object.values(fuseState).every(Boolean));
 $('fuseNote').textContent=Object.values(fuseState).every(Boolean)?
  'Protecció simulada: un curtcircuit directe pot fer fondre el fusible.':
  'Fusible fos: font desconnectada i puntes retirades abans de substituir-lo.';
}
function reading(){
 let m=measure({...s,voltage:ex.voltage,r1:ex.r1,r2:ex.r2,fuses:fuseState});
 if(m.faultFuse&&fuseState[m.faultFuse]){
  const blown=m.faultFuse;
  fuseState[blown]=false;
  m=measure({...s,voltage:ex.voltage,r1:ex.r1,r2:ex.r2,fuses:fuseState});
  // Conservem l'avís del curtcircuit en lloc d'ocultar-ne la causa.
  m={...m,status:'Curtcircuit simulat entre A i C! S’ha fos el fusible '+blown+'. Desconnecta la font i revisa les connexions.'};
  feedback(m.status,'error');
 }
 $('reading').textContent=m.display;
 $('unit').textContent=m.unit;
 $('reading').classList.toggle('meter-fuse-fault',m.display==='FUS');
 if(m.display==='OL')seenOverload=true;
 renderFuses();
 return m;
}
function render(){
 $('circuit').innerHTML=circuit();$('rotary').innerHTML=dial();const selected=ranges.find(r=>r.id===s.range);$('dialSelection').textContent='Posició seleccionada: '+(selected.mode==='OFF'?'OFF':selected.group+' · '+selected.label);
 $('circuit').querySelectorAll('[data-node]').forEach(el=>{
 const connect=()=>{s[s.probe+'Node']=el.dataset.node;render();feedback(reading().status);};
 el.onclick=connect;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();connect();}};
 });
 $('rotary').querySelectorAll('[data-range]').forEach(el=>{
 el.onclick=()=>{s.range=el.dataset.range;render();feedback(reading().status);};
 el.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();let i=ranges.findIndex(r=>r.id===s.range);s.range=ranges[(i+(e.key==='ArrowRight'?1:-1)+ranges.length)%ranges.length].id;render();$('rotary').querySelector('[data-range="'+s.range+'"]').focus();}};
 });
 $('redNode').textContent=s.redNode||'sense connectar';$('blackNode').textContent=s.blackNode||'sense connectar';
 ['red','black'].forEach(p=>$(p+'Probe').classList.toggle('selected',p===s.probe));renderJacks();
 ['schema','physical'].forEach(v=>$(v).classList.toggle('active',v===s.view));
 $('circuitInfo').textContent='Font '+fmt(ex.voltage)+' V CC · R1 '+fmt(ex.r1,0)+' Ω · R2 '+fmt(ex.r2,0)+' Ω. Terminal D i E: obertura del circuit per a A⎓.';
 updateWiring();
 reading();
}
function kindMode(id){
 if(id==='MIX')return 'all';
 if(id==='ANY')return 'VDC';
 if(['CURRENT','I_RANGE','I_DIAG','I_REVERSE'].includes(id))return 'ADC';
 if(id.startsWith('OHM_'))return 'OHM';
 return 'VDC';
}
function kinds(level,selected){
 const filter=$('magnitude').value||'all';
 const items=levelKinds[level].filter(([id])=>filter==='all'||kindMode(id)===filter);
 $('kind').innerHTML=items.map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('');
 if(selected&&items.some(([id])=>id===selected))$('kind').value=selected;
}
function load(v){
 ex=v;seenOverload=false;s.redNode=null;s.blackNode=null;s.range=v.mode==='ADC'?'ADC20m':v.mode==='OHM'?'OHM20k':'VDC20';s.redJack='VΩmA';s.blackJack='COM';s.powered=true;s.seriesOpen=false;s.isolated='';
 $('level').value=v.level;$('magnitude').value=kindMode(v.kind);kinds(v.level,v.kind);$('exerciseCode').value=v.code;
 $('task').innerHTML='<p class="task-level">'+({inicial:'Inicial',basic:'Bàsic',intermedi:'Intermedi',avancat:'Avançat'}[v.level])+' · '+levelKinds[v.level].find(([id])=>id===v.kind)[1]+'</p><strong>'+v.text+'</strong><p>Observa el circuit i tria connexions i escala. La resolució numèrica només apareix amb Mostra l’explicació.</p>';
 $('explanation').innerHTML=v.mode==='ADC'?
 '<h3>Resolució guiada de la intensitat</h3><p>Font desconnectada durant el muntatge; obre D–E i intercala el multímetre en sèrie. Després, amb la font connectada: I = U/(R1 + R2) = '+fmt(v.expected*1000,3)+' mA. Escala mínima possible: '+ranges.find(r=>r.id===v.range).label+' A⎓.</p>':
 v.mode==='OHM'?
 '<h3>Resolució guiada de resistència</h3><p>Font desconnectada; aïlla '+v.resistor+'. Col·loca les puntes a '+v.red+' i '+v.black+'. La lectura és '+fmt(v.expected,0)+' Ω, amb el rang '+ranges.find(r=>r.id===v.range).label+' Ω.</p>':
 '<h3>Resolució guiada</h3><p>I = U/(R1 + R2) = '+fmt(v.voltage/(v.r1+v.r2)*1000,3)+' mA.</p><p>Potencials: A = '+fmt(v.voltage,3)+' V, B = '+fmt(v.voltage*v.r2/(v.r1+v.r2),3)+' V i C = 0 V. Lectura: V('+v.red+') − V('+v.black+') = '+fmt(v.expected,3)+' V. Rang mínim apropiat: '+ranges.find(r=>r.id===v.range).label+' V⎓.</p>';
 $('explanation').hidden=true;$('codeStatus').textContent='Codi reproduïble: '+v.code;render();feedback('Configura el multímetre i connecta les puntes.');
}
function illustration(type){
 const base=(label,svg)=>'<figure class="edu-figure"><svg viewBox="0 0 480 226" role="img" aria-label="'+label+'"><rect width="480" height="226" rx="12" fill="#10232d"/>'+svg+'</svg><figcaption>'+label+'</figcaption></figure>';
 if(type==='range')return base('Exemple de 8 V: 2 V dona OL; 20 V dona 8,00 V','<rect x="20" y="30" width="206" height="150" rx="12" fill="#43575d"/><rect x="253" y="30" width="206" height="150" rx="12" fill="#43575d"/><rect x="34" y="45" width="178" height="88" rx="6" fill="#b0d7bf"/><rect x="267" y="45" width="178" height="88" rx="6" fill="#b0d7bf"/><text x="123" y="104" text-anchor="middle" fill="#142a24" font-size="45" font-family="monospace">OL</text><text x="356" y="104" text-anchor="middle" fill="#142a24" font-size="40" font-family="monospace">8.00</text><text x="123" y="164" text-anchor="middle" fill="#fff" font-size="22">2 V ⎓</text><text x="356" y="164" text-anchor="middle" fill="#fff" font-size="22">20 V ⎓</text>');
 if(type==='jacks')return base('Per a tensió: vermella a VΩmA, negra a COM','<circle cx="85" cy="100" r="32" fill="#08141a" stroke="#cf6d63" stroke-width="11"/><circle cx="240" cy="100" r="32" fill="#08141a" stroke="#afbecb" stroke-width="11"/><circle cx="395" cy="100" r="32" fill="#08141a" stroke="#cf6d63" stroke-width="11"/><g fill="#fff" font-size="23" text-anchor="middle" font-weight="bold"><text x="85" y="168">10A</text><text x="240" y="168">COM</text><text x="395" y="168">VΩmA</text></g><text x="240" y="203" fill="#f6d6a4" font-size="17" text-anchor="middle">10A només per a corrents elevats</text>');
 if(type==='series')return base('Amperímetre en sèrie: cal obrir el circuit','<path d="M58 95V35H197M263 35H425V188H58V95" fill="none" stroke="#d5e2e8" stroke-width="5"/><circle cx="230" cy="35" r="32" fill="#354c58" stroke="#f4c66b" stroke-width="4"/><text x="230" y="45" text-anchor="middle" fill="white" font-size="26">A</text><rect x="410" y="112" width="28" height="47" fill="#e2b774"/><text x="350" y="108" fill="#fff" font-size="22">R</text><text x="40" y="96" fill="#fff" font-size="18">+</text>');
 return base('Voltímetre en paral·lel als extrems de R2','<path d="M58 105V30H250V80M250 126V188H58V105M250 80H392V128H250" fill="none" stroke="#d5e2e8" stroke-width="5"/><rect x="234" y="80" width="32" height="46" fill="#e2b774"/><circle cx="392" cy="104" r="32" fill="#344b58" stroke="#f5c573" stroke-width="4"/><text x="392" y="114" text-anchor="middle" fill="white" font-size="30">V</text><text x="274" y="77" fill="#fff" font-size="22">R2</text><text x="286" y="169" fill="#f5d18f" font-size="18">En paral·lel</text>');
}
const theory=[
 ['1. Tensió contínua i polaritat','V⎓ mesura V(punta vermella) − V(punta negra). Si B està a 8 V i C a 0 V, la vermella a B i la negra a C indiquen +8 V; amb les puntes intercanviades apareix −8 V. La connexió del voltímetre és en paral·lel, sense obrir el circuit.','parallel'],
 ['2. Borns del multímetre','Per mesurar tensió, el cable negre va a COM i el vermell a VΩmA. El born 10A és específic de l’escala 10 A. No connectis aquest born en paral·lel amb la font: pots provocar un curtcircuit. A les escales de corrent petites s’utilitza VΩmA, però la mesura real necessita obrir el circuit.','jacks'],
 ['3. Escales i sobrecàrrega','Si esperes 8 V, el rang V⎓ de 2 V és insuficient i apareix OL. El rang de 20 V permet llegir 8,00 V. Si no coneixes la tensió, comença amb un rang elevat i redueix-lo progressivament. Cada xifra del dial correspon al fons d’escala del seu sector.','range'],
 ['4. Intensitat en sèrie','Desconnecta la font amb el botó Font. Prem Circuit: tancat per obrir la interrupció D–E. Selecciona la punta vermella i connecta-la a D; després la negra a E. Per a corrents petits, VΩmA i COM; per al rang 10 A, 10A i COM. Selecciona A⎓ i torna a connectar la font. Amb 12 V, R1 = 1 kΩ i R2 = 2 kΩ obtindràs I = 12/3000 = 4 mA. Mai connectis un amperímetre en paral·lel amb una font.','series'],
 ['5. Resistència amb el circuit desalimentat','Desconnecta la font. A Resistència aïllada, selecciona R1 o R2: el simulador la separa elèctricament de la resta. Selecciona Ω, connecta negre a COM i vermell a VΩmA i col·loca les puntes als dos extrems de la resistència escollida (R1: A–B; R2: B–C). Una resistència de 2 kΩ supera el rang 200 Ω; en 20 kΩ apareix una lectura. Aquest model és ideal i només representa la resistència aïllada.','range'],
 ['6. Exemple de divisor de tensió','Amb U = 12 V, R1 = 1 kΩ i R2 = 2 kΩ: I = 12/(1000 + 2000) = 4 mA. La caiguda a R1 és 4 V i a R2 és 8 V. Així, A = 12 V, B = 8 V i C = 0 V. Les lectures entre nodes segueixen les diferències de potencial, no el nom dels components.','parallel']
];
const help=[
 ['1. Crear un exercici','Tria Inicial, Bàsic, Intermedi o Avançat. Selecciona un tipus o Exercici aleatori i prem Nou exercici. Canviar només el desplegable no genera una pràctica. Els nous valors de font i resistències es mostren al circuit.','range'],
 ['2. Interpretar l’enunciat','L’enunciat és al requadre Pràctica actual, damunt del circuit. Indica què has de mesurar, però no revela els nodes exactes ni els resultats. Resol primer la pràctica i obre Mostra l’explicació només quan necessitis la resolució numèrica.','parallel'],
 ['3. Identificar grup i escala','Els sectors del dial són V⎓: 200 mV, 2, 20, 200 i 600 V; V~: 200 i 600 V; A⎓: 200 µA, 2, 20, 200 mA i 10 A; Ω: 200 Ω, 2 kΩ, 20 kΩ, 200 kΩ i 2 MΩ. La indicació sota el dial mostra el grup i l’escala seleccionats.','range'],
 ['4. Connectar els cables i controlar la font','Selecciona primer la punta Vermella o Negra; a continuació prem el born adequat. Per a V⎓ i Ω: negre a COM, vermell a VΩmA. Per a A⎓: VΩmA en els rangs µA/mA i 10A només al rang 10 A. La font es pot connectar i desconnectar amb el botó superior; mai canviïs el muntatge mentre està alimentat.','jacks'],
 ['5. Intensitat i resistència pas a pas','Intensitat: desconnecta la font, obre Circuit: tancat, connecta vermell a D i negre a E, selecciona A⎓ i torna a connectar la font. Resistència: desconnecta la font, selecciona R1 o R2 al control Resistència aïllada, tria Ω i mesura entre A–B o B–C respectivament. OL indica rang insuficient o camí de mesura obert.','series'],
 ['6. Comprovar i recuperar','Prem Comprova la mesura després d’ajustar el mode, els borns i el circuit. El missatge serà verd o vermell. Amb Mostra l’explicació es desenvolupen els càlculs en V, mA o Ω segons l’exercici. El codi TL-MM1 permet reproduir-ne els components i l’objectiu.','range']
];
function lessons(id,title,lead,items){$(id).innerHTML='<h2>'+title+'</h2><p class="intro">'+lead+'</p><div class="lesson-grid">'+items.map(([t,b,fig])=>'<article class="panel"><h3>'+t+'</h3>'+illustration(fig)+'<p>'+b+'</p></article>').join('')+'</div>';}
lessons('tab-fonaments','Fonaments de mesura','Explicacions i esquemes per comprendre les connexions, els rangs i els resultats.',theory);
lessons('tab-ajuda','Ajuda del laboratori','Guia pràctica amb exemples gràfics de cada operació.',help);
document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{$('sectionKicker').textContent='LAB-007 / '+({laboratori:'PRÀCTICA',fonaments:'FONAMENTS',ajuda:'AJUDA'}[b.dataset.section]);$('sectionTitle').textContent=({laboratori:'Mesures amb multímetre',fonaments:'Fonaments del multímetre',ajuda:'Ajuda del multímetre'}[b.dataset.section]);['laboratori','fonaments','ajuda'].forEach(k=>{$('tab-'+k).hidden=k!==b.dataset.section;document.querySelector('[data-section="'+k+'"]').classList.toggle('active',k===b.dataset.section);document.querySelector('[data-section="'+k+'"]').setAttribute('aria-current',k===b.dataset.section?'page':'false');});});
['schema','physical'].forEach(v=>$(v).onclick=()=>{s.view=v;render();});
['red','black'].forEach(v=>$(v+'Probe').onclick=()=>{s.probe=v;render();});
document.querySelectorAll('[data-jack]').forEach(b=>{
 b.onclick=()=>connectJack(b.dataset.jack);
 b.ondragover=e=>{e.preventDefault();b.classList.add('jack-drop-target');};
 b.ondragleave=()=>b.classList.remove('jack-drop-target');
 b.ondrop=e=>{
  e.preventDefault();b.classList.remove('jack-drop-target');
  const probe=e.dataTransfer?.getData('text/plain');
  if(probe==='red'||probe==='black')connectJack(b.dataset.jack,probe);
 };
});
for(const probe of ['red','black']){
 const el=$(probe+'Lead');
 el.onclick=()=>{s.probe=probe;render();};
 el.ondragstart=e=>{s.probe=probe;e.dataTransfer?.setData('text/plain',probe);if(e.dataTransfer)e.dataTransfer.effectAllowed='move';renderJacks();};
 el.ondragend=()=>document.querySelectorAll('[data-jack]').forEach(b=>b.classList.remove('jack-drop-target'));
}
$('unplugLead').onclick=()=>unplugJack();

$('powerToggle').onclick=()=>{
 if(!s.powered&&(s.seriesOpen&&! ((s.redNode==='D'&&s.blackNode==='E')||(s.redNode==='E'&&s.blackNode==='D')))){feedback('Abans de connectar la font, tanca el circuit o completa la connexió en sèrie entre D i E.','error');return;}
 if(!s.powered&&s.isolated){feedback('Torna a muntar la resistència abans de connectar la font.','error');return;}
 s.powered=!s.powered;render();feedback(reading().status);
};
$('seriesToggle').onclick=()=>{
 if(s.powered){feedback('Desconnecta primer la font abans d’obrir o tancar el circuit.','error');return;}
 s.seriesOpen=!s.seriesOpen;render();feedback(reading().status);
};
$('isolation').onchange=e=>{
 if(s.powered){$('isolation').value=s.isolated;feedback('Per aïllar una resistència, desconnecta primer la font.','error');return;}
 s.isolated=e.target.value;render();feedback(reading().status);
};
for(const [id,button] of [['mA','replaceMa'],['10A','replace10']]){
 $(button).onclick=()=>{
  if(s.powered||s.redNode||s.blackNode){
   feedback('Per substituir un fusible, desconnecta la font i retira les dues puntes del circuit.','error');return;
  }
  fuseState[id]=true;
  renderFuses();
  reading();
  feedback('Fusible '+id+' substituït. Revisa el muntatge abans de connectar la font.');
 };
}
$('reset').onclick=()=>{s.redNode=null;s.blackNode=null;render();feedback('Puntes desconnectades.');};
$('level').onchange=e=>kinds(e.target.value);
$('magnitude').onchange=()=>kinds($('level').value);
$('newExercise').onclick=()=>load(generate($('level').value,$('kind').value));
$('copyExercise').onclick=()=>{const code=$('exerciseCode').value;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(code).then(()=>{$('codeStatus').textContent='Codi copiat: '+code;}).catch(()=>{$('exerciseCode').focus();$('exerciseCode').select();$('codeStatus').textContent='Selecciona i copia el codi.';});}else{$('exerciseCode').focus();$('exerciseCode').select();$('codeStatus').textContent='Selecciona i copia el codi.';}};
$('recover').onclick=()=>{try{let p=fromCode($('recoverCode').value);load(generate(p.level,p.kind,p.seed));$('codeStatus').textContent='Exercici recuperat: '+ex.code;}catch(e){$('codeStatus').textContent='Error: '+e.message;}};
$('check').onclick=()=>{
 const ok=isCorrect({...s,voltage:ex.voltage,r1:ex.r1,r2:ex.r2},ex),m=reading();
 const strict=ex.strictRange&&s.range!==ex.range,missingOL=ex.requiresOverload&&!seenOverload;
 const correct=ok&&!strict&&!missingOL;
 const unit=ex.mode==='ADC'?'mA':ex.mode==='OHM'?'Ω':'V';
 const amount=ex.mode==='ADC'?m.value*1000:m.value;
 feedback(correct?'Correcte: '+fmt(amount,3)+' '+unit+'. Connexió, seguretat i escala adequades.':
  ok&&strict?'La mesura és correcta, però cal seleccionar el rang més petit vàlid.':
  ok&&missingOL?'La mesura és correcta, però falta provocar primer OL amb una escala insuficient.':
  'Encara no és correcte. '+m.status,correct?'ok':'error');
};
$('helpToggle').onclick=()=>{$('explanation').hidden=!$('explanation').hidden;};
load(ex);
