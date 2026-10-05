/**
 * प्रसंगों की संरचना — पंक्तियों की संख्या, लंबाई, लिपि, सीख, नोट।
 * (सच की जाँच अलग: katha-facts-check.mjs)
 * चलाना: node katha-check.mjs
 */
import { readFileSync } from "node:fs";

const norm = (f) => readFileSync(f, "utf-8").replace(/\r\n/g, "\n");
const hi = norm("D:/bajrang/src/lib/katha.ts");
const bn = norm("D:/bajrang/src/lib/kathaBn.ts");
const en = norm("D:/bajrang/src/lib/kathaEn.ts");

let pass = 0;
let fail = 0;
const bad = [];
function check(label, ok, detail = "") {
  if (ok) pass += 1;
  else {
    fail += 1;
    bad.push(`${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// EPISODES अब RAW_DRAFTS से बनता है — वही असली लेखन है
const block = hi.slice(hi.indexOf("const RAW_DRAFTS"), hi.indexOf("const FORTHCOMING_TITLES"));
const entries = block
  .split(/\n  \{\n/)
  .slice(1)
  .map((chunk) => ({
    n: Number(chunk.match(/n: (\d+)/)?.[1]),
    title: chunk.match(/title: "([^"]+)"/)?.[1] ?? "",
    story: [...chunk.matchAll(/\n\s{6}"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]),
    lesson: chunk.match(/lesson: "([^"]+)"/)?.[1] ?? "",
    note: chunk.match(/note: "([^"]+)"/)?.[1],
  }))
  .filter((e) => e.n);

check("30 प्रसंग", entries.length === 30, `${entries.length}`);
check("क्रम 1..30", entries.every((e, i) => e.n === i + 1));

for (const ep of entries) {
  check(`प्रसंग ${ep.n}: शीर्षक`, ep.title.length > 0);
  check(`प्रसंग ${ep.n}: 2–5 अनुच्छेद`, ep.story.length >= 2 && ep.story.length <= 5, `${ep.story.length}`);
  for (const [i, para] of ep.story.entries()) {
    check(`प्रसंग ${ep.n}/${i + 1}: लंबाई`, para.length >= 40 && para.length <= 420, `${para.length}`);
    check(`प्रसंग ${ep.n}/${i + 1}: देवनागरी`, /[\u0900-\u097F]/.test(para));
    check(`प्रसंग ${ep.n}/${i + 1}: अंग्रेज़ी अक्षर नहीं`, !/[A-Za-z]/.test(para));
  }
  check(`प्रसंग ${ep.n}: सीख`, ep.lesson.length > 8 && ep.lesson.length <= 90, `${ep.lesson.length}`);
}

// अनुवाद — हर प्रसंग मिला, और अनुच्छेदों की संख्या एक जैसी
for (const [lang, text] of [["bn", bn], ["en", en]]) {
  const parts = text.split(/\n  (?=\d+: \{)/).slice(1);
  check(`${lang}: 30 प्रविष्टियाँ`, parts.length === 30, `${parts.length}`);
  for (const ep of entries) {
    const chunk = parts.find((c) => c.trimStart().startsWith(`${ep.n}: {`));
    const idx = parts.indexOf(chunk);
    check(`${lang}: प्रसंग ${ep.n} मौजूद`, Boolean(chunk));
    if (!chunk) continue;
    const paras = ([...parts[idx].matchAll(/\n\s{6}"((?:[^"\\]|\\.)*)"/g)] ?? []).length;
    check(`${lang}: प्रसंग ${ep.n} अनुच्छेद ${ep.story.length}`, paras === ep.story.length, `${paras}`);
  }
}

// नोट वहाँ ही जहाँ परंपरा में मतभेद है
check("नोट सिर्फ़ 8, 13, 30 पर", entries.filter((e) => e.note).map((e) => e.n).join(",") === "8,13,30",
  entries.filter((e) => e.note).map((e) => e.n).join(","));

console.log(`कथा-संरचना: ${pass + fail} में ${pass} पास, ${fail} फेल`);
if (fail) {
  for (const item of bad.slice(0, 30)) console.log("  ✗ " + item);
  process.exit(1);
}
