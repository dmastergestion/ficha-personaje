export function migrarRegistroDexieV8(char: Record<string, unknown>): void {
  if (char.schemaVersion !== 8) return;
  char.weaponMasteries = char.weaponMasteries ?? [];
  const resources = char.resources as Array<Record<string, unknown>> | undefined;
  if (resources) {
    char.resources = resources.map((r) => ({
      ...r,
      source: r.source ?? "class",
    }));
  }
  char.schemaVersion = 9;
}

export function migrarRegistroDexieV9(char: Record<string, unknown>): void {
  if (char.schemaVersion !== 8 && char.schemaVersion !== 9) return;
  const proficiencies = char.proficiencies as Record<string, unknown> | undefined;
  if (proficiencies) {
    proficiencies.expertise = proficiencies.expertise ?? [];
  }
  const combat = char.combat as Record<string, unknown> | undefined;
  if (combat && combat.raging === undefined) combat.raging = false;
  if (combat && combat.reckless === undefined) combat.reckless = false;
  if (char.schemaVersion !== 9) char.schemaVersion = 9;
}
