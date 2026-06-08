# Ficha de personaje D&D 2024

PWA offline-first para fichas de personaje **D&D 5e (SRD 5.2.1 / reglas 2024)**. Proyecto independiente de la [suite DM](https://github.com/dmastergestion/herramientas-dm).

## Uso sin instalar nada (jugadores / mesa)

1. Abre la app publicada: **https://dmastergestion.github.io/ficha-personaje/**
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

Los JSON generados en `src/data/` se versionan para que CI y usuarios no dependan de `vendor/`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor local Vite |
| `npm run build` | Build producción |
| `npm test` | Vitest (reglas + db) |
| `npm run build:data` | Regenerar SRD + traducciones ES |

## Documentación

- [`SPEC.md`](SPEC.md) — contrato del proyecto
- [`PROMPT.md`](PROMPT.md) — guía para IA

## Licencia SRD

Contenido de reglas derivado del SRD 5.2.1 © Wizards of the Coast — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Traducción ES: comunidad Foundry (`translate-dnd5e-sdr2-es`).
