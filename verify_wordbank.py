# -*- coding: utf-8 -*-
"""Final verification of the packaged wordbank (js/wordbank.js) against all difficulty rules."""
import json, re, sys

PATH = r'C:\Users\Grape\Documents\DSH\runelearn\js\wordbank.js'
data = open(PATH, encoding='utf-8').read()
lib = json.loads(data[data.index('=') + 1:].strip().rstrip(';').strip())

problems = []

def vw(w): return ('v' in w) or ('w' in w)
def hasVW(w): return ('v' in w) and ('w' in w)

# 规则定义
RULES = {
    'easy':   lambda w: len(w) <= 4 and not vw(w) and len(w) >= 2,
    'med':    lambda w: 5 <= len(w) <= 8,
    'hard':   lambda w: len(w) >= 9,
    'expert': lambda w: len(w) >= 12,
}

required = ['easy', 'med', 'hard', 'expert']
for d in required:
    if d not in lib:
        problems.append('缺失难度: ' + d)
        continue
    items = lib[d]
    if len(items) < 300:
        problems.append('%s 单词数不足: %d (需>=300)' % (d, len(items)))
    for it in items:
        w = it.get('w', '')
        if not RULES[d](w):
            problems.append('%s 规则违规: %r (len=%d v/w=%s)' % (d, w, len(w), vw(w)))
        # 数据完整性
        if not isinstance(w, str) or not re.fullmatch(r'[a-z]+', w):
            problems.append('%s 词非法: %r' % (d, w))
        if not it.get('ph'):
            problems.append('%s 缺音标: %s' % (d, w))
        if not it.get('senses') or not isinstance(it['senses'], list) or not it['senses']:
            problems.append('%s 缺释义: %s' % (d, w))
        else:
            for s in it['senses']:
                if not s.get('pos') or not s.get('def'):
                    problems.append('%s 释义字段缺失: %s %r' % (d, w, s))

# 跨难度重复
seen = {}
for d in required:
    for it in lib.get(d, []):
        w = it['w']
        if w in seen and seen[w] != d:
            problems.append('跨难度重复词: %s (%s 与 %s)' % (w, seen[w], d))
        seen[w] = d

# 简单难度不得出现 v/w
simple_vw = [it['w'] for it in lib.get('easy', []) if vw(it['w'])]
if simple_vw:
    problems.append('简易难度出现 v/w: %r' % simple_vw[:10])

# 专家尽量同时出现 V 和 W（统计）
ex_vw = sum(1 for it in lib.get('expert', []) if hasVW(it['w']))
ex_any = sum(1 for it in lib.get('expert', []) if vw(it['w']))

print('=== 校验统计 ===')
for d in required:
    items = lib.get(d, [])
    print('%-7s n=%d' % (d, len(items)))
print('专家含V和W:%d  专家含V或W:%d' % (ex_vw, ex_any))
print()
print('=== 规则问题 ===')
if problems:
    for p in problems[:60]:
        print('  [问题]', p)
    print('共 %d 个问题' % len(problems))
    sys.exit(1)
else:
    print('全部通过：每个难度>=300、长度/字母规则合规、无跨难度重复、数据完整。')
