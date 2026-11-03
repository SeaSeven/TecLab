import { renderCatalog } from './catalog.js';
import { renderLab005, circuitCardFigure } from '../../labs/lab-005/lab.js?v=1.2.0';
import { renderLab001, resistorFigure } from '../../labs/lab-001/lab.js';
import {renderLab006,scopeFigure} from '../../labs/lab-006/lab.js';
const app=document.querySelector('#app');
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();const main=document.querySelector('main');main.tabIndex=-1;main.focus();});
let metadata=[];
let labs=[];
function catalog(){renderCatalog(app,metadata,{resistorFigure,circuitCardFigure,scopeFigure});}
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
 else if(id==='lab-008')location.replace(new URL('../../labs/lab-008/index.html',import.meta.url).href); else if(id==='lab-007')location.replace(new URL('../../labs/lab-007/index.html',import.meta.url).href); else if(id==='lab-002'||id==='lab-003')location.replace(new URL('../../labs/'+id+'/index.html',import.meta.url).href); else if(id==='lab-006')renderLab006(app,parts);
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

