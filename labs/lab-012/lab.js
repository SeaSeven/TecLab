import { renderEducational } from './education.js';

const root=document.querySelector('#signals-app');
const forms={sin:'Sinusoidal',tri:'Triangular',square:'Quadrada',saw:'Dent de serra ascendent',fall:'Dent de serra descendent',rect:'Rectangular'};
let mode='explora',tab='laboratori',level=0,seed=123456789,answers={},verified=false;
let s={type:'sin',amp:10,freq:50,dc:0,phase:0,duty:50},practice=null,instant=0,c1=0,c2=.25;
const round2=x=>Math.round((x+Number.EPSILON)*100)/100;
const fmt=x=>round2(x).toLocaleString('ca-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
function wave(p,a){const u=((p%1)+1)%1;if(a.type==='sin')return Math.sin(2*Math.PI*u);if(a.type==='tri')return 2/Math.PI*Math.asin(Math.sin(2*Math.PI*u));if(a.type==='saw')return 2*u-1;if(a.type==='fall')return 1-2*u;return u<(a.type==='rect'?a.duty/100:.5)?1:-1;}
const v=(p,a)=>a.dc+a.amp*wave(p+a.phase/360,a);
function calc(a){let mean=a.dc+(a.type==='rect'?a.amp*(2*a.duty/100-1):0);
let ac2=a.amp*a.amp*(a.type==='sin'?.5:['tri','saw','fall'].includes(a.type)?1/3:a.type==='rect'?4*a.duty/100*(1-a.duty/100):1);
return {max:a.dc+a.amp,min:a.dc-a.amp,amp:a.amp,vpp:2*a.amp,T:1000/a.freq,f:a.freq,ac:Math.sqrt(ac2),mean:mean,rms:Math.sqrt(mean*mean+ac2)};}
function rng(n){return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};}
function create(n){const r=rng(n),pick=x=>x[Math.floor(r()*x.length)];return {type:pick(level===0?['sin']:level===1?['sin','tri','square','saw','fall']:Object.keys(forms)),amp:pick([2,4,5,6,8,10]),freq:pick([10,20,25,50,100,200,500]),dc:level<2?0:pick([-6,-4,-2,0,2,4,6]),phase:level===3?pick([0,45,90,180,270]):0,duty:level===3?pick([20,25,40,50,60,75,80]):50};}
function code(){const b=seed.toString(36).toUpperCase().padStart(7,'0')+'-'+level;return 'TL-SEN1-'+b+'-'+String([...b].reduce((a,c)=>a+c.charCodeAt(0),0)%97).padStart(2,'0');}
function restore(raw){const m=/^TL-SEN1-([0-9A-Z]{7})-([0-3])-([0-9]{2})$/.exec(raw.trim().toUpperCase());if(!m)return false;const b=m[1]+'-'+m[2];if(Number(m[3])!==[...b].reduce((a,c)=>a+c.charCodeAt(0),0)%97)return false;const n=parseInt(m[1],36);if(n>4294967295)return false;seed=n;level=Number(m[2]);practice=create(seed);answers={};verified=false;return true;}
function newCase(){seed=crypto.getRandomValues(new Uint32Array(1))[0];practice=create(seed);answers={};verified=false;render();}
function plotCoordinates(a){const m=calc(a),cap=Math.max(1,Math.ceil(Math.max(Math.abs(m.max),Math.abs(m.min))*1.2));return {m,cap,X:frac=>55+720*frac,Y:volts=>170-125*volts/cap};}
function cursorRead(a,frac){const T=calc(a).T;return {time:frac*2*T,value:v(frac*2,a)};}
function cursorMarkup(key,frac,a,color,ordinal){const coords=plotCoordinates(a),r=cursorRead(a,frac),x=coords.X(frac),y=coords.Y(r.value);const labelX=Math.min(615,Math.max(58,x+12));const labelY=ordinal===1?24:58;
 return '<g class="signals-cursor" data-cursor="'+key+'" role="slider" tabindex="0" focusable="true" aria-label="Cursor '+ordinal+'; temps en mil·lisegons" aria-valuemin="0" aria-valuemax="'+(coords.m.T*2)+'" aria-valuenow="'+r.time+'" aria-valuetext="'+fmt(r.time)+' mil·lisegons, '+fmt(r.value)+' volts">'
 +'<line class="signals-cursor-line" x1="'+x+'" y1="43" x2="'+x+'" y2="295" stroke="'+color+'" stroke-width="2" stroke-dasharray="5 4"/>'
 +'<line class="signals-cursor-projection" x1="55" y1="'+y+'" x2="'+x+'" y2="'+y+'" stroke="'+color+'" stroke-width="1" stroke-dasharray="3 4" opacity=".8"/>'
 +'<circle class="signals-cursor-dot" cx="'+x+'" cy="'+y+'" r="6" fill="'+color+'" stroke="#0b202a" stroke-width="2"/>'
 +'<path class="signals-cursor-grip" d="M'+(x-10)+' 43L'+(x+10)+' 43L'+x+' 56Z" fill="'+color+'"/>'
 +'<rect class="signals-cursor-label-bg" x="'+labelX+'" y="'+labelY+'" width="158" height="30" rx="6" fill="#122935" stroke="'+color+'"/>'
 +'<text class="signals-cursor-label" x="'+(labelX+7)+'" y="'+(labelY+12)+'" fill="#ecf7fa" font-size="11">C'+ordinal+' · t '+fmt(r.time)+' ms</text>'
 +'<text class="signals-cursor-label-v" x="'+(labelX+7)+'" y="'+(labelY+25)+'" fill="'+color+'" font-size="11">V '+fmt(r.value)+' V</text>'
 +'<rect class="signals-cursor-hitarea" x="'+(x-15)+'" y="43" width="30" height="252" fill="transparent"/>'
 +'</g>';}
