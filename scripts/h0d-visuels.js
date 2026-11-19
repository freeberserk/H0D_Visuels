import {CATEGORIES,PRESENTATIONS,groupId,cleanVariant,selectVariant,assetUrl,mergeRegistry} from "./h0d-visual-core.mjs";

const MODULE_ID="h0d-visuels";
const DEFAULT_PATH="modules/h0d-visuels/data/visuals.json";
const ASSETS_PATH="modules/h0d-visuels/data/assets-index.json";
let assets=[];
let bundled={};
let initialized=false;
const lastByGroup=new Map();
const localCounters=new Map();

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

function requireGM(){
  if(!game.user?.isGM)throw new Error("H0D Visuels : gestion réservée au MJ.");
}
function worldOverrides(){
  try{return game.settings.get(MODULE_ID,"registry")??{};}
  catch{return {};}
}
function completeRegistry(){
  return mergeRegistry(bundled,worldOverrides());
}
function getChoices(kind,key){
  try{return (completeRegistry()[groupId(kind,key)]??[]).map(x=>({...x}));}
  catch{return [];}
}
function chooseBalancedCounts(kind,key,list){
  const counts={masculin:0,feminin:0};
  if(kind!=="equipment"){
    for(const actor of game.actors??[]){
      let identity=null;
      if(kind==="faction")identity=actor.getFlag?.("h0d-faction-builder","archetypeKey");
      if(kind==="creature")identity=actor.getFlag?.("h0d-creature-builder","creatureKey");
      if(kind==="machine")identity=actor.getFlag?.("h0d-machine-builder","machineKey");
      if(identity!==key)continue;
      const selected=actor.getFlag?.(MODULE_ID,"selectedVariant");
      const choice=list.find(v=>v.id===selected);
      if(choice&&Object.hasOwn(counts,choice.presentation))counts[choice.presentation]++;
    }
  }
  // Les créations successives restent équilibrées même si un builder ne crée
  // pas immédiatement un Actor en cours de sélection.
  const local=localCounters.get(groupId(kind,key))??{masculin:0,feminin:0};
  counts.masculin+=local.masculin;counts.feminin+=local.feminin;
  return counts;
}
function pickForBuilder({kind,key,mode="random",variantId=null}={}){
  let id;
  try{id=groupId(kind,key);}catch{return null;}
  const choices=getChoices(kind,key);
  const choice=selectVariant(choices,{
    mode,variantId,
    counts:chooseBalancedCounts(kind,key,choices),
    lastId:lastByGroup.get(id)
  });
  if(choice&&mode!=="manual"){
    lastByGroup.set(id,choice.id);
    if(mode==="balanced"&&["masculin","feminin"].includes(choice.presentation)){
      const tally=localCounters.get(id)??{masculin:0,feminin:0};
      tally[choice.presentation]++;
      localCounters.set(id,tally);
    }
  }
  return choice;
}
function visualUrl(path){return assetUrl(path,MODULE_ID);}

async function saveChoices(kind,key,records){
  requireGM();
  const id=groupId(kind,key);
  if(!Array.isArray(records))throw new Error("Une liste de variantes est nécessaire.");
  const unique=new Map();
  for(const item of records){
    const variant=cleanVariant(item);
    if(unique.has(variant.id))throw new Error("Identifiant de variante en double : "+variant.id);
    unique.set(variant.id,variant);
  }
  const existing=worldOverrides();
  await game.settings.set(MODULE_ID,"registry",{...existing,[id]:[...unique.values()]});
  return getChoices(kind,key);
}
async function addVariant(kind,key,record){
  const next=getChoices(kind,key).filter(v=>v.id!==record?.id);
  next.push(cleanVariant(record));
  return saveChoices(kind,key,next);
}
function status(){
  const records=completeRegistry();
  return {
    version:"0.2.1",ready:initialized,
    assets:assets.length,
    groups:Object.keys(records).length,
    variants:Object.values(records).reduce((n,x)=>n+x.length,0),
    approved:Object.values(records).reduce((n,x)=>n+x.filter(v=>v.approved).length,0)
  };
}

