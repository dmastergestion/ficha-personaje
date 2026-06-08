import Dexie, { type EntityTable } from "dexie";
import type { Character } from "@/schemas/character";

export class FichaDatabase extends Dexie {
  characters!: EntityTable<Character, "id">;

  constructor(name = "ficha-personaje") {
    super(name);
    this.version(1).stores({
      characters: "id, identity.name, identity.classId, meta.updatedAt",
    });
  }
}

export const db = new FichaDatabase();
