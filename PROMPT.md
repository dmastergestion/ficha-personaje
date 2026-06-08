# PROMPT — Ficha de personaje PWA

Lee **`SPEC.md`** antes de cualquier cambio. Es la fuente de verdad del alcance.

## Resumen para IA

- PWA **React + TypeScript**, offline-first, **español**, D&D **2024 SRD**.
- Proyecto **aislado** de `suiteDM`; sin imports cruzados.
- **React sin lógica de reglas** → todo en `src/rules/`.
- **Zod** = forma persistida; **Dexie** = IndexedDB; derivados **no se guardan**.
- Fase activa: **v2 completa** (efectos, inventario, PWA+, multiclass, PDF). Mantener alcance SPEC.
- UX mesa: acciones críticas `#ffd54f`; daño PV ≤2 clics; tirada ≤1 clic.
- SRD: build desde Markdown EN + i18n ES híbrido (SPEC § Pipeline SRD).
- Cambio mínimo por iteración; una mejora visible por paso.
- Código y comentarios en **castellano**.

## No hacer (v2 pendiente)

- Tracker, multijugador, backend, APIs runtime, reglas 2014, integración automática suite DM, multiclass, PDF.

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `SPEC.md` | Alcance, schema, pantallas, fases |
| `src/schemas/` | Zod personaje + export |
| `src/rules/` | Motor de reglas puro |
| `src/db/` | Dexie + migraciones |
| `scripts/build-srd.ts` | Pipeline SRD |
