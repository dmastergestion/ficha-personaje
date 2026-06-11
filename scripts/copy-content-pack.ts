import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "vendor", "content-pack", "xphb-pack.json");
const destDir = path.join(root, "public", "content-pack");
const dest = path.join(destDir, "xphb-pack.json");

if (!fs.existsSync(src)) {
  console.log("Sin pack local. Ejecuta: npm run fetch:5etools && npm run build:content-pack");
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
execSync(`npx tsx scripts/patch-content-pack-es.ts "${src}" "${dest}"`, {
  cwd: root,
  stdio: "inherit",
});
console.log(`Pack ES listo → public/content-pack/xphb-pack.json`);
