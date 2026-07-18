# AGENTS — ficha-personaje

PWA jugador **D&D 2024 SRD**, offline-first, UI en **castellano**. Proyecto **aislado** de `suiteDM`.

| Prioridad | Archivo | Uso |
|-----------|---------|-----|
| 1 | `SPEC.md` | Contrato (alcance, schema, fases, pipeline SRD) |
| 2 | `PROMPT.md` | Resumen operativo para asistentes |
| 3 | `.cursor/rules/ficha-personaje.mdc` | Regla Cursor |
| — | `README.md` | Scripts, despliegue, mantenimiento |

## Áreas clave

| Área | Dónde |
|------|-------|
| Motor de reglas (puro) | `src/rules/` |
| Zod (forma persistida) | `src/schemas/` |
| Dexie / migraciones | `src/db/` |
| Pipeline SRD | `scripts/build-srd.ts` |
| i18n ES | `data/i18n/`, `src/data/i18n/` |
| Export tracker → DM | Zod export; esquema `../dnd-data-es/schemas/tracker-export-v1.json` |

## Límites

- Sin imports desde `suiteDM` ni otros repos; sin APIs en runtime.
- React sin lógica de reglas → `src/rules/`.
- Interacción/commits: `~/.cursor/rules/interaccion-agente.mdc`.

## Comandos

```bash
npm test
npm run build
```
