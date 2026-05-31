import React, { useState } from "react";
import { Download, HardDrive, ShieldCheck, Upload } from "lucide-react";
import { exportMedrevBackup, importMedrevBackup, validateMedrevBackup } from "../core/backup";
import { useStore } from "../core/store";

const STORE_KEY = "reviewflow-v6";

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function readPersistedPayload() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state || parsed;
  } catch {
    return null;
  }
}

export default function DataSafetyPanel() {
  const showToast = useStore((s) => s.showToast);
  const openConfirm = useStore((s) => s.openConfirm);
  const [validation, setValidation] = useState(null);
  const [importCandidate, setImportCandidate] = useState(null);
  const [importValidation, setImportValidation] = useState(null);

  const storageBytes = (() => {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? new Blob([raw]).size : 0;
  })();

  const handleExport = () => {
    const backup = exportMedrevBackup(useStore.getState());
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medrev_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast("Backup exportado com sucesso.");
  };

  const handleValidateLocal = () => {
    const payload = readPersistedPayload();
    if (!payload) {
      setValidation({ valid: false, errors: ["Nao foi encontrado backup local."], warnings: [], summary: null });
      return;
    }
    const localBackup = exportMedrevBackup(payload);
    setValidation(validateMedrevBackup(localBackup));
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(String(loadEvent.target?.result || "{}"));
        const result = validateMedrevBackup(parsed);
        setImportCandidate(parsed);
        setImportValidation(result);
      } catch (error) {
        setImportCandidate(null);
        setImportValidation({ valid: false, errors: [error.message], warnings: [], summary: null });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!importCandidate || !importValidation?.valid) return;
    openConfirm({
      title: "Importar backup",
      message: "Deseja importar este backup? Os dados atuais serao sobrescritos.",
      confirmLabel: "Importar",
      danger: true,
      onConfirm: () => {
        const currentState = useStore.getState();
        const imported = importMedrevBackup(importCandidate, { currentMeta: currentState.meta });
        if (!imported.ok) {
          if (showToast) showToast("Falha ao importar backup.");
          return;
        }
        useStore.setState(imported.patch);
        const rebuild = useStore.getState().rebuildActionInboxForToday;
        if (rebuild) rebuild();
        if (showToast) showToast("Backup importado com sucesso.");
      },
    });
  };

  const clearTemporaryCaches = () => {
    localStorage.removeItem("medrev_recent_mentor_phrases");
    sessionStorage.removeItem("medrev_welcome_shown_v2");
    if (showToast) showToast("Caches temporarios limpos.");
  };

  return (
    <section className="bg-[#111113] border border-white/5 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-blue-400" />
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">Seguranca dos dados</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <Download size={13} /> Exportar backup JSON
        </button>
        <label className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-[11px] font-bold border border-white/10 cursor-pointer inline-flex items-center justify-center gap-1.5">
          <Upload size={13} /> Importar backup JSON
          <input type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        </label>
      </div>

      {importValidation && (
        <div className={`rounded-xl border p-3 ${importValidation.valid ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
          <p className="text-[11px] font-bold text-white">
            {importValidation.valid ? "Backup valido para importacao." : "Backup invalido."}
          </p>
          {importValidation.summary && (
            <p className="text-[10px] text-gray-300 mt-1">
              Usuario: {importValidation.summary.userName} · Temas: {importValidation.summary.temas} · Reflexoes: {importValidation.summary.sessionReflections}
            </p>
          )}
          {importValidation.errors?.length > 0 && (
            <p className="text-[10px] text-red-200 mt-1">{importValidation.errors.join(" | ")}</p>
          )}
          {importValidation.valid && (
            <button
              type="button"
              onClick={confirmImport}
              className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold border-none cursor-pointer"
            >
              Confirmar importacao
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleValidateLocal}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-[11px] font-bold border border-white/10 cursor-pointer"
        >
          Validar integridade local
        </button>
        <div className="px-3 py-2 rounded-xl bg-black/20 border border-white/5 text-[11px] text-gray-300 font-bold inline-flex items-center justify-center gap-1.5">
          <HardDrive size={12} /> {formatBytes(storageBytes)}
        </div>
        <button
          type="button"
          onClick={clearTemporaryCaches}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold border border-white/10 cursor-pointer"
        >
          Limpar caches temporarios
        </button>
      </div>

      {validation && (
        <p className={`text-[10px] ${validation.valid ? "text-emerald-300" : "text-red-300"}`}>
          {validation.valid ? "Estrutura local valida." : validation.errors.join(" | ")}
        </p>
      )}
    </section>
  );
}
