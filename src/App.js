import { useState, useEffect, useCallback } from "react";

// ─── STORAGE HELPERS ───────────────────────────────────────────────
async function load(key) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}
async function save(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ─── DATE HELPERS ──────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function diffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
}
function isOverdue(dateStr) { return dateStr && dateStr < today(); }
function isDueToday(dateStr) { return dateStr === today(); }
function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const diff = diffDays(today(), dateStr);
  return diff >= 0 && diff <= 2;
}

// ─── INTERVALS ─────────────────────────────────────────────────────
const INTERVALS = [1, 4, 7, 21]; // D1, D4, D7, D21
const INTERVAL_LABELS = ["D1 · Dump", "D4 · Questões", "D7 · Qst+Anki", "D21 · Interleaved"];

function computeRevisions(studyDate) {
  return INTERVALS.map((n, i) => ({
    label: INTERVAL_LABELS[i],
    date: addDays(studyDate, n),
    done: false,
    acerto: null,
  }));
}

// ─── SPECIALTIES ───────────────────────────────────────────────────
const ESPECIALIDADES = [
  "Cirurgia Geral", "Clínica Médica", "Pediatria",
  "Ginecologia/Obstetrícia", "Medicina Preventiva", "Semiologia",
  "Urgência/Emergência", "Outro",
];

const STATUS_COLORS = {
  ok: "#22c55e",
  warn: "#f59e0b",
  overdue: "#ef4444",
  pending: "#6b7280",
};

// ─── ANKI AUDIT CATEGORIES ─────────────────────────────────────────
const ANKI_CRITERIOS = [
  { id: "atomic", label: "Fato atômico único" },
  { id: "derived", label: "Derivável de outro conhecimento" },
  { id: "list", label: "Lista / conceito amplo" },
  { id: "clinical", label: "Raciocínio clínico (não é card)" },
  { id: "copy", label: "Cópia de texto / gabarito" },
];

// ══════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [temas, setTemas] = useState([]);
  const [ankiLog, setAnkiLog] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load
  useEffect(() => {
    (async () => {
      const t = await load("residencia:temas");
      const a = await load("residencia:anki");
      if (t) setTemas(t);
      if (a) setAnkiLog(a);
      setLoaded(true);
    })();
  }, []);

  // Persist temas
  useEffect(() => { if (loaded) save("residencia:temas", temas); }, [temas, loaded]);
  useEffect(() => { if (loaded) save("residencia:anki", ankiLog); }, [ankiLog, loaded]);

  // ── derived: due today / overdue
  const allRevisions = temas.flatMap(t =>
    t.revisoes
      .map((r, ri) => ({ ...r, temaId: t.id, temaNome: t.nome, revIdx: ri }))
      .filter(r => !r.done)
  );
  const overdue = allRevisions.filter(r => isOverdue(r.date));
  const dueToday = allRevisions.filter(r => isDueToday(r.date));
  const dueSoon = allRevisions.filter(r => isDueSoon(r.date) && !isDueToday(r.date) && !isOverdue(r.date));

  // ── mark revision done
  const markDone = useCallback((temaId, revIdx, acerto) => {
    setTemas(prev => prev.map(t => {
      if (t.id !== temaId) return t;
      const revisoes = t.revisoes.map((r, i) =>
        i === revIdx ? { ...r, done: true, acerto, dataDone: today() } : r
      );
      return { ...t, revisoes };
    }));
  }, []);

  // ── add tema
  const addTema = useCallback((tema) => {
    setTemas(prev => [...prev, {
      ...tema,
      id: Date.now().toString(),
      revisoes: computeRevisions(tema.dataEstudo),
      criadoEm: today(),
    }]);
  }, []);

  // ── delete tema
  const deleteTema = useCallback((id) => {
    setTemas(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── add anki entry
  const addAnkiLog = useCallback((entry) => {
    setAnkiLog(prev => [{ ...entry, id: Date.now().toString(), data: today() }, ...prev]);
  }, []);

  if (!loaded) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#555", fontFamily: "monospace", fontSize: 13 }}>carregando...</span>
    </div>
  );

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'DM Mono', 'Courier New', monospace", color: "#e0e0e0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Unbounded:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        input, textarea, select { font-family: 'DM Mono', monospace; }
        button { cursor: pointer; font-family: 'DM Mono', monospace; }
        .fade-in { animation: fadeIn 0.25s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "0 0 0 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20 }}>
            <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 15, fontWeight: 700, color: "#c8f135", letterSpacing: "-0.01em" }}>RESIDÊNCIA</span>
            <span style={{ color: "#333", fontSize: 11, letterSpacing: "0.15em" }}>REVISÃO ESPAÇADA · CIRURGIA</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Pill color="#ef4444" n={overdue.length} label="vencidas" />
              <Pill color="#f59e0b" n={dueToday.length} label="hoje" />
              <Pill color="#6b7280" n={dueSoon.length} label="em breve" />
            </div>
          </div>
          <TabBar tab={tab} setTab={setTab} />
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }} className="fade-in">
        {tab === "dashboard" && <Dashboard temas={temas} overdue={overdue} dueToday={dueToday} dueSoon={dueSoon} markDone={markDone} />}
        {tab === "temas" && <Temas temas={temas} addTema={addTema} deleteTema={deleteTema} markDone={markDone} />}
        {tab === "anki" && <AnkiAudit ankiLog={ankiLog} addAnkiLog={addAnkiLog} setAnkiLog={setAnkiLog} />}
        {tab === "caso" && <CasoClinico />}
        {tab === "metricas" && <Metricas temas={temas} ankiLog={ankiLog} />}
      </div>
    </div>
  );
}

