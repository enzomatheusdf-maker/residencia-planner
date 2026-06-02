// src/components/ClinicalTaskPanel.jsx
// Painel de tarefa clinica multimodal para FocusMode.
// Aparece nos steps D4 (illness recall), D7 (mini caso), D21/manutencao (SCT).
// O D1 ja tem brain dump proprio no FocusMode — nao e substituido.
//
// Comportamento:
//   - Colapsavel: comeca fechado para nao bloquear o fluxo padrao
//   - Respostas sao estado local (nao gravadas no store — P4-C)
//   - Nao substitui AcertoInputs — e um painel adicional
//   - Feature-gated: so renderiza quando task != null
//   - Aviso de uso educacional em conduta/SCT
import React, { useState } from "react";
import { Brain, ChevronDown, ChevronUp, BookOpen, Stethoscope, FlaskConical } from "lucide-react";
import { TASK_TYPE } from "../core/reviewTaskPlanner";

// ─── Icone por tipo ───────────────────────────────────────────────────────────

const TASK_ICON = {
  [TASK_TYPE.BRAIN_DUMP]: Brain,
  [TASK_TYPE.ILLNESS_RECALL]: BookOpen,
  [TASK_TYPE.MINI_CASE]: Stethoscope,
  [TASK_TYPE.SCT]: FlaskConical,
};

const TASK_COLOR = {
  [TASK_TYPE.BRAIN_DUMP]: "text-purple-400",
  [TASK_TYPE.ILLNESS_RECALL]: "text-blue-400",
  [TASK_TYPE.MINI_CASE]: "text-teal-400",
  [TASK_TYPE.SCT]: "text-amber-400",
};

const TASK_BORDER = {
  [TASK_TYPE.BRAIN_DUMP]: "border-purple-500/20",
  [TASK_TYPE.ILLNESS_RECALL]: "border-blue-500/20",
  [TASK_TYPE.MINI_CASE]: "border-teal-500/20",
  [TASK_TYPE.SCT]: "border-amber-500/20",
};

const TASK_BG = {
  [TASK_TYPE.BRAIN_DUMP]: "bg-purple-950/10",
  [TASK_TYPE.ILLNESS_RECALL]: "bg-blue-950/10",
  [TASK_TYPE.MINI_CASE]: "bg-teal-950/10",
  [TASK_TYPE.SCT]: "bg-amber-950/10",
};

// ─── Campo de resposta ────────────────────────────────────────────────────────

function TaskField({ field, value, onChange, color }) {
  return (
    <div className="space-y-1.5">
      <label className={`block text-[10px] font-bold uppercase tracking-wider ${color}`}>
        {field.label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[12px] text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-white/20 transition-colors leading-relaxed"
      />
    </div>
  );
}

// ─── ClinicalTaskPanel ────────────────────────────────────────────────────────

/**
 * Props:
 *   task    object|null  resultado de getReviewTaskForStep
 *   className string
 *   onSelfScore function|null
 */
export default function ClinicalTaskPanel({ task, className = "", onSelfScore = null }) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState({});

  if (!task || task.taskType === TASK_TYPE.STANDARD) return null;

  const { taskType, description, caso, tema } = task;
  const Icon = TASK_ICON[taskType] || Brain;
  const color = TASK_COLOR[taskType] || "text-blue-400";
  const border = TASK_BORDER[taskType] || "border-blue-500/20";
  const bg = TASK_BG[taskType] || "bg-blue-950/10";

  const handleChange = (key, val) => setResponses((prev) => ({ ...prev, [key]: val }));
  const filledCount = Object.values(responses).filter((v) => String(v || "").trim().length > 0).length;
  const totalFields = description.fields.length;

  const isSctOrManagement = taskType === TASK_TYPE.SCT;

  return (
    <div className={`${bg} border ${border} rounded-2xl overflow-hidden ${className}`}>
      {/* Header colapsavel */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon size={15} className={`${color} shrink-0`} />
          <div className="text-left min-w-0">
            <p className={`text-[11px] font-bold ${color}`}>
              {description.shortLabel} — {description.label}
            </p>
            {caso && (
              <p className="text-[10px] text-gray-500 truncate">
                Caso: {caso.tema || caso.area || "clinico"}
              </p>
            )}
            {!caso && tema && (
              <p className="text-[10px] text-gray-500 truncate">
                Tema: {tema.nome}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {open && filledCount > 0 && (
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-900/30 border border-emerald-600/20 px-2 py-0.5 rounded-full">
              {filledCount}/{totalFields}
            </span>
          )}
          <span className="text-[9px] text-gray-600 font-semibold uppercase tracking-wide">
            {open ? "fechar" : `${description.durationMin} min`}
          </span>
          {open ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
        </div>
      </button>

      {/* Conteudo */}
      {open && (
        <div className="p-4 pt-0 space-y-4">
          {/* Instrucao */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-[11px] text-gray-400 leading-relaxed">{description.instruction}</p>
          </div>

          {/* Vinheta do caso (se disponivel) */}
          {caso?.vinheta && (
            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold mb-1">Vinheta clinica</p>
              <p className="text-[12px] text-gray-300 leading-relaxed">{caso.vinheta}</p>
            </div>
          )}

          {/* Campos de resposta */}
          <div className="space-y-3">
            {description.fields.map((field) => (
              <TaskField
                key={field.key}
                field={field}
                value={responses[field.key] || ""}
                onChange={handleChange}
                color={color}
              />
            ))}
          </div>

          {/* Aviso educacional para SCT/conduta */}
          {isSctOrManagement && (
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3">
              <p className="text-[10px] text-amber-400 font-bold">Aviso educacional</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Esta atividade e exclusivamente para fins de estudo. Nao aplicar decisoes terapeuticas
                em pacientes reais com base neste exercicio.
              </p>
            </div>
          )}

          <div className="border-t border-white/5 pt-3 space-y-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Como foi seu recall, sem consultar?</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Falhei", value: 35, style: "border-red-500/30 text-red-300" },
                { label: "Parcial", value: 70, style: "border-amber-500/30 text-amber-300" },
                { label: "Solido", value: 95, style: "border-emerald-500/30 text-emerald-300" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelfScore && onSelfScore(option.value)}
                  className={`px-2 py-2 rounded-xl border bg-black/20 text-[11px] font-bold ${option.style}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Indicador de preenchimento */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <p className="text-[10px] text-gray-600">
              {filledCount}/{totalFields} campos preenchidos
            </p>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex-1 mx-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  filledCount === totalFields ? "bg-emerald-500" : `bg-gradient-to-r from-blue-600 to-sky-400`
                }`}
                style={{ width: `${(filledCount / totalFields) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-600">{description.durationMin} min</p>
          </div>
        </div>
      )}
    </div>
  );
}
