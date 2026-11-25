import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const source=path=>readFile(new URL(path,root),'utf8');

test('el catàleg inclou cinc àrees i LAB-011 a pràctiques',async()=>{
 const catalog=await source('shared/components/catalog.js');
 const entries=[...catalog.matchAll(/\{id:'(components|circuits|instruments|signals|practices)', number:'\d\d'/g)].map(m=>m[1]);
 assert.deepEqual(entries,['components','circuits','instruments','signals','practices']);
 assert.match(catalog,/title:'Laboratoris de pràctiques'/);
 assert.match(catalog,/labs:\['LAB-011'\]/);
});
test('LAB-011 és accessible des de la portada i el catàleg generat',async()=>{
 const [app,db,raw]=await Promise.all([
   source('shared/components/app.js'),
   source('data/laboratories.json'),
   source('labs/lab-011/metadata.json')
 ]);
 const labs=JSON.parse(db),metadata=JSON.parse(raw),entry=labs.find(l=>l.id==='LAB-011');
 assert.ok(labs.length>=11,'El catàleg ha de conservar almenys els 11 laboratoris esperats');
 assert.equal(new Set(labs.map(l=>l.id)).size,labs.length);
 assert.deepEqual(entry,metadata);
 assert.equal(entry.status,'published');
 assert.equal(entry.entry,'labs/lab-011/');
 assert.match(app,/['"]lab-011['"]/);
 assert.match(app,/labs\/['"]\+id\+['"]\/index\.html/);
});
