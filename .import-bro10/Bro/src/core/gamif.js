// src/core/gamif.js
import { diffDays, addDays } from "./fsrs";

export function getYearWeek(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

export function computeStreakOnStudy(gamif, todayStr) {
  const g = { ...gamif };
  if (!g.studyDates) {
    g.studyDates = [];
  }
  if (g.lastStudyDate && !g.studyDates.includes(g.lastStudyDate)) {
    g.studyDates.push(g.lastStudyDate);
  }
  if (!g.studyDates.includes(todayStr)) {
    g.studyDates.push(todayStr);
  }
  // Filtra datas de estudos muito antigas para manter array pequeno
  g.studyDates = g.studyDates.filter(d => diffDays(d, todayStr) <= 60);

  // Calcula dias ativos nos últimos 7 dias
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    last7Days.push(addDays(todayStr, -i));
  }
  const current = g.studyDates.filter(d => last7Days.includes(d)).length;

  g.streakCurrent = current;
  g.streakBest = Math.max(current, g.streakBest || 0);
  g.lastStudyDate = todayStr;
  return g;
}

export function recoverStreak(gamif) {
  const g = { ...gamif };
  if (g.recoveryOwned > 0 && g.streakPriorToReset > 0) {
    g.streakCurrent = g.streakPriorToReset + 1;
    g.streakBest = Math.max(g.streakCurrent, g.streakBest || 0);
    g.recoveryOwned -= 1;
    g.streakPriorToReset = 0;
    g.lostStreakDate = null;
  }
  return g;
}

export function xpForReview({ acerto, stepKey, isInterleaved }) {
  let xp = 10;
  if (acerto != null && acerto >= 0.8) xp += 5;
  if (stepKey === "d21") xp += 10;
  if (isInterleaved) xp += 5;
  return xp;
}

export function levelForXp(xp) {
  return Math.floor(Math.sqrt((xp || 0) / 50)) + 1;
}

export function xpToNextLevel(xp) {
  const currentLevel = levelForXp(xp);
  const nextLevelMinXp = (currentLevel ** 2) * 50;
  return Math.max(0, nextLevelMinXp - (xp || 0));
}
