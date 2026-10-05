import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // दिन की सीमा ३:०० बजे है, इसलिए टेस्ट में एक तय समय-क्षेत्र चाहिए
    env: { TZ: "Asia/Kolkata" },
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/store.ts"],
      reporter: ["text", "json-summary"],
      // React के हुक (useAppState/useDerivedState) केवल घटकों में चलते हैं — इसलिए
      // फ़ंक्शन-कवरेज थोड़ा कम रहता है; बाक़ी सब ९०% से ऊपर।
      thresholds: { lines: 90, statements: 90, branches: 80, functions: 80 },
    },
  },
});
