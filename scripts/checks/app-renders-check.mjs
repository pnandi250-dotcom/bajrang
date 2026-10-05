/**
 * ऐप सचमुच खुलता है या नहीं — यह सबसे पहली जाँच है।
 *
 * एक बार Phase-2 में `getDerived()` हर बार नई वस्तु बना देता था, React infinite
 * loop में चला गया, और स्क्रीन **सफ़ेद** हो गई — जबकि build, lint और 55 इकाई
 * परीक्षण पास थे। इसलिए यह जाँच अब `npm run check:content` का हिस्सा है।
 *
 * चलाना: node scripts/checks/app-renders-check.mjs   (पहले `npm run preview` चालू हो)
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const URL = process.env.APP_URL ?? "http://localhost:4173/";

if (!existsSync("node_modules/puppeteer-core")) {
  console.log("⚠️  puppeteer-core नहीं — यह जाँच छोड़ दी गई (सर्वर भी नहीं चलाया गया)।");
  process.exit(0);
}

const probe = `
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const p = await b.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(String(e).split("\\n")[0]));
await p.goto("${URL}", { waitUntil: "networkidle0", timeout: 45000 });
await new Promise((r) => setTimeout(r, 1200));
const out = await p.evaluate(() => ({
  children: document.getElementById("root")?.childElementCount ?? 0,
  text: (document.body.innerText ?? "").trim().length,
}));
await b.close();
console.log(JSON.stringify({ ...out, errors }));
`;

const res = spawnSync(process.execPath, ["--input-type=module", "-e", probe], {
  encoding: "utf-8",
  timeout: 90000,
});

let result = null;
try {
  result = JSON.parse((res.stdout || "").trim().split("\n").pop() || "{}");
} catch {
  /* नीचे साफ़ बताएँगे */
}

const label = "ऐप खुली";
if (!result) {
  console.log(`✗ ${label} — जाँच चली ही नहीं (सर्वर ${URL} पर चला है? कोई puppeteer त्रुटि?)`);
  if (res.stderr) console.log("  " + res.stderr.split("\n")[0]);
  process.exit(1);
}

const ok = result.children > 0 && result.text > 40 && (!result.errors || result.errors.length === 0);
if (!ok) {
  console.log(`✗ ${label} — root के बच्चे: ${result.children}, दिखने वाला टेक्स्ट: ${result.text} अक्षर`);
  for (const e of result.errors ?? []) console.log("  भूल: " + e.slice(0, 160));
  console.log("  (यह जाँच इसलिए है कि सफ़ेद स्क्रीन कभी पास न हो)");
  process.exit(1);
}
console.log(`✓ ${label} — ${result.children} घटक, ${result.text} अक्षर दिखे, कोई त्रुटि नहीं`);
