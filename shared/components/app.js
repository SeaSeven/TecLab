import { renderLab005, circuitCardFigure } from '../../labs/lab-005/lab.js?v=1.1.0';
import { renderLab001, resistorFigure } from '../../labs/lab-001/lab.js';
import {renderLab006,scopeFigure} from '../../labs/lab-006/lab.js';
const app=document.querySelector('#app');
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();const main=document.querySelector('main');main.tabIndex=-1;main.focus();});
let metadata=[];
let labs=[];
function catalog(){app.innerHTML=`<div class="eyebrow">ENTORN DE PRÀCTICA TÈCNICA</div><h1>De la teoria<br><span class="accent-text">a la prova.</span></h1><p class="intro">Explora components, interpreta codis i experimenta amb senyals. Un espai comú per als laboratoris de formació professional i enginyeria.</p><div class="toolbar"><input id="search" type="search" aria-label="Cerca laboratoris" placeholder="Cerca per nom, matèria o identificador…"><select id="course" aria-label="Filtra per estudis"><option value="">Tots els estudis</option value="EE10">CFGM EE10 · Elèctriques i Automàtiques</option value="EE30">CFGM EE30 · Telecomunicacions</option value="EEB0">CFGS EEB0 · Automatització i Robòtica</option><option value="Enginyeria">Grau en Enginyeria · Sistema de Propulsió</option></select></div><h2>Catàleg de laboratoris <small id="count"></small></h2><div class="grid" id="cards"></div><section class="code"><div><h2>Tens un codi de laboratori?</h2><p>Prova TECLAB-001 per localitzar el laboratori de resistències. És un codi de distribució, sense protecció d'accés.</p></div><form id="access"><input aria-label="Codi de laboratori" name="code" placeholder="Codi de laboratori" required><button class="primary">Obrir</button><div id="message" role="status"></div></form></section>`; const filter=()=>{const normalize=text=>text.toLocaleLowerCase('ca').normalize('NFD').replace(/[\u0300-\u036f]/g,'');const q=normalize(document.querySelector('#search').value);const course=document.querySelector('#course').value;const found=labs.filter(l=>normalize(l.join(' ')+' LAB-'+l[0]+' '+(metadata.find(m=>m.id==='LAB-'+l[0]).tags??[]).join(' ')).includes(q)&&l[3].includes(course));document.querySelector('#count').textContent=`/ ${found.length}`;document.querySelector('#cards').innerHTML=found.map(l=>`<article class="card"><div class="card-top"><span class="id">LAB-${l[0]}</span><span class="badge">${metadata.find(m=>m.id==='LAB-'+l[0]).status==='published'?'Disponible':'En preparació'}</span></div><div class="catalog-visual">${l[0]==='001'?resistorFigure(['yellow','violet','red','gold'],{hero:true}):l[0]==='005'?circuitCardFigure():l[0]==='006'?scopeFigure():l[0]==='008'?'<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="5" y="8" width="90" height="54" rx="9" fill="#273b48" stroke="#eebc70" stroke-width="3"/><rect x="13" y="17" width="50" height="36" rx="3" fill="#0a2830" stroke="#7aadb3"/><path d="M17 35Q24 12 31 35T45 35T59 35" fill="none" stroke="#f2d570" stroke-width="2"/><circle cx="78" cy="30" r="9" fill="#3c5260" stroke="#eebc70" stroke-width="3"/><circle cx="78" cy="50" r="5" fill="#3c5260" stroke="#eebc70"/></svg>':l[0]==='007'?'<svg viewBox="0 0 90 90" aria-hidden="true"><rect x="20" y="3" width="50" height="84" rx="10" stroke="#eebc70" fill="#253c49" stroke-width="3"/><rect x="28" y="13" width="34" height="19" rx="3" stroke="#9bd0a5" fill="#abcbb3" stroke-width="2"/><circle cx="45" cy="53" r="14" stroke="#f3cd85" fill="#344b57" stroke-width="3"/><path d="M45 43v-8M39 79v-9M51 79v-9" stroke="#f3cd85" stroke-width="3"/></svg>':`<svg viewBox="0 0 90 48" aria-hidden="true"><path d="${l[4]}"/></svg>`}</div><h2>${l[1]}</h2><p>${l[2]}</p><div class="tags">${l[3].split(' ').join(' · ')}</div><a href="#lab-${l[0]}">${metadata.find(m=>m.id==='LAB-'+l[0]).status==='published'?'Obrir el laboratori':'Consultar la fitxa'}</a></article>`).join('')||'<p>No hi ha laboratoris amb aquests filtres.</p>'};document.querySelector('#search').oninput=filter;document.querySelector('#course').onchange=filter;filter();document.querySelector('#access').onsubmit=e=>{e.preventDefault();if(/^TECLAB-00[15678]$/.test(e.target.code.value.trim().toUpperCase()))location.hash='lab-'+e.target.code.value.trim().slice(-3);else document.querySelector('#message').textContent='Codi no reconegut. Prova TECLAB-001.'}}
function credits(){
 document.title='Autoria i reutilització | TecLab';
 app.innerHTML=`<a class="back" href="#">← Catàleg</a><p class="eyebrow">INFORMACIÓ DEL PROJECTE</p><h1>Autoria i reutilització</h1>
 <section class="panel"><h2>Estat actual</h2><p>TecLab és un projecte de laboratoris tècnics interactius. TecLab ha estat pensat, definit i creat per <strong>Albert Marcet i Valdés</strong>.</p>
 <p>El repositori és públic, però encara no hi ha cap llicència de reutilització publicada. Per tant, la consulta del codi no s'ha d'interpretar com una autorització general per copiar-lo, modificar-lo o redistribuir-lo.</p>
 <h2>Proposta pendent d'aprovació</h2><p>Per al codi: llicència MIT. Per als continguts docents: Creative Commons Reconeixement–CompartirIgual 4.0 Internacional (CC BY-SA 4.0).</p>
 <p>Les llicències definitives s'indicaran aquí quan s'hagin confirmat els drets i les condicions de reutilització.</p>
 <p><a href="https://github.com/SeaSeven/TecLab/blob/main/README.md" target="_blank" rel="noopener noreferrer">Consultar el repositori de TecLab</a></p></section>`;
}
function upcoming(id,section='laboratori') {
 const l=metadata.find(l=>l.id==='LAB-'+id);
 if(!l){location.hash='';return;}
 app.innerHTML=`<a class="back" href="#">← Catàleg</a><p class="eyebrow">${l.id} / EN PREPARACIÓ</p><h1>${l.title}</h1><p class="intro">${l.description}</p><nav class="tabs" aria-label="Apartats del laboratori">${[['laboratori','Laboratori'],['fonaments','Fonaments'],['ajuda','Ajuda']].map(([path,title])=>`<a class="${section===path?'active':''}" href="#lab-${id}/${path}">${title}</a>`).join('')}</nav><div class="panel"><h2>${section==='ajuda'?'Ajuda':section==='fonaments'?'Fonaments previstos':'Activitat en preparació'}</h2><p>${section==='ajuda'?'Torna al catàleg amb l’enllaç superior. L’activitat d’aquest laboratori encara no està disponible.':section==='fonaments'?'Aquest apartat inclourà les convencions, les unitats i els exemples del laboratori.':'La fitxa i la navegació estan preparades. L’activitat interactiva encara no està implementada.'}</p></div>`;
 document.title=l.title+' | TecLab';
}
function route(focus=false){
 document.body.classList.remove('lab-cover','lab-active');
 document.querySelector('.version').textContent='TECLAB / v0.6';
 // El peu de pàgina és comú i conserva l'enllaç d'autoria.
 const [id,...parts]=location.hash.slice(1).split('/');
 if(id==='credits')credits();
 else if(id==='lab-008')location.replace(new URL('../../labs/lab-008/index.html',import.meta.url).href); else if(id==='lab-007')location.replace(new URL('../../labs/lab-007/index.html',import.meta.url).href); else if(id==='lab-006')renderLab006(app,parts);
 else if(id==='lab-005')renderLab005(app,parts);
 else if(id==='lab-001')renderLab001(app,parts);
 else if(id.startsWith('lab-'))upcoming(id.slice(4),parts[0]);
 else{document.title='TecLab · Laboratoris tècnics interactius';catalog();}
 if(focus){const h=app.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}window.scrollTo(0,0);}
}
async function start(){
 try{
 const response=await fetch(new URL('../../data/laboratories.json',import.meta.url));
 if(!response.ok)throw new Error('Catàleg no disponible');
 metadata=await response.json();
 labs=metadata.map(l=>[l.id.slice(4),l.title,l.description,l.courses.join(' '),l.iconPath]);
 window.addEventListener('hashchange',()=>route(true));route();
 }catch(error){app.innerHTML='<h1>No s’ha pogut carregar TecLab</h1><p>Comprova la connexió i torna a carregar la pàgina.</p><button id="retry">Tornar a provar</button>';app.querySelector('#retry').onclick=()=>location.reload();}
}
start();

