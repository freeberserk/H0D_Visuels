import test from "node:test";
import assert from "node:assert/strict";
import {CATEGORIES,groupId,cleanVariant,selectVariant,assetUrl,mergeRegistry} from "../scripts/h0d-visual-core.mjs";

const make=(id,presentation="non_renseigne",approved=true)=>({
 id,label:id,portrait:"https://assets.forge-vtt.com/"+id+".webp",
 token:"modules/h0d-faction-builder/assets/conseil/tokens/"+id+".webp",
 presentation,approved
});
test("catégories techniques explicites et sans noms approximatifs",()=>{
 assert.deepEqual(CATEGORIES,["faction","creature","machine","equipment"]);
 assert.equal(groupId("faction","guerrier-rouge"),"faction::guerrier-rouge");
 assert.throws(()=>groupId("unknown","x"),/invalide/);
});
test("une variante respecte l'approbation et n'infère aucune présentation",()=>{
 const v=cleanVariant({id:"v1",portrait:"modules/x/foo.webp"});
 assert.equal(v.presentation,"non_renseigne");
 assert.equal(v.approved,false);
 assert.equal(selectVariant([v],{mode:"random"}),null);
 assert.deepEqual(selectVariant([v],{mode:"manual",variantId:"v1"}),v);
});
test("mode aucun et modes d'apparence explicitement annotés",()=>{
 const all=[make("m","masculin"),make("f","feminin"),make("u","non_renseigne")];
 assert.equal(selectVariant(all,{mode:"none"}),null);
 assert.equal(selectVariant(all,{mode:"masculin"}).id,"m");
 assert.equal(selectVariant(all,{mode:"feminin"}).id,"f");
 assert.equal(selectVariant(all,{mode:"manual",variantId:"missing"}),null);
 assert.equal(selectVariant([make("m","masculin")],{mode:"feminin"}),null);
});
test("mode équilibré choisit la catégorie sous-représentée",()=>{
 const list=[make("m","masculin"),make("f","feminin")];
 assert.equal(selectVariant(list,{mode:"balanced",counts:{masculin:3,feminin:1}}).id,"f");
 assert.equal(selectVariant(list,{mode:"balanced",counts:{masculin:1,feminin:5}}).id,"m");
 assert.equal(selectVariant([make("m","masculin")],{mode:"balanced"}).id,"m");
});
test("tirage aléatoire évite la dernière variante si possible",()=>{
 const list=[make("a"),make("b")];
 assert.equal(selectVariant(list,{mode:"random",lastId:"a",random:()=>0}).id,"b");
 assert.equal(selectVariant(list,{mode:"random",lastId:"b",random:()=>0}).id,"a");
});
test("chemins Forge, module, systèmes, absolus, interdiction JS/data",()=>{
 assert.equal(assetUrl("https://assets.forge-vtt.com/test.webp"),"https://assets.forge-vtt.com/test.webp");
 assert.equal(assetUrl("modules/h0d-faction-builder/assets/conseil/tokens/tarek.webp"),
  "modules/h0d-faction-builder/assets/conseil/tokens/tarek.webp");
 assert.equal(assetUrl("assets/portrait.webp"),"modules/h0d-visuels/assets/portrait.webp");
 assert.equal(assetUrl("assets/prive.webp".replace("assets/","./data/")),
  "modules/h0d-visuels/data/prive.webp");
 assert.equal(assetUrl("javascript:alert(1)"),null);
 assert.equal(assetUrl("data:image/webp;base64,evil"),null);
 assert.throws(()=>cleanVariant({id:"bad",portrait:"javascript:alert(1)"}),/dangereux/);
});
test("le groupe modifié par le MJ remplace entièrement le groupe embarqué",()=>{
 const old={"faction::x":[make("a"),make("b")],"faction::y":[make("c")]};
 const updated={"faction::x":[{...make("a"),approved:false}]};
 const merged=mergeRegistry(old,updated);
 assert.equal(merged["faction::x"].length,1);
 assert.equal(merged["faction::x"][0].approved,false);
 assert.equal(merged["faction::y"].length,1);
 const emptied=mergeRegistry(old,{"faction::x":[]});
 assert.deepEqual(emptied["faction::x"],[]);
});
