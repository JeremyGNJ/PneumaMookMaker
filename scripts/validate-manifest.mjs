import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(projectRoot, "module.json"), "utf8"));
const packageJson = JSON.parse(await readFile(resolve(projectRoot, "package.json"), "utf8"));

const errors = [];
if (manifest.id !== "pneuma-mook-maker") errors.push("module id must be pneuma-mook-maker");
if (manifest.version !== packageJson.version) errors.push("module.json and package.json versions differ");
if (manifest.compatibility?.minimum !== "12") errors.push("minimum Foundry version must be 12");
if (manifest.compatibility?.maximum !== "12") errors.push("maximum Foundry version must be 12");
if (!manifest.esmodules?.includes("scripts/main.js")) errors.push("compiled entry point is missing");

if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("module.json is valid for this project.");

