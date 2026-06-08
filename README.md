# Ficha de personaje interactiva

Proyecto **independiente** de la suite DM ([herramientas-dm](https://github.com/dmastergestion/herramientas-dm)). Repo propio: [ficha-personaje](https://github.com/dmastergestion/ficha-personaje).

Objetivo: una ficha de personaje **D&D 2024** usable en partida, con edición en vivo y buena legibilidad en pantalla de 16".

## Estado

Esqueleto inicial. Sin integración con `suiteDM` por ahora.

## Repositorio

| Proyecto | Carpeta local | GitHub |
|----------|---------------|--------|
| Suite DM | `suiteDM/` | `dmastergestion/herramientas-dm` |
| Ficha de personaje | `ficha-personaje/` | `dmastergestion/ficha-personaje` |

No mezclar remotes ni subcarpetas entre repos.

## Requisitos

- Python ≥ 3.10
- Flet (UI local)

```powershell
cd ficha-personaje
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python main.pyw
```

## Alcance previsto (borrador)

- Atributos, modificadores y tiradas rápidas (d20).
- PV, CA, iniciativa, velocidad.
- Habilidades y salvaciones.
- Espacios para hechizos / rasgos / inventario (según clase).
- Guardado local en JSON (sin nube).

Ver `PROMPT.md` para criterios de diseño y vibecoding.
