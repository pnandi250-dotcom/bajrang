/**
 * i18n जाँच — हर `t("…")` वाक्य की बंगाली अनुवाद है या नहीं।
 * चलाना: node i18n-check.mjs   (repo के बाहर, temp फ़ोल्डर में)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = "D:/bajrang/src";
const BN = "D:/bajrang/src/lib/bn.ts";
const KATHA_BN = "D:/bajrang/src/lib/kathaBn.ts";
const CONTENT_BN = "D:/bajrang/src/lib/contentBn.ts";
const EN_DICT = "D:/bajrang/src/lib/en.ts";
const KATHA_EN = "D:/bajrang/src/lib/kathaEn.ts";
const CONTENT_EN = "D:/bajrang/src/lib/contentEn.ts";

/** पुराना अंदरूनी तरीका हटा दिया गया है, अब हर जगह t() है */
const LEGACY_INLINE = new Set();

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts") ? [full] : [];
  });
}

/** स्रोत में हर t()/translate()/fmt()/SectionTitle/label आदि से निकला हिंदी वाक्य */
function collectKeys(files) {
  const keys = new Map();
  const add = (value, where) => {
    if (!value || !/[ऀ-ॿ]/.test(value)) return;
    if (!keys.has(value)) keys.set(value, where);
  };

  for (const file of files) {
    const text = readFileSync(file, "utf-8");
    const rel = file.replace(SRC, "");
    // t("…") / translate("…") / fmt("…", {…})
    for (const m of text.matchAll(/\b(?:t|translate|fmt)\(\s*"((?:[^"\\]|\\.)*)"/g)) add(m[1], rel);
    // t(\n "…" ) — कई पंक्तियों वाला
    for (const m of text.matchAll(/\b(?:t|translate|fmt)\(\s*\n\s*"((?:[^"\\]|\\.)*)"/g)) add(m[1], rel);
    // <SectionTitle hindi="…" english="…" />
    for (const m of text.matchAll(/<SectionTitle\s+hindi="([^"]*)"/g)) add(m[1], rel);
    // कोई भी JSX text node जो साफ़ हिंदी वाक्य हो
    for (const m of text.matchAll(/>\s*([ऀ-ॿ][^<>{}\n]{3,})\s*</g)) add(m[1].trim(), rel);
    // <label="…" /> जैसे props (label="…")
    for (const m of text.matchAll(/\blabel="([^"]*[ऀ-ॿ][^"]*)"/g)) add(m[1], rel);
  }
  return keys;
}

function readKeysFrom(file, exportName) {
  const text = readFileSync(file, "utf-8");
  const keys = new Set();
  for (const m of text.matchAll(/^\s{2}"((?:[^"\\]|\\.)*)":/gm)) keys.add(m[1]);
  for (const m of text.matchAll(/^\s{4}"((?:[^"\\]|\\.)*)":/gm)) keys.add(m[1]);
  return { text, keys };
}

const keys = collectKeys(walk(SRC));
function keysOf(file) {
  const raw = readFileSync(file, "utf-8");
  const out = new Set();
  for (const line of raw.split("\n")) {
    // टिप्पणी की पंक्ति कभी कुंजी नहीं होती
    if (!/^\s{2}\S/.test(line) || line.trim().startsWith("*") || line.trim().startsWith("//")) continue;
    const m = line.match(/^\s{2}("(?:[^"\\]|\\.)*"|[^"\s:][^:]*):/);
    if (!m) continue;
    out.add(m[1].startsWith('"') ? m[1].slice(1, -1) : m[1].trim());
  }
  return out;
}
const bnKeys = keysOf(BN);
const enKeys = keysOf(EN_DICT);

const missing = [];
const missingEn = [];
for (const [key, where] of keys) {
  if (LEGACY_INLINE.has(key)) continue;
  if (!bnKeys.has(key)) missing.push(`${where}  →  ${key}`);
  if (!enKeys.has(key)) missingEn.push(`${where}  →  ${key}`);
}

