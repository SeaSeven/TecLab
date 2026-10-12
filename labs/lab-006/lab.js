import {volts,times,state,path,generate,readCode,checkReading,types,triggerState,advancedAnswer,triggerOffset,cursorReadings,channelFits,voltage,signalLimits,defaultTrigger,dutyCycle,faultLabel,readingVpp,signalBounds,exerciseMode} from './signal.js';
import {randomSeed} from '../../shared/services/exercises.js';
const href=s=>'#lab-006'+(s?'/'+s:'');
const format=x=>Number(x.toPrecision(4)).toLocaleString('ca-ES');
const tlabel=t=>t<.001?format(t*1e6)+' µs/div':format(t*1e3)+' ms/div';
let vi=3,v2i=3,ti=3,triggerLevel=0,pos1=0,pos2=0,shown=0,exercise=null,selectedMode='A',coupling='DC';
let cursors={x1:150,x2:300,y1:110,y2:210},cursorsOn=false;
const exerciseLevels={
 inicial:[['A','Ona aleatòria'],['S','Sinusoidal'],['T','Triangular'],['Q','Quadrada']],
 aplicat:[['L','Exercici aleatori'],['R','Dent de serra'],['P','Polsos PWM · cicle de treball variable'],['H','Sinusoide rectificada · unipolar'],['W','Mesurar el cicle de treball PWM'],['C','Acoblament AC/DC i component contínua'],['F','Diagnosi de formes d’ona']],
 intermedi:[['J','Exercici aleatori'],['I','Sincronització amb trigger'],['M','Mesures amb cursors']],
 avancat:[['K','Exercici aleatori'],['D','Dos canals · desfasament'],['N','Dos canals · amplitud i fase']]
};
const levelOf=mode=>['R','P','H','W','C','F','L'].includes(mode)?'aplicat':['I','M','J'].includes(mode)?'intermedi':['D','N','K'].includes(mode)?'avancat':'inicial';
const levelOptions=level=>exerciseLevels[level].map(([mode,label])=>'<option value="'+mode+'">'+label+'</option>').join('');

