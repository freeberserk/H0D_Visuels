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
 assert.equal(index.assets.filter(a=>a.status==="unassigned").length,19);
 assert.equal(visuals.entries.length,33);
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
 const original=index.assets.find(a=>a.src==="assets/faune/chevre.webp");
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

test("associations de faune validées par le MJ, sans assimilation aux mutations",()=>{
 const matching=[["images.webp","sanglier-territorial"],["reindeer.webp","cerf-herbivore-rapide"],["serpent.webp","serpent-venimeux"],["fouines.webp","petit-nuisible"],["lezard.webp","petit-nuisible"],["renard.webp","petit-nuisible"]];
 for(const [name,key] of matching){
   const src="assets/faune/"+name;
   const asset=index.assets.find(a=>a.src===src);
   assert.ok(asset,name);
   assert.equal(asset.status,"mapped");
   assert.deepEqual(asset.suggestedKeys,[key]);
   const entry=visuals.entries.find(e=>e.kind==="creature"&&e.key===key);
   const variant=entry?.variants.find(v=>v.portrait===src);
   assert.ok(variant,name+" → "+key);
   assert.equal(variant.token,"",name+" : ne pas supposer de token");
   assert.equal(variant.presentation,"non_renseigne");
   assert.equal(variant.approved,true);
 }
 const rat=index.assets.find(a=>a.src==="assets/faune/rat.webp");
 assert.equal(rat.status,"unassigned","Rat normal : pas de rattachement automatique au rat pâle contaminé");
 assert.deepEqual(rat.suggestedKeys,[]);
 for(const name of ["oiseau.webp","chevre.webp"])
  assert.equal(index.assets.find(a=>a.src==="assets/faune/"+name).status,"unassigned");
});
