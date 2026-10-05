import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--mute-audio"],
});

let pass = 0;
let fail = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "✅" : "❌"} ${label}: ${ok ? actual : `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}
const T = JSON.parse(readFileSync(new URL("./expected.json", import.meta.url), "utf-8"));
const FRAGMENT = "किसी प्रमाणिक संस्करण से म";
const body = (p) => p.evaluate(() => document.body.innerText);
const has = async (p, t) => (await body(p)).includes(t);
const nav = (p, t) =>
  p.evaluate((text) => {
    const b = [...document.querySelectorAll("nav button")].find((x) => x.textContent.includes(text));
    b?.click();
    return Boolean(b);
  }, t);

const state = {
  version: 1,
  profile: {
    name: "सीता",
    sankalp: "परीक्षा",
    reminderTime: "06:00",
    reminderEnabled: false,
    chantingEnabled: false,
    onboarded: true,
    createdAt: "2026-09-01",
  },
  bestStreak: 10,
  totalCompleted: 10,
  completedDates: ["2026-10-04"],
  streak: 3,
  kathaRevealed: 2,
  kathaRead: 1,
  lastCompleted: "2026-10-04",
};

const p = await browser.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
p.on("pageerror", (e) => console.log("  PAGEERROR", e.message));
await p.goto("http://localhost:4173/", { waitUntil: "networkidle0" });
await p.evaluate((json) => localStorage.setItem("bajrang.state.v1", json), JSON.stringify(state));
await p.reload({ waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 500));

console.log("== होम पर जाँच-निशान ==");
check("श्लोक के नीचे 'जाँच बाकी'", await has(p, "जाँच बाकी"), true);
check("यह स्पष्ट बताया गया है कि जाँच नहीं हुई", await has(p, FRAGMENT), true);
check("अर्थ नहीं दिखाया जा रहा", await has(p, "दायकु फल चारि यानी धर्म"), false);
check("अर्थ छिपने का संकेत है", await has(p, "अर्थ अभी जाँचा नहीं गया"), true);

console.log("== सेटिंग्स में गिनती ==");
await nav(p, "सेटिंग");
await new Promise((r) => setTimeout(r, 500));
const s = await body(p);
check("जाँच कार्ड मौजूद", s.includes("पंक्तियों की जाँच"), true);
check("गिनती ० / ४५ दिखती है", /०\s*\/\s*४५/.test(s), true);
check("स्रोत बताया गया", s.includes("shridharam.com"), true);
check("पाठ और अर्थ का फ़र्क बताया", s.includes("क्या अभी बाकी है"), true);
check("अर्थ की गिनती दिखी", s.includes("० / ४३ जाँचे गए"), true);

console.log("== कथा — जाँच और स्रोत का इशारा ==");
await nav(p, "कथा");
await new Promise((r) => setTimeout(r, 500));
check("कथा रुकी हुई है — जाँच का इशारा", await has(p, "जाँच बाकी"), true);
check("स्रोत की बात साफ़ कही गई", await has(p, "वाल्मीकि रामायण"), true);
check("प्रसंग का लेखन स्क्रीन पर नहीं", await has(p, "पवन और अंजनी"), false);

console.log("== ग़लत पंक्तियाँ स्क्रीन पर नहीं ==");
for (const line of [
  "जहाँ जन्म हनुमान जोई",
  "बुद्धिरबल समला जाने",
  "कहाँ राम कहाँ जामुना",
  "नव खंड जोत लियो ठोट",
  "निज मनु की छाऊँ",
  "चालीसा नहीं",
]) {
  check(`"${line.slice(0, 20)}" गायब`, await has(p, line), false);
}

console.log("== पूजा-स्क्रीन पर भी निशान ==");
await nav(p, "आज");
await new Promise((r) => setTimeout(r, 400));
await p.evaluate((label) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(label));
  b?.click();
}, T["home.start_pray"]);
await new Promise((r) => setTimeout(r, 800));
check("पूजा खुली", await has(p, T["ritual.sound_prompt"]), true);
await p.evaluate((label) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(label));
  b?.click();
}, T["ritual.silent"]);
await new Promise((r) => setTimeout(r, 900));
check("पाठ-स्रोत स्क्रीन पर", await has(p, T["ritual.text_source"]), true);
check("कल का चालीसा इशारा पूजा में", await has(p, T["ritual.yatra_teaser"]), true);

await browser.close();
console.log(`\n${pass + fail} checks — ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);