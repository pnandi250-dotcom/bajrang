import { toNativeDigits } from "./date";
import { t } from "./i18n";

/**
 * साझा करने लायक सुंदर कार्ड — सीधे canvas पर बनता है,
 * ताकि किसी html-to-image लाइब्रेरी की ज़रूरत न पड़े।
 */

const SIZE = 1080;
const FONT_STACK =
  '"Nirmala UI", "Noto Sans Devanagari", "Mangal", "Segoe UI", sans-serif';

export type ShareCardData = {
  name: string;
  streak: number;
  totalCompleted: number;
  sankalp: string;
  /** कार्ड पर दिखने वाली अवधि, जैसे "7 दिन" */
  periodLabel: string;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDiya(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // दीवक की लौ
  const glow = ctx.createRadialGradient(0, -26, 2, 0, -20, 46);
  glow.addColorStop(0, "rgba(255,236,168,0.95)");
  glow.addColorStop(1, "rgba(255,168,64,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -22, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffb648";
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.quadraticCurveTo(16, -24, 0, -6);
  ctx.quadraticCurveTo(-16, -24, 0, -52);
  ctx.fill();

  // कटोरी
  ctx.fillStyle = "#c1272d";
  ctx.beginPath();
  ctx.moveTo(-46, -4);
  ctx.quadraticCurveTo(0, 34, 46, -4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e8b24a";
  ctx.beginPath();
  ctx.ellipse(0, -4, 46, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawOm(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.font = `${size}px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(240, 208, 131, 0.15)";
  ctx.fillText("ॐ", cx, cy);
  ctx.restore();
}

/**
 * हनुमान जी की सिंहावली — खड़े, हाथ जोड़े, गदा और पूँछ।
 * सरल आकार हैं ताकि छोटे फ़ोन पर भी साफ़ दिखे।
 */
function drawHanuman(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const body = "#5a0d14";
  const rim = "rgba(255, 227, 174, 0.55)";

  // प्रभामंडल
  const halo = ctx.createRadialGradient(0, 48, 8, 0, 48, 58);
  halo.addColorStop(0, "rgba(255, 236, 168, 0.55)");
  halo.addColorStop(1, "rgba(255, 207, 106, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 48, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 208, 131, 0.6)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 48, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // पूँछ — बाईं ओर खुलकर लिपटी
  ctx.strokeStyle = body;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(28, 192);
  ctx.bezierCurveTo(-30, 206, -78, 176, -70, 132);
  ctx.bezierCurveTo(-66, 104, -34, 104, -36, 128);
  ctx.stroke();

  // गदा (आने का)
  ctx.strokeStyle = body;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(64, 56);
  ctx.lineTo(64, 206);
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(64, 42, 14, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(64, 19);
  ctx.lineTo(71, 33);
  ctx.lineTo(57, 33);
  ctx.closePath();
  ctx.fill();

  // पैर — थोड़े फैले हुए, बीच में साफ़ फ़ासला
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-26, 146);
  ctx.quadraticCurveTo(-38, 186, -30, 212);
  ctx.lineTo(-10, 212);
  ctx.quadraticCurveTo(-16, 184, -8, 146);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 146);
  ctx.quadraticCurveTo(16, 184, 10, 212);
  ctx.lineTo(30, 212);
  ctx.quadraticCurveTo(38, 186, 26, 146);
  ctx.closePath();
  ctx.fill();
  // पैरों के बीच हल्की रोशनी
  ctx.strokeStyle = "rgba(255, 236, 168, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 156);
  ctx.lineTo(0, 206);
  ctx.stroke();

  // धड़ — पतला कंधे, पतली कमर
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-12, 76);
  ctx.quadraticCurveTo(-36, 82, -38, 108);
  ctx.quadraticCurveTo(-28, 128, -28, 148);
  ctx.lineTo(28, 148);
  ctx.quadraticCurveTo(28, 128, 38, 108);
  ctx.quadraticCurveTo(36, 82, 12, 76);
  ctx.quadraticCurveTo(0, 88, -12, 76);
  ctx.closePath();
  ctx.fill();

  // जोड़े हाथ (नमस्कार)
  ctx.strokeStyle = body;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(-28, 98);
  ctx.quadraticCurveTo(-20, 126, -2, 140);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, 98);
  ctx.quadraticCurveTo(20, 126, 2, 140);
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, 118);
  ctx.lineTo(10, 144);
  ctx.lineTo(0, 154);
  ctx.lineTo(-10, 144);
  ctx.closePath();
  ctx.fill();

  // कान
  ctx.beginPath();
  ctx.ellipse(-19, 44, 6, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(19, 44, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // सिर
  ctx.beginPath();
  ctx.ellipse(0, 44, 20, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  // मुकुट
  ctx.beginPath();
  ctx.moveTo(-17, 27);
  ctx.quadraticCurveTo(0, -8, 17, 27);
  ctx.quadraticCurveTo(0, 20, -17, 27);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // कानों की कुंडी — हल्की सुनहरी रेखा
  ctx.strokeStyle = rim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 44, 20, Math.PI * 1.08, Math.PI * 1.92);
  ctx.moveTo(-17, 27);
  ctx.quadraticCurveTo(0, -8, 17, 27);
  ctx.stroke();

  ctx.restore();
}

/** छोटी लौ — कार्ड पर सजावट के लिए */
function drawFlameMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size / 40;
  ctx.scale(s, s);

  const glow = ctx.createRadialGradient(0, -6, 2, 0, -4, 34);
  glow.addColorStop(0, "rgba(255, 228, 160, 0.95)");
  glow.addColorStop(0.55, "rgba(255, 170, 70, 0.35)");
  glow.addColorStop(1, "rgba(255, 160, 60, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -4, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffb648";
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.quadraticCurveTo(17, -12, 0, 8);
  ctx.quadraticCurveTo(-17, -12, 0, -30);
  ctx.fill();
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(7, -4, 0, 6);
  ctx.quadraticCurveTo(-7, -4, 0, -14);
  ctx.fill();
  ctx.restore();
}

/** दीवार पर टाइल/किनारा */
function drawBorder(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = "#e8b24a";
  ctx.lineWidth = 6;
  roundRect(ctx, 28, 28, SIZE - 56, SIZE - 56, 44);
  ctx.stroke();
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines && shown.length > 0) {
    shown[shown.length - 1] = `${shown[shown.length - 1].slice(0, -1)}…`;
  }

  shown.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return y + shown.length * lineHeight;
}

/** जब तक लिखावट गोलाई में समा जाए, छोटा करता है */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  weight = 800,
  minSize = 40,
) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

export function createShareCard(data: ShareCardData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // पृष्ठभूमि: गहरा केसरिया → लाल
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, "#ff8a4c");
  bg.addColorStop(0.45, "#ff6b35");
  bg.addColorStop(1, "#a01b23");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  drawBorder(ctx);
  drawOm(ctx, SIZE / 2, 330, 330);

  // हनुमान जी की सिंहावली और सामने दीवा
  drawHanuman(ctx, SIZE / 2, 106, 1.63);
  drawDiya(ctx, SIZE / 2, 498, 0.5);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // शीर्षक
  ctx.fillStyle = "#fff7ec";
  ctx.font = `800 74px ${FONT_STACK}`;
  ctx.fillText(t("बजरंग"), SIZE / 2, 588);

  ctx.fillStyle = "#f0d083";
  ctx.font = `600 30px ${FONT_STACK}`;
  ctx.fillText(t("हर दिन 1 मिनट की हनुमान पूजा"), SIZE / 2, 634);

  // मुख्य वाक्य — एक ही लाइन में, गोलाई के हिसाब से छोटा होता जाता है
  const headline = t("मैंने {p} लगातार हनुमान चालीसा की").replace("{p}", data.periodLabel);
  ctx.fillStyle = "#fffdf9";
  ctx.font = `800 ${fitFontSize(ctx, headline, SIZE - 190, 64, 800, 40)}px ${FONT_STACK}`;
  wrapText(ctx, headline, SIZE / 2, 706, SIZE - 190, 84, 1);

  // नाम + स्ट्रीक — बड़ा और मोटा
  const badgeW = 720;
  const badgeH = 162;
  const badgeX = SIZE / 2 - badgeW / 2;
  const badgeY = 780;
  ctx.fillStyle = "rgba(94, 15, 22, 0.45)";
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 40);
  ctx.fill();
  ctx.strokeStyle = "#f0d083";
  ctx.lineWidth = 4;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 40);
  ctx.stroke();

  const nameLine = `— ${data.name} —`;
  ctx.fillStyle = "#fff7ec";
  ctx.font = `700 ${fitFontSize(ctx, nameLine, badgeW - 120, 42, 700, 24)}px ${FONT_STACK}`;
  ctx.fillText(nameLine, SIZE / 2, badgeY + 58);

  // स्ट्रीक + छोटी लौ (emoji नहीं, ताकि गिनती हमेशा सीधी रहे)
  const streakLine = `${toNativeDigits(data.streak)} ${t("दिन")}`;
  ctx.fillStyle = "#ffd15c";
  ctx.font = `800 ${fitFontSize(ctx, streakLine, badgeW - 220, 88, 800, 52)}px ${FONT_STACK}`;
  const streakWidth = ctx.measureText(streakLine).width;
  ctx.fillText(streakLine, SIZE / 2 + 30, badgeY + 140);
  drawFlameMark(ctx, SIZE / 2 - streakWidth / 2 - 18, badgeY + 110, 72);

  // संकल्प
  if (data.sankalp) {
    const sankalpLine = `${t("संकल्प:")} ${data.sankalp}`;
    ctx.fillStyle = "rgba(255, 247, 236, 0.92)";
    ctx.font = `500 ${fitFontSize(ctx, sankalpLine, SIZE - 200, 34, 500, 22)}px ${FONT_STACK}`;
    wrapText(ctx, sankalpLine, SIZE / 2, badgeY + badgeH + 48, SIZE - 200, 40, 1);
  }

  // समापन
  ctx.fillStyle = "rgba(255, 247, 236, 0.78)";
  ctx.font = `500 26px ${FONT_STACK}`;
  ctx.fillText(`Bajrang · ${t("चलो हनुमान जी के साथ जियें")}`, SIZE / 2, 1036);

  return canvas;
}

/** फ़ाइल नाम: bajrang-streak-12.png */
export function shareFileName(streak: number): string {
  return `bajrang-streak-${streak}.png`;
}

export function buildShareText(data: ShareCardData): string {
  const parts = [
    `${t("मैंने {p} लगातार हनुमान चालीसा की 🙏").replace("{p}", data.periodLabel)}`,
    `${t("आज का स्ट्रीक:")} ${toNativeDigits(data.streak)} ${t("दिन")} 🔥`,
  ];
  if (data.sankalp) parts.push(`${t("मेरा संकल्प:")} ${data.sankalp}`);
  parts.push(t("आप भी रोज़ 1 मिनट हनुमान जी के साथ बिताइए — Bajrang app"));
  return parts.join("\n");
}