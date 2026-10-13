// Geometria única: sectors, línies i punts de selecció comparteixen angles.
export const dialLayout=Object.freeze([
 {group:'OFF',start:-171,end:-155,positions:[-163],ids:['OFF'],color:'#35434e',ink:'#edf2f6'},
 {group:'V⎓',start:-151,end:-59,positions:[-141,-123,-105,-87,-69],ids:['VDC200m','VDC2','VDC20','VDC200','VDC600'],color:'#2f5261',ink:'#b8edff'},
 {group:'V~',start:-55,end:-19,positions:[-46,-28],ids:['VAC200','VAC600'],color:'#514764',ink:'#ead4ff'},
 {group:'A⎓',start:-15,end:77,positions:[-5,13,31,49,67],ids:['ADC200u','ADC2m','ADC20m','ADC200m','ADC10'],color:'#5c4939',ink:'#ffe1b3'},
 {group:'Ω',start:81,end:173,positions:[91,109,127,145,163],ids:['OHM200','OHM2k','OHM20k','OHM200k','OHM2M'],color:'#345441',ink:'#c6f9cb'}
]);
export function polar(angle,radius,cx=200,cy=200){
 const a=angle*Math.PI/180;
 return [cx+Math.sin(a)*radius,cy-Math.cos(a)*radius];
}
export function sectorPath(start,end,outer=194,inner=71){
 const point=(angle,r)=>polar(angle,r).map(n=>n.toFixed(3)).join(' ');
 return 'M '+point(start,outer)+' A '+outer+' '+outer+' 0 0 1 '+point(end,outer)+
   ' L '+point(end,inner)+' A '+inner+' '+inner+' 0 0 0 '+point(start,inner)+' Z';
}
export function dialPositions(layout=dialLayout){
 return layout.flatMap(group=>group.ids.map((id,i)=>({
  id,group:group.group,angle:group.positions[i]
 })));
}
export function validateDialLayout(layout=dialLayout){
 let previous=-180;const ids=new Set();
 for(const group of layout){
  if(group.start<=previous||group.end<=group.start||group.end>180||group.ids.length!==group.positions.length)return false;
  for(let i=0;i<group.positions.length;i++){
   const p=group.positions[i];
   if(!(p>group.start&&p<group.end)||(i>0&&p<=group.positions[i-1])||ids.has(group.ids[i]))return false;
   ids.add(group.ids[i]);
  }
  previous=group.end;
 }
 return true;
}
