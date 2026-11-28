"""
make_guides.py — content/english/guide-src/*.md → content/english/guide/all.json (ilova o'qiydi).
  Format:
    # Sarlavha
    meta: EGU 1–4 · A2 → C1          (ixtiyoriy, bitta qator)
    ## Bo'lim                         (bo'limlar: 🟢 Asos, 🟡 O'rta, 🔴 Advanced, ⚡ Hiylalar, ❌ Xatolar, ✅ Tekshir …)
    oddiy paragraf
    - ro'yxat bandi
    | jadval | qatori |   (2-qator |---| bo'lsa — sarlavha)
    > 💡 maslahat / > ⚠️ ogohlantirish  (quote blok)
    EN: inglizcha misol || o'zbekcha izoh   (misol bloki; izoh ixtiyoriy)
  Inline: **qalin**, *kursiv*.
  Ishga tushirish: python3 scripts/make_guides.py   (xato bo'lsa — fayl va qator bilan to'xtaydi)
"""
import json, os, re, sys

SRC = os.path.join(os.path.dirname(__file__), '..', 'content', 'english', 'guide-src')
OUT = os.path.join(os.path.dirname(__file__), '..', 'content', 'english', 'guide', 'all.json')


def fail(f, n, msg):
    sys.exit(f'{f}:{n}: {msg}')


def parse(path):
    f = os.path.basename(path)
    gid = f[:-3]
    lines = open(path, encoding='utf-8').read().split('\n')
    g = {'id': gid, 'title': '', 'meta': '', 'sections': []}
    sec = None
    para = []
    table = None

    def flush_para():
        nonlocal para
        if para:
            sec['blocks'].append({'t': 'p', 'x': ' '.join(para)})
            para = []

    def flush_table():
        nonlocal table
        if table:
            sec['blocks'].append({'t': 'table', 'head': table['head'], 'rows': table['rows']})
            table = None

    for n, raw in enumerate(lines, 1):
        line = raw.rstrip()
        if line.startswith('# '):
            g['title'] = line[2:].strip(); continue
        if line.startswith('meta:'):
            g['meta'] = line[5:].strip(); continue
        if line.startswith('## '):
            if sec is not None:
                flush_para(); flush_table()
            sec = {'title': line[3:].strip(), 'blocks': []}
            g['sections'].append(sec); continue
        if sec is None:
            if line.strip():
                fail(f, n, "bo'limdan (##) oldin matn")
            continue
        if line.startswith('|'):
            flush_para()
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            if all(re.fullmatch(r':?-{2,}:?', c) for c in cells):
                if not table or table['head'] or len(table['rows']) != 1:
                    fail(f, n, 'jadval ajratgichi noto\'g\'ri joyda')
                table['head'] = table['rows'].pop(); continue
            if table is None:
                table = {'head': None, 'rows': []}
            width = len(table['head'] or (table['rows'][0] if table['rows'] else cells))
            if len(cells) != width:
                fail(f, n, f'jadval ustunlari soni {len(cells)} ≠ {width}')
            table['rows'].append(cells); continue
        flush_table()
        if not line.strip():
            flush_para(); continue
        if line.startswith('- '):
            flush_para()
            last = sec['blocks'][-1] if sec['blocks'] else None
            if not last or last['t'] != 'list':
                last = {'t': 'list', 'items': []}; sec['blocks'].append(last)
            last['items'].append(line[2:].strip()); continue
        if line.startswith('> '):
            flush_para()
            x = line[2:].strip()
            kind = 'warn' if x.startswith(('⚠', '❌')) else 'tip'
            sec['blocks'].append({'t': kind, 'x': x}); continue
        if line.startswith('EN:'):
            flush_para()
            en, _, uz = line[3:].partition('||')
            sec['blocks'].append({'t': 'ex', 'en': en.strip(), 'uz': uz.strip()}); continue
        para.append(line.strip())
    if sec is not None:
        flush_para(); flush_table()
    if not g['title']:
        fail(f, 1, "sarlavha (# …) yo'q")
    if not g['sections']:
        fail(f, 1, "bo'lim yo'q")
    for s in g['sections']:
        if not s['blocks']:
            fail(f, 1, f"bo'sh bo'lim: {s['title']}")
        for b in s['blocks']:
            for k in ('x', 'en'):
                v = b.get(k, '')
                if v.count('**') % 2:
                    fail(f, 1, f"juft bo'lmagan ** : {v[:50]}")
    return g


def main():
    out = {}
    for f in sorted(os.listdir(SRC)):
        if f.endswith('.md'):
            g = parse(os.path.join(SRC, f))
            out[g['id']] = g
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'{len(out)} ta qo\'llanma → {os.path.relpath(OUT)}')


if __name__ == '__main__':
    main()
