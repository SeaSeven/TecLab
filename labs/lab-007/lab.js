import {measure,ranges,isCorrect} from './meter.js';
import {generate,fromCode,levelKinds} from './exercises.js';
const $=id=>document.getElementById(id);
const fmt=(n,d=2)=>Number(n).toLocaleString('ca-ES',{maximumFractionDigits:d});
let ex=generate('inicial','R2',12345);
let s={range:'VDC20',redJack:'VΩ',blackJack:'COM',redNode:null,blackNode:null,probe:'red',view:'schema'};
const points=[['A',75,44],['B',405,44],['C',405,246]];
function markings(){
 return points.map(([id,x,y])=>['red','black'].filter(p=>s[p+'Node']===id).map((p,i)=>{
 const color=p==='red'?'#ff6666':'#101820',dx=p==='red'?-19:19;
 return '<path d="M'+x+' '+y+'l'+dx+' -28" stroke="'+color+'" stroke-width="5"/><circle cx="'+(x+dx)+'" cy="'+(y-28)+'" r="6" fill="'+color+'" stroke="white"/>';
 }).join('')+'<g class="node" data-node="'+id+'" role="button" tabindex="0" aria-label="Connectar al node '+id+'"><circle cx="'+x+'" cy="'+y+'" r="11"/><text x="'+(x+16)+'" y="'+(y+5)+'">'+id+'</text></g>').join('');
}
function circuit(){
 const labels='<g fill="#eaf2f5" font-size="16"><text x="88" y="139">'+fmt(ex.voltage)+' V</text><text x="203" y="21">R1 '+fmt(ex.r1,0)+' Ω</text><text x="304" y="187">R2 '+fmt(ex.r2,0)+' Ω</text></g>';
 const schema='<path class="wire" d="M75 44H220M264 44H405V164M405 208V246H75V167M75 104V44"/><path d="M75 104v18m-15 0h30m-24 12h18m-9 0v33" stroke="#e4ca84" stroke-width="4" fill="none"/><rect class="resistor" x="220" y="30" width="44" height="28" rx="3"/><rect class="resistor" x="390" y="164" width="30" height="44" rx="3"/>';
 const holes=Array.from({length:7},(_,i)=>Array.from({length:5},(_,j)=>'<circle cx="'+(207+j*52)+'" cy="'+(34+i*36)+'" r="4" fill="#89979a"/>').join('')).join('');
 const physical='<rect x="180" y="15" width="278" height="266" rx="14" fill="#eee6d0" stroke="#b8ab89" stroke-width="4"/>'+holes+
 '<rect x="12" y="98" width="136" height="100" rx="11" fill="#475963" stroke="#adc4cc" stroke-width="3"/><text x="30" y="122" fill="#eecb86">FONT CC</text><text x="29" y="155" fill="white" font-size="24">'+fmt(ex.voltage)+' V</text>'+
 '<circle cx="53" cy="178" r="7" fill="#fa5c5c"/><circle cx="111" cy="178" r="7" fill="#111"/>'+
 '<path d="M53 178C53 17 170 44 220 44M264 44H405M111 178C111 270 206 246 405 246" fill="none" stroke="#ed5858" stroke-width="5"/><path d="M405 44V164M405 208V246" stroke="#455a60" stroke-width="5" fill="none"/>'+
 '<rect x="220" y="32" width="44" height="24" rx="9" fill="#e8c18c" stroke="#795b40"/><rect x="392" y="164" width="26" height="44" rx="9" fill="#e8c18c" stroke="#795b40"/>';
 return '<svg viewBox="0 0 500 300" role="group" aria-label="Circuit divisor de tensió">'+(s.view==='schema'?schema:physical)+labels+markings()+'</svg>';
}
function dial(){
 const start=-145,span=290,n=ranges.length;
 return '<div class="dial-surface">'+ranges.map((r,i)=>{
 const angle=(start+i*span/(n-1))*Math.PI/180,x=50+Math.sin(angle)*39,y=50-Math.cos(angle)*39;
 return '<button type="button" data-range="'+r.id+'" aria-pressed="'+(s.range===r.id)+'" title="'+r.id+'" class="dial-choice '+(s.range===r.id?'chosen':'')+'" style="left:'+x+'%;top:'+y+'%">'+r.label+'</button>';
 }).join('')+'<div class="dial-body" style="--turn:'+(start+ranges.findIndex(r=>r.id===s.range)*span/(n-1))+'deg"><span class="dial-arrow"></span></div><span class="dial-caption">SELECTOR</span></div>';
}
function feedback(message,type=''){const el=$('feedback');el.textContent=message;el.className='feedback '+(type?'feedback-'+type:'');}
function reading(){const m=measure({...s,voltage:ex.voltage,r1:ex.r1,r2:ex.r2});$('reading').textContent=m.display;$('unit').textContent=m.unit;return m;}
function render(){
 $('circuit').innerHTML=circuit();$('rotary').innerHTML=dial();
 $('circuit').querySelectorAll('[data-node]').forEach(el=>{
 const connect=()=>{s[s.probe+'Node']=el.dataset.node;render();feedback(reading().status);};
 el.onclick=connect;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();connect();}};
 });
 $('rotary').querySelectorAll('[data-range]').forEach(el=>{
 el.onclick=()=>{s.range=el.dataset.range;render();feedback(reading().status);};
 el.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();let i=ranges.findIndex(r=>r.id===s.range);s.range=ranges[(i+(e.key==='ArrowRight'?1:-1)+ranges.length)%ranges.length].id;render();$('rotary').querySelector('[data-range="'+s.range+'"]').focus();}};
 });
 $('redNode').textContent=s.redNode||'sense connectar';$('blackNode').textContent=s.blackNode||'sense connectar';
 ['red','black'].forEach(p=>$(p+'Probe').classList.toggle('selected',p===s.probe));
 ['schema','physical'].forEach(v=>$(v).classList.toggle('active',v===s.view));
 $('circuitInfo').textContent='Font '+fmt(ex.voltage)+' V CC · R1 '+fmt(ex.r1,0)+' Ω · R2 '+fmt(ex.r2,0)+' Ω.';
 reading();
}
function kinds(level,selected){$('kind').innerHTML=levelKinds[level].map(([k,t])=>'<option value="'+k+'">'+t+'</option>').join('');if(selected)$('kind').value=selected;}
function load(v){
 ex=v;s.redNode=null;s.blackNode=null;s.range='VDC20';s.redJack='VΩ';s.blackJack='COM';$('redJack').value='VΩ';$('blackJack').value='COM';
 $('level').value=v.level;kinds(v.level,v.kind);$('exerciseCode').value=v.code;
 $('task').textContent=v.text+' Connecta la punta vermella al node '+v.red+' i la negra al node '+v.black+'.';
 $('explanation').innerHTML='<h3>Resolució guiada</h3><p>Intensitat del divisor: I = U/(R1+R2) = '+fmt(v.voltage/(v.r1+v.r2)*1000,3)+' mA.</p><p>Potencials: A = '+fmt(v.voltage,3)+' V, B = '+fmt(v.voltage*v.r2/(v.r1+v.r2),3)+' V i C = 0 V. Lectura: V('+v.red+') − V('+v.black+') = '+fmt(v.expected,3)+' V. Rang mínim apropiat: '+ranges.find(r=>r.id===v.range).label+' V⎓.</p>';
 $('explanation').hidden=true;$('codeStatus').textContent='Codi reproduïble: '+v.code;render();feedback('Configura el multímetre i connecta les puntes.');
}
function illustration(type){
 if(type==='series')return '<svg class="edu-figure" viewBox="0 0 420 170" role="img" aria-label="Amperímetre connectat en sèrie"><path d="M45 85V22H160M210 22H372V145H45V85" fill="none" stroke="#d5e2e8" stroke-width="4"/><circle cx="185" cy="22" r="25" fill="#354c58" stroke="#f4c66b" stroke-width="3"/><text x="185" y="30" text-anchor="middle" fill="white" font-size="23">A</text><rect x="358" y="84" width="28" height="36" fill="#e2b774"/></svg>';
 if(type==='range')return '<svg class="edu-figure" viewBox="0 0 420 170" role="img" aria-label="Rang de 2 volts amb sobrecàrrega i rang de 20 volts amb lectura de 8 volts"><rect x="18" y="20" width="180" height="124" rx="12" fill="#42565c"/><rect x="222" y="20" width="180" height="124" rx="12" fill="#42565c"/><rect x="31" y="35" width="152" height="73" fill="#b0d7bf"/><rect x="236" y="35" width="152" height="73" fill="#b0d7bf"/><g fill="#172a24" font-size="34" text-anchor="middle"><text x="107" y="83">OL</text><text x="310" y="83">8.00</text></g><g fill="white" text-anchor="middle"><text x="107" y="130">2 V ⎓</text><text x="310" y="130">20 V ⎓</text></g></svg>';
 return '<svg class="edu-figure" viewBox="0 0 420 170" role="img" aria-label="Voltímetre en paral·lel amb la resistència"><path d="M42 100V24H226V77M226 111V145H42V100M226 77H340V110H226" fill="none" stroke="#d5e2e8" stroke-width="4"/><rect x="213" y="77" width="26" height="34" fill="#e2b774"/><circle cx="340" cy="94" r="24" fill="#344b58" stroke="#f5c573" stroke-width="3"/><text x="340" y="102" text-anchor="middle" fill="white" font-size="22">V</text><text x="245" y="79" fill="white">R2</text></svg>';
}
const theory=[
 ['1. Què mesura el multímetre?','Un multímetre permet mesurar tensió, intensitat i resistència, segons la funció seleccionada. El voltímetre calcula la diferència de potencial entre les dues puntes. En corrent continu, invertir-les canvia el signe de la lectura.','parallel'],
 ['2. Connexió del voltímetre','Per mesurar tensió es connecta l’instrument en paral·lel entre els dos punts. El cable negre ha d’estar a COM i el vermell a VΩ. El circuit no s’interromp. Si els dos punts tenen el mateix potencial, la lectura és zero.','parallel'],
 ['3. Escales manuals','El selector circular ofereix escales de tensió contínua de 200 mV, 2 V, 20 V, 200 V i 600 V. Per a una tensió de 8 V, l’escala de 2 V mostra OL perquè és insuficient; la de 20 V és adequada. Si es desconeix el valor, es comença amb una escala alta.','range'],
 ['4. Com es mesura la intensitat?','L’amperímetre s’insereix en sèrie, obrint abans el circuit amb l’alimentació desconnectada. No s’ha de connectar una entrada d’intensitat directament en paral·lel amb una font perquè pot provocar un curtcircuit. Aquesta inserció encara no està simulada.','series'],
 ['5. Resistència i continuïtat','Cal desconnectar la font i comprovar l’absència de tensió abans de mesurar una resistència. Sovint convé aïllar el component per evitar lectures alterades per camins en paral·lel. Les funcions de resistència i continuïtat queden preparades per a una ampliació posterior.','range'],
 ['6. Divisor de tensió','En dues resistències en sèrie circula el mateix corrent. La intensitat ideal és I=U/(R1+R2). Les caigudes de tensió són U1=I·R1 i U2=I·R2. La suma de totes dues és igual a la tensió de la font.','parallel']
];
const help=[
 ['1. Preparar l’exercici','Selecciona un nivell i un tipus. Cada nivell té activitats específiques i una opció aleatòria. Prem Nou exercici per generar nous valors de font i resistències.','range'],
 ['2. Alternar les dues representacions','Els botons Esquema elèctric i Muntatge físic canvien la vista del mateix circuit. Els nodes A, B i C corresponen als mateixos punts; les puntes conserven les connexions quan canvies de vista.','parallel'],
 ['3. Fer servir el selector','Fes clic sobre un valor del dial o utilitza les fletxes del teclat per moure la selecció. V⎓ és tensió contínua, V~ alterna, Ω resistència i mA intensitat. Si apareix OL, cal augmentar el rang.','range'],
 ['4. Connectar les puntes','Tria Punta vermella o Punta negra i després un punt blau del circuit. Pots canviar cada punta de node tantes vegades com vulguis. Per mesurar tensió, verifica COM al cable negre i VΩ al vermell.','parallel'],
 ['5. Comprovació i explicació','Prem Comprova la mesura. La resposta correcta es mostra en verd, i una mesura incorrecta en vermell amb una explicació que roman visible. Pots obrir Mostra l’explicació per veure els càlculs i els potencials.','range'],
 ['6. Recuperar pràctiques','El codi TL-MM1 permet reproduir exactament el mateix exercici, inclosos els valors aleatoris. Copia’l al camp Recuperar codi i prem Recuperar. Aquest codi no conté dades d’alumnes.','parallel']
];
function lessons(id,title,lead,items){$(id).innerHTML='<h2>'+title+'</h2><p class="intro">'+lead+'</p><div class="lesson-grid">'+items.map(([t,b,fig])=>'<article class="panel"><h3>'+t+'</h3>'+illustration(fig)+'<p>'+b+'</p></article>').join('')+'</div>';}
lessons('tab-fonaments','Fonaments de mesura','Explicacions i esquemes per comprendre les connexions, els rangs i els resultats.',theory);
lessons('tab-ajuda','Ajuda del laboratori','Guia pràctica amb exemples gràfics de cada operació.',help);
document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{['laboratori','fonaments','ajuda'].forEach(k=>{$('tab-'+k).hidden=k!==b.dataset.section;document.querySelector('[data-section="'+k+'"]').classList.toggle('active',k===b.dataset.section);});});
['schema','physical'].forEach(v=>$(v).onclick=()=>{s.view=v;render();});
['red','black'].forEach(v=>$(v+'Probe').onclick=()=>{s.probe=v;render();});
['redJack','blackJack'].forEach(v=>$(v).onchange=e=>{s[v]=e.target.value;render();feedback(reading().status);});
$('reset').onclick=()=>{s.redNode=null;s.blackNode=null;render();feedback('Puntes desconnectades.');};
$('level').onchange=e=>kinds(e.target.value);
$('newExercise').onclick=()=>load(generate($('level').value,$('kind').value));
$('recover').onclick=()=>{try{let p=fromCode($('recoverCode').value);load(generate(p.level,p.kind,p.seed));$('codeStatus').textContent='Exercici recuperat: '+ex.code;}catch(e){$('codeStatus').textContent='Error: '+e.message;}};
$('check').onclick=()=>{const ok=isCorrect({...s,voltage:ex.voltage,r1:ex.r1,r2:ex.r2},ex),m=reading(),strict=ex.strictRange&&s.range!==ex.range;
 feedback(ok&&!strict?'Correcte: has mesurat '+fmt(m.value,3)+' V entre '+ex.red+' i '+ex.black+' amb connexions i rang adequats.':ok&&strict?'Els nodes són correctes, però l’exercici demana el rang més petit possible. Selecciona '+ranges.find(r=>r.id===ex.range).label+' V⎓.':'Mesura incorrecta. Comprova V⎓, COM i VΩ, les puntes '+ex.red+' (vermella) i '+ex.black+' (negra) i un rang sense OL. '+m.status,ok&&!strict?'ok':'error');
};
$('helpToggle').onclick=()=>{$('explanation').hidden=!$('explanation').hidden;};
load(ex);
