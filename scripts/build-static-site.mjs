import { cpSync, existsSync, lstatSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const source = path.join(root, "web");
const output = path.join(root, "dist");

if (!existsSync(path.join(source, "index.html"))) {
  throw new Error("Expected web/index.html in the repository root.");
}

const relativeOutput = path.relative(root, output);
if (!relativeOutput || relativeOutput.startsWith("..") || path.isAbsolute(relativeOutput)) {
  throw new Error("The static output directory must stay inside the repository.");
}

if (existsSync(output)) {
  const metadata = lstatSync(output);
  if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
    throw new Error("The static output path must be a regular directory.");
  }
  rmSync(output, { recursive: true, force: true });
}

mkdirSync(output, { recursive: true });
cpSync(source, output, {
  recursive: true,
  filter: (entry) => !path.relative(source, entry).split(path.sep).includes("tests"),
});

console.log(`Prepared static site assets in ${output}`);
