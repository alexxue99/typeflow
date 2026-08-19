import { readFile, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const version = packageJson.version;
const targets = [
  {
    path: "README.md",
    pattern: /(## Current version\r?\n\r?\nVersion )\S+/,
    replacement: `$1${version}`,
  },
  {
    path: "app/components/TypingApp.tsx",
    pattern: /(<footer><span><\/span><span>Version )[^<]+(<\/span><\/footer>)/,
    replacement: `$1${version}$2`,
  },
];

for (const target of targets) {
  const contents = await readFile(target.path, "utf8");

  if (!target.pattern.test(contents)) {
    throw new Error(`Could not find the current version in ${target.path}`);
  }

  const updatedContents = contents.replace(target.pattern, target.replacement);

  if (updatedContents !== contents) {
    await writeFile(target.path, updatedContents);
  }
}
