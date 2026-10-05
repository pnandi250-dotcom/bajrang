/**
 * पाठ-सत्यापन — ऐप की हर पंक्ति उतारे गए स्रोत-पाठ में यथावत होनी चाहिए।
 *
 * स्रोत: `fixtures/chalisa-source.txt` — तीन स्वतंत्र प्रकाशनों से उतारा
 * गया साफ़ पाठ (कैसे बनाया गया: `build-source-fixture.py`)।
 * इसलिए यह जाँच बिना इंटरनेट भी चलती है।
 *
 * चलाना: node scripts/checks/chalisa-source-check.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const norm = (s) => s.replace(/[।॥|,‘’“”"'०-९0-9\s‌‍]/g, "");

const content = readFileSync(join(ROOT, "src/lib/content.ts"), "utf-8").replace(/\r\n/g, "\n");
const fixture = readFileSync(join(HERE, "fixtures", "chalisa-source.txt"), "utf-8");

// स्रोत-पाठ को स्रोत-अनुसार बाँटो
const witnesses = fixture
  .split(/^### /m)
  .slice(1)
  .map((chunk) => {
    const nl = chunk.indexOf("\n");
    return { name: chunk.slice(0, nl).trim(), text: norm(chunk.slice(nl + 1)) };
  })
  .filter((w) => w.text.length > 100);

let pass = 0;
let fail = 0;
const bad = [];
const check = (label, ok, detail = "") => {
  if (ok) pass += 1;
  else {
    fail += 1;
    bad.push(`${label}${detail ? ` — ${detail}` : ""}`);
  }
};

check("तीन स्रोत मौजूद", witnesses.length === 3, `${witnesses.length}`);

// स्रोत का हवाला
check("CHALISA_SOURCE मौजूद", content.includes("export const CHALISA_SOURCE"));
check("स्रोत का URL लिखा", content.includes("https://www.shridharam.com/hanuman-chalisa"));
check("खोज की तारीख लिखी", content.includes("retrieved:"));

const block = content.slice(content.indexOf("export const VERSES"), content.indexOf("export const HOPE_MESSAGES"));
const entries = block
  .split(/\n  \{\n/)
  .slice(1)
  .map((chunk) => {
    const head = chunk.split("meaning:")[0];
    return {
      id: head.match(/id: "([^"]+)"/)?.[1] ?? "",
      lines: [...head.matchAll(/\n\s{6}"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"')),
    };
  })
  .filter((e) => e.id);

check("43 चालीसा + 2 मंत्र = 45 प्रविष्टियाँ", entries.length === 45, `${entries.length}`);

let matchedAny = 0;
let matchedAll = 0;
const unverified = [];

for (const entry of entries) {
  for (const [i, line] of entry.lines.entries()) {
    const n = norm(line);
    const fromChalisa = entry.id.startsWith("chalisa-");
    const hits = witnesses.filter((w) => w.text.includes(n)).length;
    if (fromChalisa) {
      if (hits > 0) matchedAny += 1;
      if (hits === witnesses.length) matchedAll += 1;
      if (hits === 0) unverified.push(`${entry.id} पंक्ति ${i + 1}`);
    }
    check(
      `${entry.id} पंक्ति ${i + 1}`,
      fromChalisa ? hits > 0 : true,
      hits === 0 ? "स्रोत में नहीं मिली" : "",
    );
  }
}

// जो पहले ग़लत था, वह लौट आया तो नहीं
for (const phrase of [
  "निज मनु की छाऊँ",
  "जहाँ जन्म हनुमान जोई",
  "बुद्धिरबल समला जाने",
  "कहाँ राम कहाँ जामुना",
  "नव खंड जोत लियो ठोट",
  "चालीसा नहीं",
]) {
  check(`ग़लत पंक्ति हटी है: "${phrase}"`, !block.includes(phrase));
}

check("मंत्र साफ़-साफ़ अलग लेबल के साथ", block.includes("मंत्र — चालीसा का भाग नहीं"));
check("कोई भी पंक्ति verified नहीं", !block.match(/verified: true/));

console.log(`पाठ-सत्यापन: ${pass + fail} में ${pass} पास, ${fail} फेल`);
console.log(
  `  चालीसा की पंक्तियाँ: ${matchedAny} कम से कम एक स्रोत में यथावत · ${matchedAll} सब ${witnesses.length} स्रोतों में यथावत`,
);
if (unverified.length) console.log(`  स्रोत में न मिलीं: ${unverified.join(", ")}`);
if (fail) {
  for (const item of bad.slice(0, 20)) console.log("  ✗ " + item);
  process.exit(1);
}
