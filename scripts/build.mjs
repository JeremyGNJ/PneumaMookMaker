import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const dist = resolve(projectRoot, "dist");

await rm(dist, { recursive: true, force: true });

const tsc = resolve(projectRoot, "node_modules", "typescript", "bin", "tsc");
const result = spawnSync(process.execPath, [tsc, "--project", resolve(projectRoot, "tsconfig.json")], {
  cwd: projectRoot,
  stdio: "inherit"
});

if (result.status !== 0) process.exit(result.status ?? 1);

await mkdir(dist, { recursive: true });
await cp(resolve(projectRoot, "src", "styles"), resolve(dist, "styles"), { recursive: true });
await cp(resolve(projectRoot, "src", "lang"), resolve(dist, "lang"), { recursive: true });
await cp(resolve(projectRoot, "src", "templates"), resolve(dist, "templates"), { recursive: true });

const manifest = JSON.parse(await readFile(resolve(projectRoot, "module.json"), "utf8"));
await writeFile(resolve(dist, "module.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Built ${manifest.title} v${manifest.version} in dist/`);
