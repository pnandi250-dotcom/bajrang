"""
श्लोक-पाठ का स्रोत-साधन — जाँच के लिए।
तीन स्वतंत्र स्रोतों (shridharam.com, shloka.chakradeo.net, hanumankripa.com)
से उतारा गया साफ़-सुथरा पाठ, तिरछे हुए अक्षर-विराम हटाकर।

यह फ़ाइल इसलिए commit की गई है कि जाँच बिना इंटरनेट, बिना किसी तीसरे पक्ष की
वेबसाइट के चल सके — और यह साबित करे कि ऐप की हर पंक्ति किसी मुद्रित/प्रकाशित
पाठ में यथावत मिलती है।
"""

import html
import pathlib
import re

DIR = pathlib.Path(__file__).parent / "chalisa"
SOURCES = {
    "shridharam": "shridharam.html",
    "chakradeo": "chakradeo.html",
    "hanumankripa": "hanumankripa.html",
}
DEV = re.compile(r"[ऀ-ॿ]")
PUNCT = re.compile(r"[।॥|,‘’“”\"'०-९0-9\s‌‍]")


def html_to_text(path: pathlib.Path) -> str:
    data = path.read_bytes()
    text = None
    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            cand = data.decode(enc)
        except UnicodeDecodeError:
            continue
        if len(DEV.findall(cand)) > 200:
            text = cand
            break
    if text is None:
        text = data.decode("utf-8", errors="replace")
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", text)
    text = re.sub(r"(?is)</?(p|div|br|li|h[1-6]|tr|td)[^>]*>", "\n", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = html.unescape(text)
    return "\n".join(re.sub(r"[ \t ]+", " ", l).strip() for l in text.split("\n"))


def normalise(text: str) -> str:
    return PUNCT.sub("", text)


if not DIR.exists():
    raise SystemExit(
        f"स्रोत फ़ाइलें नहीं मिलीं: {DIR}\n"
        "इन्हें वेबसाइटों से उतारकर scripts/checks/chalisa/ में रखें।"
    )

parts = []
for name, filename in SOURCES.items():
    path = DIR / filename
    if not path.exists():
        print(f"⚠️  {name} नहीं मिला — जाँच आंशिक रहेगी")
        continue
    parts.append(f"### {name}\n{normalise(html_to_text(path))}\n")

out = pathlib.Path(__file__).parent / "fixtures" / "chalisa-source.txt"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text("\n".join(parts), encoding="utf-8")
print(f"लिखा: {out} ({out.stat().st_size} bytes, {len(SOURCES)} स्रोत)")
