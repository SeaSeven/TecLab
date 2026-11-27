import test from 'node:test';import assert from 'node:assert/strict';
import {CATALOG,DEVICE_GUIDES} from './catalog.js';
import {createProject,addDevice,installed,connect,disconnect,toggleProtection,toggleProgram,downloadAddress,downloadApplication,pressButton,objectConfig,evaluate,issues,loadProject,saveProject,migrateLegacy,removeDevice,wireKind} from './engine.js';
const fresh=()=>createProject();
function build(){const p=fresh(),id={};for(const type of ['mains','mcb','rcd','psu','button','button','act','act','lamp','lamp']){const r=addDevice(p,type);assert.equal(r.ok,true,`${type}: ${r.msg}`);(id[type]??=[]).push(r.id);}const v=(type,n=0,k='')=>`${id[type][n]}:${k}`;const w=(a,b)=>assert.equal(connect(p,a,b).ok,true,`${a} -> ${b}`);
 w(v('mains',0,'l'),v('mcb',0,'li'));w(v('mains',0,'n'),v('mcb',0,'ni'));w(v('mcb',0,'lo'),v('rcd',0,'li'));w(v('mcb',0,'no'),v('rcd',0,'ni'));w(v('rcd',0,'lo'),v('psu',0,'l'));w(v('rcd',0,'no'),v('psu',0,'n'));
 for(let n=0;n<2;n++){w(v('rcd',0,'lo'),v('act',n,'l'));w(v('rcd',0,'no'),v('lamp',n,'n'));w(v('act',n,'out'),v('lamp',n,'l'));}
 for(const t of ['button','act'])for(let n=0;n<2;n++){w(v('psu',0,'p'),v(t,n,'p'));w(v('psu',0,'m'),v(t,n,'m'));}
 toggleProtection(p,id.mcb[0]);toggleProtection(p,id.rcd[0]);return {p,id,v,w};}
