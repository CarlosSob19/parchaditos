"""Convierte una imagen PNG del logo en un SVG vectorial (web/assets/logo.svg).

Uso:  python tools/trazar-logo.py ruta/al/logo.png
Después corre  python tools/fuente-signo.py  para regenerar el signo de pregunta.
Necesita:  pip install potracer pillow numpy
"""
import sys
from pathlib import Path

import numpy as np
import potrace
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
src = Path(sys.argv[1])
out = ROOT / "web/assets/logo.svg"

img = Image.open(src).convert("RGBA")
bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
gray = np.asarray(Image.alpha_composite(bg, img).convert("L"), dtype=np.float32)
# Se traza al doble de tamaño para que las curvas queden suaves.
big = Image.fromarray(gray.astype(np.uint8)).resize((img.width * 2, img.height * 2), Image.LANCZOS)
# potracer toma como "tinta" los valores falsos: se invierte para trazar la figura oscura.
mask = np.asarray(big) >= 128

curves = potrace.Bitmap(mask).trace(turdsize=20, alphamax=1.0, opticurve=True, opttolerance=0.2)
k = 0.5  # vuelve a la escala original
f = lambda p: f"{p.x * k:.2f} {p.y * k:.2f}"
d = []
for c in curves:
    seg = [f"M{f(c.start_point)}"]
    for s in c.segments:
        seg.append(f"L{f(s.c)}L{f(s.end_point)}" if s.is_corner else f"C{f(s.c1)} {f(s.c2)} {f(s.end_point)}")
    d.append("".join(seg) + "Z")

out.write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {img.width} {img.height}" fill-rule="evenodd">\n'
    + "".join(f'  <path fill="currentColor" d="{x}"/>\n' for x in d)
    + "</svg>\n",
    encoding="utf-8",
)
print("ok", out, len(d), "contornos")
