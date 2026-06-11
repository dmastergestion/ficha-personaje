"""
Copia y desencripta la ficha oficial 2024 editable para usarla como plantilla web.
Uso: python scripts/prepare-pdf-template.py [ruta-al-pdf]
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "pdf" / "pj2024-template.pdf"
DEFAULT_SRC = Path(os.environ.get("PDF_TEMPLATE_SOURCE", ""))


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src or not src.is_file():
        print(f"No se encontró la plantilla: {src}")
        print("Indica la ruta: python scripts/prepare-pdf-template.py <Pj2024Editable.pdf>")
        sys.exit(1)

    reader = PdfReader(str(src))
    if reader.is_encrypted:
        reader.decrypt("")

    writer = PdfWriter()
    writer.append(reader)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("wb") as f:
        writer.write(f)

    fields = len(reader.get_fields() or {})
    print(f"Plantilla guardada en {OUT} ({OUT.stat().st_size // 1024} KiB, {fields} campos)")


if __name__ == "__main__":
    main()
