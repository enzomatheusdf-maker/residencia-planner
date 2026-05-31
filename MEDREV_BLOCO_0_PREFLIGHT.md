# MEDREV — BLOCO 0: Preflight, encoding, baseline e bug crítico de mojibake

> **Use este bloco sozinho no Claude Code / VSCodex.**
> Objetivo: estabilizar o repositório antes de qualquer feature grande. Não implemente dashboard novo, ENAMED novo nem raciocínio clínico neste bloco.

## Modelo recomendado

- **Modelo:** Claude Sonnet
- **Esforço:** médio
- **Por quê:** é um bloco de segurança operacional. Precisa ler o repo com precisão, corrigir encoding e validar build, mas não exige raciocínio arquitetural pesado.

---

## Comando para colar no Claude Code

```bash
claude --model sonnet --permission-mode acceptEdits <<'PROMPT'
Você é engenheiro sênior de frontend, especialista em React CRA/Zustand/Tailwind/Firebase e em prevenção de regressão de encoding.

Contexto do repositório:
- App React CRA + Zustand + Tailwind + Firebase.
- O projeto já tem histórico de mojibake e perda de texto por encoding.
- Este bloco é apenas de preflight, baseline, encoding e validação.
- Não implemente feature nova neste bloco.
- Não reescreva arquivos grandes sem necessidade.

Regras inegociáveis:
1. Trabalhe em UTF-8 sem BOM.
2. Não introduza mojibake.
3. Não use scripts que regravem o repo inteiro às cegas.
4. Não adicione dependência nova.
5. Não mude stack.
6. Não faça deploy neste bloco.
7. Faça commit só se os testes/checks passarem ou documente exatamente por que não passaram.

# BLOCO 0 — PREFLIGHT, ENCODING E BASELINE

## 0.1 Criar branch segura

Execute:

```bash
git status --short
git branch --show-current
```

Se estiver em um repo Git e não houver alterações não commitadas críticas, crie ou entre na branch:

```bash
git switch -c feat/dashboard-enamed-illness-script 2>/dev/null || git switch feat/dashboard-enamed-illness-script
```

Se houver alterações não commitadas do usuário, NÃO descarte. Apenas liste no relatório final.

## 0.2 Inventário do ambiente

Execute e registre no relatório final:

```bash
node --version
npm --version
cat package.json
```

Depois liste os arquivos relevantes:

```bash
find src -maxdepth 2 -type f | sort
find scripts -maxdepth 1 -type f | sort 2>/dev/null || true
```

## 0.3 Corrigir bug crítico conhecido no Dashboard

Procure a string corrompida:

```bash
grep -RIn "PRONTIDÒO\|PRONTIDÃO\|PRONTID" src/components/Dashboard.jsx src 2>/dev/null || true
```

Correção obrigatória:
- Em `src/components/Dashboard.jsx`, dentro da função de exportação/canvas do cartão de prontidão, trocar:

```txt
ÍNDICE DE PRONTIDÒO GERAL
```

por:

```txt
ÍNDICE DE PRONTIDÃO GERAL
```

Atenção: o caractere correto é `Ã` em `PRONTIDÃO`; não é `Ò`.

Depois confirme:

```bash
! grep -RIn "PRONTIDÒO" src || (echo "Ainda existe PRONTIDÒO" && exit 1)
```

## 0.4 Rodar checker atual de mojibake e entender falhas

Execute:

```bash
npm run check:mojibake
```

Se falhar:
1. Leia a saída.
2. Corrija o conteúdo real corrompido.
3. Se a falha vier de documentação com exemplos intencionais de mojibake, NÃO coloque bytes corrompidos no Markdown. Substitua exemplos literais por representação segura, por exemplo:
   - escreva `U+00C3 U+00A7` em vez de colar a sequência corrompida real;
   - escreva `U+FFFD` em vez do caractere de substituição literal;
   - escreva `exemplo de mojibake: c cedilha double-encoded` em vez de colar texto quebrado.
4. Não ignore `src/` nem `scripts/` no checker.

## 0.5 Criar auditoria complementar para o ponto cego do checker

O checker atual tende a detectar digrafos de double-encoding e `U+FFFD`, mas pode não pegar erro isolado como `PRONTIDÒO`.

Crie `scripts/audit-encoding.mjs` com comportamento simples, sem dependência externa:

Requisitos:
- Percorrer arquivos de texto em:
  - `src/`
  - `scripts/`
  - arquivos `.md` na raiz
- Ignorar:
  - `node_modules`
  - `.git`
  - `build`
  - `dist`
  - `coverage`
  - `.tmp-jest`
  - `.import-bro10`
  - `.tmp-encoding-corrigido`
  - lockfiles
- Procurar e falhar se encontrar:
  - `\uFFFD` literal/caractere de substituição real
  - `PRONTIDÒO`
  - padrões comuns em source: `Ã`, `Â`, `â€`, `â€œ`, `â€`, `â€“`, `â€”`, `â€¢`
- Para evitar falso positivo em documentação, permita uma allowlist explícita apenas para linhas que contenham `ALLOW_ENCODING_EXAMPLE`, mas prefira não usar allowlist se puder escrever exemplos com escapes.
- Saída deve mostrar `arquivo:linha` e o padrão encontrado.
- Se não encontrar nada, imprimir `audit-encoding: OK`.

Sugestão de implementação base:

```js
#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([
  "node_modules", ".git", "build", "dist", "coverage", ".tmp-jest",
  ".import-bro10", ".tmp-encoding-corrigido", ".vercel", ".turbo"
]);
const IGNORED_FILES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
const TEXT_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".md", ".css", ".html", ".txt", ".yml", ".yaml", ".svg"]);

