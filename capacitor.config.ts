import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bajrang.app",
  appName: "Bajrang",
  webDir: "dist",
  android: {
    // अपनी कंपनी का नाम अपने अनुसार बदल लीजिए
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      // Android पर छोटा आइकन दिखेगा
      smallIcon: "ic_stat_icon",
      iconColor: "#FF6B35",
    },
  },
};

export default config;