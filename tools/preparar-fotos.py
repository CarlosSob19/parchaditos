"""
Prepara las fotos de Parchaditos para la web y la app.

1. Pon las fotos originales (como salen del celular) en la carpeta fotos/ con esta estructura:
     fotos/hero.jpg                      portada
     fotos/galeria/vip-1.jpg ...         vip-1, hookah, granizados, vip-2, noche, botellas
     fotos/productos/<id>.jpg            el id del producto en config.js (ej. aguardiente.jpg)
     fotos/categorias/<id>.png           PNG SIN FONDO: licores, vapes, blunts, granizados
   Sirven .jpg, .jpeg, .png y .webp. En iPhone: Ajustes > Cámara > Formatos > "Más compatible".
2. Ejecuta, parado en la carpeta PARCHADITOS:
     python tools/preparar-fotos.py
3. El script recorta, comprime, borra los datos GPS de cada foto, la copia a web/ (y a mobile/
   las que la app puede mostrar) y escribe las rutas en los dos config. Se puede correr las veces
   que quieras: solo reemplaza lo que encuentre.

Los videos de portada no se procesan aquí: cópialos a web/assets/video/hero.mp4 y hero-movil.mp4
y el script los conecta en HERO.
"""

import hashlib
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fotos"
WEB = ROOT / "web"
WEB_CONFIG = WEB / "js" / "config.js"
APP_IMAGES = ROOT / "mobile" / "assets" / "images"
APP_CONFIG = ROOT / "mobile" / "src" / "constants" / "config.ts"

EXTS = (".jpg", ".jpeg", ".png", ".webp")

# Galería: archivo -> (texto de la tarjeta en config, tamaño final)
GALLERY = {
    "vip-1": ("VIP 1", (1200, 1600)),
    "hookah": ("HUMO", (1200, 1200)),
    "granizados": ("FRÍO", (1200, 1200)),
    "vip-2": ("VIP 2", (2000, 1000)),
    "noche": ("NOCHE", (1200, 1600)),
    "botellas": ("SHOT", (1200, 1200)),
}

done, warnings = [], []


def find(folder: Path, name: str):
    for ext in EXTS:
        p = folder / f"{name}{ext}"
        if p.exists():
            return p
    return None


def open_clean(path: Path) -> Image.Image:
    # exif_transpose endereza la foto; al guardar sin exif se pierden GPS, modelo del celular y fecha.
    return ImageOps.exif_transpose(Image.open(path))


def save_jpg(src: Path, dest: Path, size):
    img = ImageOps.fit(open_clean(src).convert("RGB"), size, Image.LANCZOS, centering=(0.5, 0.5))
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
    done.append(f"{dest.relative_to(ROOT)}  ({size[0]}×{size[1]}, {dest.stat().st_size // 1024} KB)")


def save_cutout(src: Path, dest: Path, max_side=1000):
    img = open_clean(src)
    if img.mode != "RGBA" or img.getchannel("A").getextrema()[0] == 255:
        warnings.append(f"{src.name}: no tiene fondo transparente. Quítaselo con Photoroom o remove.bg y vuelve a correr el script.")
        return
    box = img.getchannel("A").getbbox()  # recorta el aire transparente alrededor del producto
    if box:
        img = img.crop(box)
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "PNG", optimize=True)
    done.append(f"{dest.relative_to(ROOT)}  ({img.width}×{img.height}, {dest.stat().st_size // 1024} KB)")


def ver(dest: Path) -> str:
    """Ruta web con huella del contenido: si la foto cambia, el navegador no usa la vieja en caché."""
    h = hashlib.md5(dest.read_bytes()).hexdigest()[:8]
    return f'"{dest.relative_to(WEB).as_posix()}?v={h}"'


def set_field(text: str, line_match: str, field: str, value: str, quote: str) -> tuple[str, bool]:
    """En la línea que contiene line_match, pone field: value (lo agrega si no existe)."""
    pattern = re.compile(rf"^(.*{re.escape(line_match)}.*)$", re.M)
    m = pattern.search(text)
    if not m:
        return text, False
    line = m.group(1)
    field_re = re.compile(rf"{field}: (null|{quote}[^{quote}]*{quote}|require\([^)]*\))")
    if field_re.search(line):
        new = field_re.sub(f"{field}: {value}", line, count=1)
    else:  # campo opcional que no está (DRINKS de la app): se agrega antes de la llave de cierre
        new = re.sub(r"\s*\},?\s*$", lambda e: f", {field}: {value} }}" + ("," if e.group(0).strip().endswith(",") else ""), line, count=1)
    return text[: m.start()] + new + text[m.end():], True


