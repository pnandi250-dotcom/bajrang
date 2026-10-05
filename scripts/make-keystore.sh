#!/usr/bin/env bash
#
# Bajrang — Android release keystore बनाएँ।
#
# यह स्क्रिप्ट एक बार चलानी है। keystore और उसकी जानकारी कभी repo में नहीं आती;
# दोनों `~/.bajrang-keystore.properties` में रहती हैं, और `.gitignore` उन्हें
# रोकता है। **keystore खो गया तो उसे Play में नहीं बदला जा सकता** — इसलिए
# इसकी एक नकल अलग, सुरक्षित जगह रखिए (पासवर्ड मैनेजर में).
#
# चलाने का तरीका:  bash scripts/make-keystore.sh
set -euo pipefail

ALIAS="bajrang-release"
STORE_NAME="bajrang-release.keystore"
VALIDITY_DAYS=10000   # लगभग 27 साल — Play को कम से कम यही चाहिए
PROPS_FILE="$HOME/.bajrang-keystore.properties"

if ! command -v keytool >/dev/null 2>&1; then
  echo "❌ keytool नहीं मिला।" >&2
  echo "   JDK 17+ इंस्टॉल कीजिए, फिर यह स्क्रिप्ट दोबारा चलाइए।" >&2
  exit 1
fi

if [ -f "$PROPS_FILE" ]; then
  echo "⚠️  $PROPS_FILE पहले से मौजूद है।" >&2
  read -r -p "   मिटाकर नया बनाएँ? (y/N) " reply
  case "$reply" in
    [yY]*) rm -f "$PROPS_FILE" ;;
    *) echo "   छोड़ा जा रहा है।"; exit 0 ;;
  esac
fi

echo "→ keystore बन रहा है: $STORE_NAME"
read -r -p "   keystore का पासवर्ड (कम से कम 12 अक्षर): " STORE_PASS
if [ "${#STORE_PASS}" -lt 12 ]; then
  echo "❌ पासवर्ड बहुत छोटा है।" >&2
  exit 1
fi
read -r -p "   फिर से लिखिए: " STORE_PASS2
if [ "$STORE_PASS" != "$STORE_PASS2" ]; then
  echo "❌ दोनों पासवर्ड मेल नहीं खाते।" >&2
  exit 1
fi

keytool -genkeypair -v \
  -keystore "$STORE_NAME" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 4096 \
  -validity "$VALIDITY_DAYS" \
  -storetype PKCS12 \
  -dname "CN=Bajrang, OU=App, O=Bajrang, L=Ayodhya, ST=UP, C=IN" \
  -storepass "$STORE_PASS" \
  -keypass "$STORE_PASS"

STORE_FILE_ABS="$(cd "$(dirname "$STORE_NAME")" && pwd)/$(basename "$STORE_NAME")"

umask 077
cat > "$PROPS_FILE" <<EOF
# Bajrang Android release signing — यह फ़ाइल कभी commit न हो।
# अगर यह फ़ाइल या keystore खो जाए, तो Play Store में नया ऐप नहीं भेजा जा सकता।
storeFile=$STORE_FILE_ABS
storePassword=$STORE_PASS
keyAlias=$ALIAS
keyPassword=$STORE_PASS
EOF

echo
echo "✅ बन गया:"
echo "   keystore : $STORE_FILE_ABS"
echo "   settings: $PROPS_FILE  (नकल कहीं सुरक्षित रखिए)"
echo
echo "अगला कदम:"
echo "   cd android && ./gradlew bundleRelease"
echo "   आउटपुट: android/app/build/outputs/bundle/release/app-release.aab"
echo
echo "जाँच:"
echo "   keytool -list -v -keystore \"$STORE_FILE_ABS\""
