import fs from "node:fs";
import vm from "node:vm";

function extractMedcofFromSource(source) {
  const marker = "export const MEDCOF =";
  const start = source.indexOf(marker);
  if (start === -1) throw new Error("MEDCOF não encontrado em src/core/fsrs.js");

  const arrayStart = source.indexOf("[", start);
  if (arrayStart === -1) throw new Error("Array MEDCOF inválido");

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let i = arrayStart; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return source.slice(arrayStart, i + 1);
  }

  throw new Error("Fim do array MEDCOF não encontrado");
}

const fsrsSource = fs.readFileSync("src/core/fsrs.js", "utf8");
const MEDCOF = vm.runInNewContext(`(${extractMedcofFromSource(fsrsSource)})`, Object.create(null), { timeout: 1000 });
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,48);
const ORDEM = {Diamante:0,Alta:1,"Média":2,Media:2,Baixa:3,"Bônus":4,Bonus:4};
const temas = MEDCOF.flatMap(b => b.t.map(([nome,area,prio]) => ({
  id: slug(nome), nome, area, prio: typeof prio==="string"?prio:(prio?.prio??"Média"), bloco:b.b })));
temas.sort((a,b)=>(ORDEM[a.prio]??9)-(ORDEM[b.prio]??9));
fs.writeFileSync("temas.json", JSON.stringify(temas,null,2));
console.log("Temas:", temas.length);
