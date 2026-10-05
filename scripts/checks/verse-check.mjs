/**
 * पंक्तियों की अखंडता — नई संरचना: ४३ चालीसा इकाई + २ मंत्र
 * (पाठ-स्रोत की जाँच अलग: chalisa-source-check.mjs)
 */
import { readFileSync } from "node:fs";

const home = readFileSync("D:/bajrang/src/screens/Home.tsx", "utf-8");

const src = readFileSync("D:/bajrang/src/lib/content.ts", "utf-8").replace(/\r\n/g, "\n");
const bn = readFileSync("D:/bajrang/src/lib/contentBn.ts", "utf-8").replace(/\r\n/g, "\n");
const en = readFileSync("D:/bajrang/src/lib/contentEn.ts", "utf-8").replace(/\r\n/g, "\n");

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

const block = src.slice(src.indexOf("export const VERSES"), src.indexOf("export function verseOfDay"));
const entries = block
  .split(/\n  \{\n/)
  .slice(1)
  .map((chunk) => {
    const head = chunk.split("meaning:")[0];
    return {
      id: head.match(/id: "([^"]+)"/)?.[1] ?? "",
      source: head.match(/source: "([^"]+)"/)?.[1] ?? "",
      lines: [...head.matchAll(/\n\s{6}"((?:[^"\\]|\\.)*)"/g)].map((m) =>
        m[1].replace(/\\"/g, '"'),
      ),
      meaning: chunk.match(/meaning:\s*\n?\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "",
      verified: /verified: true/.test(chunk),
      meaningReviewed: /meaningReviewed: true/.test(chunk),
    };
  })
  .filter((e) => e.id);

const chalisa = entries.filter((e) => e.id.startsWith("chalisa-"));
const mantras = entries.filter((e) => e.id.startsWith("mantra-"));

check("४३ चालीसा इकाई", chalisa.length === 43, `${chalisa.length}`);
check("२ मंत्र", mantras.length === 2, `${mantras.length}`);
check("क्रम 1..43", chalisa.every((e, i) => e.id === `chalisa-${i + 1}`));
check("२ आरंभ दोहे", chalisa.slice(0, 2).every((e) => e.source.endsWith("आरंभ दोहा")));
check("४० चौपाई", chalisa.slice(2, 42).every((e) => e.source.includes("चौपाई")));
check("१ समापन दोहा", chalisa[42].source.endsWith("समापन दोहा"));
check("मंत्र का लेबल साफ़", mantras.every((e) => e.source.includes("चालीसा का भाग नहीं")));

for (const e of entries) {
  const isChalisa = e.id.startsWith("chalisa-");
  check(`${e.id}: पंक्तियाँ`, isChalisa ? e.lines.length === 2 : e.lines.length === 1, `${e.lines.length}`);
  for (const line of e.lines) {
    check(`${e.id}: देवनागरी`, /[ऀ-ॿ]/.test(line));
    check(`${e.id}: अंग्रेज़ी नहीं`, !/[A-Za-z]/.test(line));
    if (isChalisa) check(`${e.id}: अंत दण्ड`, /[।॥]+$/u.test(line), line.slice(-8));
  }
  check(`${e.id}: अर्थ लिखा`, e.meaning.length > 20, `${e.meaning.length}`);
  check(`${e.id}: अर्थ में देवनागरी`, /[ऀ-ॿ]/.test(e.meaning));
  check(`${e.id}: जाँच अभी नहीं`, e.verified === false);
}

// अर्थ अपनी ही पंक्ति की बात करे — बहुत लंबे/टूटे अर्थ नहीं
const long = entries.filter((e) => e.meaning.length > 260);
check("कोई अर्थ बहुत लंबा नहीं", long.length === 0, long.map((e) => e.id).join(","));

// अनुवाद — हर id मौजूद
for (const [lang, text] of [["bn", bn], ["en", en]]) {
  for (const e of entries) {
    check(`${lang}: ${e.id}`, new RegExp(`"${e.id}":\\s*\\{`).test(text));
  }
}

// जो पहले ग़लत था, वह लौटा तो नहीं
for (const phrase of [
  "निज मनु की छाऊँ",
  "जहाँ जन्म हनुमान जोई",
  "बुद्धिरबल समला जाने",
  "कहाँ राम कहाँ जामुना",
  "नव खंड जोत लियो ठोट",
  "चालीसा नहीं",
]) {
  check(`ग़लत पंक्ति हटी: "${phrase}"`, !block.includes(phrase));
}


// सुधारे गए अर्थ — ये शब्द वापस नहीं आने चाहिए (पाठक ने इन्हें ग़लत बताया था)
const MEANING_FIXES = [
  ["chalisa-3", /वानों का स्वामी/, /पवन के पुत्र हनुमान की जय/],
  ["chalisa-15", /शेषनाथ/, /हज़ार भूतियों/],
  ["chalisa-20", /मधुर फल समझकर/, /छेल लिया|अनगिनत युग/],
  ["chalisa-25", /गर्जना से तीनों लोक काँप/, /हाँकते हैं और काँपते हैं/],
  ["chalisa-30", /अमित जीवन का फल ही मिलेगा/, /मनोरथ लाता है, उसी को वे/],
  ["chalisa-42", /निवास/, /डोर बाँधना/],
];
for (const [id, must, mustNot] of MEANING_FIXES) {
  const entry = entries.find((e) => e.id === id);
  check(`${id}: सुधारा अर्थ लगा है`, entry ? must.test(entry.meaning) : false,
    entry ? entry.meaning.slice(0, 60) : "प्रविष्टि नहीं");
  check(`${id}: पुराना ग़लत अर्थ गया`, entry ? !mustNot.test(entry.meaning) : false);
}


// अर्थ — जब तक जाँच न हो, स्क्रीन पर नहीं दिखना चाहिए
const unreviewed = entries.filter((e) => !e.meaningReviewed).length;
check("हर अर्थ पर meaningReviewed लिखा है", entries.every((e) => typeof e.meaningReviewed === "boolean"));
check("अभी कोई अर्थ जाँचा हुआ नहीं है", unreviewed === entries.length, `${unreviewed} जाँचे हुए`);
check("वर्स-व्यू जाँच के बिना अर्थ नहीं भरता", /meaning: verse\.meaningReviewed/.test(src),
  "verseView() जाँच के बिना भी अर्थ लौटा रहा है");
check("Home अर्थ छिपाता है", /verse\.meaningReviewed \? \(/.test(home));
check("Ritual अर्थ छिपाता है", /if \(verse\.meaning\)/.test(
  readFileSync("D:/bajrang/src/screens/Ritual.tsx", "utf-8"),
));

console.log(`पंक्ति अखंडता: ${pass + fail} में ${pass} पास, ${fail} फेल`);
if (fail) {
  for (const item of bad.slice(0, 25)) console.log("  ✗ " + item);
  process.exit(1);
}