function program(p,id){for(const [t,n,address] of [['button',0,'1.1.10'],['button',1,'1.1.11'],['act',0,'1.1.20'],['act',1,'1.1.21']]){const d=p.devices[id[t][n]];d.config.draft.address=address;assert.equal(toggleProgram(p,d.id).ok,true);assert.equal(downloadAddress(p,d.id).ok,true);d.config.draft.ga='1/0/1';assert.equal(downloadApplication(p,d.id).ok,true);}}
test('el projecte comença completament buit',()=>{const p=fresh();assert.equal(p.order.length,0);assert.equal(p.wires.length,0);});
test('es poden crear múltiples instàncies de la mateixa família',()=>{const p=fresh();const x=addDevice(p,'button'),y=addDevice(p,'button');assert.notEqual(x.id,y.id);assert.equal(installed(p,'button').length,2);});
test('els models de protecció no es dupliquen en aquest prototip',()=>{const p=fresh();assert.equal(addDevice(p,'mcb').ok,true);assert.equal(addDevice(p,'mcb').ok,false);});
test('cada port pertany a una instància independent',()=>{const p=fresh();let a=addDevice(p,'button').id,b=addDevice(p,'button').id,psu=addDevice(p,'psu').id;assert.equal(connect(p,`${psu}:p`,`${a}:p`).ok,true);assert.equal(connect(p,`${psu}:p`,`${b}:p`).ok,true);});
test('instal·lació amb dos actuadors i dos receptors queda alimentada',()=>{const {p,id}=build(),e=evaluate(p);assert.equal(e.psuPowered,true);assert.equal(e.acShort,false);assert.equal(e.busShort,false);assert.equal(e.controlledLamps.size,2);assert.equal(e.status[id.button[1]].powered,true);});
test('la programació és independent per a cada unitat',()=>{const {p,id}=build();program(p,id);assert.equal(p.devices[id.button[0]].config.loaded.address,'1.1.10');assert.equal(p.devices[id.button[1]].config.loaded.address,'1.1.11');assert.notEqual(p.devices[id.act[0]].config,p.devices[id.act[1]].config);});
test('els dos actuadors comparteixen un grup i reben ON',()=>{const {p,id}=build();program(p,id);assert.equal(evaluate(p).ready,true,'Instal·lació correcta ha d’estar preparada');const r=pressButton(p,id.button[0]);assert.equal(r.ok,true);assert.equal(p.devices[id.act[0]].relay,true);assert.equal(p.devices[id.act[1]].relay,true);assert.equal(evaluate(p).status[id.lamp[0]].on,true);assert.equal(evaluate(p).status[id.lamp[1]].on,true);});
test('el segon pulsador commuta el mateix grup a OFF',()=>{const {p,id}=build();program(p,id);pressButton(p,id.button[0]);pressButton(p,id.button[1]);assert.equal(p.devices[id.act[0]].relay,false);assert.equal(evaluate(p).status[id.lamp[1]].on,false);});
test('el projecte complet es pot guardar i carregar',()=>{const {p,id}=build();program(p,id);pressButton(p,id.button[0]);const clone=loadProject(saveProject(p));assert.equal(clone.order.length,10);assert.equal(clone.wires.length,p.wires.length);assert.equal(evaluate(clone).status[id.lamp[0]].on,true);assert.equal(clone.devices[id.button[1]].config.loaded.address,'1.1.11');});
test('adreces duplicades provoquen rebuig durant la descàrrega',()=>{const {p,id}=build();const a=p.devices[id.button[0]],b=p.devices[id.button[1]];a.config.draft.address='1.1.10';b.config.draft.address='1.1.10';toggleProgram(p,a.id);assert.equal(downloadAddress(p,a.id).ok,true);toggleProgram(p,b.id);assert.equal(downloadAddress(p,b.id).ok,false);});
test('una bombeta no s’encén sense neutre',()=>{const {p,id}=build();program(p,id);pressButton(p,id.button[0]);const lamp=id.lamp[0];p.wires=p.wires.filter(w=>!([w.a,w.b].includes(`${lamp}:n`)));assert.equal(evaluate(p).status[lamp].on,false);});
test('quan es retira un actuador es retiren els seus cables',()=>{const {p,id}=build();const act=id.act[0];const old=p.wires.length;assert.equal(removeDevice(p,act),true);assert.equal(p.wires.some(w=>w.a.startsWith(`${act}:`)||w.b.startsWith(`${act}:`)),false);assert.ok(p.wires.length<old);assert.ok(p.devices[id.act[1]]);});
test('es poden desconnectar cables individualment',()=>{const {p}=build(),n=p.wires.length;assert.equal(disconnect(p,0),true);assert.equal(p.wires.length,n-1);});
test('la connexió de CA a KNX s’identifica com a perillosa',()=>{const {p,id}=build();const a=`${id.mains[0]}:l`,b=`${id.button[0]}:p`;connect(p,a,b);assert.equal(wireKind(p,a,b),'hazard');assert.equal(evaluate(p).psuPowered,false);});
test('projectes antics v0.1.3 es poden migrar',()=>{const legacy={schema:'teclab-knx-v0.1',placed:{mains:true,mcb:true,rcd:true,psu:true,button:true,act:true,lamp:true},positions:{},wires:[{a:'psu.p',b:'button.p'},{a:'psu.m',b:'button.m'}],protection:{mcb:false,rcd:false},config:{button:{draft:{address:'1.1.10',ga:'1/0/1',dpt:'1.001'},loaded:{address:'1.1.10',ga:'1/0/1',dpt:'1.001'}},act:{draft:{address:'1.1.20',ga:'1/0/1',dpt:'1.001'},loaded:{address:'1.1.20',ga:'1/0/1',dpt:'1.001'}}}};const p=loadProject(legacy);assert.equal(p.order.length,7);assert.equal(p.wires.length,2);assert.equal(installed(p,'button')[0].config.loaded.address,'1.1.10');});
test('no es pot importar un model de dispositiu inexistent',()=>{const p=fresh(),id=addDevice(p,'button').id,s=saveProject(p);s.devices[id].model='fals';assert.throws(()=>loadProject(s),/desconegut/);});

