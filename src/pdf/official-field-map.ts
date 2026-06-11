import type { AbilityKey, SkillKey } from "@/lib/constants";

/** Nombres de campo AcroForm del PDF oficial ES 2024 (Pj2024Editable). */
export const ABILITY_PDF: Record<
  AbilityKey,
  { score: string; mod: string; saveBtn: string; saveVal: string }
> = {
  str: {
    score: "Fuerza",
    mod: "Puntuación Fuerza",
    saveBtn: "Tirada de Salvación Fuerza",
    saveVal: "Tirada de Salvación - Fuerza",
  },
  dex: {
    score: "Destreza",
    mod: "Puntuación Destreza",
    saveBtn: "Tirada de Salvación Destreza",
    saveVal: "Tirada de Salvación - Destreza",
  },
  con: {
    score: "Constitución",
    mod: "Puntuación Constitución",
    saveBtn: "Tirada de Salvación Constitución",
    saveVal: "Tirada de Salvación - Constitución",
  },
  int: {
    score: "Inteligencia",
    mod: "Puntuación Inteligencia",
    saveBtn: "Tirada de Salvación Inteligencia",
    saveVal: "Tirada de Salvación - Inteligencia",
  },
  wis: {
    score: "Sabiduría",
    mod: "Puntuación Sabiduría",
    saveBtn: "Tirada de Salvación Sabiduría",
    saveVal: "Tirada de Salvación - Sabiduría",
  },
  cha: {
    score: "Carisma",
    mod: "Puntuación Carisma",
    saveBtn: "Tirada de Salvación Carisma",
    saveVal: "Tirada de Salvación - Carisma",
  },
};

export const SKILL_PDF: Record<SkillKey, { btn: string; val: string }> = {
  acrobatics: { btn: "Acrobacias", val: "Valor - Acrobacias" },
  animalHandling: { btn: "Trato con Animales", val: "Valor - Trato con Animales" },
  arcana: { btn: "Conocimiento Arcano", val: "Valor - Conocimiento Arcano" },
  athletics: { btn: "Atletismo", val: "Valor - Atletismo" },
  deception: { btn: "Engaño", val: "Valor - Engaño" },
  history: { btn: "Historia", val: "Valor - Historia" },
  insight: { btn: "Perspicacia", val: "Valor - Perspicacia" },
  intimidation: { btn: "Intimidación", val: "Valor - Intimidación" },
  investigation: { btn: "Investigación", val: "Valor - Investigación" },
  medicine: { btn: "Medicina", val: "Valor - Medicina" },
  nature: { btn: "Naturaleza", val: "Valor - Naturaleza" },
  perception: { btn: "Percepción", val: "Valor - Percepción" },
  performance: { btn: "Interpretación", val: "Valor - Interpretación" },
  persuasion: { btn: "Persuasión", val: "Valor - Persuasión" },
  religion: { btn: "Religión", val: "Valor - Religión" },
  sleightOfHand: { btn: "Juego de Manos", val: "Valor - Juego de Manos" },
  stealth: { btn: "Sigilo", val: "Valor - Sigilo" },
  survival: { btn: "Supervivencia", val: "Valor - Supervivencia" },
};

export function attackRowField(
  row: number,
  key: "name" | "bonus" | "damage" | "notes",
): string {
  const n = row + 1;
  switch (key) {
    case "name":
      return `Nombre -  Fila ${n}`;
    case "bonus":
      return `Bonificacion Ataque/CD - Fila ${n}`;
    case "damage":
      return `Daño y Tipo - Fila ${n}`;
    case "notes":
      return `Notas -  Fila ${n}`;
  }
}

export function spellRowField(
  row: number,
  key: "name" | "level" | "time" | "concentration" | "ritual" | "material" | "range" | "notes",
): string {
  const n = row + 1;
  switch (key) {
    case "name":
      return `Nombre - Fila ${n}`;
    case "level":
      return `Nivel - Fila ${n}`;
    case "time":
      return `Tiempo Lanzamiento - Fila ${n}`;
    case "concentration":
      return `Concentración - Fila ${n}`;
    case "ritual":
      return `Ritual - Fila ${n}`;
    case "material":
      return `Material Necesario - Fila ${n}`;
    case "range":
      return `Alcance - Fila ${n}`;
    case "notes":
      return `Notas - Fila ${n}`;
  }
}

export function spellSlotCheckbox(level: number, index: number): string {
  return `Nivel ${level} - ${index}`;
}

export const PDF_TEMPLATE_URL = "/pdf/pj2024-template.pdf";
