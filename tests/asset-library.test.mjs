import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=name=>JSON.parse(readFileSync(new URL("../"+name,import.meta.url)));
const index=read("data/assets-index.json");
const visuals=read("data/visuals.json");
test("inventaire des archives et couverture des références",()=>{
 assert.equal(index.format,"H0D_VISUAL_ASSETS");
 assert.equal(index.assets.length,54);
 assert.equal(new Set(index.assets.map(a=>a.id)).size,54);
 assert.equal(index.assets.filter(a=>a.category==="machine").length,29);
 assert.equal(index.assets.filter(a=>a.category==="creature").length,13);
 assert.equal(index.assets.filter(a=>a.category==="component").length,12);
 assert.equal(index.assets.filter(a=>a.status==="unassigned").length,26);
 assert.equal(visuals.entries.length,28);
});
test("les illustrations rattachées à des profils utilisent exclusivement des chemins présents dans l'index",()=>{
 const src=new Set(index.assets.map(a=>a.src));
 for(const entry of visuals.entries){
   assert.ok(["machine","creature"].includes(entry.kind));
   for(const v of entry.variants){
     assert.ok(src.has(v.portrait),entry.key+" : "+v.portrait);
     if(v.token)assert.ok(src.has(v.token),entry.key+" : "+v.token);
     assert.equal(v.presentation,"non_renseigne");
   }
 }
 const dog=visuals.entries.find(e=>e.kind==="creature"&&e.key==="chien-sauvage");
 assert.ok(dog);
 assert.notEqual(dog.variants[0].portrait,dog.variants[0].token);
});
test("une image non attribuée automatiquement reste visible dans la galerie",()=>{
 const original=index.assets.find(a=>a.src==="assets/faune/serpent.webp");
 assert.ok(original);
 assert.equal(original.status,"unassigned");
 assert.deepEqual(original.suggestedKeys,[]);
});

test("le loup.webp est rattaché uniquement au loup-solitaire, sans token présumé",()=>{
  const a=index.assets.find(a=>a.src==="assets/faune/loup.webp");
  assert.ok(a);
  assert.equal(a.status,"mapped");
  assert.deepEqual(a.suggestedKeys,["loup-solitaire"]);
  const profile=visuals.entries.find(e=>e.kind==="creature" && e.key==="loup-solitaire");
  assert.ok(profile);
  assert.equal(profile.variants.length,1);
  assert.equal(profile.variants[0].portrait,a.src);
  assert.equal(profile.variants[0].token,"");
  assert.equal(profile.variants[0].approved,true);
});
