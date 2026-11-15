// Vista física de connexions CA: tots els cables surten del mateix instrument.
const NS='http://www.w3.org/2000/svg';
const labels=['P0','P1','P2','24 V CC'];
const busIds=['PCC','DRIVE','CTRL','DC24'];
const colors={L1:'#d8a95c',L2:'#c4cad1',L3:'#d9909c',N:'#75ade0',PE:'#83ba91','+24V':'#d4aa64','0V':'#71b6c6'};
const wires=[
 ...['V1','V2','V3'].map((id,i)=>({id,kind:'v',index:i,color:'#eebd70',sx:430+i*34,sy:417})),
 {id:'VN',kind:'n',color:'#77b4e9',sx:532,sy:417},
 ...['I1','I2','I3'].map((id,i)=>({id,kind:'i',index:i,color:['#f4d084','#89d7b1','#c3b3f1'][i],sx:582+i*34,sy:417}))
];
// Dues places de connexió a cada conductor: identitat física separada de l'estat elèctric.
const nodeList=phases=>[
 ...labels.slice(0,3).flatMap((label,p)=>
   ['L1',...(phases>1?['L2','L3']:[]),'N','PE'].flatMap((conductor,i)=>
     [0,1].map(socket=>({point:busIds[p],label,conductor,socket,x:80+p*330+97+socket*72,y:109+i*38})))),
 ...['+24V','0V'].flatMap((conductor,i)=>
   [0,1].map(socket=>({point:'DC24',label:'24 V CC',conductor,socket,x:955+socket*67,y:354+i*34})))
];
export function findFreeSocket(nodes,wires,settings,wire,point,conductor,preferred=null){
 const used=new Set(wires.filter(w=>w.id!==wire.id).map(w=>{
   const t=getWire(settings,w);
   return t?.point===point&&t.conductor===conductor?t.socket:null;
 }).filter(v=>v!==null&&v!==undefined));
 const available=nodes.filter(n=>n.point===point&&n.conductor===conductor&&!used.has(n.socket));
 if(!available.length)return null;
 return available.find(n=>n.socket===preferred)??available[0];
}
const getWire=(settings,w)=>{
 const v=w.kind==='v'?settings.voltageChannels[w.index]:settings.voltageChannels[0];
 const c=w.kind==='i'?settings.currentChannels[w.index]:null;
 if(w.kind==='v')return v?.positivePoint&&v.positive?{point:v.positivePoint,conductor:v.positive,socket:v.positiveSocket??0}:null;
 if(w.kind==='n')return v?.negativePoint&&v.negative?{point:v.negativePoint,conductor:v.negative,socket:v.negativeSocket??0}:null;
 return c?.pointId&&c.conductor?{point:c.pointId,conductor:c.conductor,socket:c.socket??0}:null;
};
function assign(settings,w,target){
 const conductor=target?.conductor??null,point=target?.point??null,socket=target?.socket??null;
 if(w.kind==='v')Object.assign(settings.voltageChannels[w.index],{positive:conductor,positivePoint:point,positiveSocket:socket});
 else if(w.kind==='n')settings.voltageChannels.forEach(v=>Object.assign(v,{negative:conductor,negativePoint:point,negativeSocket:socket}));
 else Object.assign(settings.currentChannels[w.index],{conductor,pointId:point,socket});
}
const svgEl=(name,attrs={},value='')=>{
 const el=document.createElementNS(NS,name);
 for(const [key,val] of Object.entries(attrs))el.setAttribute(key,String(val));
 if(value)el.textContent=value;
 return el;
};
export function mountWiring(host,scenario,settings,onChange){
 const nodes=nodeList(scenario.phases),activeWires=wires.filter(w=>w.index===undefined||w.index<scenario.phases),svg=svgEl('svg',{viewBox:'0 0 1100 490',class:'pq-wiring-svg',role:'group','aria-label':'Connexions virtuals: arrossega les sondes i pinces als conductors'});
 svg.append(svgEl('rect',{width:1100,height:490,rx:12,fill:'#142633',stroke:'#577182'}));
 for(let p=0;p<3;p++){
   const x=80+p*330;
   svg.append(svgEl('rect',{x,y:45,width:270,height:280,rx:10,fill:'#203643',stroke:'#547080'}));
   svg.append(svgEl('text',{x:x+12,y:73,fill:'#f0d2a3','font-size':17,'font-weight':700},labels[p]));
   svg.append(svgEl('text',{x:x+48,y:73,fill:'#d5e1e8','font-size':12},['Entrada quadre general','Branca del variador','Quadre de control'][p]));
   for(const conductor of [...new Set(nodes.filter(n=>n.point===busIds[p]).map(n=>n.conductor))]){
     const pair=nodes.filter(n=>n.point===busIds[p]&&n.conductor===conductor);
     const cy=pair[0].y,color=colors[conductor];
     svg.append(svgEl('text',{x:x+15,y:cy+5,fill:'#e2ebf0','font-size':13},conductor));
     svg.append(svgEl('line',{x1:x+58,y1:cy,x2:x+232,y2:cy,stroke:color,'stroke-width':5,'stroke-linecap':'round'}));
     for(const node of pair)svg.append(svgEl('circle',{cx:node.x,cy,r:10,fill:'#172631',stroke:color,'stroke-width':2}));
   }
 }
 // Font de control CC: terminals físicament accessibles, no connectats a la xarxa CA.
 svg.append(svgEl('rect',{x:914,y:309,width:176,height:94,rx:8,fill:'#28413f',stroke:'#648a7c'}));
 svg.append(svgEl('text',{x:927,y:329,fill:'#d2e6de','font-size':14,'font-weight':700},'24 V CC · CONTROL'));
 for(const conductor of ['+24V','0V']){
   const pair=nodes.filter(n=>n.point==='DC24'&&n.conductor===conductor),y=pair[0].y;
   svg.append(svgEl('text',{x:919,y:y+4,fill:'#d2e6de','font-size':10},conductor));
   svg.append(svgEl('line',{x1:948,y1:y,x2:1063,y2:y,stroke:colors[conductor],'stroke-width':4,'stroke-linecap':'round'}));
   for(const n of pair)svg.append(svgEl('circle',{cx:n.x,cy:n.y,r:10,fill:'#172631',stroke:colors[conductor],'stroke-width':2}));
 }
 svg.append(svgEl('rect',{x:350,y:400,width:400,height:80,rx:13,fill:'#30444f',stroke:'#94adb6','stroke-width':2}));
 svg.append(svgEl('text',{x:373,y:465,fill:'#edd7a6','font-size':15,'font-weight':700},'TECLAB · ANALITZADOR PQ'));
 const parts=new Map();
 const rest=(w,i)=>({x:390+i*48,y:361});
 const loc=(target,w,i)=>{
   const node=target&&nodes.find(n=>n.point===target.point&&n.conductor===target.conductor&&n.socket===(target.socket??0));
   return node??rest(w,i);
 };
 function refresh(w,i,temp){
   const {path,head,title,arrow}=parts.get(w.id),at=temp??loc(getWire(settings,w),w,i);
   path.setAttribute('d','M'+w.sx+','+w.sy+' C'+w.sx+','+(w.sy-100)+' '+at.x+','+(at.y+90)+' '+at.x+','+at.y);
   head.setAttribute('transform','translate('+at.x+' '+at.y+')');
   const target=getWire(settings,w);
   const reversed=w.kind==='i'&&settings.currentChannels[w.index]?.inverted;
   const name=w.id+(target?' · '+labels[busIds.indexOf(target.point)]+' '+target.conductor:' · lliure')+(reversed?' · sentit invertit':'')+(w.kind==='i'?' · doble clic o tecla R per girar':'');
   title.textContent=name;
   if(arrow){arrow.setAttribute('transform',reversed?'rotate(180)':'rotate(0)');head.classList.toggle('is-reversed',Boolean(reversed));}
   head.setAttribute('aria-label',name+'. Arrossega, o prem Retorn i mou amb fletxes.');
 }
 const nearest=(x,y)=>{
   let best=null,dist=29;
   for(const node of nodes){const d=Math.hypot(x-node.x,y-node.y);if(d<dist){best=node;dist=d;}}
   return best;
 };
 const choose=(w,point)=>{
   if(!point)return null;
   return findFreeSocket(nodes,activeWires,settings,w,point.point,point.conductor,point.socket);
 };
 const xy=event=>{
   const box=svg.getBoundingClientRect(),scale=Math.min(box.width/1100,box.height/490);
   return {x:(event.clientX-box.left-(box.width-1100*scale)/2)/scale,y:(event.clientY-box.top-(box.height-490*scale)/2)/scale};
 };
 activeWires.forEach((w,i)=>{
   const path=svgEl('path',{fill:'none',stroke:w.color,'stroke-width':3.5,'stroke-linecap':'round','pointer-events':'none'});
   svg.append(path,svgEl('circle',{cx:w.sx,cy:w.sy,r:7,fill:w.color}));
   svg.append(svgEl('text',{x:w.sx-9,y:w.sy+24,'font-size':11,fill:'#dce9ee'},w.id));
   const head=svgEl('g',{tabindex:0,role:'button',class:'pq-drag-head'});
   head.append(svgEl('circle',{r:18,fill:'#ebf0f1',stroke:w.color,'stroke-width':3}));
   let arrow=null;
   if(w.kind==='i'){
     // La pinça disposa de mordasses i d'una fletxa física que gira 180 graus.
     head.append(svgEl('path',{d:'M-9,-12 C-17,-6 -17,5 -9,11 M9,-12 C17,-6 17,5 9,11',stroke:'#263540','stroke-width':2,fill:'none','pointer-events':'none'}));
     arrow=svgEl('g',{'pointer-events':'none'});
     arrow.append(svgEl('path',{d:'M-10,0 H10 M4,-6 L10,0 L4,6',stroke:'#174f68','stroke-width':3,'stroke-linejoin':'round','stroke-linecap':'round',fill:'none'}));
     head.append(arrow);
   }else head.append(svgEl('path',{d:'M0,-9 L8,2 L0,11 L-8,2 Z',fill:'#263540','pointer-events':'none'}));
   const title=svgEl('title');head.append(title);svg.append(head);
   parts.set(w.id,{path,head,title,arrow});
   let dragging=null,keyboard=null;
   head.addEventListener('pointerdown',event=>{
     if(event.pointerType==='mouse'&&event.button!==0)return;
     dragging={id:event.pointerId,...xy(event)};
     head.setPointerCapture(event.pointerId);event.preventDefault();
   });
   head.addEventListener('pointermove',event=>{
     if(!dragging||event.pointerId!==dragging.id)return;
     Object.assign(dragging,xy(event));refresh(w,i,dragging);
   });
   head.addEventListener('pointerup',event=>{
     if(!dragging||event.pointerId!==dragging.id)return;
     const point=nearest(dragging.x,dragging.y);
     if(!point)assign(settings,w,null);
     else{
       const slot=choose(w,point);
       if(slot)assign(settings,w,slot);
       // Si els dos allotjaments estan ocupats, es conserva la connexió prèvia.
     }
     dragging=null;refresh(w,i);onChange?.();
   });
   head.addEventListener('pointercancel',()=>{dragging=null;refresh(w,i);});
   if(w.kind==='i')head.addEventListener('dblclick',()=>{settings.currentChannels[w.index].inverted=!settings.currentChannels[w.index].inverted;refresh(w,i);onChange?.();});
   head.addEventListener('keydown',event=>{
     if((event.key==='r'||event.key==='R')&&w.kind==='i'){settings.currentChannels[w.index].inverted=!settings.currentChannels[w.index].inverted;refresh(w,i);onChange?.();event.preventDefault();return;}
     if(event.key==='Escape'){keyboard=null;assign(settings,w,null);refresh(w,i);onChange?.();event.preventDefault();return;}
     if(event.key==='Enter'||event.key===' '){
       if(keyboard===null)keyboard=loc(getWire(settings,w),w,i);
       else{const point=nearest(keyboard.x,keyboard.y);if(!point)assign(settings,w,null);else{const slot=choose(w,point);if(slot)assign(settings,w,slot);}keyboard=null;refresh(w,i);onChange?.();}
       event.preventDefault();return;
     }
     const shifts={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
     if(shifts[event.key]){
       keyboard??=loc(getWire(settings,w),w,i);
       keyboard={x:keyboard.x+shifts[event.key][0]*(event.shiftKey?30:10),y:keyboard.y+shifts[event.key][1]*(event.shiftKey?30:10)};
       refresh(w,i,keyboard);event.preventDefault();
     }
   });
   refresh(w,i);
 });
 host.replaceChildren(svg);
 return {redraw:()=>activeWires.forEach((w,i)=>refresh(w,i))};
}
