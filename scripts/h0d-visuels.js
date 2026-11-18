import {CATEGORIES,PRESENTATIONS,groupId,cleanVariant,selectVariant,assetUrl,mergeRegistry} from "./h0d-visual-core.mjs";

const MODULE_ID="h0d-visuels";
const DEFAULT_PATH="modules/h0d-visuels/data/visuals.json";
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
    version:"0.1.0",ready:initialized,
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
  const map={
    faction:game.h0dFactionBuilder?.archetypes,
    creature:game.h0dCreatureBuilder?.creatures,
    machine:game.h0dMachineBuilder?.machines
  };
  const entries=[];
  for(const [kind,provider] of Object.entries(map)){
    if(provider instanceof Map){
      for(const [key,d] of provider)entries.push({kind,key,label:d.label??d.name??key});
    }else if(provider&&typeof provider==="object"){
      for(const [key,d] of Object.entries(provider))entries.push({kind,key,label:d?.label??d?.name??key});
    }
  }
  const catalogue=game.h0dCatalogue;
  if(catalogue?.getDefinitions){
    try{for(const d of catalogue.getDefinitions())entries.push({kind:"equipment",key:d.key,label:d.name??d.key});}
    catch{/* catalogue not ready */}
  }
  return entries;
}
async function open(){
  requireGM();
  const options=providerKeys();
  const status=status();
  const datalist=options.map(o=>'<option value="'+esc(o.key)+'" label="'+esc(o.kind+" — "+o.label)+'"></option>').join("");
  const content='<div class="h0d-visual-home">'+
    '<p>'+status.groups+' groupes, '+status.variants+' variantes, '+status.approved+' approuvées.</p>'+
    '<label>Catégorie <select data-kind>'+CATEGORIES.map(x=>'<option value="'+x+'">'+x+'</option>').join("")+'</select></label>'+
    '<label>Clé technique du builder <input data-key list="h0d-keys" placeholder="ex. archetype-key"></label>'+
    '<datalist id="h0d-keys">'+datalist+'</datalist>'+
    '<p>Les clés disponibles dépendent des builders installés. Une variante peut utiliser un chemin vers un fichier sur The Forge.</p>'+
    '<button type="button" data-action="edit">Gérer les variantes de cette référence</button>'+
    '<p data-h0d-status role="status"></p></div>';
  return dialogClass().wait({
    window:{title:"H0D Visuels — Bibliothèque",resizable:true},
    content,buttons:[{action:"close",label:"Fermer"}],rejectClose:false,
    render:(_event,dialog)=>{
      const root=dialog.element?.querySelector(".h0d-visual-home");
      if(!root||root.dataset.ready==="1")return;root.dataset.ready="1";
      root.querySelector('[data-action="edit"]')?.addEventListener("click",async()=>{
        const kind=root.querySelector("[data-kind]").value,key=root.querySelector("[data-key]").value.trim();
        try{await manageVariants(kind,key);}
        catch(err){const feedback=root.querySelector("[data-h0d-status]");feedback.textContent=String(err?.message??err);}
      });
    }
  });
}
const api=Object.freeze({
  getChoices,pickForBuilder,visualUrl,manageVariants,openPicker,open,
  saveChoices,addVariant,getStatus:status
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
  }catch(err){
    console.warn("H0D Visuels | registre embarqué indisponible, entrées MJ conservées",err);
  }
  initialized=true;
  console.info("H0D Visuels | v0.1.0 prêt ; "+status().variants+" variante(s).");
});
