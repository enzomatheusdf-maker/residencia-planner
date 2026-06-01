import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";

mkdirSync("audit", { recursive: true });

const out = "audit/ASK_CHATGPT.md";

function run(title, command) {
  appendFileSync(out, `\n## ${title}\n\n\`\`\`txt\n`, "utf8");

  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      maxBuffer: 1024 * 1024 * 50,
    });

    appendFileSync(out, result || "(sem saída)\n", "utf8");
  } catch (err) {
    const stdout = err.stdout?.toString?.() || "";
    const stderr = err.stderr?.toString?.() || "";
    appendFileSync(out, `${stdout}\n${stderr}\n`, "utf8");
  }

  appendFileSync(out, "\n```\n", "utf8");
}

writeFileSync(
  out,
  `# ASK_CHATGPT — Auditoria automática

Aja como auditor sênior de engenharia de software. Audite somente o delta abaixo. Procure regressões, bugs, integração incompleta, problemas de arquitetura, encoding, testes, build, UX e riscos de dados persistidos. Priorize P0/P1/P2 e diga exatamente o que corrigir.

`,
  "utf8"
);

run("Git status", "git status --short");
run("Diff stat", "git diff --stat");
run("Changed files", "git diff --name-only");
run("Untracked files", "git ls-files --others --exclude-standard");

appendFileSync(out, "\n## Full diff\n\n```diff\n", "utf8");
try {
  const diff = execSync("git diff -- src package.json package-lock.json public", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    maxBuffer: 1024 * 1024 * 100,
  });
  appendFileSync(out, diff || "(sem diff)\n", "utf8");
} catch (err) {
  appendFileSync(out, `${err.stdout || ""}\n${err.stderr || ""}\n`, "utf8");
}
appendFileSync(out, "\n```\n", "utf8");

appendFileSync(out, "\n## Untracked file contents\n\n", "utf8");
let untrackedFiles = [];
try {
  untrackedFiles = execSync("git ls-files --others --exclude-standard", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    maxBuffer: 1024 * 1024 * 10,
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => file.startsWith("src/") || file.startsWith("scripts/") || file.endsWith(".md"));
} catch {
  untrackedFiles = [];
}

for (const file of untrackedFiles) {
  appendFileSync(out, `\n### ${file}\n\n\`\`\`txt\n`, "utf8");
  try {
    appendFileSync(out, readFileSync(file, "utf8"), "utf8");
  } catch (err) {
    appendFileSync(out, `erro ao ler ${file}: ${String(err?.message || err)}\n`, "utf8");
  }
  appendFileSync(out, "\n```\n", "utf8");
}

run("Mojibake check", "npm run check:mojibake");
run("Tests", "npm test -- --watchAll=false");
run("Build", "npm run build");

console.log(`Arquivo criado: ${out}`);