// v0.2.1: quatre canals independents amb borns de potència propis.
function buildFour(){
 const p=createProject(), ids={};for(const m of ['mains','mcb','rcd','psu','button4','button2','act4','lamp','lamp','lamp','lamp']){const a=addDevice(p,m);assert.equal(a.ok,true,a.msg);(ids[m]??=[]).push(a.id);}
 const v=(m,c=0,port)=>`${ids[m][c]}:${port}`;const w=(a,b)=>assert.equal(connect(p,a,b).ok,true,`${a}->${b}`);
 for(const k of ['l','n'])w(v('mains',0,k),v('mcb',0,k+'i'));
 for(const k of ['l','n'])w(v('mcb',0,k+'o'),v('rcd',0,k+'i'));
 for(const k of ['l','n'])w(v('rcd',0,k+'o'),v('psu',0,k));
 for(const m of ['button4','button2','act4'])for(const k of ['p','m'])w(v('psu',0,k),v(m,0,k));
 w(v('rcd',0,'lo'),v('act4',0,'l'));w(v('rcd',0,'no'),v('act4',0,'n'));
 for(let i=0;i<4;i++){w(v('rcd',0,'lo'),v('act4',0,`in${i+1}`));w(v('act4',0,`out${i+1}`),v('lamp',i,'l'));w(v('rcd',0,'no'),v('lamp',i,'n'));}
 toggleProtection(p,ids.mcb[0]);toggleProtection(p,ids.rcd[0]);
 for(const [m,n,addr] of [['button4',4,'1.1.10'],['button2',2,'1.1.11'],['act4',4,'1.1.20']]){
  const d=p.devices[ids[m][0]];d.config.draft.address=addr;assert.equal(toggleProgram(p,d.id).ok,true);assert.equal(downloadAddress(p,d.id).ok,true);
  for(let i=0;i<n;i++)d.config.channels[i].draft.ga=`1/0/${i+1}`;
  assert.equal(downloadApplication(p,d.id).ok,true);
 }
 return {p,ids};
}
test('el catàleg té pulsador de dues tecles, de quatre tecles i actuador de quatre canals',()=>{for(const m of ['button2','button4','act4']){const p=createProject();assert.equal(addDevice(p,m).ok,true);}});
test('actuador de quatre canals: un únic bus, alimentació auxiliar i quatre parells IN/OUT independents',()=>{const {p,ids}=buildFour();const a=p.devices[ids.act4[0]];assert.equal(a.relays.length,4);assert.equal(evaluate(p).controlledLamps.size,4);assert.equal(evaluate(p).ready,true);});
test('tecles A, B, C, D controlen bombetes diferents',()=>{const {p,ids}=buildFour(),b=ids.button4[0],a=p.devices[ids.act4[0]];
 for(let i=0;i<4;i++){assert.equal(pressButton(p,b,i).ok,true);assert.equal(a.relays[i],true);for(let j=0;j<4;j++)assert.equal(a.relays[j],j<=i);const e=evaluate(p);for(let j=0;j<4;j++)assert.equal(e.status[ids.lamp[j]].on,j<=i);}
 assert.equal(pressButton(p,b,1).ok,true);assert.deepEqual(a.relays,[true,false,true,true]);assert.equal(evaluate(p).status[ids.lamp[1]].on,false);
});
test('pulsador de dues tecles pot compartir grups amb canals de l’actuador',()=>{const {p,ids}=buildFour();assert.equal(pressButton(p,ids.button2[0],1).ok,true);assert.deepEqual(p.devices[ids.act4[0]].relays,[false,true,false,false]);assert.equal(p.logs[0].sourceId.includes('Tecla B'),true);});
test('configuració multicanal es conserva en exportació i importació',()=>{const {p,ids}=buildFour();pressButton(p,ids.button4[0],3);const restored=loadProject(saveProject(p));assert.equal(restored.devices[ids.act4[0]].config.channels[3].loaded.ga,'1/0/4');assert.deepEqual(restored.devices[ids.act4[0]].relays,[false,false,false,true]);assert.equal(evaluate(restored).status[ids.lamp[3]].on,true);});
test('la desconnexió d’una sortida no fa apagar altres canals',()=>{const {p,ids}=buildFour();pressButton(p,ids.button4[0],0);pressButton(p,ids.button4[0],1);const out=`${ids.act4[0]}:out1`;p.wires=p.wires.filter(w=>w.a!==out&&w.b!==out);const e=evaluate(p);assert.equal(e.status[ids.lamp[0]].on,false);assert.equal(e.status[ids.lamp[1]].on,true);});
test('canals sense adreça de grup es mantenen desconnectats de la programació',()=>{const p=createProject(),b=addDevice(p,'button4').id;const c=p.devices[b].config;assert.equal(c.channels.length,4);assert.equal(c.channels[3].loaded.ga,'');});

