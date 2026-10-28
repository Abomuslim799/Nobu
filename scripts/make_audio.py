"""
make_audio.py — so'zlar uchun ovoz fayllarini yasaydi (GitHub Actions'da, har push'da).

    en-GB-RyanNeural  — London erkak ovozi: so'z (-w) va misol gap (-s)
    uz-UZ-SardorNeural — o'zbekcha erkak ovozi: tarjima (-uz)

Natija: assets/audio/<id>-w.mp3 ... va src/data/audio.ts (require xaritasi).
Biror fayl yasalmasa — o'sha qism telefonning o'z ovoziga tushadi, ilova buzilmaydi.
"""

import asyncio
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


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(4)
    jobs = []
    for w in words():
        for part, text, voice in (("w", w["word"], EN), ("s", w["example"], EN), ("uz", w["translation"], UZ)):
            if text:
                jobs.append((w["id"], part, make(text, voice, OUT / f"{w['id']}-{part}.mp3", sem)))
    results = await asyncio.gather(*(j[2] for j in jobs))

    table: dict[str, list[str]] = {}
    for (wid, part, _), ok in zip(jobs, results):
        if ok:
            table.setdefault(wid, []).append(f"{part}: require('../../assets/audio/{wid}-{part}.mp3')")
    lines = [f"  '{wid}': {{ {', '.join(parts)} }}," for wid, parts in table.items()]
    MAP.write_text(
        "// Avtomatik yasalgan (scripts/make_audio.py) — qo'lda o'zgartirmang.\n"
        "import type { AudioMap } from '@/lib/speak';\n\n"
        "export const AUDIO: AudioMap = {\n" + "\n".join(lines) + "\n};\n",
        encoding="utf-8",
    )
    print(f"{sum(results)}/{len(jobs)} ta ovoz tayyor")


asyncio.run(main())
