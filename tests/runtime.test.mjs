import test from "node:test";
import assert from "node:assert/strict";

test("le module expose l'API attendue par Faction Builder sans retoucher les Actors",async()=>{
 const hooks=new Map(),settings=new Map();
 globalThis.Hooks={once:(name,fn)=>hooks.set(name,fn)};
 const module={id:"h0d-visuels",active:true,api:null};
 const actor={name:"Pillard",updates:[], getFlag:(mod,key)=>mod==="h0d-faction-builder"&&key==="archetypeKey"?"pillards-rouges":null,
  update(p){this.updates.push(p);return Promise.resolve();}};
 globalThis.game={
   user:{isGM:true},actors:[actor],modules:new Map([["h0d-visuels",module]]),
   settings:{
     register:()=>{},
     get:(_id,key)=>settings.get(key)??{},
     set:async(_id,key,value)=>{settings.set(key,value);return value;}
   }
 };
 globalThis.fetch=async()=>({ok:true,json:async()=>({format:"H0D_VISUAL_REGISTRY",formatVersion:1,entries:[]})});
 await import("../scripts/h0d-visuels.js");
 assert.ok(hooks.has("init")&&hooks.has("ready"));
 hooks.get("init")();
 await hooks.get("ready")();
 const api=game.h0dVisuels;
 assert.equal(module.api,api);
 for(const m of ["getChoices","pickForBuilder","visualUrl","manageVariants","openPicker"])
  assert.equal(typeof api[m],"function",m);
 assert.equal(api.getStatus().ready,true);
 assert.equal(api.getStatus().variants,0);
 assert.equal(api.pickForBuilder({kind:"faction",key:"pillards-rouges"}),null);
 const entry={id:"v1",label:"Variante A",portrait:"modules/example/portrait.webp",token:"modules/example/token.webp",approved:true,presentation:"non_renseigne"};
 await api.addVariant("faction","pillards-rouges",entry);
 assert.equal(api.getChoices("faction","pillards-rouges").length,1);
 assert.equal(api.getChoices("faction","pillards-rouges")[0].approved,true);
 const selected=api.pickForBuilder({kind:"faction",key:"pillards-rouges",mode:"balanced"});
 assert.equal(selected.id,"v1");
 assert.equal(actor.updates.length,0,"Pas de migration automatique des portraits et tokens");
 assert.equal(api.visualUrl(entry.portrait),entry.portrait);
});
