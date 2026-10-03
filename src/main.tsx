import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import "./index.css";

async function bootstrap() {
  // सेवा वर्कर सिर्फ़ वेब पर — Android ऐप में इसकी ज़रूरत नहीं
  if (!Capacitor.isNativePlatform()) {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();