function dialogClass(){
  const klass=foundry?.applications?.api?.DialogV2;
  if(!klass)throw new Error("H0D Visuels nécessite Foundry VTT v14 (DialogV2).");
  return klass;
}
function presentationOptions(current){
  return PRESENTATIONS.map(p=>'<option value="'+p+'"'+(p===current?" selected":"")+">"+
    (p==="masculin"?"Masculine":p==="feminin"?"Féminine":"Non renseignée")+"</option>").join("");
}
function variantFields(v={},index=0){
  return '<fieldset data-h0d-variant-row style="margin:6px 0;padding:8px;border:1px solid var(--color-border-light-primary)">'+
    '<legend>Variante '+(index+1)+'</legend>'+
    '<label>ID <input type="text" data-field="id" value="'+esc(v.id??"")+'" placeholder="exemple-01" required></label>'+
    '<label>Nom <input type="text" data-field="label" value="'+esc(v.label??"")+'"></label>'+
    '<label>Portrait / image <input type="text" data-field="portrait" value="'+esc(v.portrait??"")+'" placeholder="Chemin Foundry ou URL HTTPS"></label>'+
    '<label>Token <input type="text" data-field="token" value="'+esc(v.token??"")+'" placeholder="Chemin Foundry ou URL HTTPS"></label>'+
    '<label>Présentation <select data-field="presentation">'+presentationOptions(v.presentation??"non_renseigne")+'</select></label>'+
    '<label><input type="checkbox" data-field="approved"'+(v.approved?" checked":"")+'> Approuvée pour tirage automatique</label>'+
    '<label><input type="checkbox" data-field="remove"> Supprimer cette variante</label>'+
    '</fieldset>';
}
function readFields(row){
  const get=k=>row.querySelector('[data-field="'+k+'"]');
  return {
    id:get("id")?.value,label:get("label")?.value,
    portrait:get("portrait")?.value,token:get("token")?.value,
    presentation:get("presentation")?.value,approved:get("approved")?.checked===true
  };
}
async function manageVariants(kind,key){
  requireGM();
  const id=groupId(kind,key);
  const choices=getChoices(kind,key);
  const content='<div class="h0d-visual-editor">'+
    '<p>Référence : <code>'+esc(id)+'</code> — '+choices.length+' variante(s). Aucune image ne sera copiée ou remplacée automatiquement.</p>'+
    '<div data-h0d-rows>'+choices.map(variantFields).join("")+'</div>'+
    '<button type="button" data-action="add">Ajouter une variante</button> '+
    '<button type="button" data-action="save">Enregistrer les variantes</button>'+
    '<p data-h0d-status role="status"></p></div>';
  return dialogClass().wait({
    window:{title:"H0D Visuels — "+id,resizable:true},
    content,buttons:[{action:"close",label:"Fermer"}],rejectClose:false,
    render:(_event,dialog)=>{
      const root=dialog.element?.querySelector(".h0d-visual-editor");
      if(!root||root.dataset.ready==="1")return;
      root.dataset.ready="1";
      const rows=root.querySelector("[data-h0d-rows]");
      const feedback=root.querySelector("[data-h0d-status]");
      root.querySelector('[data-action="add"]')?.addEventListener("click",()=>{
        const next=rows.querySelectorAll("[data-h0d-variant-row]").length;
        rows.insertAdjacentHTML("beforeend",variantFields({},next));
      });
      root.querySelector('[data-action="save"]')?.addEventListener("click",async event=>{
        const button=event.currentTarget;button.disabled=true;
        feedback.textContent="Enregistrement…";
        try{
          const records=[];
          for(const row of rows.querySelectorAll("[data-h0d-variant-row]")){
            if(row.querySelector('[data-field="remove"]')?.checked)continue;
            records.push(readFields(row));
          }
          await saveChoices(kind,key,records);
          feedback.textContent="Variantes enregistrées : "+records.length+". Ferme et rouvre pour actualiser la liste.";
          ui.notifications?.info?.("H0D Visuels : variantes enregistrées pour "+id);
        }catch(err){feedback.textContent=String(err?.message??err);ui.notifications?.error?.(feedback.textContent);}
        finally{button.disabled=false;}
      });
    }
  });
}
function actorIdentity(actor){
  if(!actor?.getFlag)return null;
  const sources=[
    ["faction","h0d-faction-builder","archetypeKey"],
    ["creature","h0d-creature-builder","creatureKey"],
    ["machine","h0d-machine-builder","machineKey"]
  ];
  for(const [kind,mod,key] of sources){
    const value=actor.getFlag(mod,key);
    if(typeof value==="string"&&value)return {kind,key:value};
  }
  return null;
}
async function openPicker(actor){
  requireGM();
  const identity=actorIdentity(actor);
  if(!identity)throw new Error("H0D Visuels : aucune clé de builder reconnue pour cet Actor.");
  const choices=getChoices(identity.kind,identity.key);
  if(!choices.length)throw new Error("H0D Visuels : aucune variante enregistrée pour "+groupId(identity.kind,identity.key));
  const selected=actor.getFlag?.(MODULE_ID,"selectedVariant")??choices[0].id;
  const content='<div class="h0d-visual-picker">'+
    '<p>Fiche : <strong>'+esc(actor.name)+'</strong> — '+esc(groupId(identity.kind,identity.key))+'</p>'+
    '<label>Variante <select data-h0d-select>'+
      choices.map(v=>'<option value="'+esc(v.id)+'"'+(v.id===selected?" selected":"")+">"+esc(v.label)+(v.approved?"":" [non approuvée]")+"</option>").join("")+
    '</select></label>'+
    '<p><img data-h0d-preview alt="Prévisualisation" style="max-height:170px;max-width:100%;object-fit:contain"></p>'+
    '<button type="button" data-action="apply">Appliquer à cette fiche</button>'+
    '<p data-h0d-status role="status"></p></div>';
  return dialogClass().wait({
    window:{title:"H0D Visuels — Choisir une apparence",resizable:true},
    content,buttons:[{action:"close",label:"Fermer"}],rejectClose:false,
    render:(_event,dialog)=>{
      const root=dialog.element?.querySelector(".h0d-visual-picker");
      if(!root||root.dataset.ready==="1")return;root.dataset.ready="1";
      const select=root.querySelector("[data-h0d-select]");
      const preview=root.querySelector("[data-h0d-preview]");
      const feedback=root.querySelector("[data-h0d-status]");
      const chosen=()=>choices.find(v=>v.id===select.value);
      const renderPreview=()=>{
        const v=chosen(),url=visualUrl(v?.portrait||v?.token);
        if(url){preview.src=url;preview.style.display="";}else{preview.removeAttribute("src");preview.style.display="none";}
      };
      select.addEventListener("change",renderPreview);renderPreview();
      root.querySelector('[data-action="apply"]')?.addEventListener("click",async event=>{
        const button=event.currentTarget;button.disabled=true;
        try{
          const v=chosen();
          if(!v)throw new Error("Variante non trouvée.");
          const update={};
          if(v.portrait)update.img=visualUrl(v.portrait);
          if(v.token)update["prototypeToken.texture.src"]=visualUrl(v.token);
          update["flags.h0d-visuels.selectedVariant"]=v.id;
          update["flags.h0d-visuels.source"]="manual";
          await actor.update(update);
          feedback.textContent="Apparence appliquée à la fiche. Les tokens déjà placés ne sont pas modifiés.";
        }catch(err){feedback.textContent=String(err?.message??err);ui.notifications?.error?.(feedback.textContent);}
        finally{button.disabled=false;}
      });
    }
  });
}
function providerKeys(){
  const sources={
    faction:game.h0dFactionBuilder?.archetypes,
    creature:game.h0dCreatureBuilder?.creatures,
    machine:game.h0dMachineBuilder?.machines
  };
  const found=new Map();
  for(const [kind,provider] of Object.entries(sources)){
    if(!provider)continue;
    const entries=provider instanceof Map?[...provider]:Object.entries(provider);
    for(const [key,def] of entries)found.set(kind+"::"+key,{
      kind,key,label:def?.label||def?.name||key
    });
  }
  try {
    for(const def of game.h0dCatalogue?.getDefinitions?.()||[])
      found.set("equipment::"+def.key,{kind:"equipment",key:def.key,label:def.name||def.key});
  }catch{}
  for(const id of Object.keys(completeRegistry())){
    const n=id.indexOf("::");if(n<0)continue;
    const kind=id.slice(0,n),key=id.slice(n+2);
    if(CATEGORIES.includes(kind)&&!found.has(id))found.set(id,{kind,key,label:key});
  }
  return [...found.values()].sort((a,b)=>a.label.localeCompare(b.label,"fr"));
}

