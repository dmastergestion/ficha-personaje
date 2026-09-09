/** Filtra opciones ya tomadas en otra elección, conservando el valor actual. */
export function opcionesSinDuplicar<T extends { value: string }>(
  options: T[],
  ocupadas: Iterable<string>,
  valorActual?: string,
): T[] {
  const blocked = new Set(ocupadas);
  if (valorActual) blocked.delete(valorActual);
  return options.filter((opt) => !blocked.has(opt.value));
}

/** Prefiere el valor actual si está libre; si no, la primera opción no ocupada. */
export function valorLibre(
  options: { value: string }[],
  ocupadas: Iterable<string>,
  preferida?: string,
): string {
  const blocked = new Set(ocupadas);
  if (preferida && !blocked.has(preferida) && options.some((opt) => opt.value === preferida)) {
    return preferida;
  }
  return options.find((opt) => !blocked.has(opt.value))?.value ?? preferida ?? options[0]?.value ?? "";
}
