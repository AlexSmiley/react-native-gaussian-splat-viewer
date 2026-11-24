import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
const dir = new URL("../public/resources/", import.meta.url);
await mkdir(dir, { recursive: true });
const names = (await readdir(dir, { withFileTypes: true })).filter(e => e.isFile() && /\.(ply|splat)$/i.test(e.name)).map(e => e.name).sort();
const entries = await Promise.all(names.map(async name => ({ name, size: (await stat(new URL(encodeURIComponent(name), dir))).size })));
await writeFile(new URL("manifest.json", dir), JSON.stringify(entries, null, 2) + "\n");
