# Android: Play Store से पहले अलार्म अनुमति

यह फ़ाइल उस बात का सही-सही हिसाब है जो अभी **ठीक** है, क्या **बाकी** है, और क्या
**यहाँ से नहीं** किया जा सकता।

## स्थिति: यह मशीन APK नहीं बना सकती

इस कंप्यूटर पर Java, Android SDK, Gradle और `adb` — कुछ नहीं है। इसलिए यहाँ जो
बदला गया वह **स्रोत-स्तर पर सही** है, पर **एक बार असली फ़ोन पर चलाकर देखा नहीं
गया**। पहले ध्यान रहे: `npm run build` और `npm run lint` पास हैं, लेकिन
`cd android && ./gradlew assembleRelease` यहाँ नहीं चल सकता।

## जो पहले से सही था

- `SCHEDULE_EXACT_ALARM`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS`
  — `android/app/src/main/AndroidManifest.xml` में घोषित हैं।
- रन-टाइम पर अनुमति पूछने का ब्यूहरता पक्ष side में है:
  `src/lib/reminder.ts` में `checkExactNotificationSetting()` और
  `changeExactNotificationSetting()`, और सेटिंग्स में "अनुमति देने के लिए खोलें"
  बटन।
- `targetSdkVersion = 35` — Play की वर्तमान शर्तों के अनुरूप है।

## अभी क्या बदला

1. **`USE_EXACT_ALARM` हटा दिया गया।**
   - कारण: यह अनुमति तब दी जाती है जब ऐप "अलार्म/टाइमर ऐप" श्रेणी में हो; Play
     Store को इसकी **अलग घोषणा** करनी पड़ती है और अनुमति न मिलने पर ऐप रुक
     सकता है।
   - `SCHEDULE_EXACT_ALARM` उपयोगकर्ता से **एक बार** अनुमति लेता है (ऐप में बटन है)
     और Play को कोई विशेष घोषणा नहीं चाहिए। यही रोज़ के प्रसाद-समय के संदेश के
     लिए सही रास्ता है।
2. **`versionName` "1.0" → "0.2.0"** किया गया ताकि ऐप के भीतर दिखने वाला
   संस्करण (सेटिंग्स → "Bajrang · v0.2") और Play सूची एक जैसी रहे।

## रीबूट के बाद अलार्म — यह ठीक से सेट है

**पिछले संस्करण की फ़ाइल यहाँ ग़लत थी।** उसमें लिखा था कि `RECEIVE_BOOT_COMPLETED`
घोषित तो है पर उसे कोई receiver नहीं सुनता, और इसलिए अपना receiver तथा native Java
का कोड लिखना पड़ेगा। **दोनों बातें ग़लत थीं।**

स्रोत देखिए — `@capacitor/local-notifications` (संस्करण **7.0.7**) अपने साथ
receiver लेकर आता है:

- `node_modules/@capacitor/local-notifications/android/src/main/AndroidManifest.xml`
  में `LocalNotificationRestoreReceiver` घोषित है, जो `BOOT_COMPLETED`,
  `LOCKED_BOOT_COMPLETED` और `QUICKBOOT_POWERON` सुनता है।
- वही फ़ाइल `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` और `POST_NOTIFICATIONS`
  भी घोषित करती है — Gradle का manifest-merger इन्हें हमारे APK में जोड़ देता है।
- `LocalNotificationRestoreReceiver.java` रीबूट पर संरक्षित संदेशों को फिर से
  शेड्यूल करता है; और जो समय रीबूट के दौरान बीत गया हो, उसे लगभग १५ सेकंड बाद
  दिखा देता है।

हमारा अनुष्ठान `LocalNotifications.schedule()` से लगता है (`src/lib/reminder.ts`),
इसलिए वह इसी storage में संरक्षित होता है और रीबूट के बाद वापस आ जाता है।

**इसलिए कोई custom receiver नहीं लिखना है।**

### असली जाँच: असली फ़ोन पर

यहाँ Java/SDK/adb नहीं है, इसलिए यह जाँच यहीं नहीं हो सकती। प्रकाशन से पहले:

1. Android ऐप इंस्टॉल करें, रोज़ का संदेश चालू करें, "ठीक समय पर संदेश" वाली अनुमति
   भी दे दें।
2. **फ़ोन बंद करके चालू कीजिए।**
3. अगली सुबह देखिए कि संदेश आया या नहीं।
4. यदि न आए — तभी जाँच कीजिए: `adb shell dumpsys alarm | findstr bajrang`, और देखिए
   कि `SCHEDULE_EXACT_ALARM` अनुमति सच में मिली है या नहीं (`Settings → Alarms &
   reminders`)।

**एक सीधी बात:** जो अनुमति माँगी जाती है वह "ठीक समय" वाली है; यदि उपयोगकर्ता ने
मना कर दिया, तो संदेश देर से आ सकता है — यह ऐप की ग़लती नहीं, Android की नीति है।

## Play Store की दरस और चीज़ें (जाँचनी हैं, यहाँ नहीं होतीं)

| काम | कहाँ |
| --- | --- |
| Privacy policy URL (सार्वजनिक पन्ना) | Play Console → App content |
| Data safety: कोई आँकड़ा नहीं जाता, सब कुछ फ़ोन में | Play Console → Data safety — "No data collected" चुनें; यह सच है (`localStorage`) |
| Content rating प्रश्नावली | Play Console |
| `targetSdk 35` की पुष्टि | यहाँ पहले से है |
| Release signing keystore | `android/app/build.gradle` में अभी signing config नहीं है — बनाकर जोड़ना होगा (`keytool` यहाँ नहीं है) |
| AAB (Play App Bundle) | `./gradlew bundleRelease` |

## सारांश

- अनुमति का ढाँचा और रन-टाइम बटन पहले से सही हैं।
- `USE_EXACT_ALARM` हटाकर Play की अनावश्यक घोषणा से बचा गया।
- **रीबूट के बाद अलार्म प्लगइन ख़ुद बहाल करता है** — यह पिछली फ़ाइल में ग़लत लिखा
  था। अब बस असली फ़ोन पर रीबूट करके देखना है।
