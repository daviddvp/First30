/* Ejecuta todas las suites en orden y resume. npx tsx scripts/test-all.ts */
import { execSync } from "node:child_process";

const suites = [
  "test-seed: validate-seed.ts",
  "test-engines.ts",
  "test-api.ts",
  "test-permissions.ts",
  "test-detail.ts",
  "test-reports.ts",
];
let failed = 0;
for (const s of suites) {
  const file = s.includes(":") ? s.split(": ")[1] : s;
  const name = file.replace(".ts", "");
  try {
    execSync(`npx tsx scripts/${file}`, { stdio: "pipe" });
    console.log(`\u2713 ${name}`);
  } catch (e) {
    failed++;
    console.log(`\u2717 ${name}`);
    const out = (e as { stdout?: Buffer }).stdout?.toString() ?? "";
    console.log(out.split("\n").filter((l) => l.includes("\u2717")).join("\n"));
  }
}
console.log(failed === 0 ? "\nTODAS LAS SUITES OK \u2705" : `\n${failed} suite(s) con fallos \u274c`);
process.exit(failed === 0 ? 0 : 1);
