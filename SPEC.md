# SPEC — Ficha de personaje D&D 2024 (PWA)

Contrato del proyecto. Alcance congelado por **fase** (v1 / v2). Ante dudas no documentadas aquí: proponer en 3 líneas y esperar OK antes de codificar reglas D&D o nuevas librerías.

---

## Visión

PWA offline-first para gestionar fichas de personaje **D&D 5e reglas 2024 (SRD 5.2.1)**. Uso personal o grupos reducidos. Sin backend. Datos locales (IndexedDB). Optimizada para mesa real: acceso rápido, offline tras instalación, automatización de cálculos repetitivos sin sustituir decisiones del jugador.

Proyecto **independiente** de [herramientas-dm](https://github.com/dmastergestion/herramientas-dm). Reutilización opcional: export mínimo compatible con tracker, color crítico `#ffd54f`.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Lenguaje | TypeScript |
| UI | React 19, Tailwind CSS 4, componentes propios |
| Build | Vite |
| Estado UI | Zustand (pestaña activa, modales, última tirada) |
| Validación / tipos | Zod (forma de datos persistidos) |
| Persistencia | Dexie.js (IndexedDB, schema versionado) |
| PWA | vite-plugin-pwa |
| Tests | Vitest (`src/rules/` + migraciones Dexie) |
| Despliegue | GitHub Pages |
| Idioma UI | Español |
| PDF | Plantilla oficial editable + `pdf-lib` (local y GitHub Pages) |

**Roles de capas:** Zod valida *qué se guarda*; `rules/` calcula *derivados*; React solo renderiza y delega.

---

## Reglas de desarrollo

- No añadir funcionalidades fuera de la fase activa (ver tabla v1/v2).
- No inventar reglas D&D: solo SRD 2024 / reglas documentadas en esta SPEC.
- React **nunca** contiene lógica de reglas.
- Cálculos derivados **nunca** se persisten (modificadores, CA calculada, bonificador de competencia).
- Sin APIs externas en runtime.
- Sin librerías nuevas sin justificación explícita.
- Desviaciones menores de UX: proponer brevemente; mayores (reglas, deps): bloqueo hasta OK.

---

## Fuera de alcance (global)

Tracker de iniciativa de grupo, mapas, multijugador, vista DM/party, VTT, backend/nube, multi-idioma, reglas 2014, bestiario, campañas/sesiones, efectos automatizados avanzados (v1).

---

## Alcance por fase

**Fase activa: v2** (v1 completada). Histórico v1 en commits anteriores.

### v2.0 — Estado actual

| Feature | Estado |
|---------|--------|
| Lista, crear, editar, duplicar, eliminar personajes | [x] |
| Multiclass (niveles por clase, slots SRD) | [x] |
| Condiciones SRD con reglas automáticas + agotamiento 0–6 | [x] |
| Inventario con peso, qty, sintonización; carga STR×15 lb | [x] |
| Combate: ataques, daño tipado, salvaciones de muerte, concentración | [x] |
| Hechizos: trucos, preparados/conocidos, ritual, descripciones ES | [x] |
| Catálogo SRD + pack PHB opcional (local) | [x] |
| PWA: banner actualización, offline, shortcuts | [x] |
| Export JSON backup + tracker mínimo | [x] |
| PDF oficial AcroForm (`pdf-lib`) en local y Pages | [x] |
| Schema personaje **v6** + migraciones Dexie v1→v6 | [x] |

---

## Objetivos de mesa (v1)

- Abrir ficha guardada: **< 2 s**
- Tirada d20 con modificador: **≤ 1 clic** desde vista combate
- Aplicar daño/curación PV: **≤ 2 clics**

---

## Arquitectura

```text
ficha-personaje/
├── .github/workflows/     # CI: test, build, deploy Pages
├── public/
├── scripts/
│   ├── build-srd.ts              # Markdown EN → src/data/srd/*.json
│   ├── build-i18n-es.ts          # Traducciones → src/data/i18n/es.json
│   ├── build-spell-i18n-es.ts    # Descripciones conjuros ES
│   ├── build-spell-components-es.ts
│   ├── prepare-pdf-template.py   # Plantilla PDF local (gitignored)
│   └── check-pdf-template.mjs    # Aviso solo en build local
├── data/i18n/
│   └── overrides.es.json  # Correcciones manuales ES
├── src/
│   ├── app/               # Router, providers, layout
│   ├── components/        # UI (shadcn + compuestos ficha)
│   ├── db/                # Dexie schema, migraciones, repositorio
│   ├── hooks/
│   ├── pages/             # Pantallas (ver flujos)
│   ├── pdf/               # Mapeo y relleno PDF oficial
│   ├── rules/             # Motor puro (sin React)
│   │   ├── dice.ts
│   │   ├── ability.ts
│   │   ├── character.ts
│   │   ├── combat.ts
│   │   ├── spells.ts
│   │   ├── rests.ts       # v1: solo short/long rest helpers
│   │   └── srd/           # lookup sobre JSON estático
│   ├── schemas/           # Zod: personaje, export, SRD
│   ├── stores/            # Zustand
│   ├── data/
│   │   ├── srd/           # JSON generado (gitignored o committed post-build)
│   │   └── i18n/
│   ├── lib/               # utils, i18n t(), constants
│   └── test/
├── SPEC.md
├── PROMPT.md
└── README.md
```

### Flujo de datos

```mermaid
flowchart TB
  UI[React pages/components]
  Store[Zustand UI state]
  Zod[Zod schemas]
  Rules[rules pure functions]
  Dexie[Dexie IndexedDB]
  SRD[src/data/srd JSON]
  I18n[src/data/i18n]
  UI --> Store
  UI --> Zod
  UI --> Rules
  Rules --> SRD
  UI --> I18n
  Dexie --> Zod
  UI -->|read/write facts| Dexie
  Rules -->|derived only| UI
```

---

## Pipeline SRD

| Rol | Fuente |
|-----|--------|
| Legal | [SRD 5.2.1 PDF](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.pdf) — CC BY 4.0 |
| Parseo | [downfallx/dnd-5e-srd-markdown](https://github.com/downfallx/dnd-5e-srd-markdown) |
| QA | [sycarion/5e-2024-SRD](https://github.com/sycarion/5e-2024-SRD) |
| ES | Foundry `translate-dnd5e-sdr2-es` + glosario SRD 5.1 ES (Nosolorol) + `overrides.es.json` |
| Conjuros ES | `spell-descriptions-es.json` + `spell-components-es.json` (build-time) |

- IDs internos: `snake_case` en inglés (estables).
- Texto visible: `i18n/es.json` (nombres) + descripciones/componentes de conjuros en JSON dedicados.
- Build-time only; **cero fetch** en runtime salvo plantilla PDF (`HEAD` + `GET` al exportar).

---

## Modelo de datos (Dexie)

### Tabla `characters`

Documento validado con `CharacterSchema` (Zod). Versión de esquema: **`schemaVersion: 6`** (`SCHEMA_VERSION` en `src/lib/constants.ts`).

```typescript
// Referencia resumida — ver src/schemas/character.ts

CharacterSchema = {
  id: string (uuid),
  schemaVersion: 6,
  meta: { createdAt, updatedAt },
  identity: {
    name, playerName,
    speciesId, backgroundId,
    classId, subclassId,       // clase principal (sincronizada con classes[])
    level: 1..20,               // suma de classes[].level
    classes: ClassLevel[],      // multiclass
  },
  abilities: {
    str, dex, con, int, wis, cha: 1..30,
  },
  proficiencies: {
    savingThrows: AbilityKey[],    // override manual
    skills: SkillKey[],
    skillOverrides: Record<SkillKey, boolean>, // forzar prof/no prof
  },
  combat: {
    hpMax, hpCurrent, hpTemp, hitDiceTotal, hitDiceUsed, hitDie,
    armorClassOverride, initiativeOverride, speedOverride,
    inspiration, deathSaves, conditionIds, conditionsCustom,
    damageResistances, damageImmunities, damageVulnerabilities,
  },
  equipment: {
    armorId, shieldEquipped,
    items: EquipmentItem[],
    currency: { pp, gp, ep, sp, cp },
  },
  spells: {
    abilityKey, cantripsKnown, spellsKnown, spellsPrepared,
    spellSlotsUsed, pactMagicUsed, concentratingOn,
  },
  feats, roleplay, resources,
  notes: string,
}
```

### Qué NO persistir

Modificadores de atributo, bonificador de competencia, CA calculada, modificadores de pericia/salvación, slots máximos (se derivan de clase + nivel).

### Export

| Formato | Archivo | Uso |
|---------|---------|-----|
| Backup completo | `ficha-{name}-{date}.json` | `CharacterSchema` completo |
| Tracker mínimo | `tracker-{name}.json` | `{ nombre, jugador, nivel, hp_max, hp_actual, ca, iniciativa }` |
| PDF oficial | `ficha-{name}.pdf` | AcroForm con plantilla en `public/pdf/` |

Import: validar con Zod + `migrateCharacter`; rechazar con mensaje en español si falla.

---

## Pantallas y flujos

```mermaid
flowchart LR
  List[ListaPersonajes]
  New[NuevoPersonaje]
  Sheet[FichaTabs]
  Combat[TabCombate]
  Spells[TabHechizos]
  Equip[TabEquipo]
  Notes[TabNotas]
  Settings[Ajustes]
  List -->|crear| New
  New --> Sheet
  List -->|abrir| Sheet
  Sheet --> Combat
  Sheet --> Spells
  Sheet --> Equip
  Sheet --> Notes
  List --> Settings
```

### `/` — Lista de personajes

- Tarjetas: nombre, clase, nivel, PV actuales/máx.
- Acciones: abrir, duplicar, exportar backup, export tracker, eliminar (confirmación).
- FAB / botón: nuevo personaje.
- Enlace a Ajustes.

### `/new` — Asistente de creación (5 pasos)

1. **Identidad** — nombre del personaje, jugador
2. **Origen** — especie, trasfondo (opcional)
3. **Clase** — clase, subclase opcional, nivel inicial
4. **Atributos** — array estándar auto-asignado por clase o edición manual
5. **Resumen** — confirmación; calcula PV nivel 1 y crea ficha

Guardar → redirige a `/character/:id`.

### `/character/:id` — Ficha (tabs)

**Tab Resumen:** identidad, atributos con botón tirada, PB visible (derivado).

**Tab Combate:** PV (botones ±1, ±5, ±custom), temp HP, CA (calculada + override), iniciativa, velocidad, salvaciones con tirada, pericias con tirada, condiciones manuales, descanso corto/largo.

**Tab Hechizos:** slots, trucos, preparados/conocidos, ritual/concentración, panel info ES, lanzar con tiradas automáticas.

**Tab Equipo:** select armadura SRD, toggle escudo, lista items libre.

**Tab Notas:** texto libre + homebrew (campos libres, sin validación SRD).

Barra fija inferior (móvil): acceso rápido Combate + tirada d20.

### `/settings` — Ajustes

- Import JSON.
- Licencias y atribución SRD.
- Versión app + schemaVersion.

---

## UX

- Tema oscuro por defecto; legible en 16".
- Acciones críticas (tirar, daño, curación, guardar): color `#ffd54f`.
- Sin chincheta nativa (limitación PWA); recomendar instalación a pantalla completa.

---

## SRD vs homebrew

- Contenido con id SRD: autocomplete y reglas automáticas.
- Fuera del SRD: campos libres en Notas / items / condiciones; sin validación de reglas.

---

## Testing

- Vitest: `src/rules/*`, migraciones Dexie, `db/repository`, `pdf/buildOfficialPdfValues`, `spell-text`.
- CI: `npm test` + `npm run build` (requiere `public/pdf/pj2024-template.pdf`).

---

## Plan de implementación

### Fase 0 — Fundación

- [x] SPEC, README, PROMPT
- [x] Scaffold Vite + React + TS + Tailwind
- [x] Dexie v1 + export/import stub
- [x] PWA shell + GitHub Pages workflow
- [x] Vitest configurado (`rules/dice`, `rules/ability`)

### Fase 1 — Datos SRD

- [x] Scripts `build-srd.ts`, `build-i18n-es.ts`
- [x] JSON clases (12), subclases (12), armaduras (13), hechizos (340), especies (14), trasfondos (4)
- [x] Traducciones ES vía Foundry `translate-dnd5e-sdr2-es`
- [x] Tests de conteo / Zod SRD en CI

### Fase 2 — Motor de reglas

- [x] `dice`, `ability`, `combat` (CA armadura + escudo)
- [x] `character`, `spells`, `rests`

### Fase 3 — UI ficha jugable

- [x] Pantallas lista, creación, tabs (Resumen, Combate, Hechizos, Equipo, Notas)
- [x] Integración reglas + Dexie

### Fase 4 — Polish

- [x] Export tracker
- [x] Ajustes + licencias + versión
- [x] Deploy GH Pages (CI)
- [x] PWA offline (service worker registrado + precache en build)
- [x] Duplicar personaje, barra móvil combate/d20, proficiencias SRD