const PATTERNS = [
  { label: "replacement char U+FFFD", regex: /\uFFFD|�/g },
  { label: "PRONTIDÒO typo", regex: /PRONTIDÒO/g },
  { label: "mojibake marker Ã", regex: /Ã/g },
  { label: "mojibake marker Â", regex: /Â/g },
  { label: "mojibake marker â€", regex: /â€/g },
  { label: "mojibake quote/open", regex: /â€œ/g },
  { label: "mojibake quote/close", regex: /â€/g },
  { label: "mojibake dash/en", regex: /â€“/g },
  { label: "mojibake dash/em", regex: /â€”/g },
  { label: "mojibake bullet", regex: /â€¢/g },
];

function shouldSkip(fullPath) {
  const rel = fullPath.replace(ROOT + "/", "");
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
    if (st.isDirectory()) walk(full, out);
    else if (!shouldSkip(full)) out.push(full);
  }
  return out;
}

const files = [
  ...walk(join(ROOT, "src")),
  ...(() => { try { return walk(join(ROOT, "scripts")); } catch { return []; } })(),
  ...readdirSync(ROOT).filter((f) => f.endsWith(".md")).map((f) => join(ROOT, f)),
];

const errors = [];
for (const file of [...new Set(files)]) {
  let text;
  try { text = readFileSync(file, "utf8"); } catch { continue; }
  const rel = file.replace(ROOT + "/", "");
  text.split("\n").forEach((line, index) => {
    if (line.includes("ALLOW_ENCODING_EXAMPLE")) return;
    for (const p of PATTERNS) {
      p.regex.lastIndex = 0;
      if (p.regex.test(line)) errors.push(`${rel}:${index + 1} - ${p.label}`);
    }
  });
}

if (errors.length) {
  console.error(`audit-encoding encontrou ${errors.length} ocorrência(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log("audit-encoding: OK");
```

Depois adicione ao `package.json`:

```json
"audit:encoding": "node scripts/audit-encoding.mjs"
```

Não quebre JSON. Mantenha scripts existentes.

## 0.6 Conferir `.editorconfig`, `.gitattributes` e hook

Verifique se existem:

```bash
cat .editorconfig 2>/dev/null || true
cat .gitattributes 2>/dev/null || true
cat .githooks/pre-commit 2>/dev/null || true
```

Critérios:
- `.editorconfig` deve ter `charset = utf-8` e `end_of_line = lf`.
- `.gitattributes` deve forçar texto/UTF-8/LF para `.js`, `.jsx`, `.json`, `.css`, `.md`.
- `.githooks/pre-commit` deve rodar `node scripts/check-mojibake.mjs`.

Se algo estiver ausente, corrija de forma mínima.

## 0.7 Baseline de testes e build

Execute na ordem:

```bash
npm run check:mojibake
npm run audit:encoding
npm test -- --watchAll=false
npm run build
```

Se `npm test -- --watchAll=false` ficar interativo ou travar por ambiente, tente:

```bash
CI=true npm test -- --watchAll=false
```

Se algum teste existente falhar sem relação com este bloco, não corrija feature grande aqui. Registre no relatório final:
- teste que falhou;
- mensagem;
- hipótese;
- se bloqueia ou não o próximo bloco.

## 0.8 Relatório final do bloco

Ao terminar, responda com:

1. Arquivos alterados.
2. Bugs de encoding corrigidos.
3. Resultado de:
   - `npm run check:mojibake`
   - `npm run audit:encoding`
   - `npm test -- --watchAll=false` ou `CI=true npm test -- --watchAll=false`
   - `npm run build`
4. `git status --short`.
5. Se commitou, hash do commit.

## 0.9 Commit deste bloco

Se todos os checks essenciais passarem:

```bash
git add .
git commit -m "chore: fix encoding preflight and dashboard label"
```

Não faça push ainda. Push/deploy ficam para o bloco final.

Critérios de aceite do Bloco 0:
- `PRONTIDÒO` não existe mais no repo.
- Nenhum `U+FFFD` literal.
- `npm run check:mojibake` passa.
- `npm run audit:encoding` passa.
- Build passa ou a falha é documentada e não foi causada por este bloco.
- Commit pequeno, focado e reversível.
PROMPT
```

---

## Checklist manual pós-bloco

Depois que o Claude Code concluir, confira manualmente:

```bash
grep -RIn "PRONTIDÒO\|�\|Ã§\|Ã£\|â€" src scripts *.md 2>/dev/null || true
npm run check:mojibake
npm run audit:encoding
npm run build
```

Se aparecer `Ã§`, `Ã£` ou `â€` dentro de `src/` ou `scripts/`, trate como regressão. Em Markdown, só aceite se estiver escrito em escape seguro ou marcado explicitamente como exemplo permitido.