// v0.2.2 - comprovacions específiques de connexions i importació.
test('actuador 4 canals requereix L/N auxiliars a més del bus',()=>{const {p,ids}=buildFour(),id=ids.act4[0];assert.equal(evaluate(p).status[id].auxPowered,true);p.wires=p.wires.filter(w=>![w.a,w.b].includes(`${id}:n`));assert.equal(evaluate(p).status[id].auxPowered,false);assert.equal(evaluate(p).ready,false);const r=pressButton(p,ids.button4[0],0);assert.equal(r.ok,false);assert.ok(evaluate(p).status[ids.lamp[0]].on===false);});
test('els canals IN/OUT són independents entre ells',()=>{const {p,ids}=buildFour(),id=ids.act4[0];pressButton(p,ids.button4[0],0);assert.deepEqual(p.devices[id].relays,[true,false,false,false]);assert.equal(evaluate(p).status[ids.lamp[0]].on,true);assert.equal(evaluate(p).status[ids.lamp[1]].on,false);});
test('la bombeta E27 invertida s’encén però genera advertiment i suspèn la validació',()=>{const {p,ids}=buildFour(),l=ids.lamp[0];p.wires=p.wires.map(w=>{const a=w.a===`${l}:l`?`${l}:n`:w.a===`${l}:n`?`${l}:l`:w.a,b=w.b===`${l}:l`?`${l}:n`:w.b===`${l}:n`?`${l}:l`:w.b;return {...w,a,b};});pressButton(p,ids.button4[0],0);const e=evaluate(p);assert.equal(e.status[l].on,true);assert.equal(e.status[l].reversed,true);assert.equal(e.ready,false);assert.ok(issues(p,e).some(x=>x.text.includes('fase i neutre invertits')));});
test('la importació de fitxers 0.2.1 reassigna els borns l1–l4 cap a in1–in4',()=>{const {p,ids}=buildFour(),id=ids.act4[0],raw=saveProject(p);for(const w of raw.wires)for(const key of ['a','b'])if(new RegExp('^'+id+':in[1-4]$').test(w[key]))w[key]=w[key].replace(':in',':l');const clone=loadProject(raw);assert.equal(clone.wires.length,p.wires.length);assert.ok(clone.wires.some(w=>[w.a,w.b].includes(`${id}:in3`)));});

