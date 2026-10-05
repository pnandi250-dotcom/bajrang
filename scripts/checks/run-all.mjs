/**
 * सारी सामग्री-जाँचें एक साथ — यही CI में चलती है।
 * ये जाँचें वे नहीं देखतीं जो हमने ग़लत लिखा है, बल्कि वे जो आकार और
 * "कहा-कहा" ज़रूरी है, उसे पकड़ती हैं: पंक्तियाँ स्रोत से मिलती हैं या नहीं,
 * अनुवाद हर जगह है या नहीं, कथा का स्रोत दर्ज है या नहीं, Android manifest
 * ठीक है या नहीं।
 *
 * चलाना: npm run check:content
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// (फ़ाइल, क्या जाँचता है)
const CHECKS = [
  ["chalisa-source-check.mjs", "श्लोक-पाठ स्रोत से यथावत मिलता है"],
  ["verse-check.mjs", "श्लोकों की संरचना, अर्थ-दरवाज़ा, सुधारे गए अर्थ"],
  ["i18n-check.mjs", "हर UI वाक्य का बंगाली और अंग्रेज़ी अनुवाद"],
  ["katha-check.mjs", "कथा की संरचना और अनुवादों की गिनती"],
  ["katha-facts-check.mjs", "कथा में ज्ञात-ग़लत तथ्य लौटे नहीं"],
  ["katha-grounding-check.mjs", "कथा प्रकाशित न हो जब तक जाँच न हो"],
  ["android-boot-check.mjs", "रीबूट receiver और exact-alarm की स्थिति"],
  ["app-renders-check.mjs", "ऐप सचमुच खुलती है (सफ़ेद स्क्रीन नहीं)"],
];

let failed = 0;
for (const [file, what] of CHECKS) {
  process.stdout.write(`\n▶ ${file} — ${what}\n`);
  const result = spawnSync(process.execPath, [join(HERE, file)], { stdio: "inherit" });
  if (result.status !== 0) failed += 1;
}

console.log(
  failed === 0
    ? `\n✅ सभी ${CHECKS.length} जाँचें पास`
    : `\n❌ ${failed} / ${CHECKS.length} जाँचें फेल`,
);
process.exit(failed === 0 ? 0 : 1);
