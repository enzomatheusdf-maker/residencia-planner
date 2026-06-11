# MedRev — Landing Page Premium Pré-Login — Plano de Implementação

> **Modo:** Opus planeja / Sonnet Low executa.
> **Status global:** A Landing Page **já existe e já está integrada** ao fluxo de auth. Este plano documenta o que já está pronto e mastiga os blocos que faltam para chegar ao escopo completo do briefing, sem tocar em core/auth/Firestore.
> **Data:** 2026-06-10

---

## 1. Auditoria do fluxo atual de autenticação / pré-login

### 1.1 Como o app decide se o usuário está autenticado

Arquivo: `src/App.js`.

- O estado de auth vive em `usuarioLogado` (objeto user do Firebase) + `authSession` (escopo/hidratação).
- `monitorarAuth(callback)` (de `src/services/firebase.js`) é assinado em `useEffect` (`App.js:445`). Quando há `user`, faz `setUsuarioLogado(user)`, carrega dados via `carregarDadosUsuario(uid)` e hidrata o scope. Quando não há, faz `setUsuarioLogado(null)` e `setView("login")`.
- Há um **timeout de segurança de 5s** (`App.js:594`): se o Firebase não responder, `carregandoAuth` vira `false` e a Landing aparece mesmo assim.

### 1.2 Qual tela aparece antes do login hoje

Ordem de render em `App.js`:

1. `if (carregandoAuth)` → splash com `MedRevLogo` (`App.js:1053`).
2. `if (!usuarioLogado)` → **`<LandingPage>`** + `<AuthModal>` condicional (`App.js:1067-1087`).
3. `if (focusMode)` → FocusMode.
4. Default → app completo (Sidebar + views).

**Gating já é exatamente o desejado:** não autenticado vê Landing; autenticado entra direto no app; a Landing nunca reaparece depois do login.

### 1.3 Onde ficam os componentes de UI premium

- Primitivos do app: `src/components/Primitives.jsx` (`MedRevLogo`, `Btn`, `Input`, `Modal`...).
- Design system novo: `src/components/ui/*` (`Button`, `Card`, `Dialog`, `Badge`...).
- **Classes utilitárias premium** em `src/index.css`: `.med-card`, `.med-card-interactive`, `.med-pressable`, `.med-focus-ring`, `.med-animate-in`, `.med-card-enter` — todas com bloco `@media (prefers-reduced-motion: reduce)` (`index.css:240`). A Landing já usa essas classes.
- Estilização principal: **Tailwind utilities** (classes inline) + as classes `med-*`.

### 1.4 Como abrir login/cadastro existente

- `openAuthModal(mode)` (`App.js:306`) seta `authModalMode` e `authModalOpen=true`.
- A Landing recebe `onLogin={() => openAuthModal("login")}` e `onSignup={() => openAuthModal("signup")}`.
- `AuthModal` (`src/components/AuthModal.jsx`) já cobre login / signup / reset. Contrato: `{ onSuccess, initialMode, onClose }`. Usa `criarConta`, `fazerLogin`, `resetarSenha` de `services/firebase`.
- **Não criar segundo sistema de auth.** Os CTAs apenas chamam `onLogin` / `onSignup`.

### 1.5 Já existe Landing Page?

**Sim.** `src/components/LandingPage.jsx` (387 linhas, untracked) + `src/components/LandingPage.test.jsx` (3 testes passando). Já contém: navbar âncora, hero + mock "Comando do dia" (`MockPanel`), seção Problema, Como funciona (ciclo de 7 etapas), Recursos (grid de 9), Diferencial (tabela banco vs MedRev), Para quem é, Beta gratuito, Segurança, FAQ (7 perguntas), CTA final, Footer. `document.title` setado via `useEffect`.

### 1.6 Arquivos seguros para alterar (Sonnet Low)

```
src/components/LandingPage.jsx
src/components/LandingPage.test.jsx
src/components/landing/*           (novos subcomponentes, se necessário)
src/index.css                      (apenas adicionar classes med-* novas no fim; nunca editar tokens existentes)
```

### 1.7 Arquivos PROIBIDOS para Sonnet Low

```
src/core/fsrs.js
src/core/store.js
src/core/agendaEngine.js
src/core/scheduleWizard.js
src/core/mentorSignals.js
src/core/userScope.js          (não há dataSafety.js; o equivalente é DataSafetyPanel + userScope)
src/services/firebase.js
src/services/userDataPaths.js
src/components/AuthModal.jsx    (contrato já correto — não mexer)
firestore.rules / firebase.json (se existirem)
src/App.js                     (já integrado — só editar se um bloco exigir explicitamente; ver LP-INT)
```

