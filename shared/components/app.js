import { renderLab001, resistorFigure } from '../../labs/lab-001/lab.js';
const app=document.querySelector('#app');
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();const main=document.querySelector('main');main.tabIndex=-1;main.focus();});
let metadata=[];
let labs=[];
function catalog(){app.innerHTML=`<div class="eyebrow">ENTORN DE PRÀCTICA TÈCNICA</div><h1>De la teoria<br><span class="accent-text">a la prova.</span></h1><p class="intro">Explora components, interpreta codis i experimenta amb senyals. Un espai comú per als laboratoris de formació professional i enginyeria.</p><div class="toolbar"><input id="search" type="search" aria-label="Cerca laboratoris" placeholder="Cerca per nom, matèria o identificador…"><select id="course" aria-label="Filtra per estudis"><option value="">Tots els estudis</option value="EE10">CFGM EE10 · Elèctriques i Automàtiques</option value="EE30">CFGM EE30 · Telecomunicacions</option value="EEB0">CFGS EEB0 · Automatització i Robòtica</option><option value="Enginyeria">Grau en Enginyeria · Sistema de Propulsió</option></select></div><h2>Catàleg de laboratoris <small id="count"></small></h2><div class="grid" id="cards"></div><section class="code"><div><h2>Tens un codi de laboratori?</h2><p>Prova TECLAB-001 per localitzar el laboratori de resistències. És un codi de distribució, sense protecció d'accés.</p></div><form id="access"><input aria-label="Codi de laboratori" name="code" placeholder="Codi de laboratori" required><button class="primary">Obrir</button><div id="message" role="status"></div></form></section>`; const filter=()=>{const normalize=text=>text.toLocaleLowerCase('ca').normalize('NFD').replace(/[\u0300-\u036f]/g,'');const q=normalize(document.querySelector('#search').value);const course=document.querySelector('#course').value;const found=labs.filter(l=>normalize(l.join(' ')+' LAB-'+l[0]+' '+(metadata.find(m=>m.id==='LAB-'+l[0]).tags??[]).join(' ')).includes(q)&&l[3].includes(course));document.querySelector('#count').textContent=`/ ${found.length}`;document.querySelector('#cards').innerHTML=found.map(l=>`<article class="card"><div class="card-top"><span class="id">LAB-${l[0]}</span><span class="badge">${l[0]==='001'?'Disponible':'En preparació'}</span></div><div class="catalog-visual">${l[0]==='001'?resistorFigure(['yellow','violet','red','gold'],{hero:true}):`<svg viewBox="0 0 90 48" aria-hidden="true"><path d="${l[4]}"/></svg>`}</div><h2>${l[1]}</h2><p>${l[2]}</p><div class="tags">${l[3].split(' ').join(' · ')}</div><a href="#lab-${l[0]}">${l[0]==='001'?'Obrir el laboratori':'Consultar la fitxa'}</a></article>`).join('')||'<p>No hi ha laboratoris amb aquests filtres.</p>'};document.querySelector('#search').oninput=filter;document.querySelector('#course').onchange=filter;filter();document.querySelector('#access').onsubmit=e=>{e.preventDefault();if(e.target.code.value.trim().toUpperCase()==='TECLAB-001')location.hash='lab-001';else document.querySelector('#message').textContent='Codi no reconegut. Prova TECLAB-001.'}}
function upcoming(id,section='laboratori') {
 const l=metadata.find(l=>l.id==='LAB-'+id);
 if(!l){location.hash='';return;}
 app.innerHTML=`<a class="back" href="#">← Catàleg</a><p class="eyebrow">${l.id} / EN PREPARACIÓ</p><h1>${l.title}</h1><p class="intro">${l.description}</p><nav class="tabs" aria-label="Apartats del laboratori">${[['laboratori','Laboratori'],['fonaments','Fonaments'],['ajuda','Ajuda']].map(([path,title])=>`<a class="${section===path?'active':''}" href="#lab-${id}/${path}">${title}</a>`).join('')}</nav><div class="panel"><h2>${section==='ajuda'?'Ajuda':section==='fonaments'?'Fonaments previstos':'Activitat en preparació'}</h2><p>${section==='ajuda'?'Torna al catàleg amb l’enllaç superior. L’activitat d’aquest laboratori encara no està disponible.':section==='fonaments'?'Aquest apartat inclourà les convencions, les unitats i els exemples del laboratori.':'La fitxa i la navegació estan preparades. L’activitat interactiva encara no està implementada.'}</p></div>`;
 document.title=l.title+' | TecLab';
}
function route(focus=false){
 document.body.classList.remove('lab-cover','lab-active');
 document.querySelector('.version').textContent='TECLAB / v0.3';
 document.querySelector('footer').firstChild.textContent='TecLab · v0.3 · Octubre 2026 ';
 const [id,...parts]=location.hash.slice(1).split('/');
 if(id==='lab-001')renderLab001(app,parts);
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
