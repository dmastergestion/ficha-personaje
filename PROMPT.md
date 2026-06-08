# PROMPT — Ficha de personaje interactiva

## Objetivo

Ficha de personaje D&D 2024 en castellano, **interactiva** (editar valores, tirar dados, ver modificadores al instante). 100 % local, ventana Flet, estilo legible en 16".

## Principios

- Proyecto **aislado** de `suiteDM` (sin imports cruzados).
- Código y comentarios en **castellano**.
- Cambio mínimo por iteración; una mejora visible por paso.
- `.pyw` para la GUI principal.

## UX

- Botón chincheta (siempre encima) como en la suite.
- Dorado `#ffd54f` para acciones críticas.
- Pocos clics para tirar dado o marcar daño/curación en PV.

## Datos

- Un JSON por personaje en `datos/` (no versionar personajes reales de campaña en git).
- Esquema versionado en `esquema_ficha.json` cuando se defina.

## No hacer (por ahora)

- Sincronizar con tracker o campaña de la suite.
- Reglas SRD completas automatizadas (solo lo que la ficha necesita mostrar/editar).