// v0.2.3 - borns inferiors de l'actuador amb esquema imprès al frontal.
test('les quatre parelles IN i OUT es troben juntes a la part inferior',()=>{
 const m=CATALOG.act4;
 for(let i=1;i<=4;i++){
  const a=m.ports.find(p=>p.id===`in${i}`), b=m.ports.find(p=>p.id===`out${i}`);
  assert.equal(a.y,m.h);assert.equal(b.y,m.h);
  assert.ok(b.x>a.x);assert.ok(b.x-a.x>=34&&b.x-a.x<=52);
  if(i<4){const next=m.ports.find(p=>p.id===`in${i+1}`);assert.ok(next.x>b.x+30);}
 }
 assert.equal(m.ports.find(p=>p.id==='l').y,0);
 assert.equal(m.ports.find(p=>p.id==='n').y,0);
 assert.match(DEVICE_GUIDES.act4.tip,/parelles contigües a la part inferior/);
});
test('reposicionant els borns no altera les connexions desades ni els estats del motor',()=>{
 const {p,ids}=buildFour();const model=CATALOG.act4;
 const refs=new Set(model.ports.map(pt=>pt.id));
 assert.equal(refs.size,12);
 const before=evaluate(p);assert.equal(before.ready,true);
 const saved=saveProject(p);const restored=loadProject(saved);
 assert.deepEqual(restored.wires,p.wires);
 assert.equal(evaluate(restored).ready,true);
 assert.equal(pressButton(restored,ids.button4[0],2).ok,true);
 assert.equal(evaluate(restored).status[ids.lamp[2]].on,true);
});

