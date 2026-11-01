"""
make_audio.py — so'zlar uchun ovoz fayllarini yasaydi (GitHub Actions'da, har push'da).

    en-GB-RyanNeural  — London erkak ovozi: so'z (-w) va misol gap (-s)
    uz-UZ-SardorNeural — o'zbekcha erkak ovozi: tarjima (-uz)

Natija: assets/audio/<id>-w.mp3 ... va src/features/english/data/audio.ts.
Biror fayl yasalmasa — o'sha qism telefonning o'z ovoziga tushadi, ilova buzilmaydi.
"""

import asyncio
import json
import os
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "audio"
MAP = ROOT / "src" / "features" / "english" / "data" / "audio.ts"
EN, UZ = "en-GB-RyanNeural", "uz-UZ-SardorNeural"

FIELD = r"""{name}:\s*(['"])((?:\\.|(?!\1).)*)\1"""


def field(block: str, name: str) -> str | None:
    m = re.search(FIELD.format(name=name), block)
    return m.group(2).replace("\\'", "'").replace('\\"', '"') if m else None


def words() -> list[dict]:
    src = (ROOT / "src" / "features" / "english" / "data" / "words.ts").read_text(encoding="utf-8")
    body = src.split("export const WORDS", 1)[1]
    out = []
    for block in body.split("{ id:")[1:]:
        block = "id:" + block
        out.append({k: field(block, k) for k in ("id", "word", "translation", "example")})
    return out


# Ovoz uchun matn: formulalar so'z bilan, o'zbekcha tutuq belgilari to'g'ri (oʻ, gʻ — U+02BB), yolg'iz harflar nomi bilan.
W = r"[\wʻʼ'’]"
SAY_FIX = [
    (re.compile(r"km/soat"), "kilometr soatiga"),
    (re.compile(r"m/s²"), "metr sekund kvadratga"),
    (re.compile(r"m/s"), "metr sekundiga"),
    (re.compile(r"Δ\s*"), "delta "),
    (re.compile(r"²"), " kvadrat"), (re.compile(r"³"), " kub"), (re.compile(r"√"), " ildiz "),
    (re.compile(r"π"), " pi "), (re.compile(r"θ"), " teta "), (re.compile(r"α"), " alfa "),
    (re.compile(r"′"), " shtrix"), (re.compile(r"[·×]"), " karra "), (re.compile(r"∫"), " integral "),
    (re.compile(r"Σ"), " yigʻindi "), (re.compile(r"∞"), " cheksizlik "), (re.compile(r"≈"), " taxminan "),
    (re.compile(r"→"), ", "), (re.compile(r"−"), " minus "), (re.compile(r"\s\+\s"), " plyus "),
    (re.compile(r"\s=\s|="), " teng "), (re.compile(r"\s<\s"), " kichik "), (re.compile(r"\s>\s"), " katta "),
    (re.compile(r"°"), " gradus"), (re.compile(r"%"), " foiz"), (re.compile(r"₀"), " nol"), (re.compile(r"ₓ"), " iks"),
    (re.compile(r"(?<=\w)\s*/\s*(?=\w)"), " boʻlinsin "),
    (re.compile(r"±"), " plyus-minus "),
    (re.compile(r"(?<=\d)x(?![\wʻʼ])"), " iks"), (re.compile(r"(?<=\d)y(?![\wʻʼ])"), " igrek"),
    (re.compile(r"[()\[\]{}|]"), " "),
    (re.compile(r"\blim\b"), "limit"),
]
LETTERS = {"x": "iks", "y": "igrek", "f": "ef", "g": "ge", "h": "ha", "k": "ka", "t": "te", "v": "ve", "L": "el", "F": "ef", "T": "te", "H": "ha"}
LETTER_RX = re.compile(r"(?<![\wʻʼ'’])([xyfghktvLFTH])(?![\wʻʼ'’])")
APOS = [
    (re.compile(r"(?<=[oOgG])['’`‘]"), "ʻ"),                      # oʻ, gʻ
    (re.compile(r"(?<=\w)['’](?=\w)"), "ʼ"),                      # tutuq: maʼno, taʼlim
]


def say_text(t: str) -> str:
    for rx, rep in APOS:                                        # avval tutuq — keyin harflar
        t = rx.sub(rep, t)
    for rx, rep in SAY_FIX:
        t = rx.sub(rep, t)
    t = LETTER_RX.sub(lambda m: LETTERS[m.group(1)], t)
    t = re.sub(r"(?<![\wʻʼ])delta(?![\wʻʼ])", "del-ta", t, flags=re.I)
    return re.sub(r"\s+", " ", t).strip()


# O'z-o'zini tekshirish: o'zbekcha so'zlar buzilmasin
assert say_text("yaxshi xona yo'l") == "yaxshi xona yoʻl", say_text("yaxshi xona yo'l")
assert say_text("Δy bo'linsin x") == "del-ta igrek boʻlinsin iks", say_text("Δy bo'linsin x")
assert say_text("ma'no") == "maʼno"


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
    for path in sorted((ROOT / "content" / "english" / "units").glob("*.json")):
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
    # Science doskasi: Nobu ovozi (o'zbekcha, Sardor) — sci-<dars>-b<n>.mp3
    boards = []
    for path in sorted((ROOT / "content" / "science" / "boards").glob("*.json")):
        b = json.loads(path.read_text(encoding="utf-8"))
        boards += [(f"sci-{b['id']}", f"b{i}", say_text(st["say"]), UZ) for i, st in enumerate(b["steps"])]
    # Science darslari matni (scripts/dump_say.ts → SAY_JSON)
    lessons = []
    sj = os.environ.get("SAY_JSON")
    if sj and Path(sj).exists():
        lessons = [(x["id"], x["part"], say_text(x["text"]), UZ) for x in json.loads(Path(sj).read_text(encoding="utf-8")) if x["part"].startswith("s")]
    for wid, part, text, voice in texts + unit_texts() + boards + lessons:
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
        "import type { AudioMap } from '@/features/english/speak';\n\n"
        "export const AUDIO: AudioMap = {\n" + "\n".join(lines) + "\n};\n",
        encoding="utf-8",
    )
    print(f"{sum(results)}/{len(jobs)} ta ovoz tayyor")


asyncio.run(main())
