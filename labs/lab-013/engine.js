import {CATALOG,MODEL_ORDER,PROGRAMMABLE,INPUT_MODELS,OUTPUT_MODELS,channelCount,BOARD,terminal,terminalRef,SHUTTER_ACTUATORS,SHUTTER_SENDERS,defaultDpt,GENERIC_BUTTONS,allowedDpt} from './catalog.js';
export const SCHEMA='teclab-knx-v0.2';
const addressRE=/^(\d{1,2})\.(\d{1,2})\.(\d{1,3})$/;
const groupRE=/^(\d{1,2})\/(\d{1,2})\/(\d{1,3})$/;
export const isAddress=s=>{const m=addressRE.exec(String(s??'').trim());return !!m&&+m[1]>=1&&+m[1]<=15&&+m[2]<=15&&+m[3]>=1&&+m[3]<=255;};
export const isGroup=s=>{const m=groupRE.exec(String(s??'').trim());return !!m&&+m[1]<=31&&+m[2]<=7&&+m[3]<=255&&(+m[1]+ +m[2]+ +m[3])>0;};
export const blankConfig=(channels=1,model='')=>({draft:{address:'',ga:'',dpt:defaultDpt(model,0),value:'0'},loaded:{address:'',ga:'',dpt:defaultDpt(model,0),value:'0'},programLed:false,channels:channels>1?Array.from({length:channels},(_,i)=>({draft:{ga:'',dpt:defaultDpt(model,i),value:'0'},loaded:{ga:'',dpt:defaultDpt(model,i),value:'0'}})):[]});
export function objectConfig(device,channel=0){if(!device?.config)return null;const count=channelCount(device.model);if(!Number.isInteger(channel)||channel<0||channel>=count)return null;return count===1?device.config:device.config.channels?.[channel]||null;}
export function relayState(device,channel=0){return device?.model==='act4'?device.relays?.[channel]===true:device?.model==='act'?device.relay===true:false;}
export function setRelay(device,channel,value){if(!device||!OUTPUT_MODELS.has(device.model))return false;if(device.model==='act4'){if(channel<0||channel>=4)return false;device.relays[channel]=!!value;}else if(channel===0)device.relay=!!value;else return false;return true;}
export function modelChannels(device){return CATALOG[device?.model]?.objects||[];}
export function channelLabel(device,index){return modelChannels(device)[index]?.label||`Canal ${index+1}`;}
export function createProject(){return {schema:SCHEMA,devices:{},order:[],nextId:1,wires:[],groupValues:{},logs:[]};}
export function installed(p,model){return p.order.map(id=>p.devices[id]).filter(d=>d?.model===model);}
export function deviceByModel(p,model){return installed(p,model)[0]||null;}
export function preferredPosition(p,model,point){
 const m=CATALOG[model];if(!m)return null;
 if(m.mount==='panel')return {x:BOARD.sourceX,y:Math.max(225,Math.min(BOARD.wallTop-m.h-20,point?.y??BOARD.sourceY))};
 if(m.mount==='din'){
  const rows=point?.y!=null?[...BOARD.dinRows].sort((a,b)=>Math.abs(a-point.y)-Math.abs(b-point.y)):BOARD.dinRows;
  const candidates=[];for(const row of rows)for(let x=242;x<=BOARD.width-m.w-23;x+=10){
   const collides=p.order.some(id=>{const d=p.devices[id],o=CATALOG[d.model];return o.mount==='din'&&d.position.y===row&&x<d.position.x+o.w+12&&x+m.w+12>d.position.x;});
   if(!collides)candidates.push({x,y:row});
  }
  if(!candidates.length)return null;
  const destX=point?.x==null?255:point.x-m.w/2;
  return candidates.sort((a,b)=>(Math.abs(a.y-(point?.y??BOARD.dinRows[0]))*1.2+Math.abs(a.x-destX))-(Math.abs(b.y-(point?.y??BOARD.dinRows[0]))*1.2+Math.abs(b.x-destX)))[0];
 }
 let x=point?.x==null?75+(p.order.length%6)*225:point.x-m.w/2;
 let y=point?.y==null?BOARD.wallTop+88:point.y-m.h/2;
 x=Math.max(26,Math.min(BOARD.width-m.w-22,x));y=Math.max(BOARD.wallTop+62,Math.min(BOARD.height-m.h-20,y));
 for(let k=0;k<15;k++){const occupied=p.order.some(id=>{const d=p.devices[id],o=CATALOG[d.model];return o.mount==='wall'&&Math.abs(x-d.position.x)<Math.max(o.w,m.w)-5&&Math.abs(y-d.position.y)<Math.max(o.h,m.h)-10;});if(!occupied)break;x=Math.max(26,Math.min(BOARD.width-m.w-22,x+165));}
 return {x,y};
}
export function addDevice(p,model,point){const m=CATALOG[model];if(!m)return {ok:false,msg:'Model no disponible.'};if(m.single&&installed(p,model).length)return {ok:false,msg:`Només es permet un exemplar de ${m.title} en aquesta versió.`};const pos=preferredPosition(p,model,point);if(!pos)return {ok:false,msg:'No queda espai lliure al carril DIN. Reorganitza els equips.'};const id=`u${p.nextId++}`,d={id,model,position:pos,protection:false,relay:false,relays:model==='act4'?[false,false,false,false]:null,shutterDirection:model==='blindAct'?'stop':null,shadePosition:model==='shutter'?50:null,travelSec:model==='shutter'?12:null,config:PROGRAMMABLE.has(model)?blankConfig(channelCount(model),model):null};p.devices[id]=d;p.order.push(id);return {ok:true,id,msg:`${m.title} col·locat (${id}).`};}
export function moveDevice(p,id,point){const d=p.devices[id],m=CATALOG[d?.model];if(!d||!m||!point)return false;const x=Math.max(m.mount==='din'?242:m.mount==='panel'?BOARD.sourceX:25,Math.min(m.mount==='panel'?BOARD.sourceX:BOARD.width-m.w-22,point.x-m.w/2));const y=m.mount==='din'?[...BOARD.dinRows].sort((a,b)=>Math.abs(a-point.y)-Math.abs(b-point.y))[0]:m.mount==='panel'?Math.max(225,Math.min(BOARD.wallTop-m.h-20,point.y-m.h/2)):Math.max(BOARD.wallTop+62,Math.min(BOARD.height-m.h-20,point.y-m.h/2));d.position={x:m.mount==='din'?Math.round(x/10)*10:x,y};return true;}
export function removeDevice(p,id){if(!p.devices[id])return false;delete p.devices[id];p.order=p.order.filter(k=>k!==id);p.wires=p.wires.filter(w=>terminal(p,w.a)&&terminal(p,w.b));return true;}
export function wireKind(p,a,b){const k=terminal(p,a)?.port.kind,l=terminal(p,b)?.port.kind;if(!k||!l)return 'invalid';if(k.startsWith('ac')&&l.startsWith('ac'))return k===l?k:'ac-mixed';if(k.startsWith('bus')&&l.startsWith('bus'))return k===l?k:'bus-mixed';return 'hazard';}
export function connect(p,a,b){if(!terminal(p,a)||!terminal(p,b)||a===b)return {ok:false,msg:'Selecciona dos terminals diferents i instal·lats.'};if(p.wires.some(w=>w.a===a&&w.b===b||w.a===b&&w.b===a))return {ok:false,msg:'Ja existeix aquest conductor.'};p.wires.push({a,b,route:0,offset:0});return {ok:true,msg:wireKind(p,a,b)==='hazard'?'Connexió perillosa entre circuits de diferent tensió.':'Conductor connectat.'};}
export function disconnect(p,i){if(i<0||i>=p.wires.length)return false;p.wires.splice(i,1);return true;}
function graph(p,domain,options={}){
 const refs=p.order.flatMap(id=>CATALOG[p.devices[id].model].ports.filter(t=>t.kind.startsWith(domain)).map(t=>terminalRef(id,t.id)));
 const parent=new Map(refs.map(r=>[r,r]));const root=a=>{if(!parent.has(a))return null;let b=a;while(parent.get(b)!==b){parent.set(b,parent.get(parent.get(b)));b=parent.get(b);}return b;};
 const join=(a,b)=>{const x=root(a),y=root(b);if(x!==null&&y!==null&&x!==y)parent.set(x,y);};
 for(const w of p.wires)if(wireKind(p,w.a,w.b)!=='invalid'&&wireKind(p,w.a,w.b)!=='hazard')join(w.a,w.b);
 if(domain==='ac')for(const id of p.order){const d=p.devices[id];if(['mcb','rcd'].includes(d.model)&&(options.protections?.[id]??d.protection)){join(terminalRef(id,'li'),terminalRef(id,'lo'));join(terminalRef(id,'ni'),terminalRef(id,'no'));}if(d.model==='blindAct'){const dir=options.shutterDirections?.[id]??d.shutterDirection;if(dir==='up'||dir==='down')join(terminalRef(id,'in'),terminalRef(id,dir));}
  if(OUTPUT_MODELS.has(d.model))for(let c=0;c<channelCount(d.model);c++){ 
  const override=options.relays?.[id],isClosed=typeof override==='boolean'?override:Array.isArray(override)?override[c]===true:relayState(d,c);
  if(isClosed)join(terminalRef(id,d.model==='act4'?`in${c+1}`:'l'),terminalRef(id,d.model==='act4'?`out${c+1}`:'out'));
 }}
 return {connected:(a,b)=>root(a)!==null&&root(a)===root(b)};
}
export function evaluate(p){
 const source=deviceByModel(p,'mains'),psu=deviceByModel(p,'psu'),mcb=deviceByModel(p,'mcb'),rcd=deviceByModel(p,'rcd');
 const sourceL=source&&terminalRef(source.id,'l'),sourceN=source&&terminalRef(source.id,'n');
 const ac=graph(p,'ac'),bus=graph(p,'bus');const live=ref=>!!sourceL&&ac.connected(sourceL,ref),neutral=ref=>!!sourceN&&ac.connected(sourceN,ref);
 const hazards=p.wires.filter(w=>wireKind(p,w.a,w.b)==='hazard');
 const sourcePE=source&&terminalRef(source.id,'pe');
 const acShort=!!sourceL&&ac.connected(sourceL,sourceN);
 const peFault=!!sourcePE&&(ac.connected(sourcePE,sourceL)||ac.connected(sourcePE,sourceN));
 const busShort=!!psu&&bus.connected(terminalRef(psu.id,'p'),terminalRef(psu.id,'m'));
 const safeAC=!acShort&&!peFault&&!hazards.length;const psuPowered=!!psu&&safeAC&&live(terminalRef(psu.id,'l'))&&neutral(terminalRef(psu.id,'n'));
 const noMCB=mcb?graph(p,'ac',{protections:{[mcb.id]:false}}):null;
 const noRCD=rcd?graph(p,'ac',{protections:{[rcd.id]:false}}):null;
 const sinks=p.order.flatMap(id=>{const d=p.devices[id];if(d.model==='psu')return [terminalRef(id,'l'),terminalRef(id,'n')];if(d.model==='act4')return [terminalRef(id,'l'),terminalRef(id,'n'),...[1,2,3,4].map(c=>terminalRef(id,`in${c}`))];if(d.model==='blindAct')return [terminalRef(id,'in')];if(d.model==='shutter')return [terminalRef(id,'n')];if(OUTPUT_MODELS.has(d.model))return [terminalRef(id,'l')];if(d.model==='lamp')return [terminalRef(id,'n')];return [];});
 const bypassIn=g=>!g||sinks.some(s=>{const t=terminal(p,s);return t?.port.kind==='ac-n'?g.connected(sourceN,s):g.connected(sourceL,s);});
 const bypassMcb=!!source&&!mcb||!!mcb&&bypassIn(noMCB);
 const bypassRcd=!!source&&!rcd||!!rcd&&bypassIn(noRCD);
 const poweredBus=psuPowered&&!busShort;
 const status={};
 for(const id of p.order){const d=p.devices[id],m=CATALOG[d.model];
  if(INPUT_MODELS.has(d.model)||OUTPUT_MODELS.has(d.model)||SHUTTER_ACTUATORS.has(d.model)){
   const plus=psu&&bus.connected(terminalRef(psu.id,'p'),terminalRef(id,'p'));
   const minus=psu&&bus.connected(terminalRef(psu.id,'m'),terminalRef(id,'m'));
   const reversed=!!psu&&(bus.connected(terminalRef(psu.id,'p'),terminalRef(id,'m'))||bus.connected(terminalRef(psu.id,'m'),terminalRef(id,'p')));
   const auxPowered=d.model==='act4'?!!(safeAC&&live(terminalRef(id,'l'))&&neutral(terminalRef(id,'n'))):true;
   status[id]={powered:!!(poweredBus&&plus&&minus),auxPowered,reversed};
  }
  if(m.kind==='protection')status[id]={closed:!!d.protection};
  if(m.kind==='shutter'){const up=!!(safeAC&&live(terminalRef(id,'up'))),down=!!(safeAC&&live(terminalRef(id,'down'))),hasN=!!(safeAC&&neutral(terminalRef(id,'n'))),hasPE=!!sourcePE&&ac.connected(sourcePE,terminalRef(id,'pe'));const shortDirections=up&&down;const travel=Number.isFinite(d.travelSec)?d.travelSec:12;const pos=Number.isFinite(d.shadePosition)?Math.max(0,Math.min(100,d.shadePosition)):0;const direction=!shortDirections&&hasN&&hasPE&&up!==down?(up?'up':'down'):'stop';status[id]={direction,up,down,hasN,hasPE,shortDirections,position:pos,travelSec:travel,moving:direction==='up'?pos>0:direction==='down'?pos<100:false};}
  if(m.kind==='lamp'){const correct=!!(safeAC&&live(terminalRef(id,'l'))&&neutral(terminalRef(id,'n'))),reversed=!!(safeAC&&live(terminalRef(id,'n'))&&neutral(terminalRef(id,'l')));status[id]={on:correct||reversed,reversed,correct};}
 }
 const allProgrammed=p.order.filter(id=>PROGRAMMABLE.has(p.devices[id].model));const duplicates=new Set();
 for(let i=0;i<allProgrammed.length;i++)for(let j=i+1;j<allProgrammed.length;j++){const a=p.devices[allProgrammed[i]].config.loaded.address,b=p.devices[allProgrammed[j]].config.loaded.address;if(a&&a===b)duplicates.add(a);}
 const controlledLamps=new Set();
 for(const lamp of installed(p,'lamp')){const open=graph(p,'ac',{relays:Object.fromEntries(p.order.filter(id=>OUTPUT_MODELS.has(p.devices[id].model)).map(id=>[id,false]))}),on=graph(p,'ac',{relays:Object.fromEntries(p.order.filter(id=>OUTPUT_MODELS.has(p.devices[id].model)).map(id=>[id,true]))});if(sourceL&&on.connected(sourceL,terminalRef(lamp.id,'l'))&&!open.connected(sourceL,terminalRef(lamp.id,'l'))&&neutral(terminalRef(lamp.id,'n')))controlledLamps.add(lamp.id);}
 const controlledShutters=new Set();
 for(const motor of installed(p,'shutter')){const upGraph=graph(p,'ac',{shutterDirections:Object.fromEntries(installed(p,'blindAct').map(a=>[a.id,'up']))}),downGraph=graph(p,'ac',{shutterDirections:Object.fromEntries(installed(p,'blindAct').map(a=>[a.id,'down']))}),openGraph=graph(p,'ac',{shutterDirections:Object.fromEntries(installed(p,'blindAct').map(a=>[a.id,'stop']))});const m=motor.id; if(sourceL&&upGraph.connected(sourceL,terminalRef(m,'up'))&&downGraph.connected(sourceL,terminalRef(m,'down'))&&!openGraph.connected(sourceL,terminalRef(m,'up'))&&!openGraph.connected(sourceL,terminalRef(m,'down'))&&neutral(terminalRef(m,'n'))&&status[m]?.hasPE&&!status[m]?.shortDirections)controlledShutters.add(m);}
 const addressesValid=allProgrammed.length>0&&allProgrammed.every(id=>{const addr=p.devices[id].config.loaded.address;return isAddress(addr)&&addr.startsWith('1.1.')&&!duplicates.has(addr);});
 const senders=p.order.map(id=>p.devices[id]).filter(d=>INPUT_MODELS.has(d.model));const receivers=p.order.map(id=>p.devices[id]).filter(d=>OUTPUT_MODELS.has(d.model));
 const linkedSwitch=senders.some(b=>Array.from({length:channelCount(b.model)},(_,i)=>objectConfig(b,i)?.loaded).some(bc=>bc&&isGroup(bc.ga)&&bc.dpt==='1.001'&&receivers.some(a=>Array.from({length:channelCount(a.model)},(_,i)=>objectConfig(a,i)?.loaded).some(ac=>ac?.ga===bc.ga&&ac.dpt==='1.001'))));
 const matchShutter=dpt=>senders.some(b=>Array.from({length:channelCount(b.model)},(_,i)=>objectConfig(b,i)?.loaded).some(o=>o?.dpt===dpt&&isGroup(o.ga)&&installed(p,'blindAct').some(a=>{const idx=dpt==='1.008'?0:1,ao=objectConfig(a,idx)?.loaded;return ao?.ga===o.ga&&ao?.dpt===dpt;})));
 const linkedShutter=matchShutter('1.008')&&matchShutter('1.007');
 const linked=linkedSwitch||linkedShutter;
 const safeLampholders=!installed(p,'lamp').some(d=>status[d.id]?.reversed);
 const ready=(senders.length>0||installed(p,'blindButton').length>0)&&(receivers.length>0||installed(p,'blindAct').length>0)&&(controlledLamps.size>0||controlledShutters.size>0)&&psuPowered&&!bypassMcb&&!bypassRcd&&addressesValid&&linked&&safeLampholders&&p.order.filter(id=>PROGRAMMABLE.has(p.devices[id].model)).every(id=>status[id].powered&&status[id].auxPowered!==false)&&!hazards.length&&!acShort&&!peFault&&!busShort&&!installed(p,'shutter').some(d=>status[d.id]?.shortDirections||!status[d.id]?.hasPE);
 return {status,source,psu,mcb,rcd,psuPowered,acShort,busShort,hazards,bypassMcb,bypassRcd,controlledLamps,controlledShutters,peFault,duplicates,addressesValid,linked,ready};
}
export function issues(p,e=evaluate(p)){
 const list=[];const push=(severity,text)=>list.push({severity,text});
 if(!p.order.length)push('info','El plànol és buit. Selecciona els equips de la caixa de material.');
 if(e.hazards.length)push('danger','Un conductor uneix la instal·lació de 230 V amb el bus KNX.');
 if(e.acShort)push('danger','Curtcircuit entre fase i neutre: alimentació bloquejada.');
 if(e.peFault)push('danger','Connexió incorrecta: el conductor PE ha quedat unit a fase o neutre.');
 if(e.busShort)push('danger','Curtcircuit entre + i − del bus KNX.');
 if(e.bypassMcb||e.bypassRcd)push('error','Una alimentació no passa per totes les proteccions requerides.');
 if(!e.psuPowered)push('info','La font KNX encara no rep una alimentació correcta.');
 if(p.order.some(id=>PROGRAMMABLE.has(p.devices[id].model)&&e.status[id]?.reversed))push('error','S’ha invertit la polaritat del bus en algun dispositiu.');
 for(const d of installed(p,'act4'))if(!e.status[d.id]?.auxPowered)push('error',`${d.id}: l’actuador de 4 canals necessita alimentació auxiliar 230 V als borns L/N.`);
 for(const d of installed(p,'shutter')){const s=e.status[d.id];if(!s?.hasPE)push('error',`${d.id}: falta el conductor de protecció PE del motor.`);if(s?.shortDirections)push('danger',`${d.id}: fase simultània a PUJAR i BAIXAR. Moviment bloquejat.`);if(!s?.hasN)push('info',`${d.id}: el motor necessita el neutre N.`);}
 for(const d of installed(p,'lamp'))if(e.status[d.id]?.reversed)push('error',`${d.id}: connexió insegura: fase i neutre invertits al portalàmpades E27. La bombeta pot encendre’s, però cal corregir-la.`);
 if(e.duplicates.size)push('error',`Adreça física duplicada: ${[...e.duplicates].join(', ')}.`);
 if(!e.addressesValid&&p.order.some(id=>PROGRAMMABLE.has(p.devices[id].model)))push('info','Cal descarregar adreces físiques diferents als dispositius KNX.');
 if(!e.linked&&p.order.some(id=>INPUT_MODELS.has(p.devices[id].model))&&p.order.some(id=>OUTPUT_MODELS.has(p.devices[id].model)||SHUTTER_ACTUATORS.has(p.devices[id].model)))push('info','Els objectes de commutació no comparteixen cap adreça de grup carregada.');
 if(installed(p,'lamp').length&&!e.controlledLamps.size)push('info','Cap bombeta té un circuit de fase controlat exclusivament per un relé.');
 if(installed(p,'shutter').length&&!e.controlledShutters.size)push('info','El motor de persiana no té les dues fases de moviment controlades per l’actuador.');
 if(e.ready)push('success','Instal·lació preparada: comprova la commutació o la persiana amb els pulsadors.');
 return list;
}
export function toggleProtection(p,id){const d=p.devices[id];if(!d||!['mcb','rcd'].includes(d.model))return false;d.protection=!d.protection;return true;}
export function toggleProgram(p,id){const d=p.devices[id],e=evaluate(p);if(!d||!PROGRAMMABLE.has(d.model)||!e.status[id]?.powered)return {ok:false,msg:'Aquest dispositiu ha de rebre alimentació KNX abans de programar-se.'};d.config.programLed=!d.config.programLed;return {ok:true,msg:`LED PROG ${d.config.programLed?'activat':'desactivat'} (${id}).`};}
export function downloadAddress(p,id){const d=p.devices[id],e=evaluate(p);if(!d||!PROGRAMMABLE.has(d.model))return {ok:false,msg:'Dispositiu no programable.'};if(!e.status[id]?.powered)return {ok:false,msg:'Dispositiu sense alimentació de bus.'};if(!d.config.programLed)return {ok:false,msg:'Prem primer PROG.'};const addr=d.config.draft.address.trim();if(!isAddress(addr)||!addr.startsWith('1.1.'))return {ok:false,msg:'Adreça invàlida: utilitza 1.1.1 a 1.1.255.'};if(p.order.some(other=>other!==id&&p.devices[other].config?.loaded.address===addr))return {ok:false,msg:'L’adreça física ja està assignada.'};d.config.loaded.address=addr;d.config.programLed=false;return {ok:true,msg:`Adreça física ${addr} descarregada a ${id}.`};}
export function downloadApplication(p,id){
 const d=p.devices[id],e=evaluate(p);if(!d||!PROGRAMMABLE.has(d.model))return {ok:false,msg:'Dispositiu no programable.'};
 if(!e.status[id]?.powered)return {ok:false,msg:'Dispositiu sense alimentació de bus.'};
 if(!isAddress(d.config.loaded.address))return {ok:false,msg:'Descarrega primer l’adreça física.'};
 const groups=Array.from({length:channelCount(d.model)},(_,i)=>objectConfig(d,i)?.draft);
 if(!groups.some(o=>o?.ga.trim()))return {ok:false,msg:'Defineix almenys una adreça de grup.'};
 if(groups.some(o=>o?.ga.trim()&&!isGroup(o.ga)))return {ok:false,msg:'Hi ha una adreça de grup invàlida.'};
 if(groups.some((o,i)=>o?.ga.trim()&&!allowedDpt(d.model,i,o.dpt)))return {ok:false,msg:'DPT incompatible amb aquest objecte KNX.'};
 if(groups.some(o=>o?.ga.trim()&&GENERIC_BUTTONS.has(d.model)&&!['0','1'].includes(o.value)))return {ok:false,msg:'El valor de telegrama ha de ser 0 o 1.'};
 for(let i=0;i<groups.length;i++){const cfg=objectConfig(d,i);cfg.loaded.ga=cfg.draft.ga.trim();cfg.loaded.dpt=cfg.draft.dpt;cfg.loaded.value=cfg.draft.value;}
 return {ok:true,msg:`Aplicació carregada a ${id}, ${groups.filter(o=>o.ga.trim()).length} objecte(s) amb adreça de grup.`};
}
export function pressButton(p,id,channel=0){
 const b=p.devices[id],e=evaluate(p);if(!b||!INPUT_MODELS.has(b.model))return {ok:false,msg:'Selecciona un pulsador.'};
 if(!e.status[id]?.powered)return {ok:false,msg:'Pulsador sense alimentació KNX.'};
 const cfg=objectConfig(b,channel)?.loaded;if(!cfg)return {ok:false,msg:'Tecla no disponible.'};
 const {ga,dpt}=cfg,address=b.config.loaded.address;
 if(!isAddress(address)||!isGroup(ga)||!allowedDpt(b.model,channel,dpt))return {ok:false,msg:'La tecla no té una adreça de grup i un DPT carregats vàlids.'};
 if(dpt==='1.008'||dpt==='1.007'){
  const bit=cfg.value;if(bit!=='0'&&bit!=='1')return {ok:false,msg:'El valor KNX de la tecla ha de ser 0 o 1.'};
  const received=[],action=dpt==='1.007'?'stop':bit==='0'?'up':'down',idx=dpt==='1.008'?0:1;
  for(const act of installed(p,'blindAct')){const ac=objectConfig(act,idx)?.loaded;if(!e.status[act.id]?.powered||!isAddress(act.config.loaded.address)||act.config.loaded.address===address||e.duplicates.has(act.config.loaded.address)||ac?.ga!==ga||ac?.dpt!==dpt)continue;act.shutterDirection=action;received.push(act.id);}
  const value=dpt==='1.008'?`${bit} · ${action==='up'?'PUJAR':'BAIXAR'}`:`${bit} · PAS/ATURAR`;
  p.logs.unshift({time:new Date().toLocaleTimeString('ca-ES',{hour12:false}),source:address,sourceId:`${id} · ${channelLabel(b,channel)}`,ga,value,service:'GroupValueWrite',dest:received.join(', ')||'Sense receptor'});p.logs=p.logs.slice(0,80);
  return {ok:received.length>0,msg:received.length?`Ordre ${action==='up'?'de pujada':action==='down'?'de baixada':'d’aturada'} rebuda per ${received.length} actuador(s).`:'Telegram enviat, però no hi ha actuador de persiana amb el mateix grup i DPT.'};
 }
 const value=!p.groupValues[ga];p.groupValues[ga]=value;
 const received=[];
 for(const id2 of p.order){const a=p.devices[id2];if(!OUTPUT_MODELS.has(a.model)||(!e.status[id2]?.powered||e.status[id2]?.auxPowered===false)||!isAddress(a.config.loaded.address)||a.config.loaded.address===address||e.duplicates.has(a.config.loaded.address))continue;
  for(let k=0;k<channelCount(a.model);k++){const ac=objectConfig(a,k)?.loaded;if(ac?.ga===ga&&ac?.dpt===dpt){setRelay(a,k,value);received.push(`${a.id}${channelCount(a.model)>1?` · ${channelLabel(a,k)}`:''}`);}}
 }
 p.logs.unshift({time:new Date().toLocaleTimeString('ca-ES',{hour12:false}),source:address,sourceId:`${id}${channelCount(b.model)>1?` · ${channelLabel(b,channel)}`:''}`,ga,value:value?'1 · ON':'0 · OFF',service:'GroupValueWrite',dest:received.join(', ')||'Sense receptor'});p.logs=p.logs.slice(0,80);
 return {ok:received.length>0,msg:received.length?`Telegram ${value?'ON':'OFF'} rebut per ${received.length} canal(s).`:'Telegram emès, sense canals receptors compatibles.'};
}
/** Enviament KNX de moviment (DPT 1.008) o aturada (DPT 1.007). */
export function pressShutter(p,id,action){
 const sender=p.devices[id],e=evaluate(p);
 if(sender?.model!=='blindButton'||!['up','down','stop'].includes(action))return {ok:false,msg:'Selecciona un pulsador de persiana i una ordre vàlida.'};
 if(!e.status[id]?.powered||!isAddress(sender.config.loaded.address))return {ok:false,msg:'Cal alimentar i programar el pulsador KNX.'};
 const idx=action==='stop'?1:0,obj=objectConfig(sender,idx)?.loaded;
 if(!obj||!isGroup(obj.ga)||obj.dpt!==defaultDpt('blindButton',idx))return {ok:false,msg:'Cal descarregar els grups de moviment i aturada al pulsador.'};
 const received=[];
 for(const act of installed(p,'blindAct')){
  const cfg=objectConfig(act,idx)?.loaded;
  if(!e.status[act.id]?.powered||!isAddress(act.config.loaded.address)||act.config.loaded.address===sender.config.loaded.address||e.duplicates.has(act.config.loaded.address)||cfg?.ga!==obj.ga||cfg?.dpt!==obj.dpt)continue;
  act.shutterDirection=action;received.push(act.id);
 }
 const value=action==='up'?'0 · PUJAR':action==='down'?'1 · BAIXAR':'STOP';
 p.logs.unshift({time:new Date().toLocaleTimeString('ca-ES',{hour12:false}),source:sender.config.loaded.address,sourceId:`${id} · ${action.toUpperCase()}`,ga:obj.ga,value,service:'GroupValueWrite',dest:received.join(', ')||'Sense receptor'});p.logs=p.logs.slice(0,80);
 return {ok:received.length>0,msg:received.length?`Ordre «${action==='up'?'Pujar':action==='down'?'Baixar':'Aturar'}» rebuda per ${received.length} actuador(s).`:'Telegram enviat, però no hi ha cap actuador de persiana amb aquest grup.'};
}
/** Avança la mecànica sense accelerar el temps real ni saltar els finals de carrera. */
export function advanceShutters(p,seconds){
 if(!Number.isFinite(seconds)||seconds<=0||seconds>10)return false;
 const e=evaluate(p);let changed=false;
 for(const motor of installed(p,'shutter')){const s=e.status[motor.id];if(!s?.moving)continue;const next=Math.max(0,Math.min(100,motor.shadePosition+(s.direction==='up'?-1:1)*100*seconds/motor.travelSec));if(next!==motor.shadePosition){motor.shadePosition=next;changed=true;}}
 return changed;
}
export function saveProject(p){return JSON.parse(JSON.stringify({...p,logs:[]}));}
export function loadProject(raw){
 if(!raw||!Array.isArray(raw.wires)||raw.wires.length>1200)throw Error('Projecte invàlid: connexions incorrectes.');
 if(raw.schema==='teclab-knx-v0.1')return migrateLegacy(raw);
 if(raw.schema!==SCHEMA||!Array.isArray(raw.order)||raw.order.length>200)throw Error('Versió de projecte incompatible.');
 const p=createProject();const seen=new Set();
 for(const id of raw.order){if(typeof id!=='string'||!/^u\d{1,6}$/.test(id)||seen.has(id))throw Error('Identificador de dispositiu invàlid.');const d=raw.devices?.[id];if(!CATALOG[d?.model])throw Error('Model de dispositiu desconegut.');if(CATALOG[d.model].single&&installed(p,d.model).length)throw Error('Equip únic repetit.');seen.add(id);const m=CATALOG[d.model];const x=Number(d.position?.x),y=Number(d.position?.y);p.devices[id]={id,model:d.model,position:{x:Number.isFinite(x)?Math.max(12,Math.min(BOARD.width-m.w-10,x)):300,y:m.mount==='din'?(BOARD.dinRows.includes(y)?y:BOARD.dinRows[0]):m.mount==='wall'?(Number.isFinite(y)?Math.max(BOARD.wallTop+62,Math.min(BOARD.height-m.h-20,y)):BOARD.wallTop+80):(Number.isFinite(y)?Math.max(80,Math.min(BOARD.wallTop-m.h-20,y)):BOARD.sourceY)},protection:d.protection===true,relay:d.relay===true,relays:d.model==='act4'?Array.from({length:4},(_,i)=>d.relays?.[i]===true):null,shutterDirection:d.model==='blindAct'&&['up','down'].includes(d.shutterDirection)?d.shutterDirection:'stop',shadePosition:d.model==='shutter'&&Number.isFinite(d.shadePosition)?Math.max(0,Math.min(100,d.shadePosition)):50,travelSec:d.model==='shutter'&&Number.isFinite(d.travelSec)?Math.max(5,Math.min(60,d.travelSec)):12,config:PROGRAMMABLE.has(d.model)?blankConfig(channelCount(d.model),d.model):null};
  if(PROGRAMMABLE.has(d.model))for(const part of ['draft','loaded'])for(const key of ['address','ga','dpt','value'])if(typeof d.config?.[part]?.[key]==='string')p.devices[id].config[part][key]=d.config[part][key].slice(0,32);
  if(PROGRAMMABLE.has(d.model)&&channelCount(d.model)>1)for(let i=0;i<channelCount(d.model);i++)for(const part of ['draft','loaded'])for(const key of ['ga','dpt','value']){
   const val=d.config?.channels?.[i]?.[part]?.[key];if(typeof val==='string')p.devices[id].config.channels[i][part][key]=val.slice(0,32);
  }
  p.order.push(id);
 }
 p.nextId=Math.max(1,...p.order.map(id=>Number(id.slice(1))+1));
 // Compatibilitat: la v0.2.1 anterior anomenava l1..l4 els nous IN1..IN4.
 const adaptRef=ref=>{if(typeof ref!=='string')return ref;const sep=ref.lastIndexOf(':');if(sep<1)return ref;const id=ref.slice(0,sep),key=ref.slice(sep+1);return p.devices[id]?.model==='act4'&&/^l[1-4]$/.test(key)?`${id}:in${key.slice(1)}`:ref;};
 p.wires=raw.wires.map(w=>({...w,a:adaptRef(w?.a),b:adaptRef(w?.b)})).filter(w=>terminal(p,w.a)&&terminal(p,w.b)&&w.a!==w.b).map(w=>({a:w.a,b:w.b,route:Number.isFinite(w.route)?Math.max(-12,Math.min(12,w.route)):0,offset:Number.isFinite(w.offset)?Math.max(-240,Math.min(240,w.offset)):0}));
 p.groupValues=raw.groupValues&&typeof raw.groupValues==='object'?Object.fromEntries(Object.entries(raw.groupValues).filter(([k,v])=>isGroup(k)&&typeof v==='boolean')):{};return p;
}
export function migrateLegacy(x){const p=createProject(),map={};for(const model of MODEL_ORDER){if(x.placed&&x.placed[model]!==true)continue;const oldPos=x.positions?.[model],r=addDevice(p,model,oldPos&&{x:oldPos.x+CATALOG[model].w/2,y:oldPos.y+CATALOG[model].h/2});if(!r.ok)continue;map[model]=r.id;const d=p.devices[r.id];if(oldPos&&Number.isFinite(oldPos.x)&&Number.isFinite(oldPos.y))d.position={x:oldPos.x,y:CATALOG[model].mount==='din'?BOARD.dinRows[0]:oldPos.y};if(model==='mcb'||model==='rcd')d.protection=x.protection?.[model]===true;if(model==='act')d.relay=x.relay===true;if(PROGRAMMABLE.has(model))for(const part of ['draft','loaded'])for(const key of ['address','ga','dpt'])if(typeof x.config?.[model]?.[part]?.[key]==='string')d.config[part][key]=x.config[model][part][key];}
 for(const w of x.wires){const convert=ref=>{const split=String(ref||'').split('.');return map[split[0]]?terminalRef(map[split[0]],split[1]):null;};const a=convert(w.a),b=convert(w.b);if(terminal(p,a)&&terminal(p,b)){connect(p,a,b);const last=p.wires[p.wires.length-1];last.offset=Number.isFinite(w.offset)?w.offset:0;last.route=Number.isFinite(w.route)?w.route:0;}}
 return p;}