// v0.3.0 — persianes KNX
import {pressShutter,advanceShutters} from './engine.js';
function buildShutter(){
 const p=createProject(),ids={};for(const model of ['mains','mcb','rcd','psu','blindButton','blindAct','shutter']){
  const r=addDevice(p,model);assert.equal(r.ok,true,r.msg);ids[model]=r.id;
 }
 const v=(m,k)=>`${ids[m]}:${k}`;
 const w=(ma,ka,mb,kb)=>assert.equal(connect(p,v(ma,ka),v(mb,kb)).ok,true,`${ma}:${ka} -> ${mb}:${kb}`);
 for(const k of ['l','n'])w('mains',k,'mcb',k+'i');
 for(const k of ['l','n'])w('mcb',k+'o','rcd',k+'i');
 for(const k of ['l','n'])w('rcd',k+'o','psu',k);
 for(const m of ['blindButton','blindAct'])for(const k of ['p','m'])w('psu',k,m,k);
 w('rcd','lo','blindAct','in');w('blindAct','up','shutter','up');w('blindAct','down','shutter','down');
 w('rcd','no','shutter','n');w('mains','pe','shutter','pe');
 toggleProtection(p,ids.mcb);toggleProtection(p,ids.rcd);
 for(const [model,address] of [['blindButton','1.1.50'],['blindAct','1.1.51']]){
  const d=p.devices[ids[model]];d.config.draft.address=address;
  assert.equal(toggleProgram(p,d.id).ok,true);
  assert.equal(downloadAddress(p,d.id).ok,true);
  d.config.channels[0].draft.ga='2/0/1';d.config.channels[1].draft.ga='2/0/2';
  assert.equal(downloadApplication(p,d.id).ok,true);
 }
 return {p,ids,v};
}
test('els nous dispositius són al catàleg per funció, amb terminals i guies',()=>{
 for(const model of ['blindButton','blindAct','shutter']){
  assert.ok(CATALOG[model],model);assert.ok(DEVICE_GUIDES[model]);
 }
 assert.deepEqual(CATALOG.blindAct.ports.filter(x=>x.connector==='screw').map(x=>x.id),['in','up','down']);
 assert.deepEqual(CATALOG.shutter.ports.map(x=>x.id),['up','down','n','pe']);
});
test('amb el muntatge complet la persiana queda preparada',()=>{
 const {p,ids}=buildShutter(),e=evaluate(p);
 assert.equal(e.psuPowered,true);assert.equal(e.controlledShutters.has(ids.shutter),true);
 assert.equal(e.ready,true);
 assert.equal(e.status[ids.shutter].position,50);
 assert.equal(p.devices[ids.blindButton].config.channels[0].loaded.dpt,'1.008');
 assert.equal(p.devices[ids.blindButton].config.channels[1].loaded.dpt,'1.007');
});
test('baixar, aturar i pujar modifiquen la posició sense activar dos sentits',()=>{
 const {p,ids}=buildShutter();
 assert.equal(pressShutter(p,ids.blindButton,'down').ok,true);
 assert.equal(p.devices[ids.blindAct].shutterDirection,'down');
 assert.equal(evaluate(p).status[ids.shutter].up,false);assert.equal(evaluate(p).status[ids.shutter].down,true);
 assert.equal(advanceShutters(p,3),true);assert.equal(p.devices[ids.shutter].shadePosition,75);
 assert.equal(pressShutter(p,ids.blindButton,'stop').ok,true);
 assert.equal(advanceShutters(p,2),false);assert.equal(p.devices[ids.shutter].shadePosition,75);
 assert.equal(pressShutter(p,ids.blindButton,'up').ok,true);assert.equal(advanceShutters(p,3),true);
 assert.equal(p.devices[ids.shutter].shadePosition,50);
 assert.equal(evaluate(p).status[ids.shutter].shortDirections,false);
 assert.deepEqual(p.logs.slice(0,3).map(l=>l.value),['0 · PUJAR','STOP','1 · BAIXAR']);
});
test('el final de carrera limita el recorregut de la persiana',()=>{
 const {p,ids}=buildShutter();pressShutter(p,ids.blindButton,'down');
 advanceShutters(p,9);assert.equal(p.devices[ids.shutter].shadePosition,100);
 assert.equal(evaluate(p).status[ids.shutter].moving,false);
 pressShutter(p,ids.blindButton,'up');advanceShutters(p,9);
 assert.equal(p.devices[ids.shutter].shadePosition,25);
 advanceShutters(p,9);assert.equal(p.devices[ids.shutter].shadePosition,0);
});
test('falten neutre o PE: no es permet el moviment i la diagnosi avisa',()=>{
 for(const terminalMissing of ['n','pe']){
  const {p,ids,v}=buildShutter();p.wires=p.wires.filter(w=>w.a!==v('shutter',terminalMissing)&&w.b!==v('shutter',terminalMissing));
  pressShutter(p,ids.blindButton,'down');assert.equal(advanceShutters(p,2),false);
  assert.equal(evaluate(p).ready,false);
  if(terminalMissing==='pe')assert.ok(issues(p).some(x=>/falta.*PE/.test(x.text)));
 }
});
test('pujada i baixada alimentades simultàniament queden bloquejades',()=>{
 const {p,ids,v}=buildShutter();
 // Una connexió errònia pot alimentar les dues vies encara que el relé estigui enclavat.
 assert.equal(connect(p,v('blindAct','up'),v('shutter','down')).ok,true);
 pressShutter(p,ids.blindButton,'up');
 assert.equal(evaluate(p).status[ids.shutter].shortDirections,true);
 assert.equal(advanceShutters(p,2),false);
 assert.equal(evaluate(p).ready,false);
});
test('sense grup descarregat a la persiana no es transmet una ordre',()=>{
 const {p,ids}=buildShutter();
 p.devices[ids.blindAct].config.channels[0].loaded.ga='2/0/99';
 assert.equal(pressShutter(p,ids.blindButton,'down').ok,false);
 assert.equal(p.devices[ids.blindAct].shutterDirection,'stop');
});
test('els fitxers de projecte recuperen la posició i els grups 1.008 / 1.007',()=>{
 const {p,ids}=buildShutter();pressShutter(p,ids.blindButton,'down');advanceShutters(p,4);
 const recovered=loadProject(saveProject(p));
 assert.equal(recovered.devices[ids.shutter].shadePosition,p.devices[ids.shutter].shadePosition);
 assert.equal(recovered.devices[ids.blindAct].config.channels[0].loaded.dpt,'1.008');
 assert.equal(recovered.devices[ids.blindAct].config.channels[1].loaded.dpt,'1.007');
 assert.equal(evaluate(recovered).status[ids.shutter].moving,true);
});