function graph(a,hide){const {m,cap,Y,X}=plotCoordinates(a);let lines='',path='',prev=null;
 for(let i=0;i<=20;i++){const xx=X(i/20),yy=45+i*12.5;lines+='<path d="M'+xx+' 43V295 M55 '+yy+'H775" stroke="#89a8b4" opacity="'+(i%5===0?.5:.18)+'"/>';}
 for(let j=0;j<=4;j++){const volts=cap-j*cap/2;lines+='<text x="48" y="'+(Y(volts)+4)+'" fill="#dcebef" font-size="12" text-anchor="end">'+fmt(volts)+'</text><text x="'+X(j/4)+'" y="318" fill="#dcebef" font-size="12" text-anchor="middle">'+fmt(j*m.T/2)+'</text>';}
 for(let i=0;i<=1200;i++){const p=i/600,z=v(p,a),x=X(p/2),y=Y(z);const jump=i&&Math.abs(z-prev)>a.amp*.6&&['square','rect','saw','fall'].includes(a.type);if(jump)path+='L'+x+' '+Y(prev)+' ';path+=(i===0?'M':'L')+x+' '+y+' ';prev=z;}
 const cursors=hide?'':cursorMarkup('c1',c1,a,'#ffd27b',1)+cursorMarkup('c2',c2,a,'#6ccaf1',2);
 return '<svg class="signals-plot" viewBox="0 0 800 340" role="group" aria-label="Gràfic de tensió en funció del temps; dos períodes; cursors interactius"><rect width="800" height="340" rx="8" fill="#0b202a"/>'+lines+'<path d="M55 '+Y(0)+'H775" stroke="#dcebef"/><path d="'+path+'" stroke="#63e5b3" fill="none" stroke-width="2.4"/>'+cursors+'<g class="signals-probe" visibility="hidden" pointer-events="none"><path class="signals-probe-line" stroke="#d8f7e8" stroke-dasharray="3 4"/><circle class="signals-probe-dot" r="4" fill="#f6f7fb"/><rect class="signals-probe-bg" width="155" height="29" rx="5" fill="#163240" stroke="#a8c7d6"/><text class="signals-probe-label" fill="#fff" font-size="11"/></g><text x="12" y="22" fill="white">V</text><text x="772" y="334" fill="white">t (ms)</text></svg>';}