---

## 2. Decisão de arquitetura da Landing Page

- **Manter** o componente único `src/components/LandingPage.jsx` com seções internas (já é o padrão atual). Só extrair para `src/components/landing/*` se o arquivo passar de ~600 linhas e a leitura piorar. Para Sonnet Low, **preferir manter tudo em um arquivo** — menos pontos de falha.
- **Não** introduzir router, lib de animação, lib de SEO, nem imagem externa. Mockups 100% CSS/React.
- **Copy ASCII-only** (sem acentos), igual ao que já está no arquivo ("Metodo", "raciocinio"). Motivo: o projeto tem histórico de mojibake e edição em Windows; manter ASCII elimina risco e mantém consistência visual com o texto já presente. (O gate `check-mojibake` aceitaria acentos UTF-8 corretos, mas não vamos arriscar.)
- **Integração já feita** — não re-fazer. A única alteração permitida em `App.js` seria trocar o título exibido se necessário; não é preciso.

---

## 3. Estrutura visual da página (alvo final)

Ordem de seções (✅ = já existe, ➕ = falta implementar):

1. ✅ Navbar (logo, âncoras, Entrar, Comecar beta gratuito)
2. ✅ Hero + badge + CTAs + microcopy
3. ✅ Mock "Comando do dia" (`MockPanel`)
4. ➕ **A dor real** — 5 cards com a copy exata do briefing + fechamento
5. ➕ **Antes e Depois** — comparação visual premium
6. ✅ Como funciona — ciclo Planejar→...→Ajustar (já existe; ajustar título)
7. ✅ Recursos principais — grid de 9 cards
8. ➕ **O método por trás** — 5 cards de ciência da aprendizagem
9. ✅ Diferencial — tabela banco vs MedRev
10. ✅ Para quem é + ➕ **Para quem NÃO é**
11. ✅ Beta gratuito (card de inclusões) + ➕ aviso honesto "beta em construção"
12. ✅ Segurança e controle
13. ➕ **Sem promessas falsas**
14. ✅ FAQ (7 perguntas)
15. ✅ CTA final + ➕ frase opcional ("O MedRev não decide sua aprovação...")
16. ✅ Footer

---

## 4. Copy completa (ASCII-only, pronta para colar)

> Todas as strings abaixo já estão sem acento, prontas para o arquivo.

### 4.1 A dor real
- Título: `O problema nao e falta de material. E falta de sistema.`
- Cards:
  1. `Voce estuda um tema e nao sabe quando revisar.`
  2. `Faz questoes, mas nao transforma erro em plano.`
  3. `Faz simulado, mas ele vira so uma nota.`
  4. `Usa Anki, mas ele fica separado do cronograma.`
  5. `Abre o app e ainda precisa decidir sozinho o que fazer.`
- Fechamento: `O MedRev conecta essas pecas em um plano diario de execucao.`

### 4.2 Antes e Depois
- Título: `Do improviso ao sistema.`
- **Antes do MedRev:** `Cronograma separado.` / `Anki separado.` / `Simulado separado.` / `Erros esquecidos.` / `Revisao atrasada.` / `Estatisticas sem decisao.`
- **Depois do MedRev:** `Plano diario.` / `Revisao espacada por tema.` / `Erro vira acao.` / `Simulado ajusta prioridade.` / `Anki entra na rotina.` / `Mentor mostra o proximo passo.`

### 4.3 O método por trás
- Título: `Um metodo de estudo, nao so um app.`
- Intro: `O MedRev foi desenhado em torno de principios de ciencia da aprendizagem: pratica de recuperacao, revisao espacada, interleaving, feedback direcionado, auditoria de erros e acompanhamento longitudinal.`
- Cards:
  1. `Pratica de recuperacao` — `Voce testa o que lembra antes de revisar.`
  2. `Revisao espacada` — `Os temas retornam no momento certo, sem depender de memoria ou planilha.`
  3. `Auditoria de erros` — `Cada erro aponta uma acao: revisar conceito, treinar raciocinio, corrigir interpretacao ou ajustar tempo.`
  4. `Simulados com consequencia` — `O simulado nao vira so uma nota. Ele muda prioridades.`
  5. `Raciocinio clinico` — `Casos, illness scripts e diferenciais entram como parte do treino.`