// v0.3.1 - terminals documentats segons la tipologia sense alimentació auxiliar
test('actuador de persiana: L/COM, UP, DOWN i bus KNX; sense neutre auxiliar',()=>{
 const a=CATALOG.blindAct;
 assert.deepEqual(a.ports.map(p=>p.id),['p','m','in','up','down']);
 assert.equal(a.ports.find(p=>p.id==='in').name,'L / COM');
 assert.equal(a.ports.filter(p=>p.kind==='ac-n').length,0);
 assert.match(DEVICE_GUIDES.blindAct.summary,/no necessita neutre auxiliar/);
});
test('motor de persiana mostra els noms de borns i reserva una franja visual',()=>{
 const m=CATALOG.shutter;
 assert.deepEqual(m.ports.map(p=>p.name),['↑ PUJAR','↓ BAIXAR','N','PE']);
 assert.ok(m.h>=240);
 const {p,ids}=buildShutter();assert.ok(evaluate(p).ready);
});
test('el cablejat L/COM del projecte 0.3.0 continua sent compatible',()=>{
 const {p,ids,v}=buildShutter();
 const p2=loadProject(saveProject(p));
 assert.ok(p2.wires.some(w=>[w.a,w.b].includes(v('blindAct','in'))));
 assert.equal(evaluate(p2).controlledShutters.has(ids.shutter),true);
});

// v0.3.1-r3 — DPT 1.001, 1.008 i 1.007 configurables als pulsadors genèrics.
test('tots els pulsadors genèrics permeten el DPT de persianes per cada tecla',()=>{
 for(const model of ['button','button2','button4']){const p=createProject(),id=addDevice(p,model).id;for(let i=0;i<(CATALOG[model].channels||1);i++){const obj=objectConfig(p.devices[id],i);obj.draft.dpt=i%2?'1.007':'1.008';obj.draft.value=i%2?'1':'0';obj.draft.ga=`2/0/${i+1}`;assert.equal(obj.draft.dpt,i%2?'1.007':'1.008');}}
});
function genericShutter(){const {p,ids}=buildShutter();const custom=addDevice(p,'button4');assert.equal(custom.ok,true);ids.button4=custom.id;
 for(const k of ['p','m'])assert.equal(connect(p,`${ids.psu}:${k}`,`${custom.id}:${k}`).ok,true);
 const d=p.devices[custom.id];d.config.draft.address='1.1.52';assert.equal(toggleProgram(p,d.id).ok,true);assert.equal(downloadAddress(p,d.id).ok,true);
 const types=[['1.008','0','2/0/1'],['1.008','1','2/0/1'],['1.007','0','2/0/2'],['1.001','0','1/0/4']];for(let i=0;i<4;i++){const o=d.config.channels[i].draft;[o.dpt,o.value,o.ga]=types[i];}
 assert.equal(downloadApplication(p,d.id).ok,true);return {p,ids};}
