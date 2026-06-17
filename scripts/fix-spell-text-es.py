"""Correcciones de terminología en descripciones de conjuros (ES)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ROOT / "src" / "data" / "i18n" / "spell-descriptions-es.json",
    ROOT / "data" / "i18n" / "phb-spell-descriptions-manual.json",
]

# Orden importa: entradas más específicas primero.
REPLACEMENTS: list[tuple[str, str]] = [
    (r"\n\{Level\s+darts\}", ""),
    ("chuchería", "baratija"),
    ("Chuchería", "Baratija"),
    ("componente Verbal", "componente verbal"),
    ("Muerto viviente", "no muerto"),
    ("acción Dodge", "acción de Esquivar"),
    ("acción Esquivar y", "acción de Esquivar y"),
    ("realiza la acción Esquivar", "realiza la acción de Esquivar"),
    ("Tu Concentración", "Tu concentración"),
    ("mantener la Concentración", "mantener la concentración"),
    ("mantienes Concentración", "mantienes concentración"),
    ("mantener Concentración", "mantener concentración"),
    ("Indiferente hacia", "indiferente hacia"),
    ("Amistoso contigo", "amistoso contigo"),
    ("Descansos Cortos ni Largos", "descansos cortos ni largos"),
    ("beholderkin", "observador menor"),
    (" una Aberración", " una aberración"),
    ("Humanos Medianos o Pequeños", "humanoides medianos o pequeños"),
    ("un Ghoul bajo", "un necrófago bajo"),
    ("queda Petrificado", "queda petrificado"),
    ("Los Constructos superan", "Los constructos superan"),
    ("es un Constructo,", "es un constructo,"),
    ("en un Constructo que", "en un constructo que"),
    ("Invocas el espíritu de un Constructo", "Invocas el espíritu de un constructo"),
    ("Una Bestia que", "Una bestia que"),
    ("Tocas a una Bestia voluntaria", "Tocas a una bestia voluntaria"),
    ("de la Bestia además", "de la bestia además"),
    ("de la Bestia, te", "de la bestia, te"),
    ("Creas un simulacro de una Bestia", "Creas un simulacro de una bestia"),
    ("esfera de Oscuridad", "esfera de oscuridad"),
    ("daño radiante o Necrótico", "daño radiante o necrótico"),
    ("daño de frío o de Ácido", "daño de frío o de ácido"),
    ("mantener Concentración.", "mantener concentración."),
    ("tu Concentración", "tu concentración"),
    ("mantienes Concentración", "mantienes concentración"),
    ("poción Común o Poco común", "poción común o poco común"),
    ("Poción de curación", "poción de curación"),
    ("elige Demonio, Diablo o Yugoloth", "elige demonio, diablo o yugoloth"),
    ("con el conjuro.La criatura se vuelve", "con el conjuro.\nLa criatura se vuelve"),
    ("(Maldición de característica).El objetivo", "(Maldición de característica).\nEl objetivo"),
    ("(Maldición de ataques).En combate", "(Maldición de ataques).\nEn combate"),
    ("(Maldición de acciones).Si infliges", "(Maldición de acciones).\nSi infliges"),
    ("(Maldición de resistencia).Usar", "(Maldición de resistencia).\nUsar"),
]


def fix_text(text: str) -> str:
    for old, new in REPLACEMENTS:
        if old.startswith(r"\n") or "\\" in old:
            text = re.sub(old, new, text)
        else:
            text = text.replace(old, new)
    return text


def fix_file(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    changes = 0
    for key, value in data.items():
        if not isinstance(value, str):
            continue
        fixed = fix_text(value)
        if fixed != value:
            data[key] = fixed
            changes += 1
    if changes:
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return changes


def main() -> int:
    total = 0
    for path in FILES:
        if not path.exists():
            print(f"SKIP {path}")
            continue
        n = fix_file(path)
        print(f"{path.name}: {n} entradas corregidas")
        total += n
    return 0 if total >= 0 else 1


if __name__ == "__main__":
    sys.exit(main())
