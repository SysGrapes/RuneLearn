# -*- coding: utf-8 -*-
"""Build the RuneLearn word library from ECDICT data (real words, real phonetics, Chinese glosses)."""
import csv, re, json, random, itertools

ECDICT = r'C:\Users\Grape\Documents\DSH\runelearn\ecdict.csv'
OUT = r'C:\Users\Grape\Documents\DSH\runelearn\wordbank.js'
random.seed(20240924)

# ---------- Load ECDICT ----------
D = {}
with open(ECDICT, encoding='utf-8', newline='') as f:
    r = csv.reader(f)
    next(r)
    for row in r:
        D[row[0].lower()] = {
            'ph': row[1], 'trans': row[3], 'collins': row[5],
            'oxford': row[6], 'tag': row[7], 'bnc': row[8], 'frq': row[9],
        }

POS_RX = re.compile(r'^([a-zA-Z.]{1,8})[.:]\s*(.*)$')

# Meta-domain prefixes to drop ([计], [医], [网络], etc.)
META_RX = re.compile(r'^\[')

# Normalize POS labels to common short forms
POS_NORM = {
    'n': 'n', 'noun': 'n', 'v': 'v', 'vb': 'v', 'vt': 'v', 'vi': 'v',
    'verb': 'v', 'a': 'adj', 'adj': 'adj', 'ad': 'adj', 'adv': 'adv',
    'adverb': 'adv', 'prep': 'prep', 'pron': 'pron', 'num': 'num',
    'conj': 'conj', 'int': 'int', 'interj': 'int', 'art': 'art',
    'aux': 'aux', 'modal': 'aux', 'abbr': 'abbr', 'suf': 'suf', 'pref': 'pref',
}

def parse_translation(trans):
    """Return list of {pos, def} pairs. Drop meta lines and bare verb-form lines."""
    posdefs = []
    for line in trans.split('\\n'):          # ECDICT uses literal backslash-n
        line = line.strip()
        if not line:
            continue
        if line.startswith('['):
            continue
        m = POS_RX.match(line)
        if m:
            pos = m.group(1).strip()
            rest = m.group(2).strip()
            if not pos or not rest:
                continue
            pos = POS_NORM.get(pos, pos)
            rest = rest.strip(';；,，')
            if rest and not rest.startswith('['):
                posdefs.append({'pos': pos, 'def': rest})
    return posdefs

DERIV_RX = re.compile(r'的(过去式|过去分词|现在分词|复数形式|第三人称单数|比较级|最高级|动名词)$')

def clean_senses(posdefs, word):
    """Drop derivation-note senses (e.g. 'heavyweight的复数形式'); keep real glosses."""
    out = []
    for s in posdefs:
        d = s['def'].strip()
        # drop pure derivation notes
        if DERIV_RX.search(d):
            continue
        # drop ones that are just "X的过去式" leaving nothing useful
        if re.fullmatch(r'[a-zA-Z]+的(过去式|过去分词|现在分词|复数形式|第三人称单数|比较级|最高级).*', d):
            continue
        # trim
        d = d[:120]
        if d:
            out.append({'pos': s['pos'], 'def': d})
    return out

# ---------- Commonness score ----------
COMMON_TAGS = ['zk', 'gk', 'cet4', 'cet6', 'ky', 'ielts', 'toefl', 'gre']

def is_common(d):
    """Gate: a 'common/learnable' word must have a Collins star >=3 OR appear in
    a mainstream English exam list (this excludes obscure/technical words like
    'abdominoplasty', 'accouchement')."""
    c = d['collins']
    if c.isdigit() and int(c) >= 3:
        return True
    tag = d['tag'] or ''
    for t in COMMON_TAGS:
        if t in tag:
            return True
    return False

def common_score(w, d):
    """Higher = more common/learnable. Use collins star, exam tags, frq."""
    s = 0
    c = d['collins']
    if c.isdigit():
        cc = int(c)
        if cc >= 3:
            s += 10 + cc * 5
        else:
            s += cc
    tag = d['tag']
    if tag:
        s += 6
        for t in COMMON_TAGS:
            if t in tag:
                s += 4
    frq = d['frq']
    if frq.isdigit():
        fq = int(frq)
        if 0 < fq <= 1800:
            s += 30
        elif fq <= 3500:
            s += 20
        elif fq <= 6000:
            s += 12
        elif fq <= 10000:
            s += 6
    return s