def main():
    if not SRC.exists():
        (SRC / "galeria").mkdir(parents=True)
        (SRC / "productos").mkdir()
        (SRC / "categorias").mkdir()
        print(f"Creé la carpeta {SRC.relative_to(ROOT)}/. Pon ahí las fotos (ver instrucciones arriba del script) y vuelve a correrlo.")
        return

    web_cfg = WEB_CONFIG.read_text(encoding="utf-8")
    app_cfg = APP_CONFIG.read_text(encoding="utf-8")

    # Portada
    hero = find(SRC, "hero")
    if hero:
        save_jpg(hero, WEB / "assets/galeria/hero.jpg", (1920, 1080))
        web_cfg, _ = set_field(web_cfg, "poster:", "poster", ver(WEB / "assets/galeria/hero.jpg"), '"')
    for key, file in (("video", "hero.mp4"), ("videoMovil", "hero-movil.mp4")):
        if (WEB / "assets/video" / file).exists():
            web_cfg, _ = set_field(web_cfg, f"  {key}:", key, ver(WEB / "assets/video" / file), '"')
            done.append(f"web/assets/video/{file}  (conectado en HERO.{key})")

    # Galería (web y app)
    for name, (texto, size) in GALLERY.items():
        src = find(SRC / "galeria", name)
        if not src:
            continue
        save_jpg(src, WEB / f"assets/galeria/{name}.jpg", size)
        web_cfg, _ = set_field(web_cfg, f'texto: "{texto}"', "img", ver(WEB / f"assets/galeria/{name}.jpg"), '"')
        save_jpg(src, APP_IMAGES / f"galeria/{name}.jpg", size)
        app_cfg, _ = set_field(app_cfg, f"texto: '{texto}'", "img", f"require('@/assets/images/galeria/{name}.jpg')", "'")

    # Productos: web si el id está en PRODUCTS, app si está en DRINKS
    for src in sorted((SRC / "productos").glob("*")):
        if src.suffix.lower() not in EXTS:
            continue
        pid = src.stem
        used = False
        if f'id: "{pid}"' in web_cfg:
            save_jpg(src, WEB / f"assets/productos/{pid}.jpg", (800, 600))
            web_cfg, used = set_field(web_cfg, f'id: "{pid}"', "img", ver(WEB / f"assets/productos/{pid}.jpg"), '"')
        if f"id: '{pid}'" in app_cfg:
            save_jpg(src, APP_IMAGES / f"productos/{pid}.jpg", (800, 600))
            app_cfg, ok = set_field(app_cfg, f"id: '{pid}'", "img", f"require('@/assets/images/productos/{pid}.jpg')", "'")
            used = used or ok
        if not used:
            warnings.append(f"productos/{src.name}: no hay ningún producto con id \"{pid}\" en config.js ni en la app.")

    # Categorías (solo web)
    for src in sorted((SRC / "categorias").glob("*")):
        if src.suffix.lower() not in EXTS:
            continue
        cid = src.stem
        if f'{{ id: "{cid}", nombre:' not in web_cfg:
            warnings.append(f"categorias/{src.name}: no hay categoría con id \"{cid}\" (licores, vapes, blunts, granizados).")
            continue
        before = len(done)
        save_cutout(src, WEB / f"assets/categorias/{cid}.png")
        if len(done) > before:
            web_cfg, _ = set_field(web_cfg, f'{{ id: "{cid}", nombre:', "img", ver(WEB / f"assets/categorias/{cid}.png"), '"')

    for path, text in ((WEB_CONFIG, web_cfg), (APP_CONFIG, app_cfg)):
        eol = "\r\n" if b"\r\n" in path.read_bytes() else "\n"  # respeta los saltos de línea del archivo
        path.write_text(text, encoding="utf-8", newline=eol)

    print(f"Listas {len(done)}:" if done else "No encontré fotos en fotos/.")
    for d in done:
        print("  ✓", d)
    for w in warnings:
        print("  ⚠", w)
    if done:
        print("\nRevisa en local (README, sección 4) y vuelve a publicar.")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
