/**
 * कथा की अखंडता — जो ग़लतियाँ पता चलीं, वे दोबारा न आएँ।
 * चलाना: node katha-facts-check.mjs
 *
 * यह स्क्रिप्ट "सच" की जाँच नहीं कर सकती — वह विद्वान पाठक करेगा। यह सिर्फ़
 * उन ज्ञात-ग़लत पंक्तियों को रोकती है जो पिछली समीक्षा में मिलीं।
 */
import { readFileSync } from "node:fs";

const norm = (f) => readFileSync(f, "utf-8").replace(/\r\n/g, "\n");
const files = {
  hi: norm("D:/bajrang/src/lib/katha.ts"),
  bn: norm("D:/bajrang/src/lib/kathaBn.ts"),
  en: norm("D:/bajrang/src/lib/kathaEn.ts"),
};

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

/** हर भाषा में प्रसंग अलग-अलग निकालो */
function episodeBody(text, n, marker) {
  const start = text.indexOf(`  ${n}: {`);
  if (start < 0) return "";
  const end = text.indexOf(`\n  },`, start);
  return text.slice(start, end < 0 ? text.length : end);
}

const RULES = [
  // [प्रसंग, बिलना-चाहिए-वह शब्द, क्यों]
  [3, "इंद्रजीत", "इंद्रजीत रावण का पुत्र है, इंद्र का नहीं"],
  [3, "सूर्य के मुख", "यह वर्णन मान्य नहीं है"],
  [8, "ललित", "ललित का वर्णन मुख्य रामायणों में नहीं"],
  [8, "इंद्र की पुत्री", "वह वंश ईजाद किया गया था"],
  [8, "पुराण", "पुराणों का हवाला देना ठीक नहीं"],
  [26, "सन्ध्या के पुत्र", "शत्रुघ्न सुमित्रा के पुत्र हैं"],
  [26, "सन्ध्या", "यह चालीसा के विरोधाभास से उपेक्षा गया नाम है"],
  [30, "रावण की पुत्री राखमा", "मुख्य रामायण में पत्नी सुवर्चला है"],
];

for (const [lang, text] of Object.entries(files)) {
  for (const [n, needle, why] of RULES) {
    const body = episodeBody(text, n, lang);
    check(`${lang} प्रसंग ${n}: "${needle}" नहीं (${why})`, !body.includes(needle));
  }
}

// सुवर्चला और सुमित्रा अब स्पष्ट रूप से आने चाहिए
check("hi प्रसंग 26 में सुमित्रा", files.hi.includes("सुमित्रा"));
check("hi प्रसंग 30 में सुवर्चला", files.hi.includes("सुवर्चला"));
check("bn प्रसंग 30 में সুবর্চলা", files.bn.includes("সুবর্চলা"));
check("en प्रसंग 30 में Suvarchala", files.en.includes("Suvarchala"));
check("en प्रसंग 26 में Sumitra", files.en.includes("Sumitra"));

// टूटे वाक्य — जाँचने योग्य गंदगी के निशान
const BROKEN = ["तो क्या हुआ", "समाप्त हो गए।", "यह भी आरती का पंक्ति है", "अलिज्ञात स्रोत पर टिका"];
for (const [lang, text] of Object.entries(files)) {
  for (const phrase of BROKEN) {
    check(`${lang}: टूटा वाक्य "${phrase}" नहीं`, !text.includes(phrase));
  }
}

// तीनों भाषाओं में प्रसंग की संख्या एक जैसी
// हिंदी फ़ाइल में `    n: 3,` होता है, अनुवादों में `  3: {`
const count = (text) =>
  ((text.match(/^\s{4}n: \d+,$/gm) ?? []).length ||
    (text.match(/^\s{2}\d+: \{$/gm) ?? []).length);
check("तीनों भाषाओं में 30 प्रसंग", count(files.hi) === 30 && count(files.bn) === 30 && count(files.en) === 30,
  `${count(files.hi)}/${count(files.bn)}/${count(files.en)}`);

// हर प्रसंग अभी भी "प्रारूप" है
const reviewedCount = (files.hi.match(/^\s{4}reviewed: (true|false),$/gm) ?? []).length;
check("हर प्रसंग पर reviewed लिखा है", reviewedCount === 30, `${reviewedCount}`);
check("अभी एक भी प्रसंग जाँचा नहीं", !files.hi.match(/^\s{4}reviewed: true,$/m));

console.log(`कथा-तथ्य जाँच: ${pass + fail} में ${pass} पास, ${fail} फेल`);
if (fail) {
  for (const item of bad) console.log("  ✗ " + item);
  process.exit(1);
}