function visualGalleryCard(entry,isAsset=false){
 const src=isAsset?entry.src:entry.portrait||entry.token;
 const title=entry.label||entry.id;
 const subtitle=isAsset?(entry.status==="mapped"?"Correspondance connue":"À classer"):(entry.approved?"Approuvée":"À approuver");
 const url=src?visualUrl(src):null;
 return '<article class="h0dv-card"><div class="h0dv-illustration">'+
  (url?'<img loading="lazy" src="'+esc(url)+'" alt="'+esc(title)+'">':'<span class="h0dv-no-image">Aucune image</span>')+
  '</div><label>'+esc(title)+'</label><small>'+esc(subtitle)+'</small>'+
  (isAsset?'<button type="button" data-attach="'+esc(entry.id)+'">Associer au profil</button>':"")+
  '</article>';
}

function open(){
 requireGM();
 const counters=status();
 const state={kind:"machine",search:"",filter:"all",assetFilter:"all",profile:null};
 const content='<section class="h0dv"><header class="h0dv-banner">'+
  '<small>HORIZON · ZERO DAWN</small><h2>Bibliothèque visuelle</h2>'+
  '<p>Gère les portraits, les tokens et les illustrations sans saisir les clés techniques.</p>'+
  '<div class="h0dv-counters"><span><strong>'+counters.groups+'</strong> profils</span>'+
  '<span><strong>'+counters.variants+'</strong> variantes</span>'+
  '<span><strong>'+assets.length+'</strong> images</span></div></header>'+
  '<div class="h0dv-controls"><label>Catégorie<select data-kind>'+
  [['machine','Machines'],['creature','Faune'],['faction','Factions'],['equipment','Équipements & pièces']].map(([key,name])=>'<option value="'+key+'">'+name+'</option>').join('')+
  '</select></label><label class="h0dv-search">Recherche<input type="search" data-search placeholder="Nom du profil…"></label>'+
  '<label>Filtre<select data-filter><option value="all">Tous</option><option value="illustrated">Avec variantes</option><option value="empty">Sans variantes</option></select></label></div>'+
  '<div class="h0dv-layout"><aside class="h0dv-side" data-profiles></aside><main class="h0dv-body">'+
  '<div class="h0dv-section-title"><div><h3 data-profile-name>Choisis un profil</h3><small data-profile-key></small></div>'+
  '<button class="h0dv-primary" data-edit disabled>Gérer les variantes</button></div>'+
  '<div class="h0dv-grid" data-variants></div><hr class="h0dv-hr">'+
  '<div class="h0dv-section-title"><div><h3>Galerie des images</h3><small>Images identifiées et images à classer</small></div>'+
  '<select data-assets-filter><option value="all">Toutes</option><option value="unassigned">À classer</option><option value="mapped">Identifiées</option></select></div>'+
  '<p class="h0dv-gallery-note">Sélectionne un profil, puis clique sur « Associer au profil ». Une image ajoutée manuellement ne devient pas approuvée sans ta validation.</p>'+
  '<div class="h0dv-grid" data-assets></div><p class="h0dv-status" data-feedback role="status"></p>'+
  '</main></div></section>';
 return foundry.applications.api.DialogV2.wait({
   window:{title:"H0D Visuels — Bibliothèque",resizable:true},
   content,buttons:[{action:"close",label:"Fermer"}],rejectClose:false,
   render:(_event,dialog)=>{
      const root=dialog.element?.querySelector(".h0dv");
      if(!root||root.dataset.bound)return;
      root.dataset.bound="1";
      const $=selector=>root.querySelector(selector);
      function visibleProfiles(){
        return providerKeys().filter(p=>p.kind===state.kind).filter(p=>{
          const count=getChoices(p.kind,p.key).length;
          const q=(p.label+" "+p.key).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
          const search=state.search.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
          return q.includes(search)&&(state.filter==="all"||
            (state.filter==="illustrated"&&count>0)||(state.filter==="empty"&&count===0));
        });
      }
      function redraw(){
        const profiles=visibleProfiles();
        if(!profiles.some(p=>p.key===state.profile))state.profile=profiles[0]?.key||null;
        $("[data-profiles]").innerHTML=profiles.length?profiles.map(p=>
          '<button type="button" class="h0dv-target '+(p.key===state.profile?"active":"")+'" data-profile="'+esc(p.key)+'">'+
          '<span>'+esc(p.label)+'<small>'+esc(p.key)+'</small></span><b>'+ (getChoices(p.kind,p.key).length||"—")+'</b></button>'
        ).join(""):'<p class="h0dv-muted">Aucun profil correspondant.</p>';
        const selected=profiles.find(p=>p.key===state.profile);
        $("[data-profile-name]").textContent=selected?.label||"Aucun profil sélectionné";
        $("[data-profile-key]").textContent=selected?.key||"";
        $("[data-edit]").disabled=!selected;
        const list=selected?getChoices(state.kind,state.profile):[];
        $("[data-variants]").innerHTML=list.length?list.map(v=>visualGalleryCard(v)).join(""):'<p class="h0dv-muted">Aucune variante associée.</p>';
        const category=state.kind==="equipment"?"component":state.kind;
        const gallery=assets.filter(x=>x.category===category&&
          (state.assetFilter==="all"||x.status===state.assetFilter));
        $("[data-assets]").innerHTML=gallery.length?gallery.map(a=>visualGalleryCard(a,true)).join(""):'<p class="h0dv-muted">Aucune image disponible dans cette catégorie.</p>';
      }
      $("[data-kind]").addEventListener("change",e=>{state.kind=e.target.value;state.profile=null;redraw();});
      $("[data-search]").addEventListener("input",e=>{state.search=e.target.value;redraw();});
      $("[data-filter]").addEventListener("change",e=>{state.filter=e.target.value;redraw();});
      $("[data-assets-filter]").addEventListener("change",e=>{state.assetFilter=e.target.value;redraw();});
      $("[data-profiles]").addEventListener("click",e=>{
        const button=e.target.closest("[data-profile]");
        if(button){state.profile=button.dataset.profile;redraw();}
      });
      $("[data-edit]").addEventListener("click",async()=>{
        if(!state.profile)return;
        try{await manageVariants(state.kind,state.profile);redraw();}
        catch(err){$("[data-feedback]").textContent=String(err?.message||err);}
      });
      $("[data-assets]").addEventListener("click",async e=>{
        const button=e.target.closest("[data-attach]");
        if(!button)return;
        const item=assets.find(a=>a.id===button.dataset.attach);
        const feedback=$("[data-feedback]");
        if(!item||!state.profile){feedback.textContent="Sélectionne un profil avant d'associer une image.";return;}
        const current=getChoices(state.kind,state.profile);
        if(current.some(v=>v.portrait===item.src||v.token===item.src)){
          feedback.textContent="Cette image est déjà associée au profil.";return;
        }
        const base=item.id.replace(/[^a-zA-Z0-9_.-]/g,"-").slice(0,90);
        let id=base,i=2;
        while(current.some(v=>v.id===id))id=base.slice(0,85)+"-"+i++;
        try{
          await addVariant(state.kind,state.profile,{id,label:item.label,portrait:item.src,token:"",presentation:"non_renseigne",approved:false});
          feedback.textContent="Image associée — à approuver dans « Gérer les variantes ».";
          redraw();
        }catch(err){feedback.textContent=String(err?.message||err);}
      });
      redraw();
   }
 });
}
const api=Object.freeze({
  getChoices,pickForBuilder,visualUrl,manageVariants,openPicker,open,
  saveChoices,addVariant,getAssets:()=>assets.map(a=>({...a})),getProfiles:providerKeys,getStatus:status
});
Hooks.once("init",()=>{
  game.settings.register(MODULE_ID,"registry",{
    scope:"world",config:false,type:Object,default:{}
  });
});
Hooks.once("ready",async()=>{
  // Exporter l'API avant tout fetch asynchrone : les builders peuvent
  // vérifier sa présence même si un asset externe est inaccessible.
  game.h0dVisuels=api;
  const mod=game.modules?.get(MODULE_ID);
  if(mod)mod.api=api;
  try{
    const response=await fetch(DEFAULT_PATH,{cache:"no-store"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    const json=await response.json();
    if(json.format!=="H0D_VISUAL_REGISTRY"||json.formatVersion!==1||!Array.isArray(json.entries))
      throw new Error("Format du registre H0D Visuels invalide.");
    const raw={};
    for(const entry of json.entries){
      const id=groupId(entry.kind,entry.key);
      raw[id]=entry.variants;
    }
    bundled=mergeRegistry(raw,{});
    const responseAssets=await fetch(ASSETS_PATH,{cache:"no-store"});
    if(!responseAssets.ok)throw new Error("Inventaire des images introuvable : HTTP "+responseAssets.status);
    const gallery=await responseAssets.json();
    if(gallery.format!=="H0D_VISUAL_ASSETS"||!Array.isArray(gallery.assets))throw new Error("Format de galerie invalide.");
    assets=gallery.assets.filter(a=>a&&typeof a.id==="string"&&typeof a.src==="string");
  }catch(err){
    console.warn("H0D Visuels | registre embarqué indisponible, entrées MJ conservées",err);
  }
  initialized=true;
  console.info("H0D Visuels | v0.2.1 prêt ; "+status().variants+" variante(s).");
});
