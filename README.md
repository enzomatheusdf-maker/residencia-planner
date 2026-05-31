# MedRev

MedRev é uma plataforma de estudo para Residência e Vestibular baseada em revisão ativa, ciclos D0–D21 e priorização por prontidão.

## Stack
- React (CRA)
- Zustand (persistência local)
- Tailwind CSS
- Firebase (Auth + Firestore)

## Requisitos
- Node.js 18+
- npm 9+

## Configuração
1. Copie `env.example` para `.env`.
2. Preencha as variáveis Firebase.

Variáveis esperadas:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

## Rodando localmente
```bash
npm install
npm start
```

## Testes
```bash
npm test -- --watch=false --runInBand
```

## Build de produção
```bash
npm run build
```

## Deploy (GitHub Pages)
```bash
npm run deploy
```

## Lema
"A única coisa que rouba o nosso conhecimento é o tempo: o que não revemos, se perde."
