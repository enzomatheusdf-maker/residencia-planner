// src/services/firebase.js
// Firebase initialization, authentication, and user data synchronization services

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// ─── AUTHENTICATION OPERATIONS ───────────────────────────────────────────────

export const criarConta = async (email, senha, nome) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: nome });
    
    // Create initial user document in Firestore with baseline structures
    await setDoc(doc(db, "usuarios", user.uid), {
      uid: user.uid,
      email: email,
      nome: nome,
      criadoEm: new Date().toISOString(),
      plat: "res",
      userName: nome,
      meta: { dataProva: "2026-10-25", acerto: 85, metaDiaria: 0 },
      res: { temas: [], simulados: [], ankiLog: [], cronogramas: [] },
      vest: { temas: [], simulados: [], ankiLog: [], cronogramas: [] },
      focusMode: false,
      modoSimples: true,
      brainDumpD1Data: {},
      temaStats: {},
      onboardingDone: false,
    });
    
    return { sucesso: true, user, uid: user.uid };
  } catch (erro) {
    console.error("Erro ao criar conta:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

export const fazerLogin = async (email, senha) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    return { sucesso: true, user: userCredential.user, uid: userCredential.user.uid };
  } catch (erro) {
    console.error("Erro ao fazer login:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

export const fazerLogout = async () => {
  try {
    await signOut(auth);
    localStorage.clear();
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

export const monitorarAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ─── FIRESTORE STORAGE SYNC OPERATIONS ────────────────────────────────────────

export const salvarDadosUsuario = async (uid, dados) => {
  try {
    await setDoc(doc(db, "usuarios", uid), dados, { merge: true });
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao salvar dados:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

export const carregarDadosUsuario = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, "usuarios", uid));
    if (docSnap.exists()) {
      return { sucesso: true, dados: docSnap.data() };
    } else {
      return { sucesso: false, erro: "Usuário não encontrado" };
    }
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

export const sincronizarComFirebase = async (uid, estadoZustand) => {
  try {
    await setDoc(
      doc(db, "usuarios", uid),
      {
        uid: uid,
        ...estadoZustand,
      },
      { merge: true }
    );
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao sincronizar:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

const firebaseService = {
  auth,
  db,
  criarConta,
  fazerLogin,
  fazerLogout,
  monitorarAuth,
  salvarDadosUsuario,
  carregarDadosUsuario,
  sincronizarComFirebase,
};

export default firebaseService;
