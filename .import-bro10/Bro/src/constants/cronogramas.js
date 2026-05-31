import { CATALOGO_RES, CATALOGO_VEST } from "./catalogos";

export const CRONOGRAMAS = [
  {
    id: "res-medcof-2026",
    plat: "res",
    nome: "MEDCOF 2026",
    fonte: "MEDCOF",
    ano: 2026,
    descricao: "Plano estruturado da MEDCOF para Residência Médica",
    blocos: CATALOGO_RES.length,
    catalogo: CATALOGO_RES,
    default: true
  },
  {
    id: "vest-base",
    plat: "vest",
    nome: "Base Vestibular",
    fonte: "Própria",
    ano: 2026,
    descricao: "Grade curricular integrada para ENEM e Vestibulares",
    blocos: CATALOGO_VEST.length,
    catalogo: CATALOGO_VEST,
    default: true
  }
];

export function getCronogramasByPlat(plat) {
  return CRONOGRAMAS.filter(c => c.plat === plat);
}

export function getDefaultCronogramaId(plat) {
  const found = CRONOGRAMAS.find(c => c.plat === plat && c.default);
  return found ? found.id : (plat === "res" ? "res-medcof-2026" : "vest-base");
}

export function getCronogramaById(id) {
  return CRONOGRAMAS.find(c => c.id === id) || null;
}

export function resolveCatalogo(plat, id) {
  const plan = getCronogramaById(id);
  if (plan && plan.plat === plat) {
    return plan.catalogo;
  }
  const defaultId = getDefaultCronogramaId(plat);
  const defaultPlan = getCronogramaById(defaultId);
  return defaultPlan ? defaultPlan.catalogo : (plat === "res" ? CATALOGO_RES : CATALOGO_VEST);
}
