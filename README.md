# Ficha de personaje D&D 2024

PWA offline-first para fichas de personaje **D&D 5e (SRD 5.2.1 / reglas 2024)**. Proyecto independiente de la [suite DM](https://github.com/dmastergestion/herramientas-dm).

## Uso sin instalar nada (jugadores / mesa)

1. Abre la app publicada: **https://dmastergestion.github.io/ficha-personaje/** (se despliega automáticamente en cada push a `master`)
2. En Chrome/Edge: menú → **Instalar aplicación** / **Añadir a pantalla de inicio**
3. Listo: funciona **offline** con tus personajes guardados en el dispositivo

No hace falta Python, Node ni Flet en el dispositivo donde juegas.

## Desarrollo (solo mantenedores)

Requiere Node.js ≥ 20 para modificar código o regenerar datos SRD.

```powershell
cd ficha-personaje
npm install
npm run dev
```

Regenerar catálogo SRD (requiere clones en `vendor/`):

```powershell
git clone --depth 1 https://github.com/downfallx/dnd-5e-srd-markdown.git vendor/dnd-5e-srd-markdown
git clone --depth 1 --filter=blob:none --sparse https://github.com/foundryvtt/dnd5e.git vendor/dnd5e
git clone --depth 1 https://github.com/foundryvtt-sinregistrar/translate-dnd5e-sdr2-es.git vendor/translate-dnd5e-sdr2-es
npm run build:data
```

**Contenido PHB 2024 (local, no se sube a GitHub):** descarga datos 5etools y genera un pack importable:

```powershell
npm run fetch:5etools      # vendor/5etools-src/data/ (gitignored)
npm run build:content-pack # vendor/content-pack/xphb-pack.json
```

Requiere tener el PHB; el pack queda solo en tu máquina (`vendor/` está en `.gitignore`).

Los JSON generados en `src/data/` se versionan para que CI y usuarios no dependan de `vendor/`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor local Vite |
| `npm run build` | Build producción |
| `npm test` | Vitest (reglas + db) |
| `npm run build:data` | Regenerar SRD + traducciones ES |
| `npm run fetch:5etools` | Descargar JSON 5etools (solo `data/`) |
| `npm run build:content-pack` | Generar pack XPHB local desde 5etools |
| `npm run prepare:pdf-template` | Copiar plantilla oficial editable a `public/pdf/` |

### Export PDF

La plantilla oficial (`public/pdf/pj2024-template.pdf`) se incluye en el build y funciona en **local y GitHub Pages**.

Si falta la plantilla (clon nuevo sin el PDF), genera una desde el editable de WoTC:

```powershell
npm run prepare:pdf-template -- "C:\ruta\a\Pj2024Editable.pdf"
# o: $env:PDF_TEMPLATE_SOURCE="C:\ruta\..." ; npm run prepare:pdf-template
```

## Funcionalidades (v2)

- Asistente de creación por pasos, multiclase SRD, condiciones con reglas automáticas
- Inventario con peso y carga (STR × 15 lb)
- Export JSON, tracker y **PDF** (ficha oficial 2024 rellenable)
- PWA offline con aviso de actualización

## Documentación

- [`SPEC.md`](SPEC.md) — contrato del proyecto
- [`PROMPT.md`](PROMPT.md) — guía para IA

## Licencia SRD

Contenido de reglas derivado del SRD 5.2.1 © Wizards of the Coast — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Traducción ES: comunidad Foundry (`translate-dnd5e-sdr2-es`).
