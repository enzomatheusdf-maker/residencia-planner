import { todayStr } from "./fsrs";
import { CLINICAL_CASES_INDEX } from "../constants/clinicalCasesIndex";
import { buildConfusableSets } from "./confusableSets";

function toDateValue(date) {
  return String(date || "").slice(0, 10);
}

function daysBetween(from, to) {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
}

function getStepDueItems(tema, today) {
  const rev = tema?.rev || {};
  const keys = ["d1", "d4", "d7", "d21", "manutencao"];
  return keys
    .map((key) => {
      const step = rev[key];
      if (!step || step.done) return null;
      const date = toDateValue(step.date || step.scheduledAt);
      if (!date) return null;
      const delta = daysBetween(today, date);
      if (delta == null) return null;
      return { tema, stepKey: key, date, delta };
    })
    .filter(Boolean);
}

function inSameConfusableSet(id1, id2, sets) {
  if (!id1 || !id2 || !sets) return false;
  return sets.some((set) => set.members.includes(id1) && set.members.includes(id2));
}

function getCandidateReason(currentTema, candidate, status, confusableSets = []) {
  const other = candidate.tema;
  
  const sharesCaseSet = confusableSets.some(
    (set) =>
      set.key.startsWith("case:") &&
      set.members.includes(currentTema.id) &&
      set.members.includes(other.id)
  );
  if (sharesCaseSet) {
    return "diagnóstico diferencial";
  }

  if (other.parentTopic && currentTema.parentTopic && other.parentTopic === currentTema.parentTopic) {
    return "mesmo macrotema";
  }
  if (other.esp && currentTema.esp && other.esp === currentTema.esp) {
    return "mesma área";
  }
  if (status === "near_due_only") return "vence em breve";
  if (status === "mature_only") return "contraste maduro";
  return "contraste útil";
}

function toCandidate(currentTema, item, status, confusableSets) {
  return {
    temaId: item.tema.id,
    temaNome: item.tema.nome,
    esp: item.tema.esp,
    parentTopic: item.tema.parentTopic || null,
    stepKey: item.stepKey,
    date: item.date,
    delta: item.delta,
    reason: getCandidateReason(currentTema, item, status, confusableSets),
    official: false,
  };
}

function getMatureContrastCandidates(currentTema, temas, today) {
  return temas
    .filter((t) => t && t.id !== currentTema?.id)
    .filter((t) => t.rev?.d21?.done || t.rev?.manutencao)
    .map((t) => ({
      tema: t,
      stepKey: t.rev?.manutencao ? "manutencao" : "d21",
      date: today,
      delta: 0,
    }));
}

