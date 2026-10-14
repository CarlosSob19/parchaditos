"""Genera los íconos del sitio (pestaña del navegador, iPhone, Android) con el logo de web/assets/logo.svg.

Uso:  python tools/iconos.py
Logo blanco sobre un cuadrado rojo redondeado: se ve bien en pestañas claras y oscuras.
"""
import re
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.svgLib.path import parse_path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / "web/assets"
RED = (227, 18, 11, 255)
WHITE = (255, 255, 255, 255)

paths = re.findall(r'<path[^>]*\sd="([^"]+)"', (A / "logo.svg").read_text(encoding="utf-8"))
rec = RecordingPen()
for d in paths:
    parse_path(d, rec)
bp = BoundsPen(None)
rec.replay(bp)
x0, y0, x1, y1 = bp.bounds
lw, lh = x1 - x0, y1 - y0


class PolyPen(BasePen):
    """Convierte las curvas del logo en polígonos para dibujarlos con PIL."""
    def __init__(self, tf):
        super().__init__(None)
        self.tf, self.polys, self.cur = tf, [], []

    def _moveTo(self, p):
        self.cur = [self.tf(p)]

    def _lineTo(self, p):
        self.cur.append(self.tf(p))

    def _curveToOne(self, p1, p2, p3):
        p0 = self._getCurrentPoint()
        for i in range(1, 25):
            t = i / 24
            pt = tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * e for a, b, c, e in zip(p0, p1, p2, p3))
            self.cur.append(self.tf(pt))

    def _closePath(self):
        self.polys.append(self.cur)


def icon(size, logo_h=0.66, radius=0.22, bg=True):
    S = size * 4  # se dibuja grande y se reduce: bordes suaves
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius), fill=RED)
    k = S * logo_h / lh
    ox = (S - lw * k) / 2 - x0 * k
    oy = (S - lh * k) / 2 - y0 * k
    pen = PolyPen(lambda p: (p[0] * k + ox, p[1] * k + oy))
    rec.replay(pen)
    for poly in pen.polys:
        d.polygon(poly, fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


icon(32).save(A / "favicon-32.png")
icon(180, radius=0).save(A / "apple-touch-icon.png")  # iOS redondea solo
icon(192).save(A / "icon-192.png")
icon(512).save(A / "icon-512.png")
icon(512, logo_h=0.5, radius=0).save(A / "icon-512-maskable.png")  # Android recorta en círculo
icon(48).save(ROOT / "web/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# favicon.svg: el mismo logo en vector (nítido en cualquier pantalla)
k = 64 * 0.7 / lh
ox = (64 - lw * k) / 2 - x0 * k
oy = (64 - lh * k) / 2 - y0 * k
body = "".join(f'<path d="{d}"/>' for d in paths)
(A / "favicon.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#e3120b"/>'
    f'<g fill="#fff" transform="translate({ox:.3f} {oy:.3f}) scale({k:.6f})">{body}</g></svg>\n',
    encoding="utf-8",
)
print("ok íconos")
