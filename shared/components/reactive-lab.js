import {generate,readCode,checkAnswer,capacitorCharge,inductorRise,seriesAC} from '../../shared/services/reactive.js';
const lab=document.querySelector('#reactive-app'),mode=document.body.dataset.lab;
const title=mode==='002'?'Components reactius en corrent continu':'Anàlisi de circuits en corrent altern';
let level=1,exercise=null,tab='laboratori',showSolution=false;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(n,d=3){return Number(n.toPrecision(d)).toLocaleString('ca-ES',{maximumFractionDigits:8});}
function schematic(q){
  if(q.connection==='parallel'){
    const paths=q.parts.map((p,i)=>{
      const x=155+i*145;
      const shape=p.type==='C'? `<path d="M${x-11} 90v40m22-40v40"/>`:
         `<path d="M${x} 89c-26 0-26 11 0 11c-26 0-26 11 0 11c-26 0-26 11 0 11c-26 0-26 11 0 11"/>`;
      return `<path class="wire" d="M${x} 55V90M${x} 130V160"/><g class="component">${shape}</g><text class="part-label" x="${x}" y="40">${escape(p.label)}</text>`;
    }).join('');
    const right=155+(q.parts.length-1)*145;
    return `<svg class="reactive-schematic" role="img" aria-label="Components connectats en paral·lel entre dos nodes" viewBox="0 0 ${right+120} 200"><path class="wire" d="M65 55H${right+35}M65 160H${right+35}"/><circle cx="65" cy="55" r="4" fill="#edbd72"/><circle cx="65" cy="160" r="4" fill="#edbd72"/>${paths}<text x="20" y="110" class="part-name">Nodes</text><text x="${(right+65)/2}" y="188" class="part-name">Connexió en paral·lel</text></svg>`;
  }
    const parts=q.parts.map((p,i)=>({ ...p,x:110+i*150 }));
  const total=parts.length*150+100;
  const y=102;
  return `<svg class="reactive-schematic" role="img" aria-label="Esquema de components connectats en ${q.connection==='parallel'?'paral·lel':'sèrie'}" viewBox="0 0 ${total} 205" preserveAspectRatio="xMidYMid meet">
    <path class="wire" d="M40 ${y}H${parts[0].x-31}"/>
    ${parts.map((p,i)=>{const x=p.x;let shape='';
      if(p.type==='R')shape=`<rect x="${x-25}" y="${y-12}" width="50" height="24" rx="2"/>`;
      else if(p.type==='C')shape=`<path d="M${x-7} ${y-29}v58m14-58v58"/>`;
      else if(p.type==='L')shape=`<path d="M${x-26} ${y}c0-29 13-29 13 0c0-29 13-29 13 0c0-29 13-29 13 0c0-29 13-29 13 0"/>`;
      else shape=`<circle cx="${x}" cy="${y}" r="27"/><path d="M${x-10} ${y}q6-16 12 0t12 0"/>`;
      return `<g class="component"><path d="M${x-30} ${y}h${p.type==='C'?23:5}M${x+(p.type==='C'?7:25)} ${y}h${p.type==='C'?23:5}"/>${shape}</g><text x="${x}" y="50" class="part-label">${escape(p.label)}</text><text x="${x}" y="166" class="part-name">${p.type==='V'?'Font':p.type==='R'?'Resistència':p.type==='C'?'Condensador':'Inductància'}</text>${i===parts.length-1?'':`<path class="wire" d="M${x+30} ${y}h90"/>`}`;
    }).join('')}
    <path class="wire" d="M${parts.at(-1).x+30} ${y}h40"/>
    ${q.connection==='parallel'?'<text class="diagram-note" x="40" y="193">Associació en paral·lel: els components comparteixen els dos nodes (representació dels components, no de la topologia).</text>':''}
    </svg>`;
}
function graph(q){
  if(!q.graph)return '';
  const g=q.graph;const pts=[];
  for(let i=0;i<=160;i++){
    const ratio=i/160;const t=ratio*5;
    const y=g.family==='RC'?1-Math.exp(-t):g.family==='RL'?1-Math.exp(-t):Math.sin(t*4*Math.PI);
    pts.push((40+ratio*620).toFixed(2)+','+(135-100*y).toFixed(2));
  }
  return `<div class="reactive-chart"><div class="reactive-plot-title">${g.family?'Resposta temporal normalitzada (model ideal)':'Senyal sinusoidal de referència (model ideal)'}</div>
    <svg viewBox="0 0 700 175" role="img" aria-label="Gràfic teòric ${g.family?'de resposta transitòria':'de senyal sinusoidal'}">
    <path class="axis" d="M40 15V135H668"/><path class="grid-line" d="M40 35H668M40 85H668M40 135H668"/><polyline class="wave" points="${pts.join(' ')}"/>
    <text x="40" y="161" class="axis-text">0</text><text x="668" y="161" text-anchor="end" class="axis-text">${g.family?'5τ':'Temps'}</text></svg>
    <p class="reactive-graph-note">La representació serveix per interpretar el comportament. No mostra una mesura experimental ni substitueix el càlcul de l'exercici.</p></div>`;
}
function home(){
 return `<section class="reactive-cover"><div class="reactive-kicker">${mode==='002'?'COMPONENTS · TRANSITORIS':'CIRCUITS · SENYALS SINUSOIDALS'}</div><h2>${escape(title)}</h2><p>${mode==='002'?'Identifica condensadors i inductàncies, calcula associacions i estudia la càrrega i els transitoris en circuits RC i RL.':'Investiga reactàncies, impedàncies, desfasament i circuits RLC en règim sinusoidal.'}</p><div class="reactive-cover-grid">
  <div><span>01</span><strong>Nivell inicial</strong><p>${mode==='002'?'Codificació, unitats i associacions bàsiques.':'Reactàncies i relació amb la freqüència.'}</p></div>
  <div><span>02</span><strong>Nivell mitjà</strong><p>${mode==='002'?'Constants de temps en circuits RC i RL.':'Impedància de circuits RC i RL en sèrie.'}</p></div>
  <div><span>03</span><strong>Nivell avançat</strong><p>${mode==='002'?'Tensió i corrent durant els transitoris.':'Circuits RLC, ressonància i desfasament.'}</p></div>
  </div><button id="enter-lab" class="primary">Començar les pràctiques</button></section>`;
}
function fundamentals(){
 return mode==='002'? `<div class="reactive-reading"><h2>Fonaments · components reactius en CC</h2>
 <h3>1. Capacitat i inductància</h3><p>Un condensador emmagatzema energia en un camp elèctric: E = ½CV². Una inductància emmagatzema energia en un camp magnètic: E = ½LI². Les unitats són el farad (F) i l'henry (H). A la pràctica són habituals µF, nF, pF, mH i µH.</p>
 <h3>2. Codificació</h3><p>En molts condensadors ceràmics el marcatge de tres dígits expressa dos dígits significatius i un multiplicador en picofarads. Per exemple, 104 equival a 100.000 pF = 100 nF. Aquest sistema no és universal: en electrolítics sovint s'indica directament la capacitat, la tensió nominal i la polaritat.</p>
 <p>Algunes inductàncies utilitzen tres dígits amb dos significatius i un multiplicador en µH: 101 equival a 100 µH. Altres components utilitzen bandes de colors, marcatges propis o la referència del fabricant. Cal saber quin sistema s'està llegint.</p>
 <h3>3. Associacions</h3><p>Els condensadors en paral·lel sumen capacitats (Ceq = C1 + C2 + …), mentre que en sèrie se sumen els inversos (1/Ceq = 1/C1 + 1/C2 + …). Per a inductàncies ideals sense acoblament magnètic és a l'inrevés: en sèrie sumen inductàncies i en paral·lel se sumen els inversos. Les bobines pròximes poden estar acoblades; aquest model inicial ho exclou.</p>
 <h3>4. Règim permanent i transitoris</h3><p>En CC estacionari, un condensador ideal és un circuit obert i una inductància ideal és un curtcircuit. Això no descriu l'instant de commutació. En un RC sèrie la constant de temps és τ = RC, i en un RL sèrie és τ = L/R. A t = τ, un procés de pujada ideal ha assolit aproximadament el 63,2 % del canvi total.</p>
 <div class="reactive-example"><strong>Exemple RC</strong><p>R = 10 kΩ i C = 100 µF: τ = 10.000 × 0,0001 = 1 s. Amb una font de 12 V, en carregar-se des de 0 V: Vc(t) = 12(1 − e^(−t/1)). A t = 1 s, Vc ≈ 7,59 V.</p></div>
 <h3>5. Components reals i seguretat</h3><p>Un condensador pot mantenir càrrega en desconnectar l'alimentació. Cal respectar la tensió màxima, la polaritat i el procediment de descàrrega. Les inductàncies tenen resistència de bobinatge, límit de corrent i possible saturació. Aquest laboratori calcula amb models ideals i no representa tensions perilloses en commutació ni avaries físiques.</p></div>`
 :`<div class="reactive-reading"><h2>Fonaments · circuits en CA</h2>
 <h3>1. Freqüència i reactància</h3><p>En un règim sinusoidal de freqüència f, una inductància ideal presenta reactància XL = 2πfL, mentre que el mòdul de la reactància capacitiva és XC = 1/(2πfC). Per tant, XL creix amb la freqüència i XC disminueix. Aquestes expressions no es poden aplicar directament a qualsevol senyal no sinusoidal sense una anàlisi de les seves components de freqüència.</p>
 <h3>2. Impedància i fase</h3><p>En un circuit RLC sèrie: Z = R + j(XL − XC). El mòdul és |Z| = √(R² + (XL − XC)²) i el corrent eficaç és I = Vrms/|Z|. L'angle φ = atan2(XL − XC, R) és positiu per un circuit inductiu i negatiu per un de capacitiu.</p>
 <h3>3. Ressonància</h3><p>En un circuit RLC sèrie ideal la freqüència de ressonància és f₀ = 1/(2π√(LC)). A aquesta freqüència XL = XC, la part reactiva de la impedància es cancel·la i |Z| = R. Amb R = 0 el model ideal pot predir corrents il·limitats, una situació no física.</p>
 <h3>4. Valors eficaços i potència</h3><p>Les tensions de les fonts dels exercicis s'expressen en volts RMS. La potència activa dissipada en la resistència és P = I²R, i el factor de potència d'un circuit sèrie ideal amb resistència és cos φ = R/|Z|. La tensió i el corrent poden estar desfasats encara que tots dos siguin sinusoidals.</p>
 <div class="reactive-example"><strong>Exemple RL</strong><p>R = 100 Ω, L = 100 mH i f = 50 Hz: XL ≈ 31,42 Ω; |Z| ≈ 104,82 Ω i φ ≈ +17,44°. El corrent queda endarrerit respecte a la tensió.</p></div>
 <h3>5. Límits del model</h3><p>Els càlculs consideren components ideals, connexions en sèrie i règim sinusoidal estacionari. No inclouen pèrdues del nucli, resistències paràsites dels components reactius, saturació magnètica ni freqüències d'autoresonància. Aquests efectes són importants en circuits reals.</p></div>`;
}
function help(){
 return `<div class="reactive-reading"><h2>Ajuda del laboratori</h2>
 <h3>1. Tria el nivell</h3><p>Selecciona Inicial, Mitjà o Avançat. Cada nivell genera problemes del bloc que estàs estudiant; pots repetir tants exercicis com vulguis sense que canviï l'enunciat fins que en generis un de nou.</p>
 <h3>2. Llegeix l'enunciat i l'esquema</h3><p>Els components apareixen dibuixats amb el valor i les unitats. En els exercicis d'associacions, l'enunciat especifica la connexió. Els dibuixos són esquemàtics i no representen els punts de connexió físics d'una placa real.</p>
 <h3>3. Calcula la resposta</h3><p>Escriu només el valor numèric en la unitat sol·licitada. S'accepta coma o punt decimal i notació científica. Per exemple, escriu 7,59 quan se't demanin volts i el teu resultat sigui aproximadament 7,59 V.</p>
 <h3>4. Comprova el resultat</h3><p>Prem «Comprovar». Un missatge verd indica una resposta correcta; un de vermell permet revisar les unitats i el càlcul. La tolerància és del 0,5 % del valor teòric o 0,005 unitats, el que sigui més gran. Aquesta tolerància correspon a la unitat que demana l'enunciat.</p>
 <h3>5. Consulta la resolució</h3><p>El botó «Mostra la resolució» revela el desenvolupament teòric. És preferible intentar l'exercici abans de consultar-la. Les gràfiques són il·lustracions de comportament ideal, no lectures instrumentals.</p>
 <h3>6. Recupera un exercici</h3><p>Copia el codi TL-RE1 generat i introdueix-lo al camp «Recuperar exercici». El codi conserva el laboratori, el nivell, el tipus de pregunta i la llavor, i permet reprendre exactament el mateix enunciat. No desa les respostes ni identifica l'alumne.</p>
 <h3>7. Relació amb altres laboratoris</h3><p>Per practicar lectures reals amb instruments, consulta LAB-006 (oscil·loscopi), LAB-007 (multímetre) i LAB-008 (generador de funcions). Aquí treballem els càlculs i la interpretació teòrica.</p></div>`;
}
function workspace(){
 const q=exercise;
 return `<div class="reactive-workspace">
  <aside class="reactive-controls"><h2>Preparació</h2><label for="reactive-level">Nivell d'exercici</label><select id="reactive-level"><option value="1" ${level===1?'selected':''}>Inicial</option><option value="2" ${level===2?'selected':''}>Mitjà</option><option value="3" ${level===3?'selected':''}>Avançat</option></select><button id="new-exercise" class="primary">Generar exercici aleatori</button>
  <label for="reactive-code">Codi recuperable</label><div class="reactive-code-row"><input id="reactive-code" readonly value="${escape(q.code)}" aria-label="Codi de l'exercici"><button id="copy-code" type="button">Copiar</button></div>
  <label for="recover-code">Recuperar exercici</label><form id="recover-form"><input id="recover-code" placeholder="TL-RE1-…" autocomplete="off" aria-label="Codi que vols recuperar" required><button type="submit">Recuperar</button></form><p id="code-message" class="reactive-small" role="status"></p></aside>
  <section class="reactive-practice"><div class="reactive-task-header"><span>EXERCICI · NIVELL ${level}</span><span>${mode==='002'?'CORRENT CONTINU':'CORRENT ALTERN'}</span></div><h2>${escape(q.title)}</h2><p class="reactive-prompt">${escape(q.statement)}</p><div class="reactive-circuit">${schematic(q)}</div>
    ${graph(q)}
    <form id="answer-form" class="reactive-answer"><label for="reactive-answer">La teva resposta <span>(${escape(q.unit)})</span></label><div class="reactive-answer-row"><input id="reactive-answer" inputmode="decimal" autocomplete="off" placeholder="Introdueix el valor" required><span class="reactive-unit">${escape(q.unit)}</span><button class="primary" type="submit">Comprovar</button></div><div id="answer-result" class="reactive-feedback" role="status" aria-live="polite" hidden></div></form>
    <button type="button" id="solution-toggle" class="reactive-solution-button" aria-expanded="${showSolution}">${showSolution?'Amaga':'Mostra'} la resolució</button>
    <div id="reactive-solution" class="reactive-solution" ${showSolution?'':'hidden'}><h3>Resolució teòrica</h3><p>${escape(q.formula)}</p><p>Resultat: <strong>${fmt(q.expected,6)} ${escape(q.unit)}</strong></p></div>
  </section></div>`;
}
function render(){
 document.title=title+' | TecLab';
 document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false');});
 if(tab==='laboratori'){lab.innerHTML=exercise?workspace():home();}
 else lab.innerHTML=tab==='fonaments'?fundamentals():help();
 const enter=lab.querySelector('#enter-lab');if(enter)enter.onclick=()=>{exercise=generate(mode,level);render();};
 const lvl=lab.querySelector('#reactive-level');if(lvl)lvl.onchange=()=>{level=Number(lvl.value);exercise=generate(mode,level);showSolution=false;render();};
 const next=lab.querySelector('#new-exercise');if(next)next.onclick=()=>{exercise=generate(mode,level);showSolution=false;render();};
 const copy=lab.querySelector('#copy-code');if(copy)copy.onclick=async()=>{try{await navigator.clipboard.writeText(exercise.code);copy.textContent='Copiat';}catch{const field=lab.querySelector('#reactive-code');field.select();lab.querySelector('#code-message').textContent='Selecciona el codi i copia’l manualment.';}};
 const recover=lab.querySelector('#recover-form');if(recover)recover.onsubmit=e=>{e.preventDefault();try{const x=readCode(lab.querySelector('#recover-code').value);if(x.mode!==mode)throw new Error('Aquest codi correspon a l’altre laboratori.');level=x.level;exercise=generate(x.mode,x.level,x.seed,x.kind);showSolution=false;render();}catch(err){lab.querySelector('#code-message').textContent=err.message;}};
 const answer=lab.querySelector('#answer-form');if(answer)answer.onsubmit=e=>{e.preventDefault();const r=checkAnswer(lab.querySelector('#reactive-answer').value,exercise.expected);const feedback=lab.querySelector('#answer-result');feedback.hidden=false;feedback.className='reactive-feedback '+(r.ok?'correct':'incorrect');feedback.textContent=(r.ok?'✓ ':'✕ ')+r.message;};
 const toggle=lab.querySelector('#solution-toggle');if(toggle)toggle.onclick=()=>{showSolution=!showSolution;toggle.textContent=(showSolution?'Amaga':'Mostra')+' la resolució';toggle.setAttribute('aria-expanded',String(showSolution));lab.querySelector('#reactive-solution').hidden=!showSolution;};
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;render();}));
render();
