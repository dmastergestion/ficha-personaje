import Dexie, { type EntityTable } from "dexie";
import { migrarRegistroDexieV1 } from "@/schemas/migrate";
import type { Character } from "@/schemas/character";

export class FichaDatabase extends Dexie {
  characters!: EntityTable<Character, "id">;

  constructor(name = "ficha-personaje") {
    super(name);
    this.version(1).stores({
      characters: "id, identity.name, identity.classId, meta.updatedAt",
    });
    this.version(2)
      .stores({
        characters: "id, identity.name, identity.classId, meta.updatedAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("characters")
          .toCollection()
          .modify((char: Record<string, unknown>) => {
            migrarRegistroDexieV1(char);
          });
      });
  }
}

export const db = new FichaDatabase();