### 4.4 Para quem NÃO é
- Título da subseção: `Para quem nao e.`
- Itens: `Quem quer promessa de aprovacao.` / `Quem procura apenas mais um banco de questoes.` / `Quem quer substituir estudo ativo por automacao.` / `Quem nao pretende registrar erros, revisoes ou simulados.`

### 4.5 Beta em construção (complemento da seção Beta)
- `Algumas funcoes ainda podem mudar durante o beta. O objetivo e validar o metodo, melhorar a estabilidade e construir uma plataforma realmente util para a rotina de estudo.`

### 4.6 Sem promessas falsas
- Título: `Sem promessa de aprovacao. Com sistema de execucao.`
- Copy: `Nenhuma plataforma seria deve prometer aprovacao. O MedRev ajuda voce a organizar estudo, revisar melhor, corrigir erros e tomar decisoes mais consistentes ate a prova.`

### 4.7 Frase final opcional (no CTA final)
- `O MedRev nao decide sua aprovacao. Ele organiza o proximo passo.`

> Hero, Recursos, Diferencial, FAQ, Footer: **já estão corretos** no arquivo. Não reescrever.

---

## 5. Design system recomendado

- **Cores:** fundo `#05070d` / `#08101d`; acentos `blue-600 → cyan-500`; verde `emerald-300` para "incluído"; texto `white` / `slate-300` / `slate-400`. (Já é o padrão do arquivo — reusar.)
- **Cards:** classe `med-card med-card-interactive rounded-2xl p-5` para hover/profundidade. Para a coluna "Depois" e destaques, usar borda `cyan-300/20` + sombra suave.
- **Botões:** reusar os helpers locais `PrimaryButton` e `SecondaryButton` já definidos no arquivo (gradiente + `med-pressable` + `med-focus-ring`).
- **Seção helper:** reusar `SectionIntro({ eyebrow, title, children, id })`.
- **Motion:** somente `med-animate-in` (fade-up) e hover dos cards. Nada de lib nova. `prefers-reduced-motion` já tratado no CSS.
- **Antes/Depois:** grid 2 colunas no desktop, empilhado no mobile. Coluna "Antes" em tom neutro/apagado (`text-slate-400`, ícone `-` ou X), coluna "Depois" em destaque (check `cyan/emerald`).

---

## 6. Arquivos permitidos x proibidos (resumo)

| Permitido | Proibido |
|---|---|
| `src/components/LandingPage.jsx` | qualquer `src/core/*` |
| `src/components/LandingPage.test.jsx` | `src/services/*` |
| `src/components/landing/*` (se extrair) | `src/components/AuthModal.jsx` |
| `src/index.css` (append de classes med-* no fim) | `src/App.js` (salvo LP-INT, que não é necessário) |
| `docs/*` | `firestore.rules`, `firebase.json` |

---

## 7. Blocos pequenos para Sonnet Low

> **Já concluídos** (não refazer): integração de gating (App.js), estrutura base, Hero + mock, Recursos, Diferencial, Para quem é, Beta (card), Segurança, FAQ, CTA, Footer, teste base.

### BLOCO LP4 — Seção "A dor real"

**Objetivo:** Adicionar a seção de dor com as 5 dores exatas do briefing + fechamento, logo após o Hero (antes ou no lugar reforçando a seção "Problema" atual).

**Arquivos permitidos:** `src/components/LandingPage.jsx`.
**Arquivos proibidos:** todos os de core/auth/services; `App.js`.

**Tarefas:**
1. Criar um array `painPoints` com as 5 strings da seção 4.1.
2. Renderizar uma `<section>` com `SectionIntro` (título da 4.1), grid `md:grid-cols-5` de `med-card`, e um parágrafo de fechamento centralizado.
3. Garantir `id` e `scroll-mt-24` se vira alvo de âncora (opcional; não precisa entrar na navbar).
4. Não remover a seção "Problema" existente, a menos que vire redundante; se redundante, **substituir** o conteúdo dela por esta (decisão: substituir, para não duplicar a mesma ideia).

**Critérios de aceite:** as 5 dores aparecem; fechamento aparece; sem overflow no mobile 390px; build e testes passam.
**Riscos:** duplicidade com a seção "Problema". **Rollback:** `git checkout src/components/LandingPage.jsx`.

---

### BLOCO LP5 — Seção "Antes e Depois"

**Objetivo:** Implementar a comparação visual premium (4.2), inserida entre "A dor real" e "Como funciona".

**Arquivos permitidos:** `src/components/LandingPage.jsx` (+ `src/index.css` só se precisar de uma classe utilitária nova).
**Arquivos proibidos:** core/auth/services; `App.js`.

