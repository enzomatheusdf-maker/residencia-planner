import fs from "node:fs";
import path from "node:path";

const ORDEM = { Diamante: 0, Alta: 1, "Média": 2, Media: 2, Baixa: 3, "Bônus": 4, Bonus: 4 };

function slug(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const tier = process.argv[2] || "Diamante";
const limit = Number.parseInt(process.argv[3] || "8", 10);
const offset = Number.parseInt(process.argv[4] || "0", 10);

if (!fs.existsSync("temas.json")) {
  throw new Error("temas.json não encontrado. Rode: node scripts/extrairTemas.mjs");
}

if (!Number.isFinite(limit) || limit < 1) throw new Error("limit inválido");
if (!Number.isFinite(offset) || offset < 0) throw new Error("offset inválido");

const temas = readJson("temas.json").sort((a, b) => {
  const prioA = ORDEM[a.prio] ?? 9;
  const prioB = ORDEM[b.prio] ?? 9;
  if (prioA !== prioB) return prioA - prioB;
  return String(a.nome).localeCompare(String(b.nome), "pt-BR");
});

const tierTemas = temas.filter((tema) => String(tema.prio) === tier);
const selected = tierTemas.slice(offset, offset + limit);

fs.mkdirSync("codex_lotes", { recursive: true });

const payload = {
  generatedAt: new Date().toISOString(),
  mode: "codex_local",
  tier,
  offset,
  limit,
  totalTier: tierTemas.length,
  remainingAfterBatch: Math.max(tierTemas.length - offset - selected.length, 0),
  instructions: [
    "Codex deve decompor cada tema em entidades clínicas atômicas quando aplicável.",
    "Temas não clínicos devem entrar em temas_nao_clinicos.json, não em casos clínicos.",
    "Para cada entidade clínica, Codex deve criar um arquivo JSON em casos_gerados/ com determinaçãoSindromica.",
    "Todo caso é rascunho para revisão humana antes de publicação.",
  ],
  expectedOutputs: {
    entidades: "entidades.json",
    temasNaoClinicos: "temas_nao_clinicos.json",
    casosGeradosDir: "casos_gerados/",
    filaRevisar: "fila_revisar.json",
  },
  temas: selected,
};

const file = path.join("codex_lotes", `lote_${slug(tier)}_${offset}_${selected.length}.json`);
fs.writeFileSync(file, JSON.stringify(payload, null, 2));

console.log("Lote Codex:", file);
console.log("Temas no lote:", selected.length, "| total do tier:", tierTemas.length, "| restantes:", payload.remainingAfterBatch);
