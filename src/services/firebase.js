// src/services/firebase.js
// Firebase initialization, authentication, and user data synchronization services

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  deleteUser
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

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
let analyticsInstance = null;

async function getAnalyticsSafe() {
  if (analyticsInstance) return analyticsInstance;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch {
    return null;
  }
}

export async function trackEvent(name, params = {}) {
  try {
    const analytics = await getAnalyticsSafe();
    if (!analytics) return;
    logEvent(analytics, name, params);
  } catch {
    // no-op: analytics must never break UX
  }
}

// ─── AUTHENTICATION OPERATIONS ───────────────────────────────────────────────

export const criarConta = async (email, senha, nome, manterConectado = true) => {
  try {
    const persistence = manterConectado ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
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
      cronogramaSel: { res: "res-medcof-2026", vest: "vest-base" },
      gamif: {
        xp: 0,
        level: 1,
        streakCurrent: 0,
        streakBest: 0,
        lastStudyDate: null,
        freezesOwned: 1,
        freezesUsedDates: [],
        recoveryOwned: 0,
        badges: [],
        graceUsedThisWeek: false,
        focusBoostActive: false,
        xpAudit: { acertos: 0, constancia: 0, outros: 0 }
      },
      userName: nome,
      meta: { dataProva: "2026-10-25", acerto: 85, retencaoFSRS: 0.90, maxRevisoesDia: 30, tempoDisponivel: 2, intervaloMaxDias: 180, pausadoAte: null, isRetornoAcolhedor: false, lastActiveDate: null, provasAlvo: ["ENAMED"], isSegundaTentativa: false, areaPuxouBaixo: "", notasTentativaAnterior: {}, acertosAlvo: 0, totalQuestoesAlvo: 100, notaCorteAlvo: 0, streakFreezeAvailable: true, streakFreezeUsed: false, tomMentor: "gentil", estrategiaRefinada: false, metaQuestoesDia: 0, metaQuestoesTotal: 0, volumePorAreaModo: "fraqueza", mentorLog: [], ferramentas: { questoes: "MedEvo", flashcards: "Anki" }, metodoProgresso: {}, dicasVistas: [], notif: { enabled: false, hora: "08:00" }, prontidaoHist: [], ativacaoDispensada: false, trilhaDispensada: false, trilhaXpDados: {}, streakMaxAvisado: false },
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

export const fazerLogin = async (email, senha, manterConectado = true) => {
  try {
    const persistence = manterConectado ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
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
    localStorage.removeItem("reviewflow-v6");
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

export const resetarSenha = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao enviar email de redefinição:", erro);
    return { sucesso: false, erro: erro.message };
  }
};

export const excluirUsuarioEDados = async (uid) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Nenhum usuário autenticado encontrado.");
    await deleteDoc(doc(db, "usuarios", uid));
    await deleteUser(user);
    localStorage.removeItem("reviewflow-v6");
    return { sucesso: true };
  } catch (erro) {
    console.error("Erro ao excluir conta:", erro);
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
  resetarSenha,
  excluirUsuarioEDados,
};

export default firebaseService;