# ---------- Build candidates ----------
def vw(w): return ('v' in w) or ('w' in w)
def hasVW(w): return ('v' in w) and ('w' in w)

def build(difficulty):
    cands = []
    for w, d in D.items():
        if not re.fullmatch(r'[a-z]+', w):
            continue
        if len(w) < 2:
            continue  # 排除单字母词
        L = len(w)
        if difficulty == 'easy':
            if L > 4 or vw(w):
                continue
        elif difficulty == 'med':
            if not (5 <= L <= 8):
                continue
        elif difficulty == 'hard':
            if L < 9:
                continue
        elif difficulty == 'expert':
            if L < 12:
                continue
        # require a phonetic, a parseable translation, AND commonness gate
        if not is_common(d):
            continue
        if not d['ph'] or not d['trans']:
            continue
        pd = parse_translation(d['trans'])
        if not pd:
            continue
        sc = common_score(w, d)
        cands.append((sc, w, d['ph'], pd))
    # Sort by commonness desc
    cands.sort(key=lambda x: -x[0])
    return cands

def pick(cands, n, min_score, extra_vw=None, vw_bonus=0):
    """Rank by commonness (score). For expert, add a small bonus for words that
    contain both V and W so genuinely common V-W words surface, while obscure
    low-score V-W words (e.g. 'oversweeping') still lose to common words."""
    scored = []
    for c in cands:
        sc, w, ph, pd = c
        if sc < min_score:
            continue
        eff = sc + (vw_bonus if ('v' in w and 'w' in w) else 0)
        scored.append((eff, sc, w, ph, pd))
    scored.sort(key=lambda x: -x[0])
    return scored

def clean_phonetic(ph):
    """Remove garbled backslash/stress artifacts if present."""
    ph = ph.replace('\\\\', '').replace('\\', '').replace('ˊ', "'")
    ph = ph.strip()
    return ph

if __name__ == '__main__':
    lib = {}
    used = set()
    config = [
        ('easy', 340, 16, 0),
        ('med', 340, 30, 0),
        ('hard', 340, 30, 0),
        ('expert', 340, 14, 6),
    ]
    for diff, n, mins, vw_bonus in config:
        cands = build(diff)
        chosen = pick(cands, n * 3, mins, None, vw_bonus)
        entries = []
        for eff, sc, w, ph, pd in chosen:
            if len(entries) >= n:
                break
            if w in used:
                continue
            senses = clean_senses(pd, w)
            if not senses:
                continue
            used.add(w)
            entries.append({'w': w, 'ph': clean_phonetic(ph), 'senses': senses})
        lib[diff] = entries
        vwct = sum(1 for e in entries if hasVW(e['w']))
        vct = sum(1 for e in entries if ('v' in e['w']) or ('w' in e['w']))
        print(diff, 'chosen', len(entries), 'bothVW=', vwct, 'hasVorW=', vct)

    # ---- verification ----
    def check(diff, items):
        bad = []
        for it in items:
            w = it['w']
            L = len(w)
            if diff == 'easy' and not (L <= 4 and not vw(w)):
                bad.append((w, 'easy rule'))
            if diff == 'med' and not (5 <= L <= 8):
                bad.append((w, 'med rule'))
            if diff == 'hard' and L < 9:
                bad.append((w, 'hard rule'))
            if diff == 'expert' and L < 12:
                bad.append((w, 'expert rule'))
        return bad

    allbad = []
    for diff, items in lib.items():
        allbad += check(diff, items)
    print('VERIFY rule violations:', len(allbad))
    for b in allbad[:20]:
        print('  ', b)

    # dedupe words across the whole library (a word should ideally appear once)
    seen = {}
    dups = []
    for diff, items in lib.items():
        for it in items:
            if it['w'] in seen:
                dups.append((it['w'], seen[it['w']], diff))
            else:
                seen[it['w']] = diff
    print('cross-difficulty dups:', len(dups))
    for d in dups[:20]:
        print('  ', d)

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// RuneLearn word library. Built from ECDICT (real English words).\n')
        f.write('window.RUNE_WORDBANK = ')
        json.dump(lib, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    print('WROTE', OUT)
