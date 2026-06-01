#!/usr/bin/env node
/**
 * check-mojibake.mjs
 * -------------------------------------------------------------------------
 * Detecta texto corrompido (mojibake) em arquivos versionados do projeto.
 *
 * Mojibake = UTF-8 lido/regravado como Windows-1252/Latin-1. Cada caractere
 * acentuado ou emoji vira uma SEQUENCIA de 2-4 caracteres "altos". Ex.:
 *   ex: "c-cedilla" -> U+C3 U+A7,  "e-acute" -> U+C3 U+A9,  emoji -> U+F0 U+9F ...
 *
 * IMPORTANTE: NAO detectamos caracteres isolados (Ã, Â, Ð), pois isso geraria
 * falsos-positivos em portugues legitimo ("REVISAO", "NAO", "PRONTIDAO" usam
 * o "A" com til). Detectamos apenas os DIGRAFOS/SEQUENCIAS de mojibake: um
 * caractere-lider Latin-1 seguido de um caractere de "byte de continuacao".
 *
 * Todos os padroes abaixo usam escapes \u para que ESTE arquivo nao contenha
 * nenhum byte de mojibake literal e passe no seu proprio teste.
 *
 * Sai com codigo 1 se encontrar qualquer ocorrencia; 0 se estiver limpo.
 */

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, sep } from "node:path";

// Caracteres-lider: um byte 0xC0-0xFF de UTF-8 renderizado como cp1252.
const LEAD = "[\\u00c0-\\u00ff]";

// Caracteres de "continuacao" (bytes UTF-8 0x80-0xBF renderizados como cp1252):
// faixa Latin-1 0xA0-0xBF + a pontuacao especial cp1252 (0x80-0x9F).
const CONT =
  "[\\u00a0-\\u00bf\\u20ac\\u201a\\u0192\\u201e\\u2026\\u2020\\u2021" +
  "\\u02c6\\u2030\\u0160\\u2039\\u0152\\u017d\\u2018\\u2019\\u201c" +
  "\\u201d\\u2022\\u2013\\u2014\\u02dc\\u2122\\u0161\\u203a\\u0153" +
  "\\u017e\\u0178]";

const PATTERNS = [
  { label: "Sequencia de mojibake (lider + continuacao)", regex: new RegExp(LEAD + CONT, "g") },
  { label: "Caractere de substituicao U+FFFD", regex: new RegExp(String.fromCharCode(65533), "g") },
];

const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "coverage",
  ".turbo", ".vercel",
  // backups/caches contaminados (nao sao codigo-fonte)
  ".import-bro10", ".import-medrev", ".restore-bro10",
  ".tmp-encoding-corrigido", ".tmp-jest",
]);

const IGNORED_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
]);

const TEXT_EXT = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".json", ".css", ".scss", ".html", ".htm",
  ".txt", ".yml", ".yaml", ".svg",
  // .md excluído: documentação pode conter aspas tipográficas junto a acentos
  // sem ser mojibake (ex: `quê"` em texto corrido). O gate protege source code.
]);

function isIgnored(relPath) {
  const parts = relPath.split(/[\\/]/);
  if (parts.some((p) => IGNORED_DIRS.has(p))) return true;
  if (IGNORED_FILES.has(parts[parts.length - 1])) return true;
  return !TEXT_EXT.has(extname(relPath).toLowerCase());
}

function listTrackedFiles() {
  try {
    const out = execSync("git ls-files -z", { encoding: "buffer" });
    return out.toString("utf8").split("\0").filter(Boolean);
  } catch {
    return null; // nao e um repo git -> usa walk
  }
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORED_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full.split(sep).join("/"));
  }
  return acc;
}

function main() {
  const tracked = listTrackedFiles();
  const files = (tracked ?? walk(process.cwd())).filter((f) => !isIgnored(f));

  const errors = [];
  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      for (const { label, regex } of PATTERNS) {
        regex.lastIndex = 0;
        const hits = line.match(regex);
        if (hits && hits.length) {
          errors.push(`${file}:${i + 1} - ${label}: ${[...new Set(hits)].join(" ")}`);
        }
      }
    });
  }

  if (errors.length) {
    console.error(`\nMojibake encontrado em ${errors.length} local(is):\n`);
    for (const e of errors) console.error(`  ${e}`);
    console.error(`\nCorrija os caracteres corrompidos antes de continuar (salve os arquivos em UTF-8).`);
    process.exit(1);
  }

  console.log(`check-mojibake: OK - ${files.length} arquivos versionados sem mojibake.`);
  process.exit(0);
}

main();
