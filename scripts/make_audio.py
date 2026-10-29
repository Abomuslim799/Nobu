"""
make_audio.py — so'zlar uchun ovoz fayllarini yasaydi (GitHub Actions'da, har push'da).

    en-GB-RyanNeural  — London erkak ovozi: so'z (-w) va misol gap (-s)
    uz-UZ-SardorNeural — o'zbekcha erkak ovozi: tarjima (-uz)

Natija: assets/audio/<id>-w.mp3 ... va src/data/audio.ts (require xaritasi).
Biror fayl yasalmasa — o'sha qism telefonning o'z ovoziga tushadi, ilova buzilmaydi.
"""

import asyncio
import json
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "audio"
MAP = ROOT / "src" / "data" / "audio.ts"
EN, UZ = "en-GB-RyanNeural", "uz-UZ-SardorNeural"

FIELD = r"""{name}:\s*(['"])((?:\\.|(?!\1).)*)\1"""


def field(block: str, name: str) -> str | None:
    m = re.search(FIELD.format(name=name), block)
    return m.group(2).replace("\\'", "'").replace('\\"', '"') if m else None


def words() -> list[dict]:
    src = (ROOT / "src" / "data" / "words.ts").read_text(encoding="utf-8")
    body = src.split("export const WORDS", 1)[1]
    out = []
    for block in body.split("{ id:")[1:]:
        block = "id:" + block
        out.append({k: field(block, k) for k in ("id", "word", "translation", "example")})
    return out


async def make(text: str, voice: str, path: Path, sem: asyncio.Semaphore) -> bool:
    if path.exists() and path.stat().st_size > 0:
        return True
    async with sem:
        for _ in range(3):
            try:
                await edge_tts.Communicate(text, voice).save(str(path))
                return path.stat().st_size > 0
            except Exception as exc:  # tarmoq xatosi — qayta urinamiz
                print("retry", path.name, exc)
                await asyncio.sleep(2)
    return False


def unit_texts() -> list[tuple[str, str, str, str]]:
    """Unitlardan: (id, part, matn, ovoz). So'zlar ham words() bilan bir xil shaklda."""
    out = []
    for path in sorted((ROOT / "src" / "data" / "units").glob("*.json")):
        u = json.loads(path.read_text(encoding="utf-8"))
        uid = u["id"]
        for w in u["vocab"] + u["collocations"]:
            out += [(w["id"], "w", w["word"], EN), (w["id"], "s", w["example"], EN), (w["id"], "uz", w["translation"], UZ)]
        out.append((uid, "q", u["hook"]["quote"], EN))
        out += [(uid, f"p{i}", t, EN) for i, t in enumerate(u["reading"])]
        out += [(uid, f"d{i}", d["text"], EN) for i, d in enumerate(u["dictation"])]
        out += [(uid, f"sh{i}", t, EN) for i, t in enumerate(u["shadowing"])]
    return out


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(4)
    jobs = []
    texts = [(w["id"], part, text, voice) for w in words()
             for part, text, voice in (("w", w["word"], EN), ("s", w["example"], EN), ("uz", w["translation"], UZ))]
    for wid, part, text, voice in texts + unit_texts():
        if text:
            jobs.append((wid, part, make(text, voice, OUT / f"{wid}-{part}.mp3", sem)))
    results = await asyncio.gather(*(j[2] for j in jobs))

    # Fayllar ilova paketiga qo'shilmaydi (update hajmi juda katta bo'lib ketardi):
    # ular GitHub Pages'ga joylanadi (site.yml), ilova esa URL orqali chaladi.
    table: dict[str, list[str]] = {}
    for (wid, part, _), ok in zip(jobs, results):
        if ok:
            table.setdefault(wid, []).append(f"'{part}'")
    lines = [f"  '{wid}': [{', '.join(parts)}]," for wid, parts in table.items()]
    MAP.write_text(
        "// Avtomatik yasalgan (scripts/make_audio.py) — qo'lda o'zgartirmang.\n"
        "import type { AudioMap } from '@/lib/speak';\n\n"
        "export const AUDIO: AudioMap = {\n" + "\n".join(lines) + "\n};\n",
        encoding="utf-8",
    )
    print(f"{sum(results)}/{len(jobs)} ta ovoz tayyor")


asyncio.run(main())
