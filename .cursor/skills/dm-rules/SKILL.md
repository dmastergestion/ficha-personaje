---
name: dm-rules
description: >-
  /dm-rules — mecánicas D&D 2024 SRD, src/rules/, combate, hechizos, feats,
  Vitest, ficha-personaje, SPEC.md. No UI React ni pipeline SRD.
disable-model-invocation: true
---

# Reglas D&D — ficha-personaje (`src/rules/`)

**Workspace:** `proyectos/ficha-personaje/`

## Flujo

1. Alcance → archivo en `src/rules/` (mapa: `AGENTS.md`)
2. Dudas → sección relevante de `SPEC.md`
3. Regla nueva no documentada → proponer 3 líneas, esperar OK
4. Implementar función pura + `foo.test.ts`
5. `npm test`

## Restricciones

- Sin React, Dexie, fetch, DOM en `rules/`
- No persistir derivados (mods, CA calc, prof bonus, slots máx)
- UI importa desde `rules/`; lógica D&D nunca en JSX
