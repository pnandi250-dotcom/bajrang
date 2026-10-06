/**
 * हनुमान जी का चित्र — साझा कार्ड के लिए।
 *
 * सामान्य canvas-सहायक (दीपक, ओम, सीमा, लपेटना) `lib/shareCard.ts` में रहता है;
 * देवता-विशिष्ट चित्र यहाँ। इसी तरह महादेव का चित्र `devata/shiva/drawCard.ts` में है।
 */
import { drawDiya } from "../../lib/shareCard";

export function drawHanumanCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  palette: { accent: string; soft: string },
): void {
  const cx = size / 2;
  const base = size * 0.66;
  ctx.save();
  // पीछे हल्का प्रभाव — पारदर्शी आभा
  const glow = ctx.createRadialGradient(cx, base * 0.62, 10, cx, base * 0.62, size * 0.34);
  glow.addColorStop(0, palette.soft);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  drawHanuman(ctx, cx, base, size * 0.00042);
  drawDiya(ctx, cx, base + size * 0.02, size * 0.00042);
  ctx.restore();
}

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