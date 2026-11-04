export function renderCatalog(app, metadata, visuals) {
  const areas = [
    {id:'components', number:'01', title:'Components electrònics', short:'Components', desc:'Identificació, codificació i característiques dels components.', labs:['LAB-001','LAB-009','LAB-010'], symbol:'◫'},
    {id:'circuits', number:'02', title:'Anàlisi de circuits', short:'Circuits', desc:'Circuits resistius, components reactius i corrent altern.', labs:['LAB-002','LAB-003','LAB-005'], symbol:'⌁'},
    {id:'instruments', number:'03', title:'Instrumentació i mesures', short:'Instrumentació', desc:'Multímetre, oscil·loscopi i generadors de funcions.', labs:['LAB-006','LAB-007','LAB-008'], symbol:'◉'},
    {id:'signals', number:'04', title:'Senyals i aplicacions', short:'Senyals', desc:'Generació, modulació i aplicacions de senyals.', labs:['LAB-004'], symbol:'∿'}
  ];
  const esc = value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId=new Map(metadata.map(m=>[m.id,m]));
  const areaFor=id=>areas.find(a=>a.labs.includes(id));
  let selectedArea='all';
  let query='';
  let course='';
  let status='all';
  const normalize=s=>String(s).toLocaleLowerCase('ca').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const svgFor=l=>{
    if(l.id==='LAB-001') return visuals.resistorFigure(['yellow','violet','red','gold'],{hero:true});
    if(l.id==='LAB-002') return '<svg viewBox="0 0 300 105" role="img" aria-label="Circuit RC i RL amb resposta transitòria"><g fill="none" stroke="#eebc70" stroke-width="2.5"><path d="M15 52h28m0-20v40m11-40v40m0-20h28m0 0c0-15 12-15 12 0s12 15 12 0 12-15 12 0h12"/><path d="M152 81V27h128" stroke="#637e8d" stroke-width="1.5"/><path d="M152 81Q174 81 191 58T280 28" stroke="#f0c778" stroke-width="3"/></g><text x="18" y="17" fill="#bdd0d9" font-size="11">C · L / CC</text><text x="248" y="95" fill="#bdd0d9" font-size="10">t →</text></svg>';
    if(l.id==='LAB-003') return '<svg viewBox="0 0 300 105" role="img" aria-label="Circuit RLC i ones alternes desfasades"><g fill="none" stroke="#eebc70" stroke-width="2.3"><path d="M10 58h18l6-11 10 22 10-22 6 11h17m0-22v44m12-44v44m0-22h19m0 0c0-16 12-16 12 0s12 16 12 0 12-16 12 0h12"/><path d="M174 53q15-38 30 0t30 0 30 0 30 0" stroke="#efbd72"/><path d="M174 65q15-38 30 0t30 0 30 0 30 0" stroke="#79bbcd"/></g><text x="12" y="21" fill="#bdd0d9" font-size="11">RLC / CA</text></svg>';
    if(l.id==='LAB-009') return '<svg viewBox="0 0 300 105" role="img" aria-label="Condensadors ceràmics i electrolítics"><g stroke="#eebc70" stroke-width="2.5"><circle cx="80" cy="50" r="30" fill="#986d39"/><rect x="165" y="16" width="65" height="71" rx="8" fill="#324a55"/><path d="M165 33h65" stroke="#7ab8c5"/><path d="M76 12v-10m12 10v-10M180 87v15m34-15v15"/></g><text x="80" y="56" fill="#18212a" text-anchor="middle" font-size="16">104</text><text x="197" y="55" fill="#dbe9eb" text-anchor="middle" font-size="12">100 µF</text></svg>';
    if(l.id==='LAB-010') return '<svg viewBox="0 0 300 105" role="img" aria-label="Inductància axial i bobina toroidal"><g fill="none" stroke="#eebc70" stroke-width="4"><path d="M18 55h30c0-37 17-37 17 0s17 37 17 0 17-37 17 0 17 37 17 0h35"/><circle cx="230" cy="55" r="35" stroke="#739bab" stroke-width="12"/><circle cx="230" cy="55" r="17" stroke="#efbd72" stroke-width="2"/></g></svg>';
    if(l.id==='LAB-005') return visuals.circuitCardFigure();
    if(l.id==='LAB-006') return visuals.scopeFigure();
    if(l.id==='LAB-007') return '<svg viewBox="0 0 90 90" aria-hidden="true"><rect x="20" y="3" width="50" height="84" rx="10" stroke="#eebc70" fill="#253c49" stroke-width="3"/><rect x="28" y="13" width="34" height="19" rx="3" stroke="#9bd0a5" fill="#abcbb3" stroke-width="2"/><circle cx="45" cy="53" r="14" stroke="#f3cd85" fill="#344b57" stroke-width="3"/><path d="M45 43v-8M39 79v-9M51 79v-9" stroke="#f3cd85" stroke-width="3"/></svg>';
    if(l.id==='LAB-008') return '<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="5" y="8" width="90" height="54" rx="9" fill="#273b48" stroke="#eebc70" stroke-width="3"/><rect x="13" y="17" width="50" height="36" rx="3" fill="#0a2830" stroke="#7aadb3"/><path d="M17 35Q24 12 31 35T45 35T59 35" fill="none" stroke="#f2d570" stroke-width="2"/><circle cx="78" cy="30" r="9" fill="#3c5260" stroke="#eebc70" stroke-width="3"/><circle cx="78" cy="50" r="5" fill="#3c5260" stroke="#eebc70"/></svg>';
    return `<svg viewBox="0 0 90 48" aria-hidden="true"><path d="${esc(l.iconPath)}"/></svg>`;
  };
  const card=l=>{
    const available=l.status==='published';
    const area=areaFor(l.id);
    return `<article class="card catalog-lab-card"><a class="catalog-card-hit" href="#lab-${esc(l.id.slice(4))}" aria-label="${available?'Obrir':'Consultar'} ${esc(l.title)}"></a>
      <div class="card-top"><span class="id">${esc(l.id)}</span><span class="badge ${available?'is-published':'is-planned'}">${available?'Disponible':'En preparació'}</span></div>
      <div class="catalog-visual">${svgFor(l)}</div>
      <div class="catalog-card-area">${esc(area?.short || 'Laboratori')}</div>
      <h3>${esc(l.title)}</h3>
      <p>${esc(l.description)}</p>
      <div class="catalog-card-foot"><span class="catalog-course-list">${esc(l.courses.join(' · '))}</span><span class="catalog-link-text">${available?'Obrir el laboratori':'Consultar la fitxa'}</span></div>
    </article>`;
  };
  const availableCount=metadata.filter(l=>l.status==='published').length;
  app.innerHTML=`<div class="catalog-home">
    <section class="catalog-hero" aria-labelledby="catalog-title">
      <div class="eyebrow">ENTORN DE PRÀCTICA TÈCNICA</div>
      <h1 id="catalog-title">Aprèn, experimenta<br><span class="accent-text">i comprova.</span></h1>
      <p class="intro">Laboratoris virtuals d'electricitat i electrònica per treballar amb components, circuits i instruments de mesura.</p>
      <div class="catalog-stats"><span><strong>${availableCount}</strong> disponibles</span><span><strong>${metadata.length}</strong> al catàleg</span><a href="#catalog-list">Explorar laboratoris <span aria-hidden="true">↓</span></a></div>
    </section>
    <section class="catalog-areas-section" aria-labelledby="areas-title">
      <div class="catalog-section-heading"><div><p class="eyebrow">EXPLORA PER MATÈRIA</p><h2 id="areas-title">Àrees de treball</h2></div><p>Selecciona una àrea per veure els laboratoris relacionats.</p></div>
      <div class="catalog-areas" role="group" aria-label="Filtra per àrea">
        ${areas.map(a=>`<button type="button" class="catalog-area" data-area="${a.id}" aria-pressed="false"><span class="catalog-area-top"><span class="catalog-area-symbol" aria-hidden="true">${a.symbol}</span><span class="catalog-area-number">${a.number}</span></span><strong>${esc(a.title)}</strong><span class="catalog-area-description">${esc(a.desc)}</span><span class="catalog-area-count">${a.labs.length} ${a.labs.length===1?'laboratori':'laboratoris'} <span aria-hidden="true">↗</span></span></button>`).join('')}
      </div>
    </section>
    <section id="catalog-list" class="catalog-list-section" aria-labelledby="catalog-list-title">
      <div class="catalog-section-heading"><div><p class="eyebrow">CATÀLEG</p><h2 id="catalog-list-title">Laboratoris <small id="count"></small></h2></div><button type="button" id="clear-filters" class="catalog-clear" hidden>Neteja els filtres</button></div>
      <div class="catalog-toolbar">
        <label class="catalog-field catalog-search"><span>Cerca</span><input id="search" type="search" placeholder="Nom, matèria o identificador…" autocomplete="off"></label>
        <label class="catalog-field"><span>Estudis</span><select id="course"><option value="">Tots els estudis</option><option value="EE10">CFGM EE10 · Elèctriques i Automàtiques</option><option value="EE30">CFGM EE30 · Telecomunicacions</option><option value="EEB0">CFGS EEB0 · Automatització i Robòtica</option><option value="Enginyeria">Grau en Enginyeria · Sistema de Propulsió</option></select></label>
        <label class="catalog-field catalog-status"><span>Estat</span><select id="status"><option value="all">Tots</option><option value="published">Disponibles</option><option value="planned">En preparació</option></select></label>
      </div>
      <div class="catalog-active-area" id="active-area" hidden></div>
      <div id="cards" class="catalog-groups" aria-live="polite"></div>
    </section>
    <section class="code catalog-code"><div><h2>Tens un codi de laboratori?</h2><p>Introdueix el codi d'accés a un laboratori. Per exemple, TECLAB-001. Els codis d'exercici es recuperen dins de cada laboratori.</p></div><form id="access"><input aria-label="Codi de laboratori" name="code" placeholder="TECLAB-001" required><button class="primary">Obrir</button><div id="message" role="status" aria-live="polite"></div></form></section>
  </div>`;
  const cards=app.querySelector('#cards');
  const count=app.querySelector('#count');
  const activeArea=app.querySelector('#active-area');
  const clear=app.querySelector('#clear-filters');
  function update(){
    const matching=metadata.filter(l=>(selectedArea==='all'||areaFor(l.id)?.id===selectedArea)
      &&(!course||l.courses.includes(course))
      &&(status==='all'||l.status===status)
      &&(!query||normalize([l.id,l.title,l.description,...(l.tags||[]),areaFor(l.id)?.title].join(' ')).includes(normalize(query))));
    count.textContent=`/ ${matching.length}`;
    clear.hidden=selectedArea==='all'&&!query&&!course&&status==='all';
    for(const btn of app.querySelectorAll('[data-area]')) btn.setAttribute('aria-pressed',String(btn.dataset.area===selectedArea));
    const selected=areas.find(a=>a.id===selectedArea);
    activeArea.hidden=!selected;
    activeArea.innerHTML=selected?`<span>Àrea seleccionada: <strong>${esc(selected.title)}</strong></span><button type="button" id="remove-area">Mostra totes les àrees ×</button>`:'';
    if(selected)activeArea.querySelector('#remove-area').onclick=()=>{selectedArea='all';update();};
    cards.innerHTML=matching.length?areas.map(a=>{
      const entries=matching.filter(l=>a.id===areaFor(l.id)?.id);
      return entries.length?`<section class="catalog-lab-group" aria-labelledby="group-${a.id}"><div class="catalog-group-title"><span>${a.number}</span><h3 id="group-${a.id}">${esc(a.title)}</h3><small>${entries.length}</small></div><div class="catalog-card-grid">${entries.map(card).join('')}</div></section>`:'';
    }).join(''):'<div class="catalog-empty"><h3>Cap laboratori coincideix amb la cerca.</h3><p>Prova altres termes o elimina algun filtre.</p></div>';
  }
  for(const btn of app.querySelectorAll('[data-area]'))btn.addEventListener('click',()=>{
    selectedArea=selectedArea===btn.dataset.area?'all':btn.dataset.area;
    update();
    app.querySelector('#catalog-list').scrollIntoView({behavior:'auto',block:'start'});
  });
  app.querySelector('#search').addEventListener('input',e=>{query=e.target.value;update();});
  app.querySelector('#course').addEventListener('change',e=>{course=e.target.value;update();});
  app.querySelector('#status').addEventListener('change',e=>{status=e.target.value;update();});
  clear.onclick=()=>{selectedArea='all';query='';course='';status='all';app.querySelector('#search').value='';app.querySelector('#course').value='';app.querySelector('#status').value='all';update();};
  app.querySelector('#access').addEventListener('submit',e=>{
    e.preventDefault();
    const value=e.currentTarget.elements.code.value.trim().toUpperCase();
    const match=/^TECLAB-(\d{3})$/.exec(value);
    const lab=match&&byId.get('LAB-'+match[1]);
    if(lab&&lab.status==='published')location.hash='lab-'+match[1];
    else app.querySelector('#message').textContent=lab?'Aquest laboratori encara està en preparació.':'Codi no reconegut. Prova TECLAB-001.';
  });
  update();
}
