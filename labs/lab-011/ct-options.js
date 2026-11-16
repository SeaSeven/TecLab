// Escales comercials de transformadors de corrent per a l'analitzador virtual.
// ctRatio és el quocient primari/secundari que utilitza el motor de lectures.
// L'opció directa 1:1 conserva els casos on no hi ha transformador.
export const CT_PRIMARY_5A=[20,25,30,40,50,60,75,100,125,150,200,250,300,400,500,600,800,1000,1250,1500,2000,2500,3000,4000];
export const CT_PRIMARY_1A=[800,1000,1250,1500,2000,2500,3000,4000];
export const CT_OPTIONS=[
 {id:'direct',label:'Sense TC · directe (1:1)',primary:1,secondary:1,ratio:1},
 ...CT_PRIMARY_5A.map(primary=>({id:primary+'/5',label:primary+'/5 A',primary,secondary:5,ratio:primary/5})),
 ...CT_PRIMARY_1A.map(primary=>({id:primary+'/1',label:primary+'/1 A',primary,secondary:1,ratio:primary}))
];
export const CT_BY_ID=new Map(CT_OPTIONS.map(option=>[option.id,option]));

export function ctSelection(channel){
 if(channel.ctPrimary!=null&&channel.ctSecondary!=null){
   const exact=CT_OPTIONS.find(o=>o.primary===channel.ctPrimary&&o.secondary===channel.ctSecondary);
   if(exact&&exact.ratio===channel.ctRatio)return exact;
 }
 // Configuracions guardades abans de disposar de primari i secundari.
 return CT_OPTIONS.find(o=>o.ratio===channel.ctRatio)??null;
}
export function applyCtSelection(channel,id){
 const choice=CT_BY_ID.get(id);
 if(!choice)throw new RangeError('Transformador de corrent no disponible.');
 Object.assign(channel,{ctRatio:choice.ratio,ctPrimary:choice.primary,ctSecondary:choice.secondary});
 return channel;
}
