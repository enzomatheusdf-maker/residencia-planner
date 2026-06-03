// src/core/calendarDistribution.js
// Re-exporta e compõe as funções de distribuição do scheduleWizard.
// Existência separada para aderência ao plano (MTR2 = scheduleWizard + calendarDistribution).

export {
  calculateWeeklyCapacity,
  calculatePlanningHorizon,
  calculateFeasibility,
  selectTopicsByScope,
  distributeTopics,
  buildSchedulePreview,
  generateSchedule,
} from "./scheduleWizard";
