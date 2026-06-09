import { db, type StoredContentPack } from "@/db";
import { ContentPackSchema, type ContentPack } from "@/schemas/content-pack";

const ACTIVE_ID = "active";

export interface ActiveContentPack {
  pack: ContentPack;
  origin: "bundled" | "user";
}

export async function loadActiveContentPack(): Promise<ContentPack | null> {
  const active = await loadActiveContentPackRow();
  return active?.pack ?? null;
}

export async function loadActiveContentPackRow(): Promise<ActiveContentPack | null> {
  const row = await db.contentPacks.get(ACTIVE_ID);
  if (!row?.pack) return null;
  const parsed = ContentPackSchema.safeParse(row.pack);
  if (!parsed.success) return null;
  return { pack: parsed.data, origin: row.origin ?? "user" };
}

export async function saveActiveContentPack(
  pack: ContentPack,
  origin: "bundled" | "user" = "user",
): Promise<void> {
  const parsed = ContentPackSchema.parse(pack);
  const row: StoredContentPack = {
    id: ACTIVE_ID,
    importedAt: new Date().toISOString(),
    origin,
    pack: parsed,
  };
  await db.contentPacks.put(row);
}

export async function clearActiveContentPack(): Promise<void> {
  await db.contentPacks.delete(ACTIVE_ID);
}

/** Lanza SyntaxError (JSON inválido) o ZodError (estructura inválida). */
export function parseContentPackJson(json: string): ContentPack {
  return ContentPackSchema.parse(JSON.parse(json));
}
