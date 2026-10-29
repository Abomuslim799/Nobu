"""
make_puzzles.py — Lichess ochiq bazasidan (CC0, database.lichess.org) shaxmat masalalarini tanlaydi.

Reyting oralig'i 500–2300, har 100 lik "pog'ona"dan PER_BAND tadan — faqat mashhur va
ko'p o'ynalgan (ishonchli) masalalar. Natija: src/data/puzzles.json
  [id, fen, moves, rating, themes]
  fen   — raqib yurishidan OLDINGI holat; moves[0] — raqib yurishi, keyingilari — yechim (UCI)
Bir martalik ishga tushiriladi (GitHub Actions → puzzles workflow).
"""

import csv
import io
import json
import urllib.request
from pathlib import Path

import zstandard

URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst"
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "puzzles.json"
PER_BAND = 90
LO, HI = 500, 2300

bands: dict[int, list] = {b: [] for b in range(LO, HI, 100)}
need = len(bands) * PER_BAND
got = 0
with urllib.request.urlopen(URL) as resp:
    reader = csv.DictReader(io.TextIOWrapper(zstandard.ZstdDecompressor().stream_reader(resp), encoding="utf-8"))
    for row in reader:
        r = int(row["Rating"])
        b = r // 100 * 100
        if b not in bands or len(bands[b]) >= PER_BAND:
            continue
        if int(row["Popularity"]) < 85 or int(row["NbPlays"]) < 1000 or int(row["RatingDeviation"]) > 85:
            continue
        moves = row["Moves"].split()
        if len(moves) > 7:                       # juda uzun variantlar telefonda noqulay
            continue
        bands[b].append([row["PuzzleId"], row["FEN"], row["Moves"], r, row["Themes"]])
        got += 1
        if got >= need:
            break

rows = [p for b in sorted(bands) for p in bands[b]]
OUT.write_text(json.dumps(rows, separators=(",", ":")), encoding="utf-8")
print(f"{len(rows)} ta masala yozildi")
