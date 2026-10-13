import {measure,isCorrect} from './meter.js';
const $=id=>document.getElementById(id);
let state={mode:'VDC',redJack:'VΩ',blackJack:'COM',redNode:null,blackNode:null,probe:'red',view:'schema'};
const spots=[{id:'A',x:75,y:44},{id:'B',x:405,y:44},{id:'C',x:405,y:246}];
const dot=(n,x,y)=>`<g class="node" role="button" tabindex="0" aria-label="Node ${n}" data-node="${n}"><circle cx="${x}" cy="${y}" r="11"/><text x="${x+16}" y="${y+5}">${n}</text></g>`;
function schema(){
 return `<svg viewBox="0 0 500 300" role="group" aria-label="Esquema del divisor de tensió">
 <path class="wire" d="M75 44H221 M261 44H405V164 M405 198V246H75V170 M75 105V44"/>
 <path d="M75 105v18m-14 0h28m-23 12h18m-9 0v35" stroke="#e4ca84" stroke-width="4" fill="none"/>
 <rect class="resistor" x="221" y="30" width="40" height="28" rx="3"/><rect class="resistor" x="390" y="164" width="30" height="34" rx="3"/>
 <g fill="#eaf2f5" font-size="18"><text x="91" y="131">12 V</text><text x="203" y="20">R1 1 kΩ</text><text x="314" y="187">R2 2 kΩ</text><text x="46" y="120">+</text><text x="46" y="164">−</text></g>
 ${spots.map(s=>dot(s.id,s.x,s.y)).join('')}${probeMarks(spots)}</svg>`;
}
function physical(){
 return `<svg viewBox="0 0 500 300" role="group" aria-label="Representació física simplificada del divisor de tensió">
 <rect x="175" y="18" width="284" height="260" rx="13" fill="#f0e9d7" stroke="#9d9b94" stroke-width="4"/>
 ${Array.from({length:7},(_,i)=>Array.from({length:5},(_,j)=>`<circle cx="${205+j*51}" cy="${35+i*36}" r="4.5" fill="#63747a"/>`).join('')).join('')}
 <rect x="16" y="85" width="128" height="110" rx="12" fill="#3f5058" stroke="#b3b9bd" stroke-width="4"/>
 <text x="30" y="111" fill="#f2d68e" font-size="18">FONT CC</text><text x="33" y="147" fill="white" font-size="25">12.0 V</text>
 <circle cx="54" cy="173" r="7" fill="#ee5858"/><circle cx="108" cy="173" r="7" fill="#242424" stroke="white"/>
 <path d="M54 173C54 20 170 44 210 44H275M320 44H405M108 173C108 280 220 246 405 246" fill="none" stroke="#ec5353" stroke-width="5"/>
 <path d="M405 44V157M405 202V246" stroke="#38555e" stroke-width="5" fill="none"/>
 <rect x="393" y="87" width="24" height="45" rx="8" fill="#e1c18c" stroke="#7a5f3e" stroke-width="2"/>
 <rect x="393" y="157" width="24" height="45" rx="8" fill="#e1c18c" stroke="#7a5f3e" stroke-width="2"/>
 ${[165,173,181,189].map(y=>`<path d="M393 ${y}h24" stroke="${y%2?'#b54e42':'#8b663c'}" stroke-width="3"/>`).join('')}
 <g fill="#233642" font-size="14"><text x="264" y="25">R1 · 1 kΩ</text><text x="261" y="181">R2 · 2 kΩ</text></g>
 ${spots.map(s=>dot(s.id,s.x,s.y)).join('')}${probeMarks(spots)}</svg>`;
}
function probeMarks(points){
 return ['red','black'].map(color=>{const n=state[color+'Node'];if(!n)return '';const p=points.find(q=>q.id===n);return `<path d="M${p.x} ${p.y}l-13 -20" stroke="${color==='red'?'#fa5050':'#070b0c'}" stroke-width="6"/><circle cx="${p.x-13}" cy="${p.y-20}" r="5" fill="${color==='red'?'#fa5050':'#111'}" stroke="white"/>`;}).join('');
}
function render(){
 $('circuit').innerHTML=state.view==='schema'?schema():physical();
 $('circuit').querySelectorAll('[data-node]').forEach(el=>{const connect=()=>{state[state.probe+'Node']=el.dataset.node;render()};el.addEventListener('click',connect);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();connect()}})});
 const m=measure(state);$('reading').textContent=m.display;$('unit').textContent=m.unit;
 $('redNode').textContent=state.redNode||'sense connectar';$('blackNode').textContent=state.blackNode||'sense connectar';
 $('feedback').textContent=m.status;
 document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',b.dataset.mode===state.mode)});
 ['red','black'].forEach(p=>{$(p+'Probe').classList.toggle('selected',p===state.probe);$(p+'Probe').setAttribute('aria-pressed',p===state.probe)});
 ['schema','physical'].forEach(v=>{$(v).classList.toggle('active',v===state.view);$(v).setAttribute('aria-pressed',v===state.view)});
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;render()}));
['red','black'].forEach(p=>$(p+'Probe').addEventListener('click',()=>{state.probe=p;render()}));
['schema','physical'].forEach(v=>$(v).addEventListener('click',()=>{state.view=v;render()}));
['redJack','blackJack'].forEach(id=>$(id).addEventListener('change',e=>{state[id]=e.target.value;render()}));
$('reset').addEventListener('click',()=>{state={mode:'VDC',redJack:'VΩ',blackJack:'COM',redNode:null,blackNode:null,probe:'red',view:'schema'};$('redJack').value=state.redJack;$('blackJack').value=state.blackJack;render()});
$('check').addEventListener('click',()=>{$('feedback').textContent=isCorrect(state)?'Correcte: has connectat el voltímetre en paral·lel a R2, amb polaritat positiva. La lectura és +8,00 V.': 'Encara no és la mesura demanada. Comprova la funció V ⎓, els connectors VΩ i COM i les puntes als nodes B (+) i C (−).'});
$('helpToggle').addEventListener('click',()=>{$('explanation').hidden=!$('explanation').hidden});
render();
