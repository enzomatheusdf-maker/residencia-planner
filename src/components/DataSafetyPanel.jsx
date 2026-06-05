import React, { useMemo, useState } from "react";
import { Download, HardDrive, ShieldCheck, Upload, Database, RefreshCcw, Activity } from "lucide-react";
import { exportMedrevBackup, importMedrevBackup, validateMedrevBackup } from "../core/backup";
import { validateStateIntegrity } from "../core/dataIntegrity";
import { FSRS_CANONICAL_SHADOW_ENABLED, isDevOnlyEnabled } from "../core/devFlags";
import { buildFsrsShadowReport } from "../core/fsrsShadowReport";
import {
  backupLegacyGlobalStore,
  detectLegacyGlobalStore,
  migrateLegacyStoreToUserScope,
} from "../core/userDataMigration";
import { getAnonymousStorageKey, getOrCreateAnonymousSessionId, getUserScopedStorageKey } from "../core/userScope";
import { auth } from "../services/firebase";
import { useStore } from "../core/store";

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function readPersistedPayload(storageKey) {
  const raw = localStorage.getItem(storageKey);
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
  const activePlat = useStore((s) => s.plat || "res");
  const temas = useStore((s) => s[activePlat]?.temas || []);
  const [validation, setValidation] = useState(null);
  const [importCandidate, setImportCandidate] = useState(null);
  const [importValidation, setImportValidation] = useState(null);

  const currentUid = auth.currentUser?.uid || null;
  const storageKey = currentUid
    ? getUserScopedStorageKey(currentUid)
    : getAnonymousStorageKey(getOrCreateAnonymousSessionId());
  const legacyStore = detectLegacyGlobalStore();
  const storageBytes = useMemo(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? new Blob([raw]).size : 0;
  }, [storageKey]);
  const showFsrsShadowReport = FSRS_CANONICAL_SHADOW_ENABLED && isDevOnlyEnabled();
  const fsrsShadowReport = useMemo(
    () => (showFsrsShadowReport ? buildFsrsShadowReport(temas) : null),
    [showFsrsShadowReport, temas]
  );

  const handleExport = () => {
    const backup = exportMedrevBackup(useStore.getState(), {
      ownerUid: currentUid,
      appVersion: process.env.REACT_APP_VERSION || process.env.npm_package_version || "unknown",
    });
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
    const payload = readPersistedPayload(storageKey);
    if (!payload) {
      setValidation({ valid: false, errors: ["Nao foi encontrado backup local neste escopo."], warnings: [], criticals: [], summary: null });
      return;
    }
    const localBackup = exportMedrevBackup(payload, { ownerUid: currentUid });
    const backupValidation = validateMedrevBackup(localBackup);
    const integrity = validateStateIntegrity(localBackup);
    setValidation({
      ...backupValidation,
      criticals: integrity.criticals,
      warnings: [...backupValidation.warnings, ...integrity.warnings.map((item) => `${item.path}: ${item.message}`)],
      summary: {
        ...backupValidation.summary,
        criticalCount: integrity.summary.criticalCount,
        warningCount: integrity.summary.warningCount,
      },
    });
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
        setImportValidation({ valid: false, errors: [error.message], warnings: [], criticals: [], summary: null });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!importCandidate || !importValidation?.valid) return;
    openConfirm({
      title: "Importar backup",
      message: "Deseja importar este backup? Os dados atuais deste usuario serao sobrescritos.",
      confirmLabel: "Importar",
      danger: true,
      onConfirm: () => {
        const currentState = useStore.getState();
        const imported = importMedrevBackup(importCandidate, {
          currentMeta: currentState.meta,
          currentUid,
          preserveLocalMeta: false,
        });
        if (!imported.ok) {
          if (showToast) showToast(imported.errors?.[0] || "Falha ao importar backup.");
          return;
        }
        useStore.setState({ ...imported.patch, updatedAt: Date.now() });
        const rebuild = useStore.getState().rebuildActionInboxForToday;
        if (rebuild) rebuild();
        if (showToast) showToast("Backup importado com sucesso.");
      },
    });
  };

  const handleLegacyMigration = () => {
    if (!currentUid) {
      if (showToast) showToast("Faça login para migrar dados legados para um uid.");
      return;
    }
    if (!legacyStore.found) {
      if (showToast) showToast("Nenhuma chave global legada encontrada.");
      return;
    }

    const previewBackup = backupLegacyGlobalStore();
    const backupSize = previewBackup.ok ? new Blob([previewBackup.backup.payload]).size : 0;
    const targetKey = getUserScopedStorageKey(currentUid);

    openConfirm({
      title: "Migrar dados legados",
      message: `Foi detectada a chave global '${legacyStore.key}'. Migrar para '${targetKey}'?`,
      confirmLabel: "Migrar",
      danger: true,
      onConfirm: () => {
        const result = migrateLegacyStoreToUserScope(currentUid, { confirm: true });
        if (!result.ok) {
          if (showToast) showToast(`Falha na migracao: ${result.error}`);
          return;
        }
        if (showToast) showToast(`Migracao concluida (${formatBytes(backupSize)}).`);
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

      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[10px] text-gray-300">
        <p><span className="text-gray-500">UID atual:</span> {currentUid || "nao autenticado"}</p>
        <p className="break-all mt-1"><span className="text-gray-500">Escopo local:</span> {storageKey}</p>
        <p className="mt-1"><span className="text-gray-500">Store legada global:</span> {legacyStore.found ? legacyStore.key : "nao detectada"}</p>
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
              Usuario: {importValidation.summary.userName} · Owner UID: {importValidation.summary.ownerUid || "ausente"} · Temas: {importValidation.summary.temas}
            </p>
          )}
          {importValidation.errors?.length > 0 && (
            <p className="text-[10px] text-red-200 mt-1">{importValidation.errors.join(" | ")}</p>
          )}
          {importValidation.warnings?.length > 0 && (
            <p className="text-[10px] text-yellow-200 mt-1">{importValidation.warnings.join(" | ")}</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={handleValidateLocal}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-[11px] font-bold border border-white/10 cursor-pointer"
        >
          Validar local
        </button>
        <div className="px-3 py-2 rounded-xl bg-black/20 border border-white/5 text-[11px] text-gray-300 font-bold inline-flex items-center justify-center gap-1.5">
          <HardDrive size={12} /> {formatBytes(storageBytes)}
        </div>
        <button
          type="button"
          onClick={handleLegacyMigration}
          className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-[11px] font-bold border border-amber-500/40 cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <RefreshCcw size={12} /> Migrar legado
        </button>
        <button
          type="button"
          onClick={clearTemporaryCaches}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-bold border border-white/10 cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <Database size={12} /> Limpar caches
        </button>
      </div>

      {validation && (
        <div className={`rounded-xl border p-3 text-[10px] ${validation.valid ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-red-500/20 bg-red-500/10 text-red-200"}`}>
          <p className="font-bold">
            {validation.valid ? "Estrutura local valida." : validation.errors.join(" | ")}
          </p>
          <p className="mt-1 text-gray-300">
            Criticos: {validation.summary?.criticalCount || validation.criticals?.length || 0} · Warnings: {validation.summary?.warningCount || validation.warnings?.length || 0}
          </p>
          {validation.warnings?.length > 0 && (
            <p className="mt-1 text-yellow-200">{validation.warnings.join(" | ")}</p>
          )}
        </div>
      )}

      {showFsrsShadowReport && fsrsShadowReport && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-cyan-300" />
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-300">DEV FSRS canonical shadow</p>
            </div>
            <span className="text-[10px] text-gray-500">{activePlat}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[10px]">
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
              <p className="text-gray-500">Eventos shadow</p>
              <p className="text-gray-100 font-black">{fsrsShadowReport.shadowEvents}/{fsrsShadowReport.totalEvents}</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
              <p className="text-gray-500">Media |delta|</p>
              <p className="text-gray-100 font-black">{fsrsShadowReport.averageAbsDiffDays}d</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
              <p className="text-gray-500">Mediana / p90</p>
              <p className="text-gray-100 font-black">{fsrsShadowReport.medianAbsDiffDays}d / {fsrsShadowReport.p90AbsDiffDays}d</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
              <p className="text-gray-500">|delta| &gt; 3d</p>
              <p className="text-gray-100 font-black">{fsrsShadowReport.percentAbsDiffOver3Days}%</p>
            </div>
          </div>
          {fsrsShadowReport.topDivergences.length > 0 && (
            <div className="mt-3 space-y-1">
              {fsrsShadowReport.topDivergences.slice(0, 3).map((item) => (
                <p key={`${item.temaId || "tema"}-${item.reviewedAt}-${item.stepKey}`} className="text-[10px] text-gray-400">
                  {item.temaNome || item.temaId || "Tema"} · {item.stepKey} · {item.diffDays ?? "?"}d
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
