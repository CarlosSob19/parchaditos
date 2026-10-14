"""
Convierte la documentación (.md) a PDF con el estilo de Parchaditos.

Ejecuta, parado en la carpeta PARCHADITOS:
    python tools/docs-a-pdf.py

Crea los PDF en la carpeta documentos/. Vuelve a correrlo cada vez que cambie un .md.
Necesita: pip install markdown, y Microsoft Edge (viene con Windows) o Google Chrome.
"""

import html
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "documentos"
DOCS = [
    ("FINALIZACION-Y-HOSTING.md", "Parchaditos - Finalizacion, hosting y Loyverse.pdf"),
    ("GUIA-FOTOS-Y-3D.md", "Parchaditos - Guia de fotos y 3D.pdf"),
    ("README.md", "Parchaditos - Guia tecnica.pdf"),
]
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

CSS = """
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1d1414; margin: 0; }
.cover { border-bottom: 3px solid #e3120b; padding-bottom: 14px; margin-bottom: 22px; }
.cover .brand { font-family: "Arial Black", "Segoe UI Black", sans-serif; font-size: 11pt; letter-spacing: .08em; color: #e3120b; }
.cover .date { color: #7a6a66; font-size: 9pt; margin-top: 4px; }
h1 { font-family: "Arial Black", "Segoe UI Black", sans-serif; font-size: 24pt; line-height: 1.1; margin: 6px 0 4px; letter-spacing: -.01em; }
h2 { font-size: 15pt; color: #b00e08; margin: 26px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ecdcd8; page-break-after: avoid; }
h3 { font-size: 12pt; margin: 18px 0 6px; page-break-after: avoid; }
p { margin: 0 0 8px; }
a { color: #b00e08; text-decoration: none; }
strong { color: #000; }
ul, ol { margin: 0 0 10px; padding-left: 20px; }
li { margin: 2px 0; }
li.task { list-style: none; margin-left: -18px; }
.box { display: inline-block; width: 11px; height: 11px; border: 1.4px solid #b00e08; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
.box.on { background: #b00e08; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 9.2pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th { background: #2a1210; color: #fff; text-align: left; font-weight: 600; padding: 6px 7px; }
td { padding: 5px 7px; border-bottom: 1px solid #ecdcd8; vertical-align: top; }
tr:nth-child(even) td { background: #fbf6f5; }
code { font-family: Consolas, "Courier New", monospace; font-size: 8.8pt; background: #f4ecea; padding: 1px 4px; border-radius: 3px; }
pre { background: #1d1414; color: #f7ece8; padding: 10px 12px; border-radius: 6px; font-size: 8.6pt; line-height: 1.45; white-space: pre-wrap; word-break: break-word; page-break-inside: avoid; }
pre code { background: none; color: inherit; padding: 0; }
th code { background: rgba(255,255,255,.16); color: #fff; }
blockquote { margin: 10px 0; padding: 8px 12px; border-left: 4px solid #e3120b; background: #fdf1f0; }
blockquote p { margin: 0; }
hr { border: 0; border-top: 1px solid #ecdcd8; margin: 22px 0; }
"""


def to_html(md_text: str, title: str) -> str:
    # Los enlaces entre documentos apuntan al PDF correspondiente.
    for src, pdf in DOCS:
        md_text = md_text.replace(f"]({src})", f"]({pdf.replace(' ', '%20')})")
    body = markdown.markdown(md_text, extensions=["tables", "fenced_code", "sane_lists"])
    # Casillas "- [ ]" y "- [x]".
    body = re.sub(r"<li>\[ \]\s*", '<li class="task"><span class="box"></span>', body)
    body = re.sub(r"<li>\[[xX]\]\s*", '<li class="task"><span class="box on"></span>', body)
    hoy = date.today().strftime("%d/%m/%Y")
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<style>{CSS}</style></head><body>
<div class="cover"><div class="brand">PARCHADITOS</div><div class="date">Actualizado el {hoy}</div></div>
{body}</body></html>"""


def main():
    browser = next((b for b in BROWSERS if Path(b).exists()), None) or shutil.which("msedge") or shutil.which("chrome")
    if not browser:
        sys.exit("No encontré Edge ni Chrome para generar el PDF.")
    OUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for src, pdf in DOCS:
            md_path = ROOT / src
            if not md_path.exists():
                print(f"  ⚠ No existe {src}")
                continue
            text = md_path.read_text(encoding="utf-8")
            title = re.search(r"^# (.+)$", text, re.M)
            page = Path(tmp) / (md_path.stem + ".html")
            page.write_text(to_html(text, title.group(1) if title else src), encoding="utf-8")
            dest = OUT / pdf
            subprocess.run(
                [browser, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--user-data-dir={tmp}\\perfil",
                 f"--print-to-pdf={dest}", page.as_uri()],
                check=True, capture_output=True, timeout=120,
            )
            print(f"  ✓ {dest.relative_to(ROOT)}  ({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
