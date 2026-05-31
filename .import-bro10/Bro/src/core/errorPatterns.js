// src/core/errorPatterns.js
// Analyzes motivosErro patterns by specialty/area to diagnose cognitive failure modes.

export function detectErrorPatterns(doneReviews) {
  if (!doneReviews || doneReviews.length === 0) return [];

  // Group reviews by specialty
  const byEsp = {};
  doneReviews.forEach(r => {
    if (!r.esp) return;
    if (!byEsp[r.esp]) byEsp[r.esp] = [];
    byEsp[r.esp].push(r);
  });

  const patterns = [];

  for (const [esp, reviews] of Object.entries(byEsp)) {
    // Only analyze if there are >= 5 sessions for this specialty
    if (reviews.length < 5) continue;

    // Collect all motivosErro in this specialty
    let totalErrorsCount = 0;
    const counts = {
      lacuna: 0,
      raciocinio: 0,
      distractor: 0,
      descuido: 0,
      nao_visto: 0,
      interpretacao: 0
    };

    reviews.forEach(r => {
      const motivos = r.motivosErro || [];
      motivos.forEach(m => {
        // Standardize common variations or typos
        let key = m;
        if (m === "distracao" || m === "desatencao") key = "descuido";
        if (m === "raciocínio") key = "raciocinio";
        if (m === "conteudo_base") key = "lacuna";
        
        if (counts[key] !== undefined) {
          counts[key]++;
          totalErrorsCount++;
        }
      });
    });

    if (totalErrorsCount === 0) continue;

    const pctLacuna = counts.lacuna / totalErrorsCount;
    const pctRaciocinio = counts.raciocinio / totalErrorsCount;
    const pctDistracao = (counts.descuido + counts.distractor) / totalErrorsCount;

    if (pctLacuna > 0.60) {
      patterns.push({
        esp,
        type: "lacuna",
        text: `Seus erros em ${esp} são de base, não de raciocínio. Volte ao conteúdo, não faça mais questões.`
      });
    } else if (pctRaciocinio > 0.60) {
      patterns.push({
        esp,
        type: "raciocinio",
        text: `Você sabe o conteúdo em ${esp} mas erra na lógica. Faça questões comentadas, não releia.`
      });
    } else if (pctDistracao > 0.60) {
      patterns.push({
        esp,
        type: "distracao",
        text: `Erros por desatenção em ${esp}. Reveja seu horário de estudos e nível de cansaço.`
      });
    }
  }

  return patterns;
}
