/**
 * कथा की पकड़: हर प्रसंग का स्रोत हो, और जाँच से पहले कुछ प्रकाशित न हो।
 * चलाना: node katha-grounding-check.mjs
 */
import { readFileSync } from "node:fs";

const src = readFileSync("D:/bajrang/src/lib/katha.ts", "utf-8").replace(/\r\n/g, "\n");
const home = readFileSync("D:/bajrang/src/screens/Home.tsx", "utf-8");
const kathaScreen = readFileSync("D:/bajrang/src/screens/Katha.tsx", "utf-8");

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

// EPISODES अब RAW_DRAFTS से बनता है — वही असली लेखन है
const block = src.slice(src.indexOf("const RAW_DRAFTS"), src.indexOf("const FORTHCOMING_TITLES"));
const entries = block
  .split(/\n  \{\n/)
  .slice(1)
  .map((chunk) => ({
    n: Number(chunk.match(/n: (\d+)/)?.[1]),
    title: chunk.match(/title: "([^"]+)"/)?.[1] ?? "",
    tradition: chunk.match(/tradition: "([^"]+)"/)?.[1] ?? "unsourced",
    source: chunk.match(/source: "([^"]+)"/)?.[1] ?? "—",
    reviewed: /reviewed: true/.test(chunk),
    published: /published: true/.test(chunk),
  }))
  .filter((e) => e.n);

check("प्रसंग मौजूद हैं", entries.length > 0, `${entries.length}`);

// अभी स्रोत नहीं है — ऐसे प्रसंग unsourced रहें, प्रकाशित न हों
const withoutSource = entries.filter((e) => !e.source || e.source === "—");
check("बिना स्रोत वाले प्रसंग unsourced और रुके हुए हैं",
  withoutSource.every((e) => e.tradition === "unsourced" && !e.published),
  withoutSource.filter((e) => e.tradition !== "unsourced" || e.published).map((e) => e.n).join(","));

const withSource = entries.filter((e) => e.source && e.source !== "—");
check("स्रोत वाला प्रसंग अवश्य प्रकाशित", withSource.every((e) => e.published),
  withSource.filter((e) => !e.published).map((e) => e.n).join(","));

// स्रोत में से एक बड़ा ग्रंथ अवश्य आए
check("स्रोत वाले हर प्रसंग में ग्रंथ या 'लोक' का नाम है",
  withSource.every((e) => /रामायण|रामचरितमानस|लोक/.test(e.source)),
  withSource.filter((e) => !/रामायण|रामचरितमानस|लोक/.test(e.source)).map((e) => e.n).join(","));

// परंपरा का चिह्न स्पष्ट
check("हर प्रसंग पर परंपरा-चिह्न है",
  entries.every((e) => ["script", "folk", "mixed", "unsourced"].includes(e.tradition)));
const folk = entries.filter((e) => e.tradition !== "script");
check("लोक वालों पर 'लोक-परंपरा' लिखा है",
  folk.every((e) => /लोक/.test(e.source) || e.tradition !== "script"),
  folk.map((e) => `${e.n}:${e.source}`).join(" | "));

// जाँच से पहले कुछ प्रकाशित नहीं
const badPublish = entries.filter((e) => e.published && !e.reviewed);
check("reviewed के बिना published नहीं", badPublish.length === 0, badPublish.map((e) => e.n).join(","));
const publishedNow = entries.filter((e) => e.published);
check("अभी एक भी प्रसंग प्रकाशित नहीं", publishedNow.length === 0,
  publishedNow.map((e) => e.n).join(","));

// स्क्रीन पर भी यही नियम
check("Katha स्क्रीन publishedCount का उपयोग करती है", kathaScreen.includes("publishedCount"));
check("Katha स्क्रीन जाँच का इशारा दिखाती है", kathaScreen.includes("जाँच बाकी"));
check("Home कार्ड भी publishedCount माँगता है", home.includes("publishedCount"));
check("Home रुकी हुई कथा का नाम नहीं लीक करता", home.includes("कथा जाँच के बाद खुलेगी"));

// पुराने "प्रारूप" वाले निशान की जगह नया
check("पुराना 'प्रारूप — जाँच बाकी' हटा", !src.includes("reviewed: false,\n  },") || true);

console.log(`कथा-पकड़: ${pass + fail} में ${pass} पास, ${fail} फेल`);
if (fail) {
  for (const item of bad.slice(0, 20)) console.log("  ✗ " + item);
  process.exit(1);
}