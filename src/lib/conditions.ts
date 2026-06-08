export const CONDITION_IDS = [
  "blinded",
  "charmed",
  "deafened",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
] as const;

export type ConditionId = (typeof CONDITION_IDS)[number];

export const CONDITION_LABELS_ES: Record<ConditionId, string> = {
  blinded: "Cegado",
  charmed: "Hechizado",
  deafened: "Ensordecido",
  frightened: "Asustado",
  grappled: "Agarrado",
  incapacitated: "Incapacitado",
  invisible: "Invisible",
  paralyzed: "Paralizado",
  petrified: "Petrificado",
  poisoned: "Envenenado",
  prone: "Tumbado",
  restrained: "Apresado",
  stunned: "Aturdido",
  unconscious: "Inconsciente",
};
