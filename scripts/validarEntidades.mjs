import fs from "node:fs";

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const entidades = readJson("entidades.json", []);
const temas = readJson("temas.json", []);
const temaIds = new Set(temas.map((tema) => tema.id));
const required = ["cid", "entidade", "sindrome", "temaId", "temaNome", "area", "prio"];
const seen = new Set();
const reprovadas = [];

if (!Array.isArray(entidades)) {
  throw new Error("entidades.json deve ser um array");
}

for (const [index, entidade] of entidades.entries()) {
  const errs = [];
  for (const key of required) {
    if (!entidade?.[key]) errs.push(`sem_${key}`);
  }
  if (entidade?.cid && seen.has(entidade.cid)) errs.push("cid_duplicado");
  if (entidade?.cid) seen.add(entidade.cid);
  if (temaIds.size && entidade?.temaId && !temaIds.has(entidade.temaId)) errs.push("temaId_desconhecido");
  if (String(entidade?.cid || "").length > 80) errs.push("cid_longo");
  if (String(entidade?.sindrome || "").length < 6) errs.push("sindrome_fraca");
  if (errs.length) reprovadas.push({ index, cid: entidade?.cid || null, errs });
}

fs.writeFileSync("entidades_reprovadas.json", JSON.stringify(reprovadas, null, 2));
console.log("Entidades:", entidades.length, "| reprovadas:", reprovadas.length);
if (reprovadas.length) process.exitCode = 1;