// श्लोक और कथा के अनुवाद की गिनती
const katha = readFileSync(KATHA_BN, "utf-8");
const kathaCount = (katha.match(/^\s{2}\d+: \{/gm) ?? []).length;
const content = readFileSync(CONTENT_BN, "utf-8");
const verseCount = (content.match(/"source":/g) ?? []).length;
const hopeCount = (content.match(/export const HOPE_BN[\s\S]*?\];/)?.[0].match(/"/g).length ?? 0) / 2;
const kathaEn = readFileSync(KATHA_EN, "utf-8");
const kathaEnCount = (kathaEn.match(/^\s{2}\d+: \{/gm) ?? []).length;
const contentEn = readFileSync(CONTENT_EN, "utf-8");
const verseEnCount = (contentEn.match(/"source":/g) ?? []).length;

// कुछ जगह key सीधे भाषा से आती है (Part.name, SANKALP_IDEAS, त्योहार) — उन्हें भी देखें
const kathaSrc = readFileSync("D:/bajrang/src/lib/katha.ts", "utf-8");
const partNames = [...kathaSrc.matchAll(/name: "([^"]+)"/g)].map((m) => m[1]);
const extra = partNames.filter((k) => !bnKeys.has(k));
const extraEn = partNames.filter((k) => !enKeys.has(k));

console.log(`UI वाक्य जाँचे: ${keys.size}`);
console.log(`kathaBn.ts के प्रसंग: ${kathaCount} (चाहिए 30)`);
console.log(`contentBn.ts के श्लोक: ${verseCount}, संदेश: ${hopeCount}`);
console.log(`kathaEn.ts के प्रसंग: ${kathaEnCount} (चाहिए 30)`);
console.log(`contentEn.ts के श्लोक: ${verseEnCount}`);
if (extra.length) console.log(`\nभाग के नाम अनुवाद में नहीं: ${extra.join(", ")}`);
if (extraEn.length) console.log(`\nभाग के नाम (English) अनुवाद में नहीं: ${extraEn.join(", ")}`);


// कवच — शब्दकोश की कुंजियाँ भी शुद्ध होनी चाहिए (कोई बंगाली अक्षर नहीं)
const dirtyDict = [];
for (const [file, set] of [["bn.ts", bnKeys], ["en.ts", enKeys]]) {
  for (const key of set) {
    if (/[\u0980-\u09FF]/.test(key) && !/^[\u0980-\u09FF\s।,?\u2014\u00b7]+$/.test(key)) {
      dirtyDict.push(`${file}  →  ${key}`);
    }
  }
}

// कवच — हिंदी वाक्य के अंदर बंगाली अक्षर नहीं होना चाहिए
const mixed = [];
for (const [key, where] of keys) {
  if (/[\u0980-\u09FF]/.test(key)) mixed.push(`${where}  →  ${key}`);
}

if (dirtyDict.length) {
  console.log(`\nशब्दकोश की कुंजी में बंगाली अक्षर (${dirtyDict.length}):`);
  for (const line of dirtyDict) console.log("  ✗ " + line);
}

if (missing.length) {
  console.log(`\nबंगाली अनुवाद नहीं (${missing.length}):`);
  for (const line of missing) console.log("  ✗ " + line);
}
if (missingEn.length) {
  console.log(`\nअंग्रेज़ी अनुवाद नहीं (${missingEn.length}):`);
  for (const line of missingEn) console.log("  ✗ " + line);
}
if (mixed.length) {
  console.log(`\nमिश्रित लिपि (${mixed.length}) — बंगाली अक्षर हिंदी वाक्य में:`);
  for (const line of mixed) console.log("  ✗ " + line);
}

if (missing.length || missingEn.length || mixed.length || dirtyDict.length) {
  console.log("\n❌ अनुवाद अधूरा है");
  process.exit(1);
}
console.log("\n✅ हर t() वाक्य का बंगाली और अंग्रेज़ी अनुवाद मौजूद है");
