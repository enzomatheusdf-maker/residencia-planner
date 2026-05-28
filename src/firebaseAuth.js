// firebaseAuth.js - Configuração Firebase com Autenticação
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

// ─── FUNÇÕES DE AUTENTICAÇÃO ──────────────────────────────────────────────────

// Criar nova conta
export const criarConta = async (email, senha, nome) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    
    // Atualizar perfil com nome
    await updateProfile(user, { displayName: nome });
    
    // Criar documento no Firestore com dados vazios
    await setDoc(doc(db, "usuarios", user.uid), {
      uid: user.uid,
      email: email,
      nome: nome,
      criadoEm: new Date().toISOString(),
      plat: "vest", // plataforma padrão
      temas: [], // dados vazios, será preenchido pelo Zustand
      meta: {},
    });
    
    return { sucesso: true, user, uid: user.uid };
  } catch (erro) {
    console.error("Erro ao criar conta:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

// Login
export const fazerLogin = async (email, senha) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    return { sucesso: true, user: userCredential.user, uid: userCredential.user.uid };
  } catch (erro) {
    console.error("Erro ao fazer login:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

// Logout
export const fazerLogout = async () => {
  try {
    await signOut(auth);
    // Limpar dados do localStorage (Zustand persist)
    const storeKeys = Object.keys(localStorage).filter(k => k.startsWith('residencia-planner'));
    storeKeys.forEach(k => localStorage.removeItem(k));
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

// Monitorar autenticação
export const monitorarAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ─── FUNÇÕES DE SINCRONIZAÇÃO COM FIRESTORE ───────────────────────────────────

// Salvar dados do usuário no Firestore
export const salvarDadosUsuario = async (uid, dados) => {
  try {
    await setDoc(doc(db, "usuarios", uid), dados, { merge: true });
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao salvar dados:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

// Carregar dados do usuário do Firestore
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

// Sincronizar estado local com Firestore (chamar periodicamente ou ao mudar dados)
export const sincronizarComFirebase = async (uid, estadoZustand) => {
  try {
    await setDoc(doc(db, "usuarios", uid), {
      uid: uid,
      ...estadoZustand,
    }, { merge: true });
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao sincronizar:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

const firebaseAuthExports = { auth, db, criarConta, fazerLogin, fazerLogout, monitorarAuth, salvarDadosUsuario, carregarDadosUsuario, sincronizarComFirebase };
export default firebaseAuthExports;