function attachCursorInteraction(a){
 const svg=root.querySelector('.signals-plot');if(!svg||mode!=='explora')return;
 let dragging=null;const readPointer=e=>{const bounds=svg.getBoundingClientRect();if(!bounds.width)return null;const matrix=svg.getScreenCTM();if(!matrix)return null;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const pos=pt.matrixTransform(matrix.inverse());return {x:pos.x,y:pos.y,frac:Math.max(0,Math.min(1,(pos.x-55)/720))};};
 function moveCursor(key,frac){if(key==='c1')c1=frac;else c2=frac;const values=cursorRead(a,frac),{X,Y}=plotCoordinates(a),x=X(frac),y=Y(values.value),node=svg.querySelector('[data-cursor="'+key+'"]');if(!node)return;
 const labelX=Math.min(615,Math.max(58,x+12)),labelY=key==='c1'?24:58;
 const line=node.querySelector('.signals-cursor-line');line.setAttribute('x1',x);line.setAttribute('x2',x);
 const project=node.querySelector('.signals-cursor-projection');project.setAttribute('x2',x);project.setAttribute('y1',y);project.setAttribute('y2',y);
 const dot=node.querySelector('.signals-cursor-dot');dot.setAttribute('cx',x);dot.setAttribute('cy',y);
 node.querySelector('.signals-cursor-grip').setAttribute('d','M'+(x-10)+' 43L'+(x+10)+' 43L'+x+' 56Z');
 node.querySelector('.signals-cursor-hitarea').setAttribute('x',x-15);
 node.querySelector('.signals-cursor-label-bg').setAttribute('x',labelX);node.querySelector('.signals-cursor-label-bg').setAttribute('y',labelY);
 for(const [selector,text,ypos] of [['.signals-cursor-label','C'+(key==='c1'?'1':'2')+' · t '+fmt(values.time)+' ms',labelY+12],['.signals-cursor-label-v','V '+fmt(values.value)+' V',labelY+25]]){const el=node.querySelector(selector);el.setAttribute('x',labelX+7);el.setAttribute('y',ypos);el.textContent=text;}
 node.setAttribute('aria-valuenow',values.time);node.setAttribute('aria-valuetext',fmt(values.time)+' mil·lisegons, '+fmt(values.value)+' volts');
 updateReadings();
 }
 function updateReadings(){const one=cursorRead(a,c1),two=cursorRead(a,c2),set=(id,t)=>{const el=root.querySelector('#'+id);if(el)el.textContent=t;};
 set('cursor-one-readout','t = '+fmt(one.time)+' ms · V = '+fmt(one.value)+' V');
 set('cursor-two-readout','t = '+fmt(two.time)+' ms · V = '+fmt(two.value)+' V');
 set('cursor-deltas','Δt = '+fmt(Math.abs(two.time-one.time))+' ms · ΔV = '+fmt(Math.abs(two.value-one.value))+' V');
 }
 function showProbe(pos){const group=svg.querySelector('.signals-probe');if(!group)return;if(pos.x<55||pos.x>775||pos.y<43||pos.y>295){group.setAttribute('visibility','hidden');return;}
 const d=cursorRead(a,pos.frac),{X,Y}=plotCoordinates(a),x=X(pos.frac),y=Y(d.value),tx=Math.max(56,Math.min(619,x+13)),ty=Math.max(77,Math.min(263,y-38));
 group.setAttribute('visibility','visible');const line=group.querySelector('.signals-probe-line');line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('y1',43);line.setAttribute('y2',295);
 const dot=group.querySelector('.signals-probe-dot');dot.setAttribute('cx',x);dot.setAttribute('cy',y);
 const bg=group.querySelector('.signals-probe-bg');bg.setAttribute('x',tx);bg.setAttribute('y',ty);
 const label=group.querySelector('.signals-probe-label');label.setAttribute('x',tx+7);label.setAttribute('y',ty+19);label.textContent=fmt(d.time)+' ms · '+fmt(d.value)+' V';
 }
 svg.addEventListener('pointerdown',e=>{const pos=readPointer(e);if(!pos||pos.x<40||pos.x>790||pos.y<40||pos.y>310)return;
 const found=e.target.closest('[data-cursor]');const x1=55+720*c1,x2=55+720*c2;
 dragging=found?.getAttribute('data-cursor')||(Math.abs(pos.x-x1)<=Math.abs(pos.x-x2)?'c1':'c2');
 svg.setPointerCapture(e.pointerId);moveCursor(dragging,pos.frac);showProbe(pos);e.preventDefault();});
 svg.addEventListener('pointermove',e=>{const pos=readPointer(e);if(!pos)return;showProbe(pos);if(dragging)moveCursor(dragging,pos.frac);});
 const stop=e=>{if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);dragging=null;};
 svg.addEventListener('pointerup',stop);svg.addEventListener('pointercancel',stop);
 svg.addEventListener('pointerleave',()=>{if(!dragging)svg.querySelector('.signals-probe').setAttribute('visibility','hidden');});
 updateReadings();
 for(const key of ['c1','c2']){const node=svg.querySelector('[data-cursor="'+key+'"]');node.addEventListener('keydown',e=>{const step=e.shiftKey?.025:.0025;if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 let val=key==='c1'?c1:c2;val=e.key==='Home'?0:e.key==='End'?1:Math.max(0,Math.min(1,val+(e.key==='ArrowRight'?step:-step)));moveCursor(key,val);e.preventDefault();});}
}
function eq(id,label,a){return '<label>'+label+'<input type="number" data-s="'+id+'" value="'+a[id]+'" step="any"></label>';}
function ok(value,target){let str=String(value??'').trim().replace(',','.');return str!==''&&Number.isFinite(Number(str))&&Math.abs(Number(str)-round2(target))<=.010000001;}
function renderLab(){let a=mode==='explora'?s:practice,m=calc(a);
let controls='<label>Forma d’ona<select data-s="type">'+Object.entries(forms).map(([k,name])=>'<option value="'+k+'" '+(a.type===k?'selected':'')+'>'+name+'</option>').join('')+'</select></label>'+[['amp','Amplitud (V)'],['freq','Freqüència (Hz)'],['dc','Component contínua (V)'],['phase','Fase (°)'],['duty','Cicle de treball (%)']].map(x=>eq(x[0],x[1],a)).join('');
let levels=['Inicial','Intermedi','Avançat','Expert'].map((x,i)=>'<button data-level="'+i+'" class="'+(level===i?'active':'')+'">'+x+'</button>').join('');
let fields=[['max','Valor màxim','V'],['min','Valor mínim','V'],['amp','Amplitud','V'],['vpp','Pic a pic','V'],['T','Període','ms'],['f','Freqüència','Hz'],['rms','Valor eficaç total','V']];
if(level>=2)fields.push(['mean','Valor mitjà','V'],['ac','Valor eficaç AC','V']);
if(level===3&&a.type==='rect')fields.push(['duty','Cicle de treball','%']);
let metrics=Object.entries({Màxim:m.max,Mínim:m.min,Amplitud:m.amp,'Pic a pic':m.vpp,'Període (ms)':m.T,'Freqüència (Hz)':m.f,'Eficaç total (V)':m.rms,'Eficaç AC (V)':m.ac,'Valor mitjà (V)':m.mean}).map(([k,z])=>'<div class="signals-metric"><small>'+k+'</small><strong>'+fmt(z)+'</strong></div>').join('');
let inputs=fields.map(([id,label,unit])=>'<label class="signals-answer '+(verified?(ok(answers[id],id==='duty'?a.duty:m[id])?'good':'bad'):'')+'">'+label+'<input data-answer="'+id+'" inputmode="decimal" value="'+String(answers[id]??'').replace(/["<>]/g,'')+'"><small>'+unit+(verified?' · '+(ok(answers[id],id==='duty'?a.duty:m[id])?'Correcte':'Revisa el resultat'):'')+'</small></label>').join('');
let count=fields.filter(([id])=>ok(answers[id],id==='duty'?a.duty:m[id])).length;
root.innerHTML='<div class="signals-panel signals-mode"><button data-mode="explora" class="'+(mode==='explora'?'active':'')+'">Exploració lliure</button><button data-mode="practica" class="'+(mode==='practica'?'active':'')+'">Pràctica inversa</button></div><div class="signals-layout"><section class="signals-panel"><h2>'+(mode==='explora'?'Configuració':'Exercici')+'</h2>'+(mode==='explora'?'<div class="signals-controls">'+controls+'</div>':'<p>Calcula les magnituds del senyal representat.</p><div class="signals-level">'+levels+'</div><div class="signals-actions"><button id="new">Generar exercici</button></div><div class="signals-code"><label>Codi recuperable<input id="code" value="'+code()+'"></label><button id="recover">Recuperar</button></div>')+'</section><section class="signals-panel"><h2>Senyal · 2 períodes</h2>'+graph(a,mode==='practica')+(mode==='explora'?'<div class="signals-query"><p class="signals-cursor-hint">Passa el punter per sobre el senyal per consultar t i V. Arrossega els cursors C1 i C2 directament sobre la gràfica (també pots fer servir les fletxes del teclat).</p><label>Consulta puntual (ms)<input id="instant" type="number" step="any" value="'+instant+'"></label><p>v(t) = '+fmt(v(instant/m.T,a))+' V</p><div class="signals-cursor-readouts"><div><strong>C1</strong><span id="cursor-one-readout"></span></div><div><strong>C2</strong><span id="cursor-two-readout"></span></div></div><p class="signals-delta" id="cursor-deltas"></p></div>':'')+'</section></div><section class="signals-panel"><h2>'+(mode==='explora'?'Magnituds calculades':'Respostes')+'</h2>'+(mode==='explora'?'<div class="signals-metrics">'+metrics+'</div>':'<div class="signals-answers">'+inputs+'</div><div class="signals-actions"><button id="check">Comprovar resultats</button><button id="clear">Esborrar respostes</button></div>'+(verified?'<p class="signals-note '+(count===fields.length?'good':'bad')+'" role="status">'+count+' de '+fields.length+' respostes correctes.</p>':''))+'</section>';
root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render();});
if(mode==='explora'){root.querySelectorAll('[data-s]').forEach(e=>e.onchange=()=>{let k=e.dataset.s,z=k==='type'?e.value:Number(e.value);if(k!=='type'&&(!Number.isFinite(z)||(k==='amp'&&z<=0)||(k==='freq'&&z<=0)||(k==='duty'&&(z<=0||z>=100)))){alert('Valor fora de rang.');render();return;}s[k]=z;instant=Math.min(instant,2000/s.freq);render();});root.querySelector('#instant').onchange=e=>{let t=Number(e.target.value);if(Number.isFinite(t)&&t>=0&&t<=2*m.T)instant=t;render();};attachCursorInteraction(a);}
else{root.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=Number(b.dataset.level);newCase();});root.querySelector('#new').onclick=newCase;root.querySelector('#recover').onclick=()=>{if(!restore(root.querySelector('#code').value))alert('Codi incorrecte.');render();};root.querySelectorAll('[data-answer]').forEach(e=>e.oninput=()=>{answers[e.dataset.answer]=e.value;});root.querySelector('#check').onclick=()=>{verified=true;render();};root.querySelector('#clear').onclick=()=>{answers={};verified=false;render();};}
}
function info(){root.innerHTML=renderEducational(tab);}
function render(){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));tab==='laboratori'?renderLab():info();}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();});
practice=create(seed);render();