test('pulsador 4 tecles envia pujar, baixar i aturar als grups de persiana',()=>{
 const {p,ids}=genericShutter(),d=ids.button4,a=p.devices[ids.blindAct],motor=p.devices[ids.shutter];
 assert.equal(evaluate(p).ready,true);
 assert.equal(pressButton(p,d,1).ok,true);assert.equal(a.shutterDirection,'down');advanceShutters(p,3);assert.equal(motor.shadePosition,75);
 assert.equal(pressButton(p,d,2).ok,true);assert.equal(a.shutterDirection,'stop');advanceShutters(p,2);assert.equal(motor.shadePosition,75);
 assert.equal(pressButton(p,d,0).ok,true);assert.equal(a.shutterDirection,'up');advanceShutters(p,3);assert.equal(motor.shadePosition,50);
 assert.deepEqual(p.logs.slice(0,3).map(x=>x.value),['0 · PUJAR','0 · PAS/ATURAR','1 · BAIXAR']);
});
test('el DPT 1.001 es manté compatible amb commutació de bombeta',()=>{const {p,id}=build();program(p,id);const r=pressButton(p,id.button[0]);assert.equal(r.ok,true);assert.equal(evaluate(p).status[id.lamp[0]].on,true);});
test('DPT i valor del pulsador es conserven en desar i obrir el projecte',()=>{
 const {p,ids}=genericShutter();const q=loadProject(saveProject(p));const b=q.devices[ids.button4];
 assert.equal(b.config.channels[1].loaded.dpt,'1.008');assert.equal(b.config.channels[1].loaded.value,'1');
 assert.equal(b.config.channels[2].loaded.dpt,'1.007');assert.equal(b.config.channels[2].draft.value,'0');
 assert.equal(pressButton(q,ids.button4,1).ok,true);assert.equal(q.devices[ids.blindAct].shutterDirection,'down');
});
test('el pulsador no mou la persiana si no coincideixen el grup o el DPT',()=>{
 const {p,ids}=genericShutter();const b=p.devices[ids.button4];
 b.config.channels[0].loaded.dpt='1.001';assert.equal(pressButton(p,ids.button4,0).ok,false);
 b.config.channels[0].loaded.dpt='1.008';b.config.channels[0].loaded.ga='2/0/99';assert.equal(pressButton(p,ids.button4,0).ok,false);
 assert.equal(p.devices[ids.blindAct].shutterDirection,'stop');
});
test('DPT no permès es rebutja i no altera els DPT carregats',()=>{
 const {p,ids}=genericShutter();const b=p.devices[ids.button4];b.config.channels[0].draft.dpt='5.001';
 const r=downloadApplication(p,ids.button4);assert.equal(r.ok,false);assert.match(r.msg,/DPT incompatible/);
 assert.equal(b.config.channels[0].loaded.dpt,'1.008');
});
test('un projecte antic sense camp value continua sent compatible',()=>{
 const {p,ids}=genericShutter();const old=saveProject(p);
 for(const id of old.order){const c=old.devices[id].config;if(!c)continue;delete c.draft.value;delete c.loaded.value;for(const ch of c.channels||[]){delete ch.draft.value;delete ch.loaded.value;}}
 const restored=loadProject(old),b=restored.devices[ids.button4];
 assert.equal(b.config.channels[0].loaded.dpt,'1.008');assert.equal(b.config.channels[0].loaded.value,'0');
 assert.equal(pressButton(restored,ids.button4,1).ok,true);
});

// v0.3.1-r5: PROG és un estat de la unitat, no una propietat de la pestanya.
test('PROG manté l’estat fins a una segona pulsació o una descàrrega d’adreça',()=>{
 const {p,id}=build();const a=id.button[0],b=id.button[1];
 assert.equal(toggleProgram(p,a).ok,true);
 assert.equal(p.devices[a].config.programLed,true);
 assert.equal(p.devices[b].config.programLed,false,'Altres dispositius no canvien');
 assert.equal(evaluate(p).status[a].powered,true);
 assert.equal(p.devices[a].config.programLed,true,'Avaluar o canviar de vista no reinicia PROG');
 assert.equal(toggleProgram(p,a).ok,true);
 assert.equal(p.devices[a].config.programLed,false);
 assert.equal(toggleProgram(p,a).ok,true);
 p.devices[a].config.draft.address='1.1.100';
 assert.equal(downloadAddress(p,a).ok,true);
 assert.equal(p.devices[a].config.programLed,false,'Descarregar adreça tanca el mode de programació');
});
