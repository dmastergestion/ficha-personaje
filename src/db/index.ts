import Dexie, { type EntityTable } from "dexie";
import {
  migrarRegistroDexieV1,
  migrarRegistroDexieV2,
  migrarRegistroDexieV3,
  migrarRegistroDexieV4,
  migrarRegistroDexieV5,
  migrarRegistroDexieV6,
} from "@/schemas/migrate";
import type { Character } from "@/schemas/character";
import type { ContentPack } from "@/schemas/content-pack";

export interface StoredContentPack {
  id: string;
  importedAt: string;
  origin?: "bundled" | "user";
  pack: ContentPack;
}

export class FichaDatabase extends Dexie {
  characters!: EntityTable<Character, "id">;
  contentPacks!: EntityTable<StoredContentPack, "id">;

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
    this.version(3)
      .stores({
        characters: "id, identity.name, identity.classId, meta.updatedAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("characters")
          .toCollection()
          .modify((char: Record<string, unknown>) => {
            migrarRegistroDexieV2(char);
          });
      });
    this.version(4)
      .stores({
        characters: "id, identity.name, identity.classId, meta.updatedAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("characters")
          .toCollection()
          .modify((char: Record<string, unknown>) => {
            migrarRegistroDexieV3(char);
          });
      });
    this.version(5)
      .stores({
        characters: "id, identity.name, identity.classId, meta.updatedAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("characters")
          .toCollection()
          .modify((char: Record<string, unknown>) => {
            migrarRegistroDexieV4(char);
          });
      });
    this.version(6).stores({
      characters: "id, identity.name, identity.classId, meta.updatedAt",
      contentPacks: "id",
    });
    this.version(7)
      .stores({
        characters: "id, identity.name, identity.classId, meta.updatedAt",
        contentPacks: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table("characters")
          .toCollection()
          .modify((char: Record<string, unknown>) => {
            migrarRegistroDexieV5(char);
          });
      });
    this.version(8)
      .stores({
        characters: "id, identity.name, identity.classId, meta.updatedAt",
        contentPacks: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table("characters")
          .toCollection()
          .modify((char: Record<string, unknown>) => {
            migrarRegistroDexieV6(char);
          });
      });
  }
}

export const db = new FichaDatabase();
