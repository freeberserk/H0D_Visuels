/** Pure functions shared by Foundry module and Node tests. */
export const CATEGORIES=Object.freeze(["faction","creature","machine","equipment"]);
export const PRESENTATIONS=Object.freeze(["masculin","feminin","non_renseigne"]);

export function groupId(kind,key){
  if(!CATEGORIES.includes(kind)||typeof key!=="string"||!key.trim())
    throw new Error("Catégorie ou clé technique visuelle invalide.");
  return kind+"::"+key.trim();
}
export function cleanVariant(record){
  const v=record??{};
  const id=String(v.id??"").trim();
  if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(id))
    throw new Error("ID de variante invalide (1 à 100 caractères alphanumériques, tiret, point ou underscore).");
  const portrait=String(v.portrait??"").trim();
  const token=String(v.token??"").trim();
  if(!portrait&&!token)throw new Error("Une variante doit comporter un portrait ou un token.");
  for(const path of [portrait,token]){
    if(!path)continue;
    if(/^(?:javascript|data|file):/i.test(path)||/[\u0000-\u001f<>]/.test(path))
      throw new Error("Chemin d'image dangereux ou invalide.");
  }
  return {
    id,label:String(v.label??id).trim()||id,
    portrait,token,
    presentation:PRESENTATIONS.includes(v.presentation)?v.presentation:"non_renseigne",
    approved:v.approved===true
  };
}
export function selectVariant(list,{mode="random",variantId=null,counts={},lastId=null,random=Math.random}={}){
  const all=Array.isArray(list)?list:[];
  if(mode==="none")return null;
  if(mode==="manual"){
    const picked=all.find(v=>v.id===variantId);
    return picked?{...picked}:null;
  }
  const approved=all.filter(v=>v.approved===true&&(v.portrait||v.token));
  if(!approved.length)return null;
  let pool=approved;
  if(mode==="masculin"||mode==="feminin"){
    pool=approved.filter(v=>v.presentation===mode);
    if(!pool.length)return null;
  }
  if(mode==="balanced"){
    const masc=approved.filter(v=>v.presentation==="masculin");
    const fem=approved.filter(v=>v.presentation==="feminin");
    if(masc.length&&fem.length){
      const m=Number(counts.masculin||0),f=Number(counts.feminin||0);
      pool=m<f?masc:f<m?fem:random()<0.5?masc:fem;
    }
  }
  const avoidRepeat=pool.length>1?pool.filter(v=>v.id!==lastId):pool;
  const finalPool=avoidRepeat.length?avoidRepeat:pool;
  const r=Number(random());
  const n=Number.isFinite(r)?Math.max(0,Math.min(0.999999999,r)):0;
  return {...finalPool[Math.floor(n*finalPool.length)]};
}
export function assetUrl(path,moduleId="h0d-visuels"){
  const p=String(path??"").trim();
  if(!p||/^(?:javascript|data|file):/i.test(p)||/[\u0000-\u001f<>]/.test(p))return null;
  if(/^(?:https?:\/\/|\/|modules\/|worlds\/|systems\/|icons\/|assets\/)/i.test(p))return p;
  return "modules/"+moduleId+"/"+p.replace(/^(?:\.\/)+/,"");
}
export function mergeRegistry(bundled,overrides){
  const result={};
  for(const source of [bundled,overrides]){
    for(const [id,records] of Object.entries(source??{})){
      if(!Array.isArray(records))continue;
      const existing=new Map((result[id]||[]).map(v=>[v.id,v]));
      for(const item of records){
        try{const v=cleanVariant(item);existing.set(v.id,v);}catch{/* invalid entries ignored */}
      }
      result[id]=[...existing.values()];
    }
  }
  return result;
}
