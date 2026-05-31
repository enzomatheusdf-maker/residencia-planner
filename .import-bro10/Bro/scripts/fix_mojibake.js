const fs = require('fs');
const path = require('path');

const TELL = ['Ã','Â','ðŸ','â"','â€','Ð','â–','â‚'];
function tell(s) { return TELL.reduce((n, x) => n + (s.split(x).length - 1), 0); }

function rev1(s) {
  try {
    const buf = Buffer.from(s, 'latin1');
    const decoded = buf.toString('utf8');
    // Check it's valid utf8 by re-encoding
    if (Buffer.from(decoded, 'utf8').toString('latin1') === s) return decoded;
    return null;
  } catch { return null; }
}

function fixLine(line, maxp = 6) {
  let cur = line;
  for (let i = 0; i < maxp; i++) {
    const nxt = rev1(cur);
    if (nxt === null || tell(nxt) >= tell(cur)) break;
    cur = nxt;
  }
  return cur;
}

function fix(t) { return t.split('\n').map(fixLine).join('\n'); }

const TARGETS = [
  'src/components/Dashboard.jsx','src/App.js','src/components/Simulados.jsx',
  'src/components/Primitives.jsx','src/components/AcademiaMetodo.jsx',
  'src/components/BottomNav.jsx','src/components/Cronograma.jsx','src/core/store.js',
  'src/components/CronogramaVest.jsx','src/components/FocusMode.jsx',
  'src/components/SessaoPage.jsx','src/constants/stepDefinitions.js',
];

for (const p of TARGETS) {
  if (!fs.existsSync(p)) { console.log('skip  ', p, '(not found)'); continue; }
  const t = fs.readFileSync(p, 'utf8');
  const f = fix(t);
  if (f !== t) {
    fs.writeFileSync(p + '.bak', t, 'utf8');
    fs.writeFileSync(p, f, 'utf8');
    console.log('fixed ', p, tell(t), '->', tell(f));
  } else {
    console.log('clean ', p);
  }
}
