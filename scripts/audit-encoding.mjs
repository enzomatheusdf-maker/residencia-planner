#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, relative, sep } from "node:path";

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "build",
  "dist",
  "coverage",
  ".tmp-jest",
  ".import-bro10",
  ".tmp-encoding-corrigido",
  ".vercel",
  ".turbo",
]);
const IGNORED_FILES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
const TEXT_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".html",
  ".txt",
  ".yml",
  ".yaml",
  ".svg",
]);

const LEAD = "[\\u00c0-\\u00ff]";
const CONT =
  "[\\u00a0-\\u00bf\\u20ac\\u201a\\u0192\\u201e\\u2026\\u2020\\u2021" +
  "\\u02c6\\u2030\\u0160\\u2039\\u0152\\u017d\\u2018\\u2019\\u201c" +
  "\\u201d\\u2022\\u2013\\u2014\\u02dc\\u2122\\u0161\\u203a\\u0153" +
  "\\u017e\\u0178]";

const PATTERNS = [
  { label: "mojibake sequence (lead+continuation)", regex: new RegExp(LEAD + CONT, "g") },
  { label: "replacement char U+FFFD", regex: new RegExp(String.fromCharCode(65533), "g") },
  { label: "PRONTIDÒO typo", regex: /PRONTIDÒO/g },
];

function shouldSkip(fullPath) {
  const rel = relative(ROOT, fullPath);
  const parts = rel.split(/[\\/]/);
  if (parts.some((p) => IGNORED_DIRS.has(p))) return true;
  if (IGNORED_FILES.has(parts[parts.length - 1])) return true;
  return !TEXT_EXT.has(extname(rel).toLowerCase());
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORED_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (!shouldSkip(full)) {
      out.push(full);
    }
  }
  return out;
}

function listTrackedFiles() {
  try {
    const out = execSync("git ls-files -z", { encoding: "buffer" });
    return out.toString("utf8").split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

function isTarget(rel) {
  const normalized = rel.split("\\").join("/");
  return normalized.startsWith("src/") || normalized.startsWith("scripts/") || /^[^/]+\.md$/i.test(normalized);
}

const tracked = listTrackedFiles();
const files = (tracked
  ? tracked
      .filter((f) => isTarget(f))
      .map((f) => join(ROOT, f))
  : [
      ...(() => {
        try {
          return walk(join(ROOT, "src"));
        } catch {
          return [];
        }
      })(),
      ...(() => {
        try {
          return walk(join(ROOT, "scripts"));
        } catch {
          return [];
        }
      })(),
      ...(() => {
        try {
          return readdirSync(ROOT)
            .filter((f) => f.endsWith(".md"))
            .map((f) => join(ROOT, f));
        } catch {
          return [];
        }
      })(),
    ]).filter((f) => !shouldSkip(f));

const errors = [];
for (const file of [...new Set(files)]) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const rel = relative(ROOT, file);
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    if (line.includes("ALLOW_ENCODING_EXAMPLE")) return;
    for (const p of PATTERNS) {
      p.regex.lastIndex = 0;
      if (p.regex.test(line)) {
        errors.push(`${rel}:${index + 1} - ${p.label}`);
      }
    }
  });
}

if (errors.length) {
  console.error(`audit-encoding encontrou ${errors.length} ocorrência(s):`);
  for (const e of errors) {
    console.error(`  ${e}`);
  }
  process.exit(1);
}

console.log("audit-encoding: OK");