// ── PILL ──
function Pill({ color, n, label }) {
  return (
    <span style={{ fontSize: 10, letterSpacing: "0.1em", color, border: `1px solid ${color}33`, padding: "2px 8px", opacity: n === 0 ? 0.3 : 1 }}>
      {n} {label}
    </span>
  );
}

// ── TAB BAR ──
function TabBar({ tab, setTab }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "temas", label: "Temas" },
    { id: "anki", label: "Anki Audit" },
    { id: "caso", label: "Caso Clínico" },
    { id: "metricas", label: "Métricas" },
  ];
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "none" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          background: "none", border: "none", padding: "10px 18px", fontSize: 11,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: tab === t.id ? "#c8f135" : "#555",
          borderBottom: tab === t.id ? "2px solid #c8f135" : "2px solid transparent",
          transition: "all 0.15s",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════
function Dashboard({ temas, overdue, dueToday, dueSoon, markDone }) {
  const totalTemas = temas.length;
  const totalRevDone = temas.flatMap(t => t.revisoes).filter(r => r.done).length;
  const avgAcerto = (() => {
    const vals = temas.flatMap(t => t.revisoes).filter(r => r.done && r.acerto !== null).map(r => r.acerto);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  })();

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <KPI label="Temas ativos" value={totalTemas} />
        <KPI label="Revisões feitas" value={totalRevDone} />
        <KPI label="Acerto médio" value={avgAcerto !== null ? `${avgAcerto}%` : "—"} color={avgAcerto >= 70 ? "#22c55e" : avgAcerto >= 55 ? "#f59e0b" : "#ef4444"} />
        <KPI label="Pendentes hoje" value={dueToday.length + overdue.length} color={overdue.length > 0 ? "#ef4444" : "#f59e0b"} />
      </div>

      {/* OVERDUE */}
      {overdue.length > 0 && (
        <Section title="⚠ Vencidas" color="#ef4444">
          {overdue.map(r => <RevCard key={`${r.temaId}-${r.revIdx}`} rev={r} markDone={markDone} urgency="overdue" />)}
        </Section>
      )}

      {/* TODAY */}
      {dueToday.length > 0 && (
        <Section title="Hoje" color="#c8f135">
          {dueToday.map(r => <RevCard key={`${r.temaId}-${r.revIdx}`} rev={r} markDone={markDone} urgency="today" />)}
        </Section>
      )}

      {/* SOON */}
      {dueSoon.length > 0 && (
        <Section title="Próximos 2 dias" color="#6b7280">
          {dueSoon.map(r => <RevCard key={`${r.temaId}-${r.revIdx}`} rev={r} markDone={markDone} urgency="soon" />)}
        </Section>
      )}

      {overdue.length === 0 && dueToday.length === 0 && dueSoon.length === 0 && (
        <div style={{ textAlign: "center", color: "#333", fontSize: 13, marginTop: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          Nenhuma revisão pendente. Adicione temas na aba "Temas".
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, color = "#c8f135" }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "16px 18px" }}>
      <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: "'Unbounded', sans-serif", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${color}22` }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function RevCard({ rev, markDone, urgency }) {
  const [acerto, setAcerto] = useState("");
  const [open, setOpen] = useState(false);

  const bcolor = urgency === "overdue" ? "#ef444422" : urgency === "today" ? "#c8f13508" : "#11111a";
  const border = urgency === "overdue" ? "#ef444433" : urgency === "today" ? "#c8f13530" : "#1e1e1e";

  return (
    <div style={{ background: bcolor, border: `1px solid ${border}`, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#e0e0e0", marginBottom: 2 }}>{rev.temaNome}</div>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.08em" }}>{rev.label} · {fmtDate(rev.date)}</div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: "#c8f13520", border: "1px solid #c8f13540", color: "#c8f135", fontSize: 10, padding: "4px 12px", letterSpacing: "0.1em" }}>
          {open ? "FECHAR" : "REGISTRAR"}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 8, letterSpacing: "0.1em" }}>ACERTO NESSA REVISÃO (%)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" min="0" max="100" value={acerto} onChange={e => setAcerto(e.target.value)}
              placeholder="ex: 75" style={{ background: "#111", border: "1px solid #333", color: "#e0e0e0", padding: "6px 10px", fontSize: 13, width: 100 }} />
            <button onClick={() => { if (acerto !== "") markDone(rev.temaId, rev.revIdx, Number(acerto)); }}
              style={{ background: "#c8f135", border: "none", color: "#000", padding: "6px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
              CONFIRMAR
            </button>
            <button onClick={() => markDone(rev.temaId, rev.revIdx, null)}
              style={{ background: "none", border: "1px solid #333", color: "#555", padding: "6px 12px", fontSize: 11 }}>
              SEM DADO
            </button>
          </div>
          {acerto !== "" && Number(acerto) < 55 && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444", letterSpacing: "0.05em" }}>
              ⚠ Abaixo de 55% — agendar bloco extra de questões antes do D7
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  TEMAS
// ══════════════════════════════════════════════════════════════════
function Temas({ temas, addTema, deleteTema, markDone }) {
  const [form, setForm] = useState({ nome: "", especialidade: ESPECIALIDADES[0], dataEstudo: today(), obs: "" });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("todos");

  const handleAdd = () => {
    if (!form.nome.trim()) return;
    addTema(form);
    setForm({ nome: "", especialidade: ESPECIALIDADES[0], dataEstudo: today(), obs: "" });
    setShowForm(false);
  };

  const filtered = filter === "todos" ? temas : temas.filter(t => t.especialidade === filter);
  const especialidadesUsadas = [...new Set(temas.map(t => t.especialidade))];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? "#333" : "#c8f135", border: "none", color: showForm ? "#e0e0e0" : "#000", padding: "8px 18px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
          {showForm ? "CANCELAR" : "+ NOVO TEMA"}
        </button>
        <div style={{ display: "flex", gap: 8, marginLeft: 8, flexWrap: "wrap" }}>
          {["todos", ...especialidadesUsadas].map(e => (
            <button key={e} onClick={() => setFilter(e)} style={{ background: filter === e ? "#1e1e1e" : "none", border: "1px solid #2a2a2a", color: filter === e ? "#c8f135" : "#555", padding: "4px 12px", fontSize: 10, letterSpacing: "0.08em" }}>{e}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div style={{ background: "#111", border: "1px solid #2a2a2a", padding: "20px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#c8f135", letterSpacing: "0.15em", marginBottom: 16 }}>NOVO TEMA DE ESTUDO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px", gap: 12, marginBottom: 12 }}>
            <Field label="TEMA / SUBTEMA">
              <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="ex: Pancreatite aguda" style={inputStyle()} />
            </Field>
            <Field label="ESPECIALIDADE">
              <select value={form.especialidade} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value }))} style={inputStyle()}>
                {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="DATA ESTUDO (D0)">
              <input type="date" value={form.dataEstudo} onChange={e => setForm(p => ({ ...p, dataEstudo: e.target.value }))} style={inputStyle()} />
            </Field>
          </div>
          <Field label="OBSERVAÇÕES / LACUNAS IDENTIFICADAS">
            <textarea value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))} rows={2} placeholder="Ex: Erro sistemático na classificação de Ranson. Revisar critérios de gravidade." style={{ ...inputStyle(), width: "100%", resize: "vertical" }} />
          </Field>
          <button onClick={handleAdd} style={{ marginTop: 12, background: "#c8f135", border: "none", color: "#000", padding: "8px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>ADICIONAR</button>
        </div>
      )}

      {filtered.length === 0 && <div style={{ color: "#333", fontSize: 13, textAlign: "center", marginTop: 40 }}>Nenhum tema. Adicione acima.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(t => <TemaCard key={t.id} tema={t} deleteTema={deleteTema} markDone={markDone} />)}
      </div>
    </div>
  );
}

function TemaCard({ tema, deleteTema, markDone }) {
  const [open, setOpen] = useState(false);
  const done = tema.revisoes.filter(r => r.done).length;
  const total = tema.revisoes.length;
  const pct = Math.round((done / total) * 100);
  const nextRev = tema.revisoes.find(r => !r.done);
  const hasOverdue = tema.revisoes.some(r => !r.done && isOverdue(r.date));
  const hasToday = tema.revisoes.some(r => !r.done && isDueToday(r.date));

  const borderColor = hasOverdue ? "#ef4444" : hasToday ? "#c8f135" : "#1e1e1e";

  return (
    <div style={{ background: "#0e0e0e", border: `1px solid ${borderColor}`, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#e0e0e0" }}>{tema.nome}</span>
            <span style={{ fontSize: 10, color: "#444", background: "#1a1a1a", padding: "1px 7px", letterSpacing: "0.06em" }}>{tema.especialidade}</span>
          </div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>
            D0: {fmtDate(tema.dataEstudo)} · {done}/{total} revisões · {nextRev ? `próxima: ${nextRev.label} em ${fmtDate(nextRev.date)}` : "concluído ✓"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ProgressBar pct={pct} />
          <span style={{ fontSize: 10, color: "#555", width: 28, textAlign: "right" }}>{pct}%</span>
          <span style={{ color: "#333", fontSize: 14 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid #1a1a1a", padding: "12px 16px" }}>
          {tema.obs && <div style={{ fontSize: 12, color: "#666", marginBottom: 12, fontStyle: "italic" }}>{tema.obs}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tema.revisoes.map((r, i) => (
              <RevChip key={i} rev={r} idx={i} temaId={tema.id} markDone={markDone} />
            ))}
          </div>
          <button onClick={() => deleteTema(tema.id)} style={{ marginTop: 12, background: "none", border: "1px solid #2a2a2a", color: "#444", padding: "4px 12px", fontSize: 10, letterSpacing: "0.08em" }}>
            REMOVER TEMA
          </button>
        </div>
      )}
    </div>
  );
}

function RevChip({ rev, idx, temaId, markDone }) {
  const [acerto, setAcerto] = useState("");
  const [editing, setEditing] = useState(false);

  if (rev.done) {
    const col = rev.acerto === null ? "#555" : rev.acerto >= 70 ? "#22c55e" : rev.acerto >= 55 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{ border: `1px solid ${col}44`, background: `${col}11`, padding: "6px 10px", fontSize: 10 }}>
        <div style={{ color: col }}>✓ {rev.label}</div>
        <div style={{ color: "#555", marginTop: 2 }}>{rev.acerto !== null ? `${rev.acerto}%` : "sem dado"} · {fmtDate(rev.dataDone)}</div>
      </div>
    );
  }

  const overdue = isOverdue(rev.date);
  const today2 = isDueToday(rev.date);
  const borderC = overdue ? "#ef4444" : today2 ? "#c8f135" : "#2a2a2a";

  return (
    <div style={{ border: `1px solid ${borderC}`, padding: "6px 10px", fontSize: 10, minWidth: 120 }}>
      <div style={{ color: overdue ? "#ef4444" : today2 ? "#c8f135" : "#555", marginBottom: 4 }}>
        {rev.label} · {fmtDate(rev.date)}
      </div>
      {!editing ? (
        <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid #2a2a2a", color: "#666", padding: "2px 8px", fontSize: 9, letterSpacing: "0.08em" }}>
          REGISTRAR
        </button>
      ) : (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <input type="number" min="0" max="100" value={acerto} onChange={e => setAcerto(e.target.value)}
            placeholder="%" style={{ ...inputStyle(), width: 52, padding: "2px 6px", fontSize: 11 }} />
          <button onClick={() => { markDone(temaId, idx, acerto !== "" ? Number(acerto) : null); setEditing(false); }}
            style={{ background: "#c8f135", border: "none", color: "#000", padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>✓</button>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ pct }) {
  return (
    <div style={{ width: 80, height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#22c55e" : "#c8f135", transition: "width 0.3s" }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  ANKI AUDIT
// ══════════════════════════════════════════════════════════════════
function AnkiAudit({ ankiLog, addAnkiLog, setAnkiLog }) {
  const [form, setForm] = useState({ cardsRevisados: "", cardsAgain: "", maturosTotal: "", maturosOk: "", obsCardsRuins: "", acao: "manteve" });

  const handleAdd = () => {
    addAnkiLog({ ...form, cardsRevisados: Number(form.cardsRevisados), cardsAgain: Number(form.cardsAgain) });
    setForm({ cardsRevisados: "", cardsAgain: "", maturosTotal: "", maturosOk: "", obsCardsRuins: "", acao: "manteve" });
  };

  const againPct = (e) => {
    if (!e.cardsRevisados || !e.cardsAgain) return null;
    return Math.round((e.cardsAgain / e.cardsRevisados) * 100);
  };

  return (
    <div>
      <div style={{ background: "#0d1a0d", border: "1px solid #1a3a1a", padding: "16px", marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#22c55e", letterSpacing: "0.15em", marginBottom: 14 }}>PROTOCOLO DE TRIAGEM DOS SEUS 5.000+ CARDS</div>
        <div style={{ fontSize: 12, color: "#888", lineHeight: 1.8 }}>
          <div>1. <span style={{ color: "#e0e0e0" }}>NÃO delete cards maduros</span> — suspenda com <code style={{ background: "#1a1a1a", padding: "0 4px" }}>@</code> no Anki Browser</div>
          <div>2. <span style={{ color: "#e0e0e0" }}>Critério de suspensão:</span> lista / conceito amplo / cópia de texto / derivável de outro conhecimento</div>
          <div>3. <span style={{ color: "#e0e0e0" }}>Meta:</span> reduzir deck ativo de 5.000+ para 1.500–2.000 cards atômicos de qualidade</div>
          <div>4. <span style={{ color: "#e0e0e0" }}>Triagem:</span> 20 min/dia por 2 semanas — não tente fazer tudo de uma vez</div>
          <div>5. <span style={{ color: "#e0e0e0" }}>Backlog:</span> zere reviews antes de adicionar qualquer card novo</div>
        </div>
      </div>

      <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "18px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "#c8f135", letterSpacing: "0.15em", marginBottom: 14 }}>REGISTRO DIÁRIO ANKI</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="CARDS REVISADOS">
            <input type="number" value={form.cardsRevisados} onChange={e => setForm(p => ({ ...p, cardsRevisados: e.target.value }))} placeholder="ex: 120" style={inputStyle()} />
          </Field>
          <Field label="CARDS AGAIN">
            <input type="number" value={form.cardsAgain} onChange={e => setForm(p => ({ ...p, cardsAgain: e.target.value }))} placeholder="ex: 18" style={inputStyle()} />
          </Field>
          <Field label="MADUROS TOTAL">
            <input type="number" value={form.maturosTotal} onChange={e => setForm(p => ({ ...p, maturosTotal: e.target.value }))} placeholder="ex: 1500" style={inputStyle()} />
          </Field>
          <Field label="AÇÃO DO DIA">
            <select value={form.acao} onChange={e => setForm(p => ({ ...p, acao: e.target.value }))} style={inputStyle()}>
              <option value="manteve">Só revisão</option>
              <option value="suspensos">Suspensei cards ruins</option>
              <option value="novos">Adicionei cards novos</option>
              <option value="reformulou">Reformulei cards</option>
            </select>
          </Field>
        </div>
        <Field label="OBS / CARDS RUINS IDENTIFICADOS">
          <input value={form.obsCardsRuins} onChange={e => setForm(p => ({ ...p, obsCardsRuins: e.target.value }))} placeholder="ex: Suspensei 40 cards de fisiopatologia sem aplicação clínica" style={{ ...inputStyle(), width: "100%" }} />
        </Field>
        <button onClick={handleAdd} style={{ marginTop: 12, background: "#c8f135", border: "none", color: "#000", padding: "8px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>SALVAR</button>
      </div>

      {/* LOG */}
      <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", marginBottom: 10 }}>HISTÓRICO ANKI</div>
      {ankiLog.length === 0 && <div style={{ color: "#333", fontSize: 13 }}>Nenhum registro ainda.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ankiLog.slice(0, 30).map(e => {
          const ap = againPct(e);
          const apColor = ap === null ? "#555" : ap > 20 ? "#ef4444" : ap > 12 ? "#f59e0b" : "#22c55e";
          return (
            <div key={e.id} style={{ display: "flex", gap: 16, background: "#0e0e0e", border: "1px solid #1a1a1a", padding: "10px 14px", alignItems: "center", fontSize: 12 }}>
              <span style={{ color: "#555", width: 44, fontSize: 10 }}>{fmtDate(e.data)}</span>
              <span style={{ color: "#e0e0e0", width: 60 }}>{e.cardsRevisados || "—"} rev</span>
              {ap !== null && <span style={{ color: apColor, width: 70, fontSize: 10 }}>Again: {ap}%{ap > 20 ? " ⚠" : ""}</span>}
              <span style={{ color: "#555", fontSize: 10 }}>{e.acao}</span>
              {e.obsCardsRuins && <span style={{ color: "#666", fontSize: 11, flex: 1 }}>{e.obsCardsRuins}</span>}
              <button onClick={() => setAnkiLog(p => p.filter(x => x.id !== e.id))} style={{ background: "none", border: "none", color: "#333", fontSize: 12, marginLeft: "auto" }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CASO CLÍNICO (Illness Script)
// ══════════════════════════════════════════════════════════════════
function CasoClinico() {
  const BLANK = { rep: "", ddPrincipal: "", ddPorque: "", dd1: "", dd1dif: "", dd2: "", dd2dif: "", exame1: "", exame1obj: "", condutaI: "", condutaD: "", observacoes: "" };
  const [form, setForm] = useState(BLANK);
  const [casos, setCasos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    load("residencia:casos").then(d => { if (d) setCasos(d); setLoaded(true); });
  }, []);
  useEffect(() => { if (loaded) save("residencia:casos", casos); }, [casos, loaded]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.rep.trim()) return;
    setCasos(p => [{ ...form, id: Date.now().toString(), data: today() }, ...p]);
    setForm(BLANK);
    setShow(false);
  };

  return (
    <div>
      <div style={{ background: "#0d0d1a", border: "1px solid #1a1a3a", padding: "16px", marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#4dc8ff", letterSpacing: "0.15em", marginBottom: 10 }}>ROTEIRO DE RACIOCÍNIO CLÍNICO — ILLNESS SCRIPT</div>
        <div style={{ fontSize: 12, color: "#888", lineHeight: 1.9 }}>
          <b style={{ color: "#ccc" }}>1. Represente o problema</b> → síntese em 1 frase (sexo/idade/tempo/queixa/contexto)<br/>
          <b style={{ color: "#ccc" }}>2. Diagnóstico + 2 DDs obrigatórios</b> → compare e contraste características-chave<br/>
          <b style={{ color: "#ccc" }}>3. Exames (máx. 2, em ordem)</b> → primeiro o que muda conduta<br/>
          <b style={{ color: "#ccc" }}>4. Conduta imediata</b> → próximas 1–2h (estabilização, ABCs, analgesia, etc.)<br/>
          <b style={{ color: "#ccc" }}>5. Conduta definitiva</b> → cirúrgica, clínica, antibiótico, etc.
        </div>
      </div>

      <button onClick={() => setShow(!show)} style={{ background: show ? "#333" : "#4dc8ff", border: "none", color: show ? "#e0e0e0" : "#000", padding: "8px 18px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 20 }}>
        {show ? "CANCELAR" : "+ NOVO CASO"}
      </button>

      {show && (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "20px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#4dc8ff", letterSpacing: "0.12em", marginBottom: 16 }}>PREENCHA ANTES DE VER A QUESTÃO</div>

          <Field label="1. REPRESENTAÇÃO DO PROBLEMA (1 frase)">
            <textarea value={form.rep} onChange={f("rep")} rows={2} placeholder="Homem 55a com 12h de dor epigástrica irradiando para dorso + vômitos + etilista crônico..." style={{ ...inputStyle(), width: "100%", resize: "vertical" }} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label="2A. DIAGNÓSTICO MAIS PROVÁVEL">
              <input value={form.ddPrincipal} onChange={f("ddPrincipal")} placeholder="ex: Pancreatite aguda" style={inputStyle()} />
            </Field>
            <Field label="POR QUÊ (achados que sustentam)">
              <input value={form.ddPorque} onChange={f("ddPorque")} placeholder="ex: dor em faixa + amilase/lipase, etilismo" style={inputStyle()} />
            </Field>
            <Field label="2B. DD1">
              <input value={form.dd1} onChange={f("dd1")} placeholder="ex: Úlcera perfurada" style={inputStyle()} />
            </Field>
            <Field label="O QUE DIFERENCIA">
              <input value={form.dd1dif} onChange={f("dd1dif")} placeholder="ex: úlcera → pneumoperitônio, dor súbita" style={inputStyle()} />
            </Field>
            <Field label="2C. DD2">
              <input value={form.dd2} onChange={f("dd2")} placeholder="ex: Colangite aguda" style={inputStyle()} />
            </Field>
            <Field label="O QUE DIFERENCIA">
              <input value={form.dd2dif} onChange={f("dd2dif")} placeholder="ex: colangite → tríade de Charcot, icterícia" style={inputStyle()} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label="3. EXAME PRIORITÁRIO">
              <input value={form.exame1} onChange={f("exame1")} placeholder="ex: Lipase sérica + USG abdome" style={inputStyle()} />
            </Field>
            <Field label="OBJETIVO DO EXAME">
              <input value={form.exame1obj} onChange={f("exame1obj")} placeholder="ex: Confirmar + avaliar litíase biliar" style={inputStyle()} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <Field label="4. CONDUTA IMEDIATA (1–2h)">
              <textarea value={form.condutaI} onChange={f("condutaI")} rows={2} placeholder="ex: NPO, SNG se vômitos, hidratação agressiva SF0,9, analgesia (morfina/dipirona), O2 se SpO2<95%" style={{ ...inputStyle(), width: "100%", resize: "vertical" }} />
            </Field>
            <Field label="5. CONDUTA DEFINITIVA">
              <textarea value={form.condutaD} onChange={f("condutaD")} rows={2} placeholder="ex: Pancreatite leve → dieta enteral precoce. Grave → UTI, considerar CPRE se litíase, cirurgia se necrose infectada" style={{ ...inputStyle(), width: "100%", resize: "vertical" }} />
            </Field>
          </div>

          <Field label="OBSERVAÇÕES / ERRO IDENTIFICADO APÓS VER O GABARITO">
            <textarea value={form.observacoes} onChange={f("observacoes")} rows={2} placeholder="ex: Errei a conduta definitiva — não lembrei o critério de gravidade de Ranson ≥3. Card criado." style={{ ...inputStyle(), width: "100%", resize: "vertical", marginTop: 12 }} />
          </Field>

          <button onClick={handleSave} style={{ marginTop: 14, background: "#4dc8ff", border: "none", color: "#000", padding: "8px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>SALVAR CASO</button>
        </div>
      )}

      {/* CASOS LOG */}
      <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", marginBottom: 10 }}>CASOS REGISTRADOS</div>
      {casos.length === 0 && <div style={{ color: "#333", fontSize: 13 }}>Nenhum caso. Pratique acima.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {casos.slice(0, 20).map(c => (
          <div key={c.id} style={{ background: "#0e0e0e", border: "1px solid #1a1a1a", padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#555" }}>{fmtDate(c.data)}</span>
              <span style={{ fontSize: 13, color: "#e0e0e0" }}>{c.ddPrincipal || "—"}</span>
              {c.dd1 && <span style={{ fontSize: 10, color: "#555" }}>DD: {c.dd1}</span>}
              {c.dd2 && <span style={{ fontSize: 10, color: "#555" }}>{c.dd2}</span>}
            </div>
            {c.rep && <div style={{ fontSize: 11, color: "#666", fontStyle: "italic", marginBottom: 4 }}>{c.rep}</div>}
            {c.observacoes && <div style={{ fontSize: 11, color: "#f59e0b" }}>⚑ {c.observacoes}</div>}
            <button onClick={() => setCasos(p => p.filter(x => x.id !== c.id))} style={{ background: "none", border: "none", color: "#333", fontSize: 10, marginTop: 4 }}>remover</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MÉTRICAS
// ══════════════════════════════════════════════════════════════════
function Metricas({ temas, ankiLog }) {
  const revDone = temas.flatMap(t => t.revisoes).filter(r => r.done && r.acerto !== null);

  const byInterval = INTERVAL_LABELS.map((lbl, i) => {
    const vals = revDone.filter(r => r.label === lbl).map(r => r.acerto);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    return { lbl, avg, n: vals.length };
  });

  const byEsp = ESPECIALIDADES.map(e => {
    const temasFilt = temas.filter(t => t.especialidade === e);
    const vals = temasFilt.flatMap(t => t.revisoes).filter(r => r.done && r.acerto !== null).map(r => r.acerto);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    return { e, avg, n: vals.length, temas: temasFilt.length };
  }).filter(x => x.temas > 0);

  const ankiAgainHistory = ankiLog.slice(0, 14).reverse().map(e => {
    const ap = (e.cardsAgain && e.cardsRevisados) ? Math.round((e.cardsAgain / e.cardsRevisados) * 100) : null;
    return { data: fmtDate(e.data), ap };
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Acerto por intervalo */}
        <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "18px" }}>
          <div style={{ fontSize: 10, color: "#c8f135", letterSpacing: "0.15em", marginBottom: 14 }}>ACERTO POR INTERVALO DE REVISÃO</div>
          {byInterval.map(({ lbl, avg, n }) => (
            <div key={lbl} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "#888" }}>{lbl}</span>
                <span style={{ color: avg === null ? "#333" : avg >= 70 ? "#22c55e" : avg >= 55 ? "#f59e0b" : "#ef4444" }}>
                  {avg !== null ? `${avg}%` : "—"} <span style={{ color: "#444" }}>({n})</span>
                </span>
              </div>
              {avg !== null && (
                <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2 }}>
                  <div style={{ width: `${avg}%`, height: "100%", background: avg >= 70 ? "#22c55e" : avg >= 55 ? "#f59e0b" : "#ef4444" }} />
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 10, color: "#444", lineHeight: 1.7 }}>
            <span style={{ color: "#22c55e" }}>≥70%</span> ok · <span style={{ color: "#f59e0b" }}>55–69%</span> atenção · <span style={{ color: "#ef4444" }}>{"<55%"}</span> reestudo
          </div>
        </div>

        {/* Acerto por especialidade */}
        <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "18px" }}>
          <div style={{ fontSize: 10, color: "#c8f135", letterSpacing: "0.15em", marginBottom: 14 }}>ACERTO POR ESPECIALIDADE</div>
          {byEsp.length === 0 && <div style={{ color: "#444", fontSize: 12 }}>Sem dados ainda.</div>}
          {byEsp.map(({ e, avg, n, temas: nt }) => (
            <div key={e} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, padding: "6px 0", borderBottom: "1px solid #1a1a1a" }}>
              <span style={{ color: "#888" }}>{e} <span style={{ color: "#444", fontSize: 10 }}>({nt}t)</span></span>
              <span style={{ color: avg === null ? "#333" : avg >= 70 ? "#22c55e" : avg >= 55 ? "#f59e0b" : "#ef4444" }}>
                {avg !== null ? `${avg}%` : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Anki Again % */}
        <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "18px" }}>
          <div style={{ fontSize: 10, color: "#c8f135", letterSpacing: "0.15em", marginBottom: 14 }}>ANKI — % AGAIN (ÚLTIMOS 14 DIAS)</div>
          {ankiAgainHistory.length === 0 && <div style={{ color: "#444", fontSize: 12 }}>Sem registros Anki.</div>}
          <div style={{ display: "flex", align: "flex-end", gap: 6, alignItems: "flex-end", height: 80 }}>
            {ankiAgainHistory.map((e, i) => {
              const h = e.ap !== null ? Math.max(4, e.ap * 2.5) : 4;
              const col = e.ap === null ? "#222" : e.ap > 20 ? "#ef4444" : e.ap > 12 ? "#f59e0b" : "#22c55e";
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ height: `${h}px`, width: "100%", background: col, minHeight: 4 }} title={e.ap !== null ? `${e.ap}%` : "—"} />
                  <div style={{ fontSize: 9, color: "#444", transform: "rotate(-40deg)", transformOrigin: "center" }}>{e.data}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#444" }}>
            Meta: <span style={{ color: "#22c55e" }}>{"<12%"}</span> Again · {">"}<span style={{ color: "#ef4444" }}>20%</span> = cards ruins ou falsa marcação
          </div>
        </div>

        {/* Alertas automáticos */}
        <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "18px" }}>
          <div style={{ fontSize: 10, color: "#c8f135", letterSpacing: "0.15em", marginBottom: 14 }}>ALERTAS AUTOMÁTICOS</div>
          <Alerts temas={temas} ankiLog={ankiLog} />
        </div>
      </div>
    </div>
  );
}

function Alerts({ temas, ankiLog }) {
  const alerts = [];

  // Temas com acerto <55% em D3 ou D7
  temas.forEach(t => {
    t.revisoes.forEach((r, i) => {
      if (r.done && r.acerto !== null && r.acerto < 55) {
        alerts.push({ type: "warn", msg: `${t.nome}: ${r.label} com ${r.acerto}% — agendar bloco extra` });
      }
    });
  });

  // Anki Again alto
  if (ankiLog.length > 0) {
    const last3 = ankiLog.slice(0, 3);
    const highAgain = last3.filter(e => e.cardsAgain && e.cardsRevisados && (e.cardsAgain / e.cardsRevisados) > 0.2);
    if (highAgain.length >= 2) alerts.push({ type: "danger", msg: "Anki: Again >20% por 2+ dias seguidos — cards mal formulados ou marcação inflada" });
  }

  // Temas sem revisão feita há >7 dias após D7
  const now = today();
  temas.forEach(t => {
    const d7 = t.revisoes[2];
    if (d7 && !d7.done && d7.date < now && diffDays(d7.date, now) > 3) {
      alerts.push({ type: "danger", msg: `${t.nome}: D7 vencido há ${diffDays(d7.date, now)} dias` });
    }
  });

  if (alerts.length === 0) return <div style={{ color: "#444", fontSize: 12 }}>Nenhum alerta. Sistema calibrado.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {alerts.map((a, i) => (
        <div key={i} style={{ fontSize: 11, color: a.type === "danger" ? "#ef4444" : "#f59e0b", borderLeft: `2px solid ${a.type === "danger" ? "#ef4444" : "#f59e0b"}`, paddingLeft: 10, lineHeight: 1.6 }}>
          {a.msg}
        </div>
      ))}
    </div>
  );
}

// ── UI HELPERS ──
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.14em", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function inputStyle() {
  return {
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    color: "#e0e0e0",
    padding: "7px 10px",
    fontSize: 12,
    width: "100%",
    outline: "none",
  };
}