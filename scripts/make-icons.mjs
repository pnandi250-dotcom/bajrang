import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

/**
 * PWA आइकन बनाता है — बिना किसी बाहरी टूल या निर्भरता के।
 * सीधे पिक्सेल भरकर PNG लिखता है (zlib node में पहले से है)।
 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const hex = (value) => [
  parseInt(value.slice(1, 3), 16),
  parseInt(value.slice(3, 5), 16),
  parseInt(value.slice(5, 7), 16),
];

const SAFFRON = hex("#FF8A4C");
const MID = hex("#FF6B35");
const DEEP = hex("#A01B23");
const GOLD = hex("#E8B24A");
const RIM = hex("#FFD15C");
const BOWL = hex("#7D131B");
const FLAME = hex("#FFC45C");
const FLAME_IN = hex("#FFE9A8");

function lerp(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function background(t) {
  return t < 0.55 ? lerp(SAFFRON, MID, t / 0.55) : lerp(MID, DEEP, (t - 0.55) / 0.45);
}

const inEllipse = (x, y, cx, cy, rx, ry) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/** आइकन का एक पिक्सेल (0..64 निर्देशांक) */
function shade(x, y) {
  // कटोरी (नीचे का अर्धवृत्त)
  if (y >= 46 && inEllipse(x, y, 32, 46, 16, 22)) return BOWL;
  // कटोरी की किनारी
  if (inEllipse(x, y, 32, 46, 16, 3.6)) return GOLD;
  // लौ — बूँद की आकृति
  if (inEllipse(x, y, 32, 26, 9, 13)) return FLAME;
  if (inEllipse(x, y, 32, 38, 12, 12)) return FLAME;
  // भीतर की लौ
  if (inEllipse(x, y, 32, 36, 6, 9)) return FLAME_IN;
  return null;
}

function roundedMask(x, y, radius) {
  const cx = Math.min(Math.max(x, radius), 64 - radius);
  const cy = Math.min(Math.max(y, radius), 64 - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function render(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = maskable ? 0 : 13;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const x = ((px + 0.5) / size) * 64;
      const y = ((py + 0.5) / size) * 64;

      const inside = maskable ? true : roundedMask(x, y, radius);
      const color = shade(x, y) ?? background((x + y) / 128);

      const offset = (py * size + px) * 4;
      rgba[offset] = color[0];
      rgba[offset + 1] = color[1];
      rgba[offset + 2] = color[2];
      rgba[offset + 3] = inside ? 255 : 0;
    }
  }

  return encodePng(size, size, rgba);
}

mkdirSync("public/icons", { recursive: true });

writeFileSync("public/icons/icon-192.png", render(192, { maskable: false }));
writeFileSync("public/icons/icon-512.png", render(512, { maskable: false }));
writeFileSync("public/icons/icon-maskable-512.png", render(512, { maskable: true }));

console.log("Bajrang icons written to public/icons");