/**
 * महादेव का चित्र — साझा कार्ड के लिए।
 *
 * सामान्य सहायक (दीपक, ओम, सीमा, लपेटना) `lib/shareCard.ts` में हैं; देवता-विशिष्ट
 * चित्र यहाँ। रंग: रात-नीला + चाँदी की चमक; पीछे हल्की चंद्र-किरण।
 */
import { drawDiya } from "../../lib/shareCard";

export function drawShivaCard(
  ctx: CanvasRenderingContext2D,
  size: number,
  palette: { accent: string; soft: string },
): void {
  const cx = size / 2;
  const base = size * 0.66;
  ctx.save();

  // पीछे चंद्र-मंडल — पीला नहीं, चाँदी जैसा
  const halo = ctx.createRadialGradient(cx, base * 0.55, 8, cx, base * 0.55, size * 0.36);
  halo.addColorStop(0, palette.soft);
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // चन्द्रबिन्दु — माथे पर
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = size * 0.005;
  ctx.beginPath();
  ctx.arc(cx + size * 0.012, base * 0.335, size * 0.022, Math.PI * 0.35, Math.PI * 1.75);
  ctx.stroke();

  // त्रिशूल — सिर के पीछे, सीधा
  ctx.lineWidth = size * 0.007;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.052, base * 0.86);
  ctx.lineTo(cx - size * 0.052, base * 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - size * 0.052, base * 0.28, size * 0.016, Math.PI * 0.85, Math.PI * 2.15);
  ctx.stroke();
  // ट्रिशूल की शाखा (बीच वाली नुकीली पसली)
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.052, base * 0.37);
  ctx.lineTo(cx - size * 0.052, base * 0.24);
  ctx.lineTo(cx - size * 0.03, base * 0.37);
  ctx.closePath();
  ctx.stroke();
  // दाएँ शाखा
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.03, base * 0.34);
  ctx.lineTo(cx - size * 0.03, base * 0.24);
  ctx.stroke();

  // जटा-शिखर (मूँजे बाल) — छोटी लकीरें
  ctx.lineWidth = size * 0.004;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx + i * size * 0.026, base * 0.35);
    ctx.quadraticCurveTo(cx + i * size * 0.05, base * 0.3, cx + i * size * 0.042, base * 0.2);
    ctx.stroke();
  }

  // नाग — गले के चारों ओर लहराती रेखा
  ctx.lineWidth = size * 0.005;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.075, base * 0.5);
  ctx.bezierCurveTo(cx - size * 0.02, base * 0.44, cx + size * 0.02, base * 0.58, cx + size * 0.075, base * 0.5);
  ctx.stroke();

  // तीसरा नेत्र
  ctx.lineWidth = size * 0.0035;
  ctx.beginPath();
  ctx.moveTo(cx, base * 0.4);
  ctx.lineTo(cx, base * 0.43);
  ctx.stroke();

  // धरोसर — आधा चक्र
  ctx.lineWidth = size * 0.006;
  ctx.beginPath();
  ctx.arc(cx, base * 0.72, size * 0.13, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.16, base * 0.72);
  ctx.lineTo(cx - size * 0.075, base * 0.72);
  ctx.moveTo(cx + size * 0.075, base * 0.72);
  ctx.lineTo(cx + size * 0.16, base * 0.72);
  ctx.stroke();

  // डमरू — दाईं ओर
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.105, base * 0.62);
  ctx.lineTo(cx + size * 0.085, base * 0.68);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.112, base * 0.68, size * 0.016, size * 0.022, 0, 0, Math.PI * 2);
  ctx.stroke();

  drawDiya(ctx, cx, base + size * 0.02, size * 0.00042);
  ctx.restore();
}
