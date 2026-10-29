"""
check_units.py — unit JSON fayllarini tekshiradi (sonlar, javoblar, bo'shliqlar).
Ishlatish: python scripts/check_units.py
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []
ids = set()


def gap_found(w: dict) -> bool:
    """quiz.ts dagi makeGap bilan bir xil qoida: so'z misol gapda topiladimi."""
    if w.get("cloze"):
        return re.search(re.escape(w["cloze"]), w["example"], re.I) is not None
    word = re.sub(r"\s*\(.*?\)", "", re.sub(r"^to ", "", w["word"])).strip()
    parts = [re.escape(re.sub(r"[ey]$", "", p) if len(p) > 3 else p) + r"\w*" for p in word.split()]
    return re.search(r"\s+".join(parts), w["example"], re.I) is not None


for path in sorted((ROOT / "src" / "data" / "units").glob("*.json")):
    u = json.loads(path.read_text(encoding="utf-8"))
    n = path.name
    def err(msg):
        errors.append(f"{n}: {msg}")
    if len(u["vocab"]) != 15: err(f"vocab {len(u['vocab'])} ta (15 kerak)")
    if len(u["collocations"]) != 5: err(f"collocations {len(u['collocations'])} ta (5 kerak)")
    for w in u["vocab"] + u["collocations"]:
        if w["id"] in ids: err(f"takror id {w['id']}")
        ids.add(w["id"])
        if not w["id"].startswith(u["id"] + "-"): err(f"id prefiks {w['id']}")
        if not gap_found(w): err(f"so'z misolda topilmadi: {w['word']!r} | {w['example']}")
    for q in u["questions"]:
        if q["answer"] not in q["options"]: err(f"javob variantlarda yo'q: {q['q']}")
    for q in u["grammar"]["exercises"]:
        if q["answer"] not in q["options"]: err(f"grammatika javobi yo'q: {q['q']}")
        if len(set(q["options"])) != len(q["options"]): err(f"takror variant: {q['q']}")
    for d in u["dictation"]:
        if not re.search(rf"\b{re.escape(d['gap'])}\b", d["text"]): err(f"dictation gap topilmadi: {d}")
    if u["id"] != "fg1" and len(u["hook"]["quote"].split()) > 14: err("iqtibos 14 so'zdan uzun")

print("\n".join(errors) or f"OK — {len(ids)} so'z")
sys.exit(1 if errors else 0)
