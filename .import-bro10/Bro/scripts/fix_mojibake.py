import os, sys
TELL = ['Ã','Â','ðŸ','â"','â€','Ð','â–','â‚']
def tell(s): return sum(s.count(x) for x in TELL)
def rev1(s):
    try: return s.encode('cp1252').decode('utf-8')
    except Exception: return None
def fix_line(line, maxp=6):
    cur = line
    for _ in range(maxp):
        nxt = rev1(cur)
        if nxt is None or tell(nxt) >= tell(cur): break
        cur = nxt
    return cur
def fix(t): return '\n'.join(fix_line(l) for l in t.split('\n'))
TARGETS = [
  'src/components/Dashboard.jsx','src/App.js','src/components/Simulados.jsx',
  'src/components/Primitives.jsx','src/components/AcademiaMetodo.jsx',
  'src/components/BottomNav.jsx','src/components/Cronograma.jsx','src/core/store.js',
  'src/components/CronogramaVest.jsx','src/components/FocusMode.jsx',
  'src/components/SessaoPage.jsx','src/constants/stepDefinitions.js',
]
for p in TARGETS:
    if not os.path.exists(p): continue
    t = open(p, encoding='utf-8').read()
    f = fix(t)
    if f != t:
        open(p+'.bak','w',encoding='utf-8').write(t)
        open(p,'w',encoding='utf-8').write(f)
        print('fixed', p, tell(t), '->', tell(f))
    else:
        print('clean ', p)