**Tarefas:**
1. Criar arrays `antes` e `depois` (4.2).
2. Grid 2 colunas (`lg:grid-cols-2`), empilhado no mobile. Coluna "Antes" apagada, "Depois" em destaque com check cyan/emerald.
3. Usar `SectionIntro` com título `Do improviso ao sistema.`

**Critérios de aceite:** duas colunas visíveis; mobile empilha sem quebra; contraste legível; build/testes passam.
**Riscos:** baixo. **Rollback:** git checkout do arquivo.

---

### BLOCO LP6 — Seção "O método por trás" + ajuste de títulos

**Objetivo:** Implementar a seção científica (4.3) entre "Recursos" e "Diferencial"; ajustar o título de "Como funciona" para `Um ciclo fechado de estudo.` (já está) e garantir o fluxo `Planejar -> Executar -> Registrar -> Corrigir -> Revisar -> Medir -> Ajustar` visível.

**Arquivos permitidos:** `src/components/LandingPage.jsx`.
**Arquivos proibidos:** idem.

**Tarefas:**
1. Array `metodo` com os 5 cards (4.3).
2. Seção com intro (parágrafo 4.3) + grid `md:grid-cols-2`/`lg:grid-cols-3` de `med-card`.
3. Adicionar `id="metodo"` se a âncora da navbar apontar para esta seção (hoje `#metodo` aponta para o Diferencial — **decisão:** manter a âncora no Diferencial OU mover para esta seção; recomendo mover `id="metodo"` para esta seção nova e dar outro `id` ao Diferencial). Documentar a escolha no relatório.

**Critérios de aceite:** 5 cards do método; âncora "Metodo" da navbar leva a uma seção coerente; build/testes passam.
**Riscos:** âncora quebrada se `id` duplicado. **Rollback:** git checkout.

---

### BLOCO LP7 — "Para quem NÃO é" + "Beta em construção" + "Sem promessas falsas"

**Objetivo:** Completar o posicionamento honesto.

**Arquivos permitidos:** `src/components/LandingPage.jsx`.
**Arquivos proibidos:** idem.

**Tarefas:**
1. Na seção "Para quem e", adicionar uma coluna/bloco **"Para quem nao e"** (4.4) com itens em tom neutro/atenção.
2. Na seção Beta, adicionar o parágrafo "beta em construção" (4.5).
3. Criar uma seção curta **"Sem promessas falsas"** (4.6) antes do FAQ.

**Critérios de aceite:** os 3 elementos presentes; nenhum preço/checkout/plano pago; mobile ok; build/testes passam.
**Riscos:** baixo. **Rollback:** git checkout.

---

### BLOCO LP8 — Polish do CTA final + Footer + SEO

**Objetivo:** Acabamento textual e SEO básico.

**Arquivos permitidos:** `src/components/LandingPage.jsx`.
**Arquivos proibidos:** idem.

**Tarefas:**
1. Adicionar a frase opcional (4.7) abaixo do CTA final.
2. Confirmar `document.title` (já existe). Se houver `<meta name="description">` em `public/index.html`, **não** alterar sem autorização (fora do escopo de Sonnet Low; apenas reportar).
3. Footer: confirmar que só há links que existem (Entrar, Comecar beta). **Não** criar links de Termos/Privacidade/Contato se as páginas não existirem.

**Critérios de aceite:** frase final presente; sem links quebrados; build/testes passam.
**Riscos:** baixo. **Rollback:** git checkout.

---

### BLOCO LP9 — Responsividade, acessibilidade e polish premium

**Objetivo:** Garantir 390px sem overflow, foco visível, headings em ordem, motion reduzido respeitado.

**Arquivos permitidos:** `src/components/LandingPage.jsx`, `src/index.css` (append).
**Arquivos proibidos:** core/auth/services; `App.js`.

**Tarefas:**
1. Revisar todas as seções novas em 390 / 768 / 1366 / 1440px. Corrigir grids que estouram.
2. Garantir hierarquia de headings: um único `<h1>` (hero), demais seções em `<h2>`/`<h3>`.
3. Garantir `aria-label` onde o texto do botão não for autoexplicativo; foco visível via `med-focus-ring`.
4. Confirmar `overflow-x-hidden` no container raiz (já presente).

**Critérios de aceite:** sem scroll horizontal em 390px; foco visível navegando por teclado; sem warning de heading no axe básico (se disponível); build/testes passam.
**Riscos:** mexer em grid pode afetar desktop. **Rollback:** git checkout.

---

### BLOCO LP10 — Testes / build e limpeza final

