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
 assert.equal(index.assets.filter(a=>a.status==="unassigned").length,16);
 assert.equal(visuals.entries.length,35);
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
 const matching=[["images.webp","sanglier-territorial"],["reindeer.webp","cerf-herbivore-rapide"],["serpent.webp","serpent-venimeux"],["fouines.webp","petit-nuisible"],["lezard.webp","petit-nuisible"],["renard.webp","petit-nuisible"],["rat.webp","petit-nuisible"]];
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
 assert.equal(rat.status,"mapped","Rat normal : variante de petit-nuisible");
 assert.deepEqual(rat.suggestedKeys,["petit-nuisible"]);
 const nuisibles=visuals.entries.find(e=>e.kind==="creature"&&e.key==="petit-nuisible");
 assert.equal(nuisibles.variants.length,4);
 assert.equal(visuals.entries.some(e=>e.kind==="creature"&&e.key==="rat-standard"),false);
 assert.equal(visuals.entries.some(e=>e.kind==="creature"&&e.key==="rat-pale-contamine"),false);
 for(const name of ["oiseau.webp","chevre.webp"])
  assert.equal(index.assets.find(a=>a.src==="assets/faune/"+name).status,"unassigned");
});

test("lot Machines : les deux images approuvées pointent vers les bons profils",()=>{
 const mappings=[
  ["assets/machines/elysium/wolverine-elysium.webp","glouton-elys"],
  ["assets/machines/ravager.webp","ravager-young"]
 ];
 for(const [src,key] of mappings){
   const asset=index.assets.find(x=>x.src===src);
   assert.ok(asset,src);
   assert.equal(asset.status,"mapped");
   assert.deepEqual(asset.suggestedKeys,[key]);
   const profile=visuals.entries.find(x=>x.kind==="machine"&&x.key===key);
   assert.ok(profile,key);
   assert.equal(profile.variants.length,1);
   assert.equal(profile.variants[0].portrait,src);
   assert.equal(profile.variants[0].token,src);
   assert.equal(profile.variants[0].approved,true);
   assert.equal(profile.variants[0].presentation,"non_renseigne");
 }
 const existing=visuals.entries.find(x=>x.kind==="machine"&&x.key==="ravageur-sauvage");
 assert.equal(existing.variants.length,1);
 assert.equal(existing.variants[0].portrait,"assets/machines/ravager-sauvage.webp");
});
test("les deux machines ELYSIUM sans profil restent accessibles mais non associées",()=>{
 for(const file of ["dent-de-scie-elysium.webp","faucheur-elysium.webp"]){
   const src="assets/machines/elysium/"+file;
   const asset=index.assets.find(x=>x.src===src);
   assert.ok(asset,src);
   assert.equal(asset.status,"unassigned");
   assert.deepEqual(asset.suggestedKeys,[]);
   assert.equal(visuals.entries.some(e=>e.kind==="machine"&&e.variants.some(v=>v.portrait===src||v.token===src)),false);
 }
});
