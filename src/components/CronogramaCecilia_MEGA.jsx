import { useState, useMemo } from "react";
import { useStore, todayStr } from "../useStore";
import { Target } from "lucide-react";

const FASES = [
  { id: 1, nome: "Fase 1 — Execução e Atenção", cor: "#7C3AED" },
  { id: 2, nome: "Fase 2 — UFG + UnB", cor: "#0891B2" },
  { id: 3, nome: "Fase 3 — Intensificação", cor: "#059669" },
  { id: 4, nome: "Fase 4 — ENEM + UnB", cor: "#D97706" },
  { id: 5, nome: "Fase 5 — Pós-ENEM / UnB Final", cor: "#DC2626" },
];

const SEMANAS_DATA = Array.from({ length: 22 }, (_, i) => {
  const fase = i < 3 ? 1 : i < 9 ? 2 : i < 13 ? 3 : i < 20 ? 4 : 5;
  return { num: i + 1, fase };
});

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const BLOCOS = [
  { key: "anki", label: "07:00–08:00", titulo: "ANKI" },
  { key: "b1", label: "08:00–11:30", titulo: "Bloco 1 · Exatas" },
  { key: "almoco", label: "11:30–12:30", titulo: "ALMOÇO" },
  { key: "b2", label: "12:30–15:30", titulo: "Bloco 2 · Naturezas" },
  { key: "b3", label: "16:00–19:00", titulo: "Bloco 3 · Humanas/Ling/Red" },
];

const DADOS_SEMANAS = {};
for (let i = 1; i <= 22; i++) {
  DADOS_SEMANAS[i] = {
    dias: DIAS_SEMANA.map((dia, idx) => ({
      dia: `${dia} (Semana ${i})`,
      anki: "Revisão diária",
      b1: "EXATAS\nCdM aulas + Estuda",
      b2: "NATUREZAS\nCdM aulas + Estuda",
      b3: "HUMANAS\nCdM aulas + Questões",
    }))
  };
}

const corFase = (faseId) => FASES.find(f => f.id === faseId)?.cor || "#6B7280";

const calcularStats = (semana, temas) => {
  let feitos = 0, total = 0, questoes = 0, erros = 0, tempoMin = 0, ansiedade = 0;
  let blocoCount = 0;
  
  temas.forEach(t => {
    ["b1", "b2", "b3"].forEach(bloco => {
      total++;
      const r = t.rev?.[bloco];
      if (r?.done) {
        feitos++;
        if (r.questoes) questoes += r.questoes;
        if (r.acerto !== null && r.questoes) {
          erros += Math.round(r.questoes * (1 - r.acerto));
        }
        if (r.tempoMin) tempoMin += r.tempoMin;
        if (r.ansiedade) { ansiedade += r.ansiedade; blocoCount++; }
        // cansaco é armazenado mas não incluso nas métricas retornadas
      }
    });
  });

  const percentual = total > 0 ? Math.round((feitos / total) * 100) : 0;
  const ansiedadeMedia = blocoCount > 0 ? Math.round(ansiedade / blocoCount) : 0;
  
  return { feitos, total, percentual, questoes, erros, tempoMin, ansiedadeMedia };
};

// ─── WIDGET PARA DASHBOARD ───────────────────────────────────────────────────
export function CronogramaWidget() {
  const [semanaAtual, setSemanaAtual] = useState(1);
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);
  const stats = useMemo(() => calcularStats(semanaAtual, temas), [semanaAtual, temas]);
  const fase = corFase(SEMANAS_DATA[semanaAtual - 1].fase);

  return (
    <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-amber-400" />
          <h3 className="text-[13px] font-bold text-white">Cronograma Semana {semanaAtual}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setSemanaAtual(Math.max(1, semanaAtual - 1))}
            disabled={semanaAtual === 1}
            className="text-[11px] px-2 py-1 rounded bg-white/5 text-gray-400 disabled:opacity-30"
          >
            ←
          </button>
          <button 
            onClick={() => setSemanaAtual(Math.min(22, semanaAtual + 1))}
            disabled={semanaAtual === 22}
            className="text-[11px] px-2 py-1 rounded bg-white/5 text-gray-400 disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Progresso</p>
          <p className="text-[18px] font-black" style={{ color: fase }}>{stats.percentual}%</p>
          <p className="text-[9px] text-gray-600">{stats.feitos}/{stats.total}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Questões</p>
          <p className="text-[18px] font-black text-violet-400">{stats.questoes}</p>
          <p className="text-[9px] text-gray-600">{stats.erros} erros</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Tempo</p>
          <p className="text-[18px] font-black text-cyan-400">{(stats.tempoMin / 60).toFixed(1)}h</p>
          <p className="text-[9px] text-gray-600">{stats.tempoMin}min</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Humor</p>
          <p className="text-[18px] font-black" style={{ color: stats.ansiedadeMedia <= 2 ? "#10b981" : stats.ansiedadeMedia <= 3 ? "#f59e0b" : "#ef4444" }}>
            {"😌😐😰"[Math.max(0, Math.min(2, stats.ansiedadeMedia - 1))]}
          </p>
          <p className="text-[9px] text-gray-600">Ansiedade {stats.ansiedadeMedia}</p>
        </div>
      </div>
    </div>
  );
}