function explanatoryFigure(ex,kind){
 const cx=30,cy=80,w=420,h=160,period=140;
 const grid=Array.from({length:13},(_,i)=>'<path d="M'+(cx+i*35)+' 10v140" stroke="#355866" stroke-width=".7"/>').join('')+
 Array.from({length:5},(_,i)=>'<path d="M30 '+(10+i*35)+'h420" stroke="#355866" stroke-width=".7"/>').join('');
 const sample=(phase=0,amp=38)=>Array.from({length:421},(_,i)=>{
 const p=(((i/period-phase)%1)+1)%1;
 const val=voltage({...ex,amplitude:1,frequency:1},p);
 return (i?'L':'M')+(cx+i)+' '+(cy-val*amp);
 }).join(' ');
 let marks='';
 if(kind==='vertical')marks='<line x1="458" y1="42" x2="458" y2="118" stroke="#f3bd7c" stroke-width="2"/><text x="392" y="25" fill="#f3bd7c" font-size="12">Vpp</text>';
 if(kind==='horizontal'||kind==='period')marks='<line x1="30" y1="137" x2="170" y2="137" stroke="#f3bd7c" stroke-width="2"/><path d="M30 130v14m140-14v14" stroke="#f3bd7c" stroke-width="2"/><text x="96" y="130" fill="#f3bd7c" font-size="12">T</text>';
 if(kind==='trigger')marks='<line x1="30" y1="55" x2="450" y2="55" stroke="#f79c80" stroke-dasharray="7 5" stroke-width="2"/><text x="345" y="49" fill="#f79c80" font-size="12">TRIGGER</text>';
 if(kind==='cursors')marks='<line x1="100" y1="10" x2="100" y2="150" stroke="#b2ecfc" stroke-dasharray="5 4"/><line x1="240" y1="10" x2="240" y2="150" stroke="#b2ecfc" stroke-dasharray="5 4"/><text x="154" y="25" fill="#b2ecfc" font-size="12">Δt</text>';
 const second=(kind==='channels'&&ex.channel2)?'<path d="'+sample((ex.channel2.phase||0)/360,27)+'" stroke="#72d9eb" stroke-width="2" fill="none"/>':'';
 if(kind==='channels')marks='<text x="330" y="25" fill="#f1d152" font-size="12">CH1</text><text x="385" y="25" fill="#72d9eb" font-size="12">CH2</text>';
 return '<svg class="osc-figure" viewBox="0 0 480 170" role="img" aria-label="Esquema de '+({vertical:'tensió pic a pic',horizontal:'període',period:'període',trigger:'nivell de trigger',cursors:'cursors de temps',channels:'dos canals',shape:'forma del senyal'}[kind]||'mesura')+'"><rect width="480" height="170" rx="9" fill="#091e26"/>'+grid+'<path d="'+sample()+'" stroke="#f1d152" stroke-width="2" fill="none"/>'+second+marks+'</svg>';
}
function foundations(){
 return `<a class="back" href="${href('practica')}">← Tornar a la pràctica</a><p class="eyebrow">LAB-006 / FONAMENTS</p><h1>Fonaments de l’oscil·loscopi</h1>
 <p class="intro">L’oscil·loscopi representa tensió a l’eix vertical i temps a l’horitzontal. Cada divisió de la retícula equival a una escala ajustable.</p>
 <div class="osc-theory">
 <section class="panel"><h2>1. Forma d’ona i amplitud</h2><div class="osc-wave-examples"><div><h3>Sinusoidal</h3>${explanatoryFigure({type:'S'},'shape')}</div><div><h3>Triangular</h3>${explanatoryFigure({type:'T'},'shape')}</div><div><h3>Quadrada</h3>${explanatoryFigure({type:'Q'},'shape')}</div></div><p>Una sinusoide varia suaument. La triangular puja i baixa linealment, sense salts; la quadrada alterna entre dos nivells. La tensió pic a pic és la diferència entre el valor màxim i el mínim: Vpp = Vmax − Vmin. En senyals simètrics centrats a zero, Vpp = 2 · amplitud.</p></section>
 <section class="panel"><h2>2. VOLTS/DIV</h2>${explanatoryFigure({type:'S'},'vertical')}<p>La distància vertical en divisions multiplicada per VOLTS/DIV dona la diferència de tensió. Exemple: 4 divisions a 0,5 V/div corresponen a 2 V. Si la traça queda tallada, cal augmentar VOLTS/DIV o ajustar-ne la posició vertical.</p></section>
 <section class="panel"><h2>3. TIME/DIV, període i freqüència</h2>${explanatoryFigure({type:'S'},'period')}<p>El temps entre dos punts equivalents consecutius és el període: T = divisions horitzontals · TIME/DIV. La freqüència és f = 1/T, amb T expressat en segons. Un període de 2 ms correspon a 500 Hz.</p></section>
 <section class="panel"><h2>4. Trigger: estabilització de la traça</h2>${explanatoryFigure({type:'S'},'trigger')}<p>El nivell de trigger marca la tensió on l’equip comença la captura en detectar un creuament en un sentit determinat. En aquesta simulació es fa servir el flanc ascendent de CH1. Si el nivell queda fora del rang del senyal, no hi ha cap creuament vàlid i la traça perd la sincronització.</p></section>
 <section class="panel"><h2>5. Cursors de mesura</h2>${explanatoryFigure({type:'S'},'cursors')}<p>Els dos cursors verticals mesuren un interval de temps Δt; els dos horitzontals, una diferència de tensió ΔV. Per mesurar el període, situa els verticals en dos màxims consecutius. Per mesurar Vpp, situa els horitzontals en un màxim i un mínim de CH1.</p></section>
 <section class="panel"><h2>6. Dos canals i desfasament</h2>${explanatoryFigure({type:'S',channel2:{phase:90}},'channels')}<p>CH1 i CH2 comparteixen TIME/DIV, però cadascun té VOLTS/DIV i posició vertical independents. El desfasament es calcula amb φ = (Δt/T) · 360°. Un retard de 0,5 ms en un senyal de període 2 ms representa 90°. Desplaçar verticalment un canal ajuda a separar les traces, però no altera el retard temporal.</p></section>
 </div><p><a href="${href('practica')}">Tornar a l’oscil·loscopi →</a></p>`;
}
function helpPage(){
 const example={type:'S',amplitude:2,frequency:500};
 return `<a class="back" href="${href('practica')}">← Tornar a la pràctica</a>
 <p class="eyebrow">LAB-006 / GUIA D'ÚS</p><h1>Ajuda de l’oscil·loscopi</h1>
 <p class="intro">Segueix aquesta guia per preparar un exercici, ajustar l’instrument, interpretar les lectures, diagnosticar anomalies i recuperar una pràctica anterior. Cada control té un efecte directe sobre la pantalla.</p>
 <div class="osc-help-grid">
 <section class="panel"><h2>1. Escull l’activitat</h2>${explanatoryFigure(example,'shape')}<p>Al menú <strong>Nivell</strong> pots escollir Inicial, Intermedi, Avançat o Aplicacions reals. El segon desplegable mostra només els exercicis d’aquell grup. Prem <strong>Nou exercici</strong> per generar-ne un altre.</p><p>El generador fixa la forma d'ona i les magnituds de l’exercici. Aquests valors no es modifiquen quan gires els comandaments.</p></section>
 <section class="panel"><h2>2. Ajusta VOLTS/DIV</h2>${explanatoryFigure(example,'vertical')}<p>Comença comprovant que els màxims i mínims es vegin dins la retícula. Amb una escala massa petita, l'ona surt de la pantalla. Augmenta VOLTS/DIV per reduir-ne l’alçada visual.</p><p>Exemple: 4 divisions verticals a 1 V/div indiquen 4 V de diferència. La <strong>posició vertical</strong> desplaça la traça, però no modifica la tensió real.</p></section>
 <section class="panel"><h2>3. Ajusta TIME/DIV</h2>${explanatoryFigure(example,'period')}<p>Canvia la base de temps fins a veure entre dos i quatre períodes. Una divisió representa el temps indicat a TIME/DIV. Per obtenir el període, multiplica les divisions d’un cicle per aquest valor.</p><p>Si T és 2 ms, la freqüència és 1/0,002 = 500 Hz.</p></section>
 <section class="panel"><h2>4. Estabilitza amb el trigger</h2>${explanatoryFigure(example,'trigger')}<p>La línia horitzontal de color salmó indica el nivell de trigger de CH1. Ajusta aquest nivell perquè l’ona el creui en sentit ascendent. Si queda fora del rang de la tensió, no s’obté un dispar vàlid.</p><p>Quan l’indicador mostra <strong>TRIG</strong>, l’inici de la traça està alineat amb aquest creuament. En absència de dispar, la simulació indica <strong>AUTO</strong> i representa la manca de sincronització.</p></section>
 <section class="panel"><h2>5. Mesura amb cursors</h2>${explanatoryFigure(example,'cursors')}<p>Activa <strong>Cursors de mesura</strong>. X1 i X2 són línies verticals per llegir un interval temporal Δt; Y1 i Y2 són línies horitzontals per llegir ΔV de CH1.</p><p>Col·loca X1 i X2 a dos màxims consecutius per mesurar el període, o Y1 i Y2 als extrems del senyal per obtenir Vpp. Els cursors no canvien el senyal.</p></section>
 <section class="panel"><h2>6. Dos canals</h2>${explanatoryFigure({...example,channel2:{phase:90}},'channels')}<p>CH1 apareix en groc i CH2 en blau. Cada canal té el seu VOLTS/DIV i la seva posició vertical, però comparteixen TIME/DIV. Si les ones se superposen, separa-les amb els controls de posició.</p><p>Mesura el retard Δt entre punts equivalents; el desfasament és φ = 360° · Δt/T.</p></section>
 <section class="panel"><h2>7. Ones periòdiques no bàsiques</h2><div class="osc-wave-examples"><div><h3>Dent de serra</h3>${explanatoryFigure({type:'R'},'shape')}</div><div><h3>Polsos PWM</h3>${explanatoryFigure({type:'P',duty:30},'shape')}</div><div><h3>Rectificada</h3>${explanatoryFigure({type:'H'},'shape')}</div></div><p>La dent de serra puja linealment i es reinicia bruscament. Els polsos PWM alternen entre dos nivells: el cicle de treball és el percentatge de temps en nivell alt. La sinusoide rectificada és unipolar, de manera que Vpp coincideix amb el seu màxim.</p><p>Els salts verticals de la dent de serra i del PWM <strong>sí que formen part del senyal</strong>; no s’han de confondre amb un defecte de dibuix.</p></section>
 <section class="panel"><h2>8. Mesura del cicle de treball (PWM)</h2>${explanatoryFigure({type:'P',duty:30},'cursors')}<p>El cicle de treball indica quina part del període el pols es manté en nivell alt: D = (T<sub>ON</sub> / T) · 100 %. Ajusta els cursors per mesurar primer el període i després l’amplada del pols alt.</p><p>Exemple: si el pols dura 0,6 ms dins un període de 2 ms, D = 30 %. El PWM és habitual en controls de potència, variadors i regulació de velocitat.</p></section>
 <section class="panel"><h2>9. Acoblament AC / DC / GND</h2>${explanatoryFigure({type:'S',offset:2},'vertical')}<p><strong>DC</strong> mostra la tensió total: part alterna més component contínua. <strong>AC</strong> elimina la tensió mitjana, i centra la part variable a zero en aquest model. <strong>GND</strong> mostra la referència de zero volts; no equival a deixar el senyal sense connexió.</p><p>Exemple: una ona de ±1 V superposada a 2 V de contínua es veu entre 1 V i 3 V en DC; en AC es veu entre −1 V i +1 V. L’acoblament no canvia el senyal generat, només la visualització del canal.</p></section>
 <section class="panel"><h2>10. Diagnosi de senyals</h2><div class="osc-wave-examples"><div><h3>Retallament</h3>${explanatoryFigure({type:'S',fault:'clipping'},'shape')}</div><div><h3>Ondulació</h3>${explanatoryFigure({type:'S',fault:'ripple'},'shape')}</div><div><h3>Soroll</h3>${explanatoryFigure({type:'S',fault:'noise'},'shape')}</div></div><p><strong>Retallament:</strong> els màxims apareixen aplanats perquè una etapa limita el senyal. <strong>Ondulació:</strong> una oscil·lació addicional regular es superposa a l’ona principal. <strong>Soroll:</strong> hi apareixen components més ràpids que dificulten les lectures.</p><p>Aquestes situacions són models didàctics; no pretenen reproduir tots els comportaments d’un oscil·loscopi físic.</p></section>
 <section class="panel"><h2>11. Comprovacions i codi d’exercici</h2><p>Prem <strong>Comprovar visualització</strong> per saber si l’escala i la sincronització són adequades. El resultat apareix just al costat del botó en un panell ampli. Si cal corregir alguna cosa, s’indica el control responsable.</p><p>Introdueix Vpp, el període i, si escau, el desfasament. <strong>Comprovar lectures</strong> valida cada resposta per separat.</p><p>Per tornar al mateix exercici, copia’n el codi o l’enllaç. Quan el recuperis, el generador reconstruirà els mateixos valors, sense emmagatzemar dades personals.</p></section>
 </div><p><a href="${href('practica')}">Tornar a l’instrument →</a></p>`;
}
function steps(ex){
 const initial=[
 ['Identifica el senyal','La forma d’ona és '+types[ex.type].toLowerCase()+(ex.type==='P'?' amb un cicle de treball del '+ex.duty+' %.':'')+'. Cerca màxims, mínims i períodes complets.'],
 ['Escala vertical','En DC, els extrems de CH1 són '+format(signalBounds(ex).min)+' V i '+format(signalBounds(ex).max)+' V. Ajusta VOLTS/DIV i la posició vertical per mostrar tots dos extrems.'],
 ['Escala horitzontal','El període és '+format(1000/ex.frequency)+' ms; ajusta TIME/DIV per mostrar entre dos i quatre períodes.'],
 ['Mesures amb cursors','Activa els cursors i col·loca X1 i X2 a dos punts equivalents per llegir Δt. Situa Y1 i Y2 als pics per llegir ΔV de CH1.'],
 ['Comprovació','Vpp de CH1 = '+format(readingVpp(ex))+' V; T = '+format(1000/ex.frequency)+' ms; f = '+format(ex.frequency)+' Hz.']
 ];
 if(exerciseMode(ex)==='W')initial.push(['Cicle de treball','El temps en nivell alt és '+format(ex.duty)+' % de cada període. Duty = Ton/T · 100.']);
 if(exerciseMode(ex)==='C')initial.push(['Acoblament AC/DC','El senyal té una component contínua de '+format(ex.offset)+' V. DC la conserva; AC resta la mitjana. GND mostra la línia de referència a zero.']);
 if(exerciseMode(ex)==='F')initial.push(['Diagnosi','La forma d’ona presenta '+faultLabel(ex.fault).toLowerCase()+'. Observa si els pics són plans, hi ha una oscil·lació regular o hi ha components ràpids superposats.']);
 if(exerciseMode(ex)==='I')initial.splice(1,0,['Sincronitza el trigger','La línia horitzontal indica el nivell del trigger. Mou-la dins de l’interval de ±'+format(ex.amplitude)+' V, on hi ha un creuament ascendent.']);
 if(ex.channel2)initial.push(['Dos canals','CH2 té un desfasament de '+ex.channel2.phase+'°. Separa les traces amb POSITION i mesura Δt = '+format(advancedAnswer(ex).delayMs)+' ms.']);
 return initial.map(([title,description],i)=>({title,description,kind:/trigger/i.test(title)?'trigger':/dos canals/i.test(title)?'channels':/cursor/i.test(title)?'cursors':/vertical/i.test(title)?'vertical':/horitzontal/i.test(title)?'horizontal':/comprovació/i.test(title)?'period':'shape'}));
}
export function scopeFigure(){return '<svg class="osc-cover-art" viewBox="0 0 450 210" role="img" aria-label="Ona sinusoidal a la pantalla de l’oscil·loscopi"><rect width="450" height="210" rx="16" fill="#26343d"/><rect x="18" y="16" width="414" height="178" rx="7" fill="#071e27"/>'+Array.from({length:11},(_,i)=>'<path d="M'+(18+i*41.4)+' 16v178" stroke="#355866" stroke-width=".8"/>').join('')+Array.from({length:9},(_,i)=>'<path d="M18 '+(16+i*22.25)+'h414" stroke="#355866" stroke-width=".8"/>').join('')+'<path d="'+Array.from({length:415},(_,i)=>(i?'L':'M')+(18+i)+' '+(105-48*Math.sin(i*Math.PI/103.5))).join(' ')+'" fill="none" stroke="#f5d34f" stroke-width="2.5"/></svg>';}
function screen(dual=false){return '<svg class="osc-screen" viewBox="0 0 600 320" role="img" aria-label="Deu divisions horitzontals i vuit verticals"><defs><clipPath id="osc-window"><rect width="600" height="320"/></clipPath></defs>'+Array.from({length:11},(_,i)=>'<path class="osc-grid" d="M'+i*60+' 0v320"/>').join('')+Array.from({length:9},(_,i)=>'<path class="osc-grid" d="M0 '+i*40+'h600"/>').join('')+'<path d="M300 0v320M0 160h600" stroke="#6b9caa" stroke-dasharray="4 4" fill="none"/><g clip-path="url(#osc-window)"><path class="osc-wave" id="osc-wave"/>'+(dual?'<path class="osc-wave osc-wave2" id="osc-wave2"/>':'')+'</g><g id="osc-cursor-overlay" hidden><line id="osc-line-x1" y1="0" y2="320" class="osc-cursor"/><line id="osc-line-x2" y1="0" y2="320" class="osc-cursor"/><line id="osc-line-y1" x1="0" x2="600" class="osc-cursor osc-cursor-h"/><line id="osc-line-y2" x1="0" x2="600" class="osc-cursor osc-cursor-h"/></g><line id="osc-trigger-line" x1="0" x2="600" stroke="#ef947b" stroke-width="1.5" stroke-dasharray="7 5"/><rect x="0" y="0" width="280" height="27" fill="#12323a"/><text id="osc-display" x="9" y="19" fill="#bce6e3" font-size="14" font-family="monospace"/></svg>';}
function practice(root){
 if(!exercise)exercise=generate('A',randomSeed());
 const ex=exercise;
 root.innerHTML=`<a class="back" href="#">← Catàleg</a>
 <p class="eyebrow">LAB-006 / PRÀCTICA</p><h1>Mesures amb oscil·loscopi</h1>
 <nav class="tabs" aria-label="Apartats"><a href="${href('practica')}" class="active">Laboratori</a><a href="${href('fonaments')}">Fonaments</a><a href="${href('ajuda')}">Ajuda</a></nav>
 <section class="panel osc-manager"><h2>Gestió de l’exercici</h2>
 <div class="osc-actions osc-generation"><label for="osc-level">Nivell<select id="osc-level"><option value="inicial">Inicial</option><option value="intermedi">Intermedi</option><option value="avancat">Avançat</option><option value="aplicat">Aplicacions reals</option></select></label><label for="osc-type">Tipus d’exercici<select id="osc-type"></select></label><button class="primary" type="button" id="osc-new">Nou exercici</button></div>
 <div class="osc-code-grid"><div><label for="osc-current">Codi de l’exercici</label><div class="osc-code-row"><input id="osc-current" readonly value="${ex.code}"><button id="osc-copy" type="button">Copiar codi</button><button id="osc-link" type="button">Copiar enllaç</button></div></div>
 <form id="osc-load"><label for="osc-code">Recuperar un exercici</label><div class="osc-code-row"><input id="osc-code" placeholder="TL-OSC1-…" required><button type="submit">Obrir codi</button></div></form></div><p id="osc-code-status" role="status"></p></section>
 <section class="panel"><h2>Objectiu · ${ex.channel2?'Avançat · Dos canals':exerciseMode(ex)==='I'?'Intermedi · Trigger':exerciseMode(ex)==='M'?'Intermedi · Cursors':exerciseMode(ex)==='W'?'Aplicacions reals · Mesura PWM':exerciseMode(ex)==='C'?'Aplicacions reals · Acoblament AC/DC':exerciseMode(ex)==='F'?'Aplicacions reals · Diagnosi':levelOf(ex.mode)==='aplicat'?'Aplicacions reals · '+types[ex.type]:'Inicial · '+types[ex.type]}</h2><p>El generador té una ona fixa mentre dura l’exercici. Ajusta VOLTS/DIV i TIME/DIV perquè es vegin entre dos i quatre períodes complets, sense retallament vertical. ${exerciseMode(ex)==='I'?'Recupera la sincronització ajustant el nivell de trigger.':exerciseMode(ex)==='M'?'Utilitza els cursors per mesurar la tensió i el temps.':''} Després llegeix les magnituds a la retícula. ${ex.type==='P'?'El cicle de treball del generador varia entre exercicis.':ex.type==='H'?'El senyal està rectificat i només pren valors no negatius.':exerciseMode(ex)==='C'?'Compara AC, DC i GND per observar la component contínua.':exerciseMode(ex)==='F'?'Identifica la possible anomalia a partir de la traça.':''} ${ex.channel2?"Compara els canals per calcular el desfasament i el retard.":""}</p></section>
 <div class="osc-layout"><section class="osc-case" aria-label="Instrument simulat"><h2>Oscil·loscopi · ${ex.channel2?"CH1 i CH2":"CH1"}</h2><div class="osc-display-container">${screen(Boolean(ex.channel2))}<p id="osc-periods" role="status"></p><div class="osc-cursor-tools"><label><input id="osc-cursors-toggle" type="checkbox"> Activar cursors de mesura</label><div id="osc-cursor-controls" hidden><label>X1 <input type="range" id="osc-x1" min="0" max="600" step="1" value="${cursors.x1}"></label><label>X2 <input type="range" id="osc-x2" min="0" max="600" step="1" value="${cursors.x2}"></label><label>Y1 <input type="range" id="osc-y1" min="0" max="320" step="1" value="${cursors.y1}"></label><label>Y2 <input type="range" id="osc-y2" min="0" max="320" step="1" value="${cursors.y2}"></label><output id="osc-cursor-readout" aria-live="polite"></output></div></div></div>
 <div class="osc-controls-container"><div class="osc-knobs">
 <div class="osc-dial-unit"><label for="osc-v">CH1 · VOLTS/DIV</label><div class="osc-dial" data-knob="osc-v"><button type="button" class="osc-minus" aria-label="Reduir VOLTS/DIV CH1">−</button><span class="osc-knob-body"><input id="osc-v" type="range" min="0" max="${volts.length-1}" value="${vi}" step="1"><span class="osc-pointer" aria-hidden="true"></span></span><button type="button" class="osc-plus" aria-label="Augmentar VOLTS/DIV CH1">+</button></div><output id="osc-vout"></output></div>
 ${ex.channel2?`<div class="osc-dial-unit"><label for="osc-v2">CH2 · VOLTS/DIV</label><div class="osc-dial" data-knob="osc-v2"><button type="button" class="osc-minus" aria-label="Reduir VOLTS/DIV CH2">−</button><span class="osc-knob-body"><input id="osc-v2" type="range" min="0" max="${volts.length-1}" value="${v2i}" step="1"><span class="osc-pointer" aria-hidden="true"></span></span><button type="button" class="osc-plus" aria-label="Augmentar VOLTS/DIV CH2">+</button></div><output id="osc-v2out"></output></div>`:''}
 <div class="osc-dial-unit"><label for="osc-t">TIME/DIV</label><div class="osc-dial" data-knob="osc-t"><button type="button" class="osc-minus" aria-label="Reduir TIME/DIV">−</button><span class="osc-knob-body"><input id="osc-t" type="range" min="0" max="${times.length-1}" value="${ti}" step="1"><span class="osc-pointer" aria-hidden="true"></span></span><button type="button" class="osc-plus" aria-label="Augmentar TIME/DIV">+</button></div><output id="osc-tout"></output></div>
 <div class="osc-dial-unit"><label for="osc-trigger">TRIGGER LEVEL</label><div class="osc-dial" data-knob="osc-trigger"><button type="button" class="osc-minus" aria-label="Reduir trigger">−</button><span class="osc-knob-body"><input id="osc-trigger" type="range" min="-8" max="8" value="${triggerLevel}" step="0.5"><span class="osc-pointer" aria-hidden="true"></span></span><button type="button" class="osc-plus" aria-label="Augmentar trigger">+</button></div><output id="osc-trigger-out"></output></div>
 <div class="osc-coupling"><label for="osc-coupling">Acoblament CH1</label><select id="osc-coupling"><option value="DC">DC · tensió total</option><option value="AC">AC · sense component contínua</option><option value="GND">GND · referència zero</option></select><p id="osc-coupling-status"></p></div>
 <div class="osc-position-row"><label>Posició CH1 <input id="osc-pos1" type="range" min="-3" max="3" step=".25" value="${pos1}"><output id="osc-pos1out"></output></label>
 ${ex.channel2?'<label>Posició CH2 <input id="osc-pos2" type="range" min="-3" max="3" step=".25" value="'+pos2+'"><output id="osc-pos2out"></output></label>':''}</div>
 </div><p id="osc-trigger-status" role="status"></p>
 <div class="osc-actions"><button id="osc-reset" type="button">Restablir controls</button></div></div></section>
 <section class="panel"><h2>Comprovació</h2><p>Fes servir les divisions de la pantalla per llegir el senyal.</p>
 <button class="primary" id="osc-check" type="button">Comprovar visualització</button><div id="osc-status" class="osc-feedback" role="status" aria-live="polite" aria-atomic="true" tabindex="-1" hidden></div>
 <form id="osc-form"><div class="osc-reading"><label>Tensió pic a pic (V)<input name="vpp" inputmode="decimal" required></label><label>Període (ms)<input name="period" inputmode="decimal" required></label>${exerciseMode(ex)==='W'?'<label>Cicle de treball (%)<input name="duty" inputmode="decimal" required></label>':''}${exerciseMode(ex)==='C'?'<label>Component contínua (V)<input name="offset" inputmode="decimal" required></label>':''}${exerciseMode(ex)==='F'?'<label>Tipus d’anomalia<select name="fault" required><option value="">Selecciona...</option><option value="clipping">Retallament</option><option value="ripple">Ondulació periòdica</option><option value="noise">Soroll superposat</option></select></label>':''}${ex.channel2?`<label>Desfasament CH2 (°)<input name="phase" inputmode="decimal" required></label><label>Retard temporal (ms)<input name="delay" inputmode="decimal" required></label>`:""}</div>
 <div class="osc-actions"><button class="primary">Comprovar lectures</button></div><div id="osc-answer" class="osc-feedback" role="status" aria-live="polite" aria-atomic="true" tabindex="-1" hidden></div></form></section></div>
 <section class="panel"><h2>Resolució guiada</h2><div class="osc-steps" id="osc-steps"></div><p id="osc-progress" role="status"></p>
 <div class="osc-actions"><button class="primary" id="osc-next">Mostrar un pas</button><button id="osc-hide">Amagar solució</button></div></section>
 <p>No es desen ni s’envien respostes. El codi permet recuperar exactament el senyal de l’exercici.</p>`;
 root.querySelector('#osc-level').value=levelOf(selectedMode);
 root.querySelector('#osc-type').innerHTML=levelOptions(levelOf(selectedMode));
 root.querySelector('#osc-type').value=selectedMode;
 const display=()=>{
 const v=volts[vi],t=times[ti],tr=triggerState(ex,triggerLevel);
 const shift=tr.stable?(triggerOffset(ex,triggerLevel)??0):0;
 root.querySelector('#osc-vout').textContent=format(v)+' V/div';
 root.querySelector('#osc-tout').textContent=tlabel(t);
 root.querySelector('#osc-trigger-out').textContent=format(triggerLevel)+' V';
 root.querySelector('#osc-trigger-status').textContent=tr.feedback;
 root.querySelector('#osc-wave').setAttribute('d',path(ex,v,t,shift,pos1,coupling));
 root.querySelector('#osc-coupling-status').textContent=coupling==='DC'?'DC: es conserva la tensió mitjana.':coupling==='AC'?'AC: s’elimina la component contínua.':'GND: es mostra la referència de zero volts.';
 root.querySelector('#osc-wave').classList.toggle('osc-unsynced',!tr.stable);
 if(ex.channel2){
   root.querySelector('#osc-v2out').textContent=format(volts[v2i])+' V/div';
   root.querySelector('#osc-wave2').setAttribute('d',path(ex.channel2,volts[v2i],t,shift,pos2));
   root.querySelector('#osc-wave2').classList.toggle('osc-unsynced',!tr.stable);
   root.querySelector('#osc-pos2out').textContent=format(pos2)+' div';
 }
 root.querySelector('#osc-pos1out').textContent=format(pos1)+' div';
 const line=root.querySelector('#osc-trigger-line');
 line.setAttribute('y1',160-(triggerLevel/v+pos1)*40);
 line.setAttribute('y2',160-(triggerLevel/v+pos1)*40);
 root.querySelector('#osc-display').textContent='CH1 '+format(v)+' V/div | '+tlabel(t)+(tr.stable?' | TRIG':' | AUTO');
 root.querySelector('#osc-periods').textContent='Períodes dins la pantalla: '+format(state(ex,v,t).periods);
 root.querySelector('#osc-status').hidden=true;
 root.querySelectorAll('.osc-dial input').forEach(el=>{const lo=Number(el.min),hi=Number(el.max);el.closest('.osc-knob-body').style.setProperty('--angle',((Number(el.value)-lo)/(hi-lo)*270-135)+'deg');});
 if(cursorsOn)root.querySelector('#osc-cursor-overlay').removeAttribute('hidden');else root.querySelector('#osc-cursor-overlay').setAttribute('hidden','');
 for(const [id,coord,axis] of [['x1',cursors.x1,'x'],['x2',cursors.x2,'x'],['y1',cursors.y1,'y'],['y2',cursors.y2,'y']]){
 const el=root.querySelector('#osc-line-'+id);el.setAttribute(axis==='x'?'x1':'y1',coord);el.setAttribute(axis==='x'?'x2':'y2',coord);}
 const measured=cursorReadings(cursors.x1,cursors.x2,cursors.y1,cursors.y2,v,t);
 root.querySelector('#osc-cursor-readout').textContent='Δt = '+format(measured.deltaMs)+' ms · ΔV CH1 = '+format(measured.deltaV)+' V';
 };
 const feedback=(id,title,details,correct)=>{
   const el=root.querySelector('#'+id);
   el.hidden=false;
   el.classList.toggle('osc-feedback-ok',correct);
   el.classList.toggle('osc-feedback-attention',!correct);
   const icon=correct?'✓':'!';
   el.replaceChildren();
   const heading=document.createElement('strong');heading.textContent=icon+' '+title;
   const text=document.createElement('p');text.textContent=details;
   el.append(heading,text);
   el.scrollIntoView({block:'nearest',behavior:'auto'});
 };
 const dial=(id,change)=>{const el=root.querySelector('#'+id),wrap=el.closest('.osc-dial');el.oninput=()=>{change(Number(el.value));display();};for(const [selector,d] of [['.osc-minus',-1],['.osc-plus',1]])wrap.querySelector(selector).onclick=()=>{el.value=Math.max(Number(el.min),Math.min(Number(el.max),Number(el.value)+d*Number(el.step)));el.dispatchEvent(new Event('input',{bubbles:true}));};wrap.addEventListener('wheel',event=>{event.preventDefault();el.value=Math.max(Number(el.min),Math.min(Number(el.max),Number(el.value)+(event.deltaY<0?1:-1)*Number(el.step)));el.dispatchEvent(new Event('input',{bubbles:true}));},{passive:false});const rotate=event=>{const box=el.getBoundingClientRect(),dx=event.clientX-(box.left+box.width/2),dy=event.clientY-(box.top+box.height/2);let angle=Math.atan2(dx,-dy)*180/Math.PI;angle=Math.max(-135,Math.min(135,angle));const lo=Number(el.min),hi=Number(el.max),step=Number(el.step);el.value=Math.max(lo,Math.min(hi,Math.round((lo+(angle+135)/270*(hi-lo)-lo)/step)*step+lo));el.dispatchEvent(new Event('input',{bubbles:true}));};el.addEventListener('pointerdown',event=>{if(event.button!==0)return;el.setPointerCapture(event.pointerId);rotate(event);event.preventDefault();el.focus();});el.addEventListener('pointermove',event=>{if(el.hasPointerCapture(event.pointerId))rotate(event);});};
 for(const [id,update] of [['osc-pos1',v=>pos1=v],['osc-pos2',v=>pos2=v]]){const input=root.querySelector('#'+id);if(input)input.oninput=()=>{update(Number(input.value));display();};}
 root.querySelector('#osc-coupling').value=coupling;
 root.querySelector('#osc-coupling').onchange=event=>{coupling=event.target.value;display();};
 root.querySelector('#osc-cursors-toggle').checked=cursorsOn;
 root.querySelector('#osc-cursor-controls').hidden=!cursorsOn;
 root.querySelector('#osc-cursors-toggle').onchange=event=>{cursorsOn=event.target.checked;root.querySelector('#osc-cursor-controls').hidden=!cursorsOn;display();};
 for(const id of ['x1','x2','y1','y2'])root.querySelector('#osc-'+id).oninput=event=>{cursors[id]=Number(event.target.value);display();};
 dial('osc-v',value=>vi=value);dial('osc-t',value=>ti=value);dial('osc-trigger',value=>triggerLevel=value);if(ex.channel2)dial('osc-v2',value=>v2i=value);
 const replaceEx=(next)=>{exercise=next;vi=3;v2i=3;ti=3;triggerLevel=exerciseMode(next)==='I'?8:defaultTrigger(next);pos1=0;pos2=0;cursorsOn=false;coupling='DC';shown=0;practice(root);};
 root.querySelector('#osc-level').onchange=e=>{const type=root.querySelector('#osc-type');type.innerHTML=levelOptions(e.target.value);selectedMode=exerciseLevels[e.target.value][0][0];type.value=selectedMode;};
 root.querySelector('#osc-type').onchange=e=>selectedMode=e.target.value;
 root.querySelector('#osc-new').onclick=()=>replaceEx(generate(selectedMode,randomSeed()));
 root.querySelector('#osc-load').onsubmit=e=>{e.preventDefault();try{const decoded=readCode(root.querySelector('#osc-code').value);selectedMode=decoded.mode;replaceEx(generate(decoded.mode,decoded.seed));}catch(err){root.querySelector('#osc-code-status').textContent=err.message;}};
 const copy=async value=>{try{await navigator.clipboard.writeText(value);root.querySelector('#osc-code-status').textContent='Copiat al porta-retalls.';}catch{root.querySelector('#osc-code-status').textContent='No s’ha pogut copiar automàticament. Selecciona el codi i copia’l manualment.';}};
 root.querySelector('#osc-copy').onclick=()=>copy(ex.code);
 root.querySelector('#osc-link').onclick=()=>copy(location.href.split('#')[0]+href('practica')+'?code='+encodeURIComponent(ex.code));
 root.querySelector('#osc-reset').onclick=()=>{vi=3;v2i=3;ti=3;triggerLevel=exerciseMode(ex)==='I'?8:defaultTrigger(ex);pos1=0;pos2=0;coupling='DC';root.querySelector('#osc-coupling').value=coupling;for(const [id,value] of [['osc-v',vi],['osc-v2',v2i],['osc-t',ti],['osc-trigger',triggerLevel],['osc-pos1',pos1],['osc-pos2',pos2]]){const element=root.querySelector('#'+id);if(element)element.value=value;}display();};
 root.querySelector('#osc-check').onclick=()=>{
 const one=state(ex,volts[vi],times[ti]);
 const two=ex.channel2?state(ex.channel2,volts[v2i],times[ti]):null;
 const tr=triggerState(ex,triggerLevel);
 const good=coupling!=='GND'&&one.readable&&channelFits(ex,volts[vi],pos1,coupling)&&tr.stable&&(!two||(two.readable&&channelFits(ex.channel2,volts[v2i],pos2)));
 const hints=[];
 if(coupling==='GND')hints.push('GND només mostra la referència de zero volts. Selecciona DC o AC per mesurar el senyal.');
 if(!one.readable)hints.push(one.feedback);
 if(!channelFits(ex,volts[vi],pos1))hints.push('CH1 queda retallat: augmenta VOLTS/DIV o centra la posició vertical.');
 if(two&&!channelFits(ex.channel2,volts[v2i],pos2))hints.push('CH2 queda retallat: revisa VOLTS/DIV i la posició del segon canal.');
 if(!tr.stable)hints.push(tr.feedback);
 feedback('osc-status',good?'Visualització correcta':'Cal ajustar la visualització',good?'Les escales i el trigger permeten observar el senyal complet. Ara pots llegir les magnituds.':hints.join(' '),good);
 };
 root.querySelector('#osc-form').onsubmit=event=>{
   event.preventDefault();
   const input=event.target.elements;
   const correctV=checkReading(input.vpp.value,readingVpp(ex))==='correct';
   const correctT=checkReading(input.period.value,1000/ex.frequency)==='correct';
   const measurements=[['Tensió pic a pic',correctV],['Període',correctT]];
   if(exerciseMode(ex)==='W')measurements.push(['Cicle de treball',checkReading(input.duty.value,dutyCycle(ex))==='correct']);
   if(exerciseMode(ex)==='C')measurements.push(['Component contínua',checkReading(input.offset.value,ex.offset)==='correct']);
   if(exerciseMode(ex)==='F')measurements.push(['Diagnosi',input.fault.value===ex.fault]);
   if(ex.channel2){
     const expected=advancedAnswer(ex);
     measurements.push(['Desfasament',checkReading(input.phase.value,expected.phase)==='correct']);
     measurements.push(['Retard temporal',checkReading(input.delay.value,expected.delayMs)==='correct']);
   }
   const valid=measurements.every(([,ok])=>ok);
   const readable=coupling!=='GND'&&state(ex,volts[vi],times[ti]).readable&&channelFits(ex,volts[vi],pos1,coupling)&&triggerState(ex,triggerLevel).stable&&(!ex.channel2||(state(ex.channel2,volts[v2i],times[ti]).readable&&channelFits(ex.channel2,volts[v2i],pos2)));
   const details=measurements.map(([name,ok])=>name+': '+(ok?'correcte':'revisa les divisions i les unitats')).join('. ')+'. '+(readable?'La visualització és adequada.':'També cal revisar les escales o el trigger.');
   feedback('osc-answer',valid&&readable?'Lectures correctes':valid?'Lectures correctes, visualització pendent':'Revisa les lectures',details,valid&&readable);
 };
 const guide=steps(ex),draw=()=>{root.querySelector('#osc-steps').innerHTML=guide.slice(0,shown).map(step=>'<article><h3>'+step.title+'</h3><p>'+step.description+'</p>'+explanatoryFigure(ex,step.kind)+'</article>').join('');root.querySelector('#osc-progress').textContent=shown+' de '+guide.length+' passos';root.querySelector('#osc-next').disabled=shown===guide.length;};
 root.querySelector('#osc-next').onclick=()=>{shown=Math.min(shown+1,guide.length);draw();};root.querySelector('#osc-hide').onclick=()=>{shown=0;draw();};display();draw();
}
export function renderLab006(root,parts=[]){const section=(parts[0]||'practica').split('?')[0];document.title='Mesures amb oscil·loscopi | TecLab';document.body.classList.remove('lab-cover');document.body.classList.add('lab-active');if(section==='practica'||section==='laboratori'||section==='portada'){const code=location.hash.match(/[?&]code=([^&]+)/)?.[1];if(code){try{const decoded=readCode(decodeURIComponent(code));if(exercise?.code!==decoded.code){exercise=generate(decoded.mode,decoded.seed);selectedMode=decoded.mode;shown=0;triggerLevel=exerciseMode(exercise)==='I'?8:defaultTrigger(exercise);pos1=0;pos2=0;}}catch{ /* L'usuari també pot recuperar el codi manualment. */ }}practice(root);return;}if(section==='fonaments'){root.innerHTML=foundations();return;}if(section==='ajuda'){root.innerHTML=helpPage();return;}practice(root);}
