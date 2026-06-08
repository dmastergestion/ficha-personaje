# -*- coding: utf-8 -*-
"""Ficha de personaje interactiva — arranque mínimo."""

from __future__ import annotations

import flet as ft


def main(page: ft.Page) -> None:
    page.title = "Ficha de personaje"
    page.theme_mode = ft.ThemeMode.DARK
    page.padding = 24
    page.add(
        ft.Text("Ficha de personaje interactiva", size=22, weight=ft.FontWeight.BOLD),
        ft.Text("Proyecto nuevo — esqueleto listo para desarrollar.", color=ft.Colors.GREY_400),
    )


if __name__ == "__main__":
    ft.app(target=main)