export function buildInterleavingPlan({ tema, temas = [], stepKey, platKey, today = todayStr(), casos = CLINICAL_CASES_INDEX } = {}) {
  if (!tema || !stepKey) {
    return { shouldRecommend: false, mode: "none", status: "invalid", candidates: [] };
  }

  const isStrongStep = stepKey === "d21" || stepKey === "manutencao";
  const isLightStep = stepKey === "d7";
  if (!isStrongStep && !isLightStep) {
    return { shouldRecommend: false, mode: "none", status: "not_applicable", candidates: [] };
  }

  const confusableSets = buildConfusableSets(temas, casos);
  const others = temas.filter((t) => t && t.id !== tema.id);

  const dueItems = others
    .flatMap((t) => getStepDueItems(t, today))
    .filter((item) => item.delta <= 0)
    .sort((a, b) => {
      const sameSetA = inSameConfusableSet(a.tema.id, tema.id, confusableSets) ? 0 : 1;
      const sameSetB = inSameConfusableSet(b.tema.id, tema.id, confusableSets) ? 0 : 1;
      if (sameSetA !== sameSetB) return sameSetA - sameSetB;

      const sameParentA = a.tema.parentTopic && tema.parentTopic && a.tema.parentTopic === tema.parentTopic ? 0 : 1;
      const sameParentB = b.tema.parentTopic && tema.parentTopic && b.tema.parentTopic === tema.parentTopic ? 0 : 1;
      if (sameParentA !== sameParentB) return sameParentA - sameParentB;

      const sameEspA = a.tema.esp === tema.esp ? 0 : 1;
      const sameEspB = b.tema.esp === tema.esp ? 0 : 1;
      if (sameEspA !== sameEspB) return sameEspA - sameEspB;

      return a.delta - b.delta;
    });

  if (dueItems.length > 0) {
    const candidates = dueItems.slice(0, 3).map((item) => toCandidate(tema, item, "has_due_candidates", confusableSets));
    return {
      shouldRecommend: true,
      mode: "full",
      status: "has_due_candidates",
      title: "Prática intercalada recomendada",
      message: "Misture algumas questões deste tema com revisões vencidas ou de hoje. Só a revisão atual será concluída oficialmente.",
      candidates,
      officialPolicy: "only_current_review_is_official",
    };
  }

  const nearItems = others
    .flatMap((t) => getStepDueItems(t, today))
    .filter((item) => item.delta > 0 && item.delta <= 3)
    .sort((a, b) => {
      const sameSetA = inSameConfusableSet(a.tema.id, tema.id, confusableSets) ? 0 : 1;
      const sameSetB = inSameConfusableSet(b.tema.id, tema.id, confusableSets) ? 0 : 1;
      if (sameSetA !== sameSetB) return sameSetA - sameSetB;

      const sameParentA = a.tema.parentTopic && tema.parentTopic && a.tema.parentTopic === tema.parentTopic ? 0 : 1;
      const sameParentB = b.tema.parentTopic && tema.parentTopic && b.tema.parentTopic === tema.parentTopic ? 0 : 1;
      if (sameParentA !== sameParentB) return sameParentA - sameParentB;

      const sameEspA = a.tema.esp === tema.esp ? 0 : 1;
      const sameEspB = b.tema.esp === tema.esp ? 0 : 1;
      if (sameEspA !== sameEspB) return sameEspA - sameEspB;

      return a.delta - b.delta;
    })
    .slice(0, 3);

  if (nearItems.length > 0) {
    return {
      shouldRecommend: true,
      mode: "light",
      status: "near_due_only",
      title: "Interleaving leve disponível",
      message: "Não há outra revisão vencida hoje. Use um tema próximo de vencer apenas como contraste, sem marcar essa revisão como concluída.",
      candidates: nearItems.map((item) => toCandidate(tema, item, "near_due_only", confusableSets)),
      officialPolicy: "only_current_review_is_official",
    };
  }

  const mature = getMatureContrastCandidates(tema, others, today)
    .sort((a, b) => {
      const sameSetA = inSameConfusableSet(a.tema.id, tema.id, confusableSets) ? 0 : 1;
      const sameSetB = inSameConfusableSet(b.tema.id, tema.id, confusableSets) ? 0 : 1;
      if (sameSetA !== sameSetB) return sameSetA - sameSetB;

      const sameParentA = a.tema.parentTopic && tema.parentTopic && a.tema.parentTopic === tema.parentTopic ? 0 : 1;
      const sameParentB = b.tema.parentTopic && tema.parentTopic && b.tema.parentTopic === tema.parentTopic ? 0 : 1;
      if (sameParentA !== sameParentB) return sameParentA - sameParentB;

      const sameEspA = a.tema.esp === tema.esp ? 0 : 1;
      const sameEspB = b.tema.esp === tema.esp ? 0 : 1;
      if (sameEspA !== sameEspB) return sameEspA - sameEspB;

      return 0;
    })
    .slice(0, 3);

  if (mature.length > 0) {
    return {
      shouldRecommend: true,
      mode: "light",
      status: "mature_only",
      title: "Interleaving de contraste",
      message: "Não há revisões vencidas hoje. Misture 2–5 questões de um tema já estudado para treinar discriminação clínica.",
      candidates: mature.map((item) => toCandidate(tema, item, "mature_only", confusableSets)),
      officialPolicy: "only_current_review_is_official",
    };
  }

  const clinicalCopy = platKey === "res";
  return {
    shouldRecommend: true,
    mode: "self",
    status: "self_only",
    title: "Interleaving interno",
    message: clinicalCopy
      ? "Sem outros temas úteis hoje. Faça contraste interno: diagnóstico diferencial, conduta, complicações, critérios e pegadinhas do próprio tema."
      : "Sem outros temas úteis hoje. Faça contraste interno: conceitos parecidos, exercícios fáceis versus difíceis e erros antigos do próprio tema.",
    candidates: [],
    officialPolicy: "only_current_review_is_official",
  };
}
