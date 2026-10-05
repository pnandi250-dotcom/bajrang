/**
 * Android: रीबूट के बाद संदेश — दावा स्रोत से जाँचो, दस्तावेज़ से नहीं।
 * (पिछली बार docs/PLAY-PRELAUNCH.md ने ग़लत बात लिखी थी; अब यह जाँचता है।)
 * चलाना: node android-boot-check.mjs
 */
import { readFileSync, existsSync } from "node:fs";

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

const ROOT = "D:/bajrang";
const PLUGIN = `${ROOT}/node_modules/@capacitor/local-notifications/android/src/main`;
const MANIFEST = `${PLUGIN}/AndroidManifest.xml`;
const RECEIVER = `${PLUGIN}/java/com/capacitorjs/plugins/localnotifications/LocalNotificationRestoreReceiver.java`;

/* 1. प्लगइन अभी भी receiver लेकर आ रहा है? */
if (!existsSync(MANIFEST)) {
  console.log("❌ प्लगइन का manifest नहीं मिला — node_modules इंस्टॉल करें।");
  process.exit(1);
}

const manifest = readFileSync(MANIFEST, "utf-8");
check("प्लगइन में restore receiver है", manifest.includes("LocalNotificationRestoreReceiver"));
check("वह BOOT_COMPLETED सुनता है", manifest.includes("android.intent.action.BOOT_COMPLETED"));
check("वह LOCKED_BOOT_COMPLETED भी सुनता है", manifest.includes("LOCKED_BOOT_COMPLETED"));
check("प्लगइन RECEIVE_BOOT_COMPLETED घोषित करता है", manifest.includes("RECEIVE_BOOT_COMPLETED"));

/* 2. receiver असली में पुनः-शेड्यूल करता है? */
if (!existsSync(RECEIVER)) {
  console.log("⚠️ receiver का स्रोत नहीं मिला (AAR में बंद हो सकता है) — manifest से पुष्टि पर्याप्त है।");
} else {
  const src = readFileSync(RECEIVER, "utf-8");
  check("receiver शेड्यूल दोबारा लगाता है", /localNotificationManager\.schedule/.test(src));
  check("receiver छूटी समय की सूचना बनाता है", /new Date\(\)\.getTime\(\) \+ 15 \* 1000/.test(src));
}

/* 3. हमारा अनुष्ठान उसी storage में जाता है? */
const reminder = readFileSync(`${ROOT}/src/lib/reminder.ts`, "utf-8");
check("हम schedule() से लगाते हैं", reminder.includes("LocalNotifications.schedule"));
check("हमारा संदेश plugin के schedule से जाता है", /LocalNotifications\.schedule\(\{/.test(reminder));

/* 4. दस्तावेज़ फिर ग़लत न हो */
const doc = readFileSync(`${ROOT}/docs/PLAY-PRELAUNCH.md`, "utf-8");
check("दस्तावेज़ में 'receiver + native Java' का ग़लत निर्देश नहीं", !doc.includes("receiver + native Java"));
check("दस्तावेज़ प्लगइन के receiver का हवाला देता है", doc.includes("LocalNotificationRestoreReceiver"));
check("दस्तावेज़ असली फ़ोन-जाँच की बात कहता है", doc.includes("असली फ़ोन पर"));

/* 5. हमारा manifest — USE_EXACT_ALARM नहीं, SCHEDULE_EXACT_ALARM है */
const app = readFileSync(`${ROOT}/android/app/src/main/AndroidManifest.xml`, "utf-8");
check("SCHEDULE_EXACT_ALARM घोषित है", app.includes("android.permission.SCHEDULE_EXACT_ALARM"));
check("USE_EXACT_ALARM हटा हुआ है", !app.includes("android.permission.USE_EXACT_ALARM"));

console.log(`एंड्रॉइड रीबूट-जाँच: ${pass + fail} में ${pass} पास, ${fail} फेल`);
if (fail) {
  for (const item of bad) console.log("  ✗ " + item);
  process.exit(1);
}