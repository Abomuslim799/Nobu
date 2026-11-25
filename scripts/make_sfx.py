"""sfx.py — komiks effekt ovozlari: kod bilan sintez qilinadi (litsenziya muammosi yo'q). 22050 Hz, mono, 16-bit WAV."""
import sys, wave, numpy as np
SR = 22050
out = sys.argv[1]
rng = np.random.default_rng(7)

def env(n, a=0.005, d=1.0):
    t = np.linspace(0, 1, n)
    att = np.clip(t / max(a, 1e-4), 0, 1)
    return att * np.exp(-t * 6 / d)

def lowpass(x, k):
    c = np.ones(k) / k
    return np.convolve(x, c, mode='same')

def save(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    with wave.open(f'{out}/{name}.wav', 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

# BOOM — past chastotali shovqin + pasayib boruvchi ton
n = int(SR * 1.4); t = np.arange(n) / SR
boom = lowpass(rng.standard_normal(n), 40) * env(n, 0.01, 0.8) * 3 + np.sin(2 * np.pi * (60 - 30 * t) * t) * env(n, 0.005, 0.6)
save('boom', boom)

# WHOOSH — shovqin, filtri ochilib-yopiladi
n = int(SR * 0.9); t = np.linspace(0, 1, n)
noise = rng.standard_normal(n)
wh = np.zeros(n)
for i, k in enumerate([60, 30, 15, 8, 15, 30]):
    seg = slice(i * n // 6, (i + 1) * n // 6)
    wh[seg] = lowpass(noise, k)[seg]
save('whoosh', wh * np.sin(np.pi * t) ** 2)

# POP — qisqa yuqori ton (pufakcha, kadr almashishi)
n = int(SR * 0.12); t = np.arange(n) / SR
save('pop', np.sin(2 * np.pi * (900 - 2500 * t) * t) * env(n, 0.002, 0.25))

# DING — tushundim / to'g'ri
n = int(SR * 0.8); t = np.arange(n) / SR
save('ding', (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 2637 * t)) * env(n, 0.002, 0.7))

# BONK — kulgili zarba
n = int(SR * 0.35); t = np.arange(n) / SR
save('bonk', np.sin(2 * np.pi * (420 * np.exp(-t * 8)) * t) * env(n, 0.002, 0.4))
print('ok')
