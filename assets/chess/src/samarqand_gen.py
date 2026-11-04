# Samarqand (Temuriylar) dona to'plami — asl dizayn, SVG generator
W = dict(fill='#F4EBD6', line='#2E2116', tq='#1F8FA8', tqd='#14667A', gold='#C9962E', eye='#2E2116', shade='#E2D3B1')
B = dict(fill='#2C303C', line='#0B0C10', tq='#3BB3C8', tqd='#21899C', gold='#D9A93C', eye='#EDE5D0', shade='#3A3F4E')

def base(c):
    return (f'<path d="M17 94 Q17 85.5 26 85 L74 85 Q83 85.5 83 94 Z" fill="{c["fill"]}"/>'
            f'<rect x="21" y="88.3" width="58" height="3" rx="1" fill="{c["tq"]}" stroke="none"/>')

def wrap(c, inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 1 93 93"><g stroke="{c["line"]}" stroke-width="2.3" '
            f'stroke-linejoin="round" stroke-linecap="round">{inner}{base(c)}</g></svg>')

def shaft_x(y, y0=85, y1=38, w0=16, w1=11.5):
    t = (y0 - y) / (y0 - y1); hw = w0 + (w1 - w0) * t
    return 50 - hw, 50 + hw

def pawn(c):  # sarboz — uchli dubulg'a
    return wrap(c, f'''
<path d="M33 85 Q37 69 43.5 62 L56.5 62 Q63 69 67 85 Z" fill="{c["fill"]}"/>
<rect x="38" y="58.5" width="24" height="5" rx="2.5" fill="{c["gold"]}"/>
<circle cx="50" cy="49" r="10.5" fill="{c["fill"]}"/>
<path d="M38.8 48 Q40 36 50 32 Q60 36 61.2 48 Z" fill="{c["tq"]}"/>
<path d="M47.8 33 L50 21 L52.2 33 Z" fill="{c["gold"]}"/>
<circle cx="45.5" cy="51" r="1.3" fill="{c["eye"]}" stroke="none"/><circle cx="54.5" cy="51" r="1.3" fill="{c["eye"]}" stroke="none"/>''')

def rook(c):  # minora
    bands = ''
    for ya, yb in ((70, 75), (52, 55)):
        a0, a1 = shaft_x(ya); b0, b1 = shaft_x(yb)
        bands += f'<path d="M{a0:.1f} {ya} L{a1:.1f} {ya} L{b1:.1f} {yb} L{b0:.1f} {yb} Z" fill="{c["tq"]}" stroke-width="1.4"/>'
    l0, r0 = shaft_x(85); l1, r1 = shaft_x(38)
    return wrap(c, f'''
<path d="M{l0:.1f} 85 L{l1:.1f} 38 L{r1:.1f} 38 L{r0:.1f} 85 Z" fill="{c["fill"]}"/>{bands}
<path d="M46 66 Q46 61 50 60 Q54 61 54 66 L54 70 L46 70 Z" fill="{c["line"]}" stroke="none" opacity="0.75"/>
<rect x="31" y="32" width="38" height="7" rx="2" fill="{c["gold"]}"/>
<rect x="41" y="21" width="18" height="11" fill="{c["fill"]}"/>
<path d="M47.5 31 L47.5 26 Q50 23 52.5 26 L52.5 31 Z" fill="{c["line"]}" stroke="none" opacity="0.75"/>
<path d="M39.5 22 Q40 11.5 50 8.5 Q60 11.5 60.5 22 Z" fill="{c["tq"]}"/>
<path d="M50 9 L50 3.5" /><circle cx="50" cy="3.5" r="1.6" fill="{c["gold"]}"/>''')

def knight(c):  # arg'umoq
    return wrap(c, f'''
<path d="M65 85 L35 85 Q36 71 45 62 Q39 59.5 33.5 63 Q27.5 66 25.5 60.5 Q24.5 55 31.5 49 Q39 41 43 31 Q46 24 52 21.5 L54.5 14.5 L58.5 21.5 Q71 26 73 45 Q74.5 63 65 85 Z" fill="{c["fill"]}"/>
<path d="M55 22.5 Q68.5 28 70.5 46 Q71.5 61 66 76 L61.5 76 Q66 60 64 45 Q62 31 55 25 Z" fill="{c["tq"]}" stroke-width="1.6"/>
<path d="M31 52 Q40 45 50 41" stroke="{c["gold"]}" stroke-width="2.6" fill="none"/>
<circle cx="50.5" cy="41" r="2.6" fill="{c["gold"]}" stroke-width="1.2"/>
<circle cx="45" cy="36" r="2.1" fill="{c["eye"]}" stroke="none"/>
<circle cx="29.5" cy="57.5" r="1.2" fill="{c["eye"]}" stroke="none"/>''')

