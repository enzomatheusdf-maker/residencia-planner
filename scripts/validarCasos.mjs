import fs from "node:fs";
const dir="casos_gerados";
if (!fs.existsSync(dir)) {
  console.error("casos_gerados não encontrado. Gere casos antes de validar.");
  process.exit(1);
}
fs.mkdirSync("casos_validos",{recursive:true});
const VITAIS=/\b(FC|FR|PA|Sat|SatO2|T)\b/;
const GENERICOS=new Set(["variante benigna/autolimitada","condição grave a excluir"]);
const reprovados=[];
const plausivel=(c)=>{ const m=c.match(/FC\s*[:=]?\s*(\d{2,3})/); if(m && (+m[1]<20||+m[1]>250)) return false;
  const s=c.match(/SatO2?\s*[:=]?\s*(\d{1,3})/); if(s && (+s[1]<40||+s[1]>100)) return false; return true; };
for(const f of fs.readdirSync(dir)){
  const j=JSON.parse(fs.readFileSync(`${dir}/${f}`,"utf8")); const errs=[];
  if(!j.script||!Array.isArray(j.instances)||j.instances.length<2) errs.push("estrutura");
  if((j.script?.keyFeatures||[]).length>3) errs.push("keyFeatures>3");
  if(!(j.script?.keyFeatures||[]).some(k=>k.isCritical)) errs.push("sem_isCritical");
  if((j.script?.pertinentNegatives||[]).length<1) errs.push("sem_negativo");
  if((j.script?.discriminators||[]).length<1) errs.push("sem_discriminador");
  for(const i of (j.instances||[])){
    const ds=i.determinacaoSindromica;
    if(!ds||(ds.opcoes||[]).length<3||(ds.diferenciaisDaSindrome||[]).length<2) errs.push("sindromica_incompleta");
    if((ds?.diferenciaisDaSindrome||[]).some(dx=>GENERICOS.has(dx))) errs.push("diferencial_sindromico_generico");
    if((i.differentials||[]).some(d=>GENERICOS.has(d?.dx))) errs.push("diferencial_generico");
    if((i.differentials||[]).length<3) errs.push("diferenciais_insuficientes");
    if(i.vignette && i.diagnosticoFinal && i.vignette.toLowerCase().includes(String(i.diagnosticoFinal).toLowerCase())) errs.push("spoiler");
    if(i.vignette && VITAIS.test(i.vignette) && !plausivel(i.vignette)) errs.push("vitais_implausiveis");
  }
  if(errs.length) reprovados.push({f,errs}); else fs.writeFileSync(`casos_validos/${f}`, JSON.stringify(j,null,2));
}
fs.writeFileSync("reprovados.json", JSON.stringify(reprovados,null,2));
console.log("Válidos:", fs.readdirSync("casos_validos").length, "| reprovados:", reprovados.length);
