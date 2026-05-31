const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Fix 1: canvas fillText - ÍNDICE DE PRONTIDÃO GERAL
// Current: "ÃNDICE DE PRONTIDÃƒO GERAL"
// Ã + U+0081(invisible) + NDICE → ÍNDICE
// PRONTIDÃƒO → PRONTIDÃO (Ãƒ = 2-layer Ã)
content = content.replace('ÃNDICE DE PRONTIDÃƒO GERAL', 'ÍNDICE DE PRONTIDÃO GERAL');

// Fix 2: 🏆 trophy (ðŸ + U+008F invisible + †)
// ð=U+00F0, Ÿ=U+0178, U+008F invisible, †=U+2020
content = content.split('\uF0' + 'Ÿ' + '' + '†').join('🏆');
// fallback regex on the visible part
content = content.replace(/ðŸ†/g, '🏆');

// Fix 3: 🤝 handshake (ðŸ + ¤ + U+009D invisible)
// ð=U+00F0, Ÿ=U+0178, ¤=U+00A4, U+009D invisible
content = content.split('ð' + 'Ÿ' + '¤' + '').join('🤝');
content = content.replace(/ðŸ¤/g, '🤝');

// Fix 4: 🕊️ dove (ðŸ•Š + ï¸)
// ð=U+00F0, Ÿ=U+0178, •=U+2022, Š=U+0160, ï=U+00EF, ¸=U+00B8, U+008F invisible
content = content.split('ðŸ•Šï¸').join('🕊️');
content = content.replace(/ðŸ•Šï¸/g, '🕊️');

// Fix 5: 🏁 chequered flag (ðŸ + U+008F invisible + U+0081 invisible)
// ð=U+00F0, Ÿ=U+0178, U+008F, U+0081
content = content.split('ðŸ').join('🏁');
// This one has only 2 visible chars in grep, so no visible-only fallback

// Fix 6: ✅ check mark green (â + œ + …)
// â=U+00E2, œ=U+0153(cp1252 0x9C), …=U+2026(cp1252 0x85)
content = content.split('âœ…').join('✅');

// Fix 7: ⚠️ warning (â + š + ï¸)
// â=U+00E2, š=U+009A → wait, let me think: ⚠ U+26A0, UTF-8 E2 9A A0
// cp1252: E2→â, 9A→š(cp1252 0x9A=U+0161), A0→nbsp
// ï¸ = variation selector: EF B8 8F cp1252: EF→ï, B8→¸, 8F→U+008F
content = content.split('âš ï¸').join('⚠️');

// Fix 8: 📊 bar chart (ðŸ"Š)
// 📊 U+1F4CA, UTF-8 F0 9F 93 8A
// cp1252: F0→ð, 9F→Ÿ, 93→"(cp1252 0x93=U+201C), 8A→Š(cp1252 0x8A=U+0160)
content = content.split('ðŸ“Š').join('📊');
content = content.replace(/ðŸ"Š/g, '📊');

// Fix 9: Áreas (Ã + U+0081 invisible + reas)
content = content.split('Ãreas').join('Áreas');
content = content.split('ÃREAS').join('ÁREAS');

// Fix 10: comment em-dash â€" → —
// â=U+00E2, €=U+20AC, "=U+201D(cp1252 0x94)
content = content.split('â€”').join('—');

const before = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
if (content !== before) {
  fs.writeFileSync('src/components/Dashboard.jsx', content, 'utf8');
  console.log('Fixed Dashboard.jsx');
} else {
  console.log('No changes made - pattern matching may need adjustment');
}
