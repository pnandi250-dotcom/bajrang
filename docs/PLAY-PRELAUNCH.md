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

## जो अभी भी ख़ुला है — रीबूट के बाद अलार्म

**समस्या:** फ़ोन दोबारा चालू होने पर पहले से लगे अलार्म मिट जाते हैं।
`RECEIVE_BOOT_COMPLETED` घोषित तो है, पर उसे **कोई receiver नहीं सुनता**।
इसलिए आज का व्यवहार यह है: *ऐप को एक बार खोलने पर* अनुष्ठान फिर से लग जाता है
(`App.tsx` में `scheduleReminder` हर खोलने पर चलता है)। दिन भर बंद रहा तो अलार्म
नहीं आएगा।

**यहाँ से क्यों नहीं किया:** सही समाधान में native Java लिखना पड़ता है (receiver →
Capacitor plugin द्वारा दोबारा schedule कराना), और वह बिना compiler के जाँचा नहीं
जा सकता। गलत receiver भेजने से ऐप Play पर reject हो सकता है, इसलिए इसे जानबूझकर
छोड़ा गया है — यहाँ तक कि स्थानीय रूप से काम करे।

**जाने से पहले करना है:**

1. `android/app/src/main/res/xml/alarm_receiver.xml` बनाएँ —
   `<receiver android:name=".AlarmBootReceiver" android:enabled="true"
   android:exported="false"><intent-filter><action
   android:name="android.intent.action.BOOT_COMPLETED" /></intent-filter></receiver>`
2. `android/app/src/main/java/com/bajrang/app/AlarmBootReceiver.java` में
   `onReceive` के भीतर `LocalNotifications` plugin की अनुमति जाँचकर असल
   reschedule के लिए app का `MainActivity` चुपचाप खोलें — या Capacitor का
   `AppRestartListener` उपयोग करें, ताकि JS का `scheduleReminder` दोबारा चले।
3. **असली फ़ोन पर जाँचें:** फ़ोन बंद करके चालू कीजिए, 12 घंटे बाद देखिए कि संदेश
   आया या नहीं; Android 12, 13 और 14+ तीनों पर।

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
- **रीबूट के बाद अलार्म लगाना अभी बाकी है** और वह APK बनाकर फ़ोन पर जाँचे बिना
  पूरा नहीं होगा।
