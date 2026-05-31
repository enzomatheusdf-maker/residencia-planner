# Ingestão futura do RESISTATS

Este documento descreve o fluxo para converter o dump RESISTATS completo na árvore fina de hotness usada por `src/constants/enamedIncidencia.js`.

## Fonte

- Dump RESISTATS com tópicos em níveis hierárquicos (`NV n`).
- Contagens empíricas por área e subtópico.
- Marcadores editoriais que devem ser removidos antes do parse: `[cite_start]`, `[cite: N]` e variações equivalentes.

## Normalização de áreas

Mapear as áreas originais para as áreas canônicas do app:

- `CLINICA MEDICA` -> `Clínica Médica`
- `CIRURGIA` -> `Cirurgia`
- `PREVENTIVA E SAUDE PUBLICA` + `PREVENTIVA E SAUDE COLETIVA` -> `Preventiva`
- `PEDIATRIA` -> `Pediatria`
- `GINECOLOGIA` + `OBSTETRICIA` -> `GO`

## Schema alvo

```js
export const ENAMED_HOTNESS = {
  "Clínica Médica": {
    "Subárea": 0.12,
    "Subárea > Tópico": 0.03,
  },
  "Cirurgia": {},
  "Preventiva": {},
  "Pediatria": {},
  "GO": {},
};
```

Os pesos devem representar share relativo dentro da própria macroárea, não share global do corpus.

## Passos de ingestão

1. Ler o dump como UTF-8.
2. Remover marcadores `[cite_start]` e `[cite: N]`.
3. Normalizar cada linha de hierarquia `NV n` para profundidade numérica.
4. Somar contagens por caminho hierárquico.
5. Mesclar os dois blocos de Preventiva em `Preventiva`.
6. Mesclar `GINECOLOGIA` e `OBSTETRICIA` em `GO`.
7. Calcular o total de questões por macroárea.
8. Calcular o share de cada subtópico dentro da macroárea.
9. Gerar `ENAMED_MACRO_QUESTOES`, `ENAMED_MACRO_SHARE_CORPUS` e a árvore fina `ENAMED_HOTNESS`.
10. Manter `MACRO_PESO_ENAMED` separado do share cru para evitar inflar Preventiva pelo artefato dos dois blocos.

## Critérios de qualidade

- O arquivo gerado deve ser UTF-8 sem BOM.
- Nenhuma string visível deve conter mojibake.
- A soma dos shares de subtópicos de uma macroárea deve ficar próxima de `1.0`, respeitando arredondamento.
- Preventiva deve permanecer mesclada para hotness de subtópico, mas o peso macro recomendado deve continuar alinhado ao blueprint equitativo.