**Objetivo:** Validar tudo e ampliar o teste mínimo.

**Arquivos permitidos:** `src/components/LandingPage.test.jsx`, `src/components/LandingPage.jsx`.
**Arquivos proibidos:** idem.

**Tarefas:**
1. Ampliar `LandingPage.test.jsx`: além dos 3 testes atuais, adicionar asserts de presença de "Antes"/"Depois", "A dor real" (fechamento) e "Sem promessa de aprovacao". Manter matchers tolerantes (regex), texto ASCII.
2. Rodar a tríade de validação (seção 9).
3. Entregar relatório: arquivos alterados, o que foi feito, saída de testes/build, riscos.

**Critérios de aceite:** `check:mojibake` OK; `test` verde; `build` OK; nenhum arquivo de core alterado.
**Riscos:** teste frágil por texto exato. **Rollback:** git checkout.

---

## 8. Prompts prontos para Sonnet Low

> Template aplicável a cada bloco. Trocar `LPx` e colar a seção de Tarefas correspondente.

```
Execute somente o BLOCO LPx do documento docs/MEDREV_LANDING_PREMIUM_PRELOGIN_IMPLEMENTATION_PLAN.md.

Nao execute blocos futuros.
Nao refatore arquivos fora do escopo.
Nao instale bibliotecas.
Nao altere Firebase/Auth/Firestore.
Nao altere core do MedRev (src/core/*, src/services/*).
Nao altere src/App.js nem src/components/AuthModal.jsx.
Use copy ASCII-only (sem acentos), no mesmo estilo do arquivo atual.
Reuse os helpers ja existentes no arquivo: PrimaryButton, SecondaryButton, SectionIntro, classes med-*.

Arquivos permitidos:
src/components/LandingPage.jsx
(+ os listados no bloco)

Arquivos proibidos:
src/core/*, src/services/*, src/App.js, src/components/AuthModal.jsx, firestore.rules, firebase.json

Tarefas:
<colar a lista de Tarefas do bloco>

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue:
1. arquivos alterados
2. o que foi feito
3. saida de testes/build
4. riscos
```

---

## 9. Validações obrigatórias (por bloco, quando aplicável)

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

`npm run build` já roda `check:mojibake` antes do `react-scripts build`. Testes via `react-scripts test` (Jest + Testing Library, já configurado).

Teste alvo: `src/components/LandingPage.test.jsx` — manter os 3 testes atuais + ampliar no LP10:
- renderiza headline;
- renderiza CTA "comecar beta gratuito";
- renderiza FAQ;
- botão Entrar chama `onLogin`;
- botão Comecar beta chama `onSignup`;
- (novos) presença de Antes/Depois, dor real, "Sem promessa de aprovacao".

---

## 10. Critérios de aceite finais

- [x] usuário não autenticado vê a Landing (já — `App.js:1067`)
- [x] usuário autenticado entra no app (já)
- [x] CTAs abrem login/cadastro existente (já — `openAuthModal`)
- [x] explica o MedRev em < 5s (hero já faz)
- [x] comunica beta gratuito, sem preço/cobrança/checkout
- [x] não promete aprovação
- [ ] Antes/Depois presente (LP5)
- [ ] A dor real presente (LP4)
- [ ] Método por trás presente (LP6)
- [ ] Para quem NÃO é + Sem promessas falsas (LP7)
- [x] FAQ presente (já)
- [ ] mobile 390px sem overflow validado (LP9)
- [ ] foco visível / contraste / headings (LP9)
- [ ] build + mojibake + testes passam (LP10)
- [x] nenhum arquivo de core alterado (manter)

---

## 11. Ordem exata de execução

`LP4 → LP5 → LP6 → LP7 → LP8 → LP9 → LP10`

Cada bloco é independente o suficiente para parar e validar. LP9 e LP10 são de fechamento e dependem dos anteriores.

---

## 12. Riscos principais

1. **Duplicação de conteúdo** entre a seção "Problema" atual e a nova "A dor real" — resolver substituindo, não somando (LP4).
2. **Âncora `#metodo` ambígua** — hoje aponta ao Diferencial; ao criar "O método por trás" decidir um único destino (LP6).
3. **Mojibake** ao colar acentos — mitigado mantendo copy ASCII-only.
4. **Quebra de layout mobile** ao adicionar grids de 5/7 colunas — validar em 390px (LP9).
5. **Teste frágil** por texto exato — usar regex tolerante (LP10).
6. **Sonnet tocar em App.js/AuthModal sem necessidade** — proibido explicitamente; integração já está pronta.
