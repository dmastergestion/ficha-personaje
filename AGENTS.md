# AGENTS — Orientación rápida

Mapa para IAs. **Contrato:** `SPEC.md` · **Resumen:** `PROMPT.md` · **Reglas Cursor:** `.cursor/rules/` (por carpeta).

## Arquitectura

```text
React (components/pages) → rules/ (puro) → schemas + Dexie (hechos)
                              ↓
                    src/data/srd + i18n (estático)
```

- Sin APIs en runtime. Español. Fase activa: **v2**. Reglas: **PHB/SRD 2024** (`edition.ts`).
- **No persistir derivados** (mods, CA calc, prof bonus, slots máx).

## Flujo de cambio

1. Hecho nuevo → `src/schemas/character.ts` (+ `migrate.ts` si sube `schemaVersion`)
2. Regla D&D → `src/rules/<dominio>.ts` + `*.test.ts`
3. UI → importar desde `rules/`; sin lógica de reglas en JSX
4. `npm test`

## Dominios (`src/rules/`)

| Área | Archivos |
|------|----------|
| Core | `character.ts`, `ability.ts`, `level-up.ts`, `multiclass.ts` |
| Origen/creación | `creation.ts`, `origin-choices.ts`, `origin-benefits.ts`, `origin-equipment.ts` |
| Combate | `combat.ts`, `combat-hp.ts`, `attacks.ts`, `attack-roll.ts`, `hit-dice.ts`, `death-saves.ts`, `concentration.ts` |
| Hechizos | `spells.ts`, `spell-cast.ts`, `spell-lists.ts`, `spell-choices.ts`, `spell-progression.ts` |
| Equipo | `inventory.ts`, `class-equipment.ts`, `equipment-parsing.ts`, `weapon-mastery.ts` |
| Recursos | `resource-ids.ts`, `resource-use.ts`, `resources-tracker.ts`, `resources.ts` (PV), `rests.ts` |
| Meta | `edition.ts`, `proficiencies.ts`, `feat-mechanics.ts`, `effects.ts` |
| Texto/catálogo | `catalog.ts`, `feat-text.ts`, `spell-text.ts`, `armor-text.ts`, `weapon-text.ts` |

## UI

| Pantalla | Archivo |
|----------|---------|
| Lista | `src/pages/CharacterListPage.tsx` |
| Creación | `src/pages/CharacterNewPage.tsx` |
| Ficha | `src/pages/character-sheet/CharacterSheetPage.tsx` |
| Tabs | `TabResumen`, `TabCombate`, `TabHechizos`, `TabEquipo`, `TabNotas` |

Componentes compartidos: `src/components/`, layout en `src/components/layout.tsx`.

## Persistencia

- Schema: `src/schemas/character.ts` — versión: `SCHEMA_VERSION` en `src/lib/constants.ts`
- Migraciones: `src/schemas/migrate.ts` · DB: `src/db/index.ts`

## SRD / catálogo

`npm run build:data` regenera JSON desde `vendor/` (Foundry + 5etools + i18n). CI **no** lo ejecuta: versionamos `src/data/`.

| Origen | Archivos |
|--------|----------|
| `build-srd.ts` | `classes`, `subclasses`, `armor`, `weapons`, `spells`, `species`, `backgrounds`, `manifest` (incluye ritual/concentración) |
| `build-phb-catalog.ts` | Fusiona subclases/trasfondos/especies/conjuros PHB 2024 en esos JSON |
| `build-srd-extras.ts` | `feats`, `feat-meta`, `weapon-meta`, `species-meta`, `background-meta` |
| `build-spell-*` | `spell-meta`, `spell-lists`, `subclass-spell-grants` + i18n de conjuros |
| `build-class-features.ts` / `build-phb-i18n-es.ts` | `class-feature-meta`, `subclass-feature-meta` |
| A mano | `*-resource-meta`, `feat-mechanics-meta`, `spell-grant-meta`, `class-prof-meta`, invocaciones, maniobras, maestrías |

No editar JSON **generado** a mano. Textos ES: `src/data/i18n/`. Manuales opcionales: `data/i18n/` (si existen, se fusionan).

## Anti-patrones

- Reglas D&D o deps nuevas sin OK (ver SPEC)
- Lógica de combate/hechizos en componentes
- Versionar `notion-inventario/` ni exports Notion

## Skills (prefijo `dm-` — filtra con `/dm`)

| / | Cuándo |
|---|--------|
| `/dm-rules` | Mecánicas en `src/rules/` + tests |

Reglas con `globs` cubren capas UI/SRD/persistencia sin cargar skills.

## Comandos

`npm test` · `npm run build` · ver `README.md` para pipeline SRD
