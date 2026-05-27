import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_CHAVE",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function loadFromFirebase(key) {
  try {
    const snap = await getDoc(doc(db, "reviewflow", key));
    return snap.exists() ? snap.data().value : null;
  } catch (err) {
    console.error("Erro ao carregar:", err);
    return null;
  }
}

export async function saveToFirebase(key, val) {
  try {
    await setDoc(doc(db, "reviewflow", key), { value: val, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Erro ao salvar:", err);
  }
}