import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useStore } from "../core/store";
import { getLaunchChecklistItems, summarizeLaunchRisks } from "../core/launchReadiness";

function toneForStatus(status) {
  if (status === "fail") return "text-red-300 border-red-500/25 bg-red-500/10";
  if (status === "warn") return "text-amber-300 border-amber-500/25 bg-amber-500/10";
  return "text-emerald-300 border-emerald-500/25 bg-emerald-500/10";
}

export default function LaunchChecklistPanel() {
  const meta = useStore((s) => s.meta || {});
  const calendarProvider = useStore((s) => s.calendarProvider || {});
  const actionInbox = useStore((s) => s.actionInbox || []);
  const enamedAnalises = useStore((s) => s.enamedAnalises || []);

  const items = useMemo(
    () =>
      getLaunchChecklistItems({
        meta,
        calendarProvider,
        actionInbox,
        enamedAnalises,
        backupAvailable: true,
      }),
    [actionInbox, calendarProvider, enamedAnalises, meta]
  );
  const summary = useMemo(() => summarizeLaunchRisks(items), [items]);

  return (
    <section className="bg-[#111113] border border-white/5 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-blue-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">Launch readiness</h3>
        </div>
        <span
          className={`text-[10px] px-2 py-1 rounded-full border font-black uppercase ${
            summary.overallStatus === "fail"
              ? "bg-red-500/10 text-red-300 border-red-500/25"
              : summary.overallStatus === "warn"
              ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
          }`}
        >
          {summary.overallStatus}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 font-bold">OK: {summary.ok}</div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300 font-bold">WARN: {summary.warn}</div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 font-bold">FAIL: {summary.fail}</div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className={`rounded-xl border px-3 py-2 ${toneForStatus(item.status)}`}>
            <div className="flex items-center gap-2">
              {item.status === "ok" ? (
                <CheckCircle2 size={13} />
              ) : item.status === "warn" ? (
                <AlertTriangle size={13} />
              ) : (
                <ShieldAlert size={13} />
              )}
              <p className="text-[11px] font-bold">{item.label}</p>
            </div>
            <p className="text-[10px] text-gray-200 mt-1">{item.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
