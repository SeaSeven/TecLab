// Connexions manuals dels terminals de tensió i de les pinces, per punt de mesura.
// Les connexions són completament virtuals; no representen una maniobra segura real.
export function emptyWiring(phases){
 return {
   voltage:Array.from({length:phases},()=>({positive:null,negative:null})),
   clamps:Array.from({length:phases},()=>({conductor:null,direction:1}))
 };
}
export function availableNodes(scenario){
 return [...Array.from({length:scenario.phases},(_,i)=>'L'+(i+1)),'N'];
}
export function assertWiring(scenario,wiring){
 if(!wiring||!Array.isArray(wiring.voltage)||!Array.isArray(wiring.clamps)||
 wiring.voltage.length!==scenario.phases||wiring.clamps.length!==scenario.phases)throw new RangeError('Connexions no vàlides.');
 const nodes=availableNodes(scenario);
 for(const v of wiring.voltage){
   if(![null,...nodes].includes(v.positive)||![null,...nodes].includes(v.negative))
     throw new RangeError('Terminal de tensió no disponible.');
 }
 for(const c of wiring.clamps){
   if(![null,...nodes].includes(c.conductor)||![1,-1].includes(c.direction))
     throw new RangeError('Pinça o sentit no disponible.');
 }
 return true;
}
export function nodePhase(node){return /^L[123]$/.test(node)?Number(node.slice(1))-1:null;}
export function setWiringTerminal(wiring,kind,slot,node){
 const next=structuredClone(wiring);
 if(kind==='positive'||kind==='negative')next.voltage[slot][kind]=node;
 else if(kind==='clamp')next.clamps[slot].conductor=node;
 else throw new RangeError('Terminal desconegut.');
 return next;
}
export function invertWiringClamp(wiring,slot){
 const next=structuredClone(wiring);
 next.clamps[slot].direction*=-1;
 return next;
}
