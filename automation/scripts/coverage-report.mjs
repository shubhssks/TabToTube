import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "../..");
const matrixPath = resolve(root, "automation/coverage-matrix.json");
const outputJsonPath = resolve(root, "automation/reports/coverage/coverage.json");
const outputMarkdownPath = resolve(root, "automation/reports/coverage/coverage.md");
const matrix = JSON.parse(await readFile(matrixPath, "utf8"));

const rows = await Promise.all(matrix.map(async (entry) => {
  const absoluteTestPath = resolve(root, entry.testFile);
  let covered = false;
  try {
    await stat(absoluteTestPath);
    covered = true;
  } catch {
    covered = false;
  }

  return {
    ...entry,
    covered
  };
}));

const coveredCount = rows.filter((row) => row.covered).length;
const percent = Math.round((coveredCount / rows.length) * 100);
const summary = {
  covered: coveredCount,
  total: rows.length,
  percent,
  rows
};

await mkdir(dirname(outputJsonPath), { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(outputMarkdownPath, renderMarkdown(summary));

console.log(`Automation coverage: ${coveredCount}/${rows.length} (${percent}%)`);

if (coveredCount !== rows.length) {
  process.exit(1);
}

function renderMarkdown({ rows: coverageRows, covered, total, percent: coveragePercent }) {
  const lines = [
    "# Automation Coverage",
    "",
    `Coverage: ${covered}/${total} (${coveragePercent}%)`,
    "",
    "| ID | Area | Suite | Covered | Requirement |",
    "| --- | --- | --- | --- | --- |"
  ];

  for (const row of coverageRows) {
    lines.push(`| ${row.id} | ${row.area} | ${row.suite} | ${row.covered ? "yes" : "no"} | ${row.requirement} |`);
  }

  lines.push("");
  return lines.join("\n");
}
