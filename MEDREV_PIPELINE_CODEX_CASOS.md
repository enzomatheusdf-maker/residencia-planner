# MEDREV — PIPELINE CODEX LOCAL DE CASOS CLÍNICOS

> Objetivo: gerar entidades clínicas e casos sem enviar dados para Anthropic ou qualquer API externa. O Codex gera o conteúdo dentro do repositório, em lotes pequenos, e os scripts locais apenas extraem, preparam e validam arquivos.

---

## 1. Decisão

O pipeline antigo usava Message Batches API. Este plano substitui isso por geração local assistida por Codex:

```txt
MEDCOF -> extrair temas -> preparar lote -> Codex gera entidades/casos -> validar -> revisão humana -> publicar
```

Não há chamada externa de modelo. A geração acontece nesta conversa/ambiente de Codex, com arquivos JSON versionáveis e validação local.

---

## 2. Arquitetura

```txt
src/core/fsrs.js
  -> scripts/extrairTemas.mjs
  -> temas.json
  -> scripts/prepararLoteCodex.mjs <tier> <limit> <offset>
  -> codex_lotes/lote_<tier>_<offset>_<n>.json
  -> Codex escreve:
       entidades.json
       temas_nao_clinicos.json
       casos_gerados/*.json
       fila_revisar.json
  -> scripts/validarEntidades.mjs
  -> scripts/validarCasos.mjs
```

---

## 3. Runbook

### 3.1 Extrair temas

```bash
node scripts/extrairTemas.mjs
```

Saída esperada:

```txt
temas.json
```

### 3.2 Preparar lote para Codex

Use lotes pequenos para manter qualidade médica e revisão objetiva.

```bash
node scripts/prepararLoteCodex.mjs Diamante 8 0
```

Parâmetros:

```txt
1. tier: Diamante | Alta | Média | Baixa | Bônus
2. limit: quantidade de temas no lote
3. offset: deslocamento dentro do tier
```

Exemplo de sequência:

```bash
node scripts/prepararLoteCodex.mjs Diamante 8 0
node scripts/prepararLoteCodex.mjs Diamante 8 8
node scripts/prepararLoteCodex.mjs Diamante 8 16
```

### 3.3 Geração pelo Codex

Para cada lote, Codex deve:

```txt
1. Ler codex_lotes/lote_*.json.
2. Decompor temas empacotados em entidades clínicas atômicas.
3. Enviar temas não clínicos para temas_nao_clinicos.json.
4. Acrescentar entidades clínicas em entidades.json.
5. Criar um caso por entidade em casos_gerados/<cid>.json.
6. Preencher fila_revisar.json com casos incertos ou que exigem checagem humana prioritária.
```

### 3.4 Validar

```bash
node scripts/validarEntidades.mjs
node scripts/validarCasos.mjs
npm run check:mojibake
npm test
npm run build
```

---

## 4. Contrato de entidade

```json
{
  "cid": "tema-id__entidade-id",
  "entidade": "Nome da doença/condição",
  "sindrome": "Síndrome guarda-chuva",
  "incidencia": "alta",
  "temaId": "tema-id",
  "temaNome": "Tema original",
  "area": "Clínica Médica",
  "prio": "Diamante"
}
```

Regras:

```txt
- Uma entidade = uma doença/condição diagnosticável.
- Tema empacotado vira múltiplas entidades.
- Tema administrativo/conceitual sem caso clínico vira temas_nao_clinicos.json.
- cid deve ser estável e único.
```

---

## 5. Contrato de caso

Cada arquivo em `casos_gerados/*.json` deve seguir o schema do prompt em `prompts/gerar_system.txt`.

Obrigatório:

```txt
- script com illness script atômico.
- 2 instâncias: typical e atypical.
- determinacaoSindromica como primeiro passo.
- diferenciais que compartilham a mesma síndrome.
- keyFeatures com no máximo 3 itens.
- negatives, discriminators e commonErrors.
- _revisar preenchido quando houver incerteza clínica.
```

---

## 6. Critério de aceite por lote

```txt
[ ] codex_lotes/lote_*.json criado.
[ ] entidades.json atualizado sem duplicar cid.
[ ] temas_nao_clinicos.json atualizado quando aplicável.
[ ] casos_gerados/*.json criado para cada entidade clínica do lote.
[ ] scripts/validarEntidades.mjs passa.
[ ] scripts/validarCasos.mjs passa ou reprovados.json explica os problemas.
[ ] npm run check:mojibake passa.
[ ] Tudo permanece rascunho para revisão humana antes de publicar.
```

---

## 7. Limite operacional

Codex pode gerar o conteúdo, mas deve fazer isso em lotes pequenos. Gerar o MEDCOF inteiro em uma única resposta reduziria qualidade, aumentaria risco clínico e dificultaria revisão. A ordem recomendada é:

```txt
1. Diamante em lotes de 8 temas.
2. Alta em lotes de 8-12 temas.
3. Média/Baixa/Bônus somente depois da revisão dos tiers principais.
```