def bishop(c):  # fil
    return wrap(c, f'''
<path d="M33 85 Q37 72 42 67 L58 67 Q63 72 67 85 Z" fill="{c["fill"]}"/>
<rect x="38" y="74" width="24" height="4" rx="2" fill="{c["gold"]}" stroke-width="1.4"/>
<ellipse cx="33.5" cy="47" rx="11.5" ry="15" fill="{c["fill"]}"/><ellipse cx="66.5" cy="47" rx="11.5" ry="15" fill="{c["fill"]}"/>
<ellipse cx="34.5" cy="47" rx="6.5" ry="9.5" fill="{c["tq"]}" stroke="none"/><ellipse cx="65.5" cy="47" rx="6.5" ry="9.5" fill="{c["tq"]}" stroke="none"/>
<path d="M38.5 41 Q38.5 28 50 26 Q61.5 28 61.5 41 Q61.5 51 56 56 L44 56 Q38.5 51 38.5 41 Z" fill="{c["fill"]}"/>
<path d="M45 54.5 Q44 66 47.5 72.5 Q50.5 77.5 55.5 74 Q51.5 70.5 52.5 64 L55 54.5 Z" fill="{c["fill"]}"/>
<path d="M44 55.5 Q40 58 38.5 63" stroke="{c["eye"]}" stroke-width="2.6" fill="none"/><path d="M56 55.5 Q60 58 61.5 63" stroke="{c["eye"]}" stroke-width="2.6" fill="none"/>
<circle cx="44.5" cy="41.5" r="1.8" fill="{c["eye"]}" stroke="none"/><circle cx="55.5" cy="41.5" r="1.8" fill="{c["eye"]}" stroke="none"/>
<path d="M42.5 28 Q42.5 19.5 50 16.5 Q57.5 19.5 57.5 28 Z" fill="{c["gold"]}"/>
<path d="M50 16.5 L50 12"/><circle cx="50" cy="11" r="1.5" fill="{c["gold"]}"/>''')

def queen(c):  # vazir — salla
    return wrap(c, f'''
<path d="M29 85 Q33 66 41 58 L59 58 Q67 66 71 85 Z" fill="{c["fill"]}"/>
<path d="M36 71 Q50 64 64 71 L66 76 Q50 69 34 76 Z" fill="{c["gold"]}" stroke-width="1.5"/>
<circle cx="50" cy="50" r="8.5" fill="{c["fill"]}"/>
<circle cx="46.8" cy="50.5" r="1.3" fill="{c["eye"]}" stroke="none"/><circle cx="53.2" cy="50.5" r="1.3" fill="{c["eye"]}" stroke="none"/>
<path d="M33 44 Q31 29 50 23 Q69 29 67 44 Q59 48.5 50 47.5 Q41 48.5 33 44 Z" fill="{c["fill"]}"/>
<path d="M36 40 Q50 31 64 40" fill="none" stroke-width="1.6"/><path d="M38 33.5 Q50 27 62 33.5" fill="none" stroke-width="1.6"/>
<circle cx="50" cy="38.5" r="3.4" fill="{c["gold"]}" stroke-width="1.4"/>
<path d="M51 35.5 Q55.5 22 63 15 Q58.5 24.5 53.5 36 Z" fill="{c["tq"]}" stroke-width="1.4"/>''')

def king(c):  # shoh — Go'ri Amir qovurg'ali gumbazi
    return wrap(c, f'''
<path d="M31 85 Q35 64 40 57 L60 57 Q65 64 69 85 Z" fill="{c["fill"]}"/>
<rect x="36" y="69" width="28" height="4.5" rx="2" fill="{c["gold"]}" stroke-width="1.4"/>
<rect x="37" y="46" width="26" height="11" fill="{c["fill"]}"/>
<path d="M42 56 L42 51.5 Q44 49 46 51.5 L46 56 Z M48 56 L48 51.5 Q50 49 52 51.5 L52 56 Z M54 56 L54 51.5 Q56 49 58 51.5 L58 56 Z" fill="{c["tq"]}" stroke="none"/>
<path d="M33.5 46.5 Q31 25 50 16.5 Q69 25 66.5 46.5 Z" fill="{c["tq"]}"/>
<path d="M41 46 Q38.5 29 50 17.5 M50 46 L50 17.5 M59 46 Q61.5 29 50 17.5 M36.5 45 Q34.5 32 50 17.5 M63.5 45 Q65.5 32 50 17.5" fill="none" stroke="{c["tqd"]}" stroke-width="1.5"/>
<path d="M33.5 46.5 Q31 25 50 16.5 Q69 25 66.5 46.5 Z" fill="none"/>
<path d="M50 16.5 L50 6"/><circle cx="50" cy="11.5" r="2" fill="{c["gold"]}"/><circle cx="50" cy="6" r="1.6" fill="{c["gold"]}"/>''')

import os
P = dict(P=pawn, R=rook, N=knight, B=bishop, Q=queen, K=king)
os.makedirs('svg', exist_ok=True)
for col, c in (('w', W), ('b', B)):
    for k, f in P.items():
        open(f'svg/{col}{k}.svg', 'w').write(f(c))