// ─── CRONOGRAMA PRINCIPAL ────────────────────────────────────────────────────
export default function CronogramaCecilia() {
  const [semanaAtual, setSemanaAtual] = useState(1);
  const [modalAberto, setModalAberto] = useState(null);
  const [formData, setFormData] = useState({
    questoes: 0,
    acertoPct: 100,
    tempoMin: 0,
    ansiedade: 3,
    cansaco: 3,
    confianca: 4,
    dificuldade: 3,
    foco: 4,
    motivos: "",
  });

  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);
  const markStep = useStore((s) => s.markStep);
  const addTema = useStore((s) => s.addTema);

  const semanaInfo = SEMANAS_DATA[semanaAtual - 1];
  const fase = corFase(semanaInfo.fase);
  const stats = useMemo(() => calcularStats(semanaAtual, temas), [semanaAtual, temas]);
  const dados = DADOS_SEMANAS[semanaAtual];

  const styles = {
    container: {
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      maxWidth: 1280,
      margin: "0 auto",
      padding: "24px 16px",
      backgroundColor: "#0f0f13",
      minHeight: "100vh",
      color: "#e8e8ee",
    },
    header: { marginBottom: 28 },
    titulo: { fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" },
    subtitulo: { fontSize: 13, color: "#888", margin: 0 },
    faseBadge: {
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      marginBottom: 12,
      backgroundColor: fase + "22",
      color: fase,
      border: `1px solid ${fase}44`,
    },
    statsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: "#16161e",
      border: "1px solid #1e1e2a",
      borderRadius: 10,
      padding: "12px 14px",
    },
    statLabel: { fontSize: 11, color: "#666", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" },
    statValor: (cor) => ({ fontSize: 24, fontWeight: 800, color: cor, lineHeight: 1 }),
    statSubtexto: { fontSize: 10, color: "#555", marginTop: 4 },
    navRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    semanaNumero: { fontSize: 28, fontWeight: 800, color: fase, lineHeight: 1 },
    grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 20 },
    diaCard: { backgroundColor: "#16161e", border: "1px solid #1e1e2a", borderRadius: 10, overflow: "hidden" },
    diaHeader: { padding: "8px", borderBottom: "1px solid #1e1e2a", backgroundColor: "#12121a" },
    diaNome: { fontSize: 10, fontWeight: 700, color: "#888" },
    blocos: { padding: 6, display: "flex", flexDirection: "column", gap: 2 },
    blocoWrapper: { display: "flex", alignItems: "flex-start", gap: 5 },
    checkbox: {
      width: 16,
      height: 16,
      borderRadius: 4,
      border: "1.5px solid #333",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      marginTop: 3,
      flexShrink: 0,
    },
    blocoItem: (feito) => ({
      flex: 1,
      padding: "5px 7px",
      borderRadius: 6,
      backgroundColor: feito ? fase + "15" : "#0e0e16",
      border: `1px solid ${feito ? fase + "44" : "#1a1a25"}`,
      cursor: "pointer",
      fontSize: 9,
    }),
    blocoHora: { fontSize: 8, color: "#555", marginBottom: 2 },
    blocoMateria: { fontSize: 9, fontWeight: 700, color: "#ddd" },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      overflow: "auto",
    },
    modalContent: {
      backgroundColor: "#16161e",
      borderRadius: 12,
      border: "1px solid #1e1e2a",
      padding: "20px",
      maxWidth: 600,
      width: "90%",
      my: "auto",
    },
    modalTitulo: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#fff" },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase" },
    input: {
      width: "100%",
      padding: "8px 10px",
      borderRadius: 6,
      border: "1px solid #2a2a35",
      backgroundColor: "#0e0e16",
      color: "#ddd",
      fontSize: 12,
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      padding: "8px 10px",
      borderRadius: 6,
      border: "1px solid #2a2a35",
      backgroundColor: "#0e0e16",
      color: "#ddd",
      fontSize: 12,
      boxSizing: "border-box",
      minHeight: 50,
    },
    slider: { width: "100%", height: 4, borderRadius: 2, outline: "none" },
    sliderLabels: { display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", marginTop: 4 },
    gridFormGroups: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    resumo: {
      backgroundColor: "#0e0e16",
      border: `1px solid ${fase}44`,
      borderRadius: 6,
      padding: "10px 12px",
      marginBottom: 16,
      fontSize: 12,
      color: "#aaa",
    },
    btnGroup: { display: "flex", gap: 8 },
    btn: (primary) => ({
      flex: 1,
      padding: "8px 12px",
      borderRadius: 6,
      border: primary ? "none" : "1px solid #2a2a35",
      backgroundColor: primary ? fase : "#0e0e16",
      color: primary ? "#000" : "#ddd",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
    }),
    progressBar: { height: 3, backgroundColor: "#1a1a25", borderRadius: 2, marginBottom: 20, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 2, backgroundColor: fase, width: `${stats.percentual}%` },
  };

  const abrirModal = (semana, dia, bloco) => {
    setModalAberto({ semana, dia, bloco });
    setFormData({
      questoes: 0,
      acertoPct: 100,
      tempoMin: 0,
      ansiedade: 3,
      cansaco: 3,
      confianca: 4,
      dificuldade: 3,
      foco: 4,
      motivos: "",
    });
  };

  const salvarRegistro = () => {
    if (!modalAberto || formData.questoes === 0) return;

    const temaId = `cronograma-${modalAberto.semana}-${modalAberto.dia}-${modalAberto.bloco}`;
    let tema = temas.find(t => t.id === temaId);

    if (!tema) {
      addTema(plat, {
        nome: `Sem${modalAberto.semana} Dia${modalAberto.dia + 1}`,
        esp: "Exatas",
        d0: todayStr(),
      });
      tema = temas.find(t => t.id === temaId);
    }

    if (tema) {
      markStep(plat, tema.id, modalAberto.bloco, {
        acerto: formData.acertoPct / 100,
        questoes: formData.questoes,
        tempoMin: formData.tempoMin,
        ansiedade: formData.ansiedade,
        cansaco: formData.cansaco,
        confianca: formData.confianca,
        dificuldade: formData.dificuldade,
        foco: formData.foco,
        motivosErro: formData.motivos ? [formData.motivos] : [],
      });
    }

    setModalAberto(null);
  };

  const acertos = Math.round(formData.questoes * formData.acertoPct / 100);
  const erros = formData.questoes - acertos;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>📚 Cronograma Cecília 2026</h1>
        <p style={styles.subtitulo}>Medicina · ESCS · UnB · UFG · ENEM · 22 semanas</p>
      </div>

      <div style={styles.progressBar}>
        <div style={styles.progressFill} />
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Progresso</div>
          <div style={styles.statValor(fase)}>{stats.percentual}%</div>
          <div style={styles.statSubtexto}>{stats.feitos}/{stats.total} blocos</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Questões</div>
          <div style={styles.statValor("#a78bfa")}>{stats.questoes}</div>
          <div style={styles.statSubtexto}>{stats.erros} erros</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Tempo</div>
          <div style={styles.statValor("#06b6d4")}>{(stats.tempoMin / 60).toFixed(1)}h</div>
          <div style={styles.statSubtexto}>{stats.tempoMin} minutos</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Ansiedade</div>
          <div style={{ ...styles.statValor(stats.ansiedadeMedia <= 2 ? "#10b981" : stats.ansiedadeMedia <= 3 ? "#f59e0b" : "#ef4444"), fontSize: 20 }}>
            {"😌😐😰"[Math.max(0, Math.min(2, stats.ansiedadeMedia - 1))]}
          </div>
          <div style={styles.statSubtexto}>Nível {stats.ansiedadeMedia}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {SEMANAS_DATA.map(s => (
          <button
            key={s.num}
            onClick={() => setSemanaAtual(s.num)}
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: semanaAtual === s.num ? 700 : 400,
              cursor: "pointer",
              border: `1px solid ${semanaAtual === s.num ? corFase(s.fase) : "#2a2a35"}`,
              backgroundColor: semanaAtual === s.num ? corFase(s.fase) + "22" : "#1a1a22",
              color: semanaAtual === s.num ? corFase(s.fase) : "#666",
            }}
          >
            S{s.num}
          </button>
        ))}
      </div>

      <div style={styles.navRow}>
        <div>
          <div style={styles.faseBadge}>Fase {semanaInfo.fase}</div>
          <div style={styles.semanaNumero}>Semana {semanaAtual}</div>
        </div>
        <button
          style={{ ...styles.checkbox, width: 36, height: 36, marginTop: 0 }}
          onClick={() => setSemanaAtual(Math.max(1, semanaAtual - 1))}
          disabled={semanaAtual === 1}
        >
          ‹
        </button>
        <button
          style={{ ...styles.checkbox, width: 36, height: 36, marginTop: 0 }}
          onClick={() => setSemanaAtual(Math.min(22, semanaAtual + 1))}
          disabled={semanaAtual === 22}
        >
          ›
        </button>
      </div>

      <div style={styles.grid}>
        {dados?.dias.map((dia, dIdx) => (
          <div key={dIdx} style={styles.diaCard}>
            <div style={styles.diaHeader}>
              <div style={styles.diaNome}>{dia.dia.split(" (")[0]}</div>
            </div>
            <div style={styles.blocos}>
              {["b1", "b2", "b3"].map((bloco) => {
                const texto = dia[bloco] || "";
                const linhas = texto.split("\n");
                const materia = linhas[0];
                
                const temaId = `cronograma-${semanaAtual}-${dIdx}-${bloco}`;
                const tema = temas.find(t => t.id === temaId);
                const r = tema?.rev?.[bloco];
                const feito = r?.done || false;
                const blocoInfo = BLOCOS.find(b => b.key === bloco);

                if (bloco === "b1") {
                  return (
                    <div key={bloco} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ ...styles.bloco_almoco_anki = { padding: "5px 7px", borderRadius: 6, backgroundColor: "#0e0e16", border: "1px solid #1a1a25", fontSize: 9, color: "#555" } }}>
                        07:00 ANKI
                      </div>
                      <div style={styles.blocoWrapper}>
                        <div
                          style={{
                            ...styles.checkbox,
                            backgroundColor: feito ? fase : "transparent",
                            borderColor: feito ? fase : "#333",
                          }}
                          onClick={() => abrirModal(semanaAtual, dIdx, bloco)}
                        >
                          {feito && "✓"}
                        </div>
                        <div style={styles.blocoItem(feito)} onClick={() => abrirModal(semanaAtual, dIdx, bloco)}>
                          <div style={styles.blocoHora}>{blocoInfo.label}</div>
                          <div style={{...styles.blocoMateria, textDecoration: feito ? "line-through" : "none"}}>
                            {materia}
                          </div>
                          {feito && r?.questoes && (
                            <div style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
                              {r.questoes}q • {Math.round(r.acerto * 100)}% • {r.tempoMin || 0}min
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (bloco === "b2") {
                  return (
                    <div key={bloco} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ padding: "5px 7px", borderRadius: 6, backgroundColor: "#0e0e16", border: "1px solid #1a1a25", fontSize: 9, color: "#555" }}>
                        11:30 ALMOÇO
                      </div>
                      <div style={styles.blocoWrapper}>
                        <div
                          style={{
                            ...styles.checkbox,
                            backgroundColor: feito ? fase : "transparent",
                            borderColor: feito ? fase : "#333",
                          }}
                          onClick={() => abrirModal(semanaAtual, dIdx, bloco)}
                        >
                          {feito && "✓"}
                        </div>
                        <div style={styles.blocoItem(feito)} onClick={() => abrirModal(semanaAtual, dIdx, bloco)}>
                          <div style={styles.blocoHora}>{blocoInfo.label}</div>
                          <div style={{...styles.blocoMateria, textDecoration: feito ? "line-through" : "none"}}>
                            {materia}
                          </div>
                          {feito && r?.questoes && (
                            <div style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
                              {r.questoes}q • {Math.round(r.acerto * 100)}% • {r.tempoMin || 0}min
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={bloco} style={styles.blocoWrapper}>
                    <div
                      style={{
                        ...styles.checkbox,
                        backgroundColor: feito ? fase : "transparent",
                        borderColor: feito ? fase : "#333",
                      }}
                      onClick={() => abrirModal(semanaAtual, dIdx, bloco)}
                    >
                      {feito && "✓"}
                    </div>
                    <div style={styles.blocoItem(feito)} onClick={() => abrirModal(semanaAtual, dIdx, bloco)}>
                      <div style={styles.blocoHora}>{blocoInfo.label}</div>
                      <div style={{...styles.blocoMateria, textDecoration: feito ? "line-through" : "none"}}>
                        {materia}
                      </div>
                      {feito && r?.questoes && (
                        <div style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
                          {r.questoes}q • {Math.round(r.acerto * 100)}% • {r.tempoMin || 0}min
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div style={styles.modal} onClick={() => setModalAberto(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitulo}>
              📝 Registrar Bloco
              <div style={{ fontSize: 12, color: "#666", fontWeight: 400, marginTop: 4 }}>
                Semana {modalAberto.semana} · Dia {modalAberto.dia + 1}
              </div>
            </div>

            <div style={styles.gridFormGroups}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Questões Feitas</label>
                <input
                  type="number"
                  style={styles.input}
                  min="0"
                  value={formData.questoes}
                  onChange={(e) => setFormData({...formData, questoes: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tempo (minutos)</label>
                <input
                  type="number"
                  style={styles.input}
                  min="0"
                  value={formData.tempoMin}
                  onChange={(e) => setFormData({...formData, tempoMin: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Acerto %</label>
                <input
                  type="range"
                  style={styles.slider}
                  min="0"
                  max="100"
                  value={formData.acertoPct}
                  onChange={(e) => setFormData({...formData, acertoPct: parseInt(e.target.value)})}
                />
                <div style={styles.sliderLabels}>
                  <span>0%</span>
                  <span style={{ fontWeight: 700, color: fase }}>{formData.acertoPct}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Ansiedade</label>
                <input
                  type="range"
                  style={styles.slider}
                  min="1"
                  max="5"
                  value={formData.ansiedade}
                  onChange={(e) => setFormData({...formData, ansiedade: parseInt(e.target.value)})}
                />
                <div style={styles.sliderLabels}>
                  <span>Calmo</span>
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>{"😌😐😰"[formData.ansiedade - 1]}</span>
                  <span>Pânico</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Cansaço</label>
                <input
                  type="range"
                  style={styles.slider}
                  min="1"
                  max="5"
                  value={formData.cansaco}
                  onChange={(e) => setFormData({...formData, cansaco: parseInt(e.target.value)})}
                />
                <div style={styles.sliderLabels}>
                  <span>Fresco</span>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>{formData.cansaco}</span>
                  <span>Morto</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confiança</label>
                <input
                  type="range"
                  style={styles.slider}
                  min="1"
                  max="5"
                  value={formData.confianca}
                  onChange={(e) => setFormData({...formData, confianca: parseInt(e.target.value)})}
                />
                <div style={styles.sliderLabels}>
                  <span>Duvidoso</span>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>{formData.confianca}</span>
                  <span>Confiante</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Dificuldade</label>
                <input
                  type="range"
                  style={styles.slider}
                  min="1"
                  max="5"
                  value={formData.dificuldade}
                  onChange={(e) => setFormData({...formData, dificuldade: parseInt(e.target.value)})}
                />
                <div style={styles.sliderLabels}>
                  <span>Fácil</span>
                  <span style={{ color: fase, fontWeight: 700 }}>{formData.dificuldade}</span>
                  <span>Impossível</span>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Foco</label>
                <input
                  type="range"
                  style={styles.slider}
                  min="1"
                  max="5"
                  value={formData.foco}
                  onChange={(e) => setFormData({...formData, foco: parseInt(e.target.value)})}
                />
                <div style={styles.sliderLabels}>
                  <span>Disperso</span>
                  <span style={{ color: "#06b6d4", fontWeight: 700 }}>{formData.foco}</span>
                  <span>Laser</span>
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Motivos dos Erros</label>
              <textarea
                style={styles.textarea}
                placeholder="Ex: Erro de cálculo, conceito errado, falta de atenção..."
                value={formData.motivos}
                onChange={(e) => setFormData({...formData, motivos: e.target.value})}
              />
            </div>

            <div style={styles.resumo}>
              📊 {formData.questoes} questões · {acertos} acertos · {erros} erros · {formData.tempoMin}min · Foco {formData.foco}/5
            </div>

            <div style={styles.btnGroup}>
              <button
                style={styles.btn(true)}
                onClick={salvarRegistro}
                disabled={formData.questoes === 0}
              >
                ✓ Salvar Registro
              </button>
              <button style={styles.btn(false)} onClick={() => setModalAberto(null)}>
                ✕ Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
