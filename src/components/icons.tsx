/**
 * प्रतीक — पतली रेखा (1.5px), एक जैसे तौर-तरीके से बने।
 *
 * पहले ऐप में ईमोजी (🙏 📖 🪔 🕊️) इस्तेमाल होते थे। हर स्क्रीन पर वे अलग-अलग
 * आकार में दिखते थे, इसलिए पूरा ऐप "मशीनी" लगता था। अब सब कुछ एक ही रेखा-शैली
 * में खींचा गया है, और हर आकार एक ही ढाँचे में बैठता है।
 */

type IconProps = {
  className?: string;
  /** पहुँचने वालों के लिए, या सजावट के लिए छोड़ दें */
  title?: string;
};

function Svg({
  className = "",
  title,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** दीपक — पूजा का मुख्य प्रतीक */
export const IconFlame = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c.6 3.2-1.4 4.4-2.6 5.8C7.8 10.6 7 12 7 14a5 5 0 0 0 10 0c0-1.6-.7-2.8-1.6-3.9-.4 1-1 1.6-1.9 1.9.6-2.6-.4-6.4-1.5-9Z" />
  </Svg>
);

/** घंटी */
export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 4.5-1.5 5.5-1.5 5.5h15S18 13.5 18 9Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </Svg>
);

/** खुला हुआ पुस्तक — कथा */
export const IconBook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
  </Svg>
);

/** दीप — साप्ताहिक सिलसिला */
export const IconDiya = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v3" />
    <path d="M9 6h6l-1 2H10l-1-2Z" />
    <path d="M5 12h14l-2 5H7l-2-5Z" />
    <path d="M4 19h16" />
  </Svg>
);

/** कलश */
export const IconKalash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4h6" />
    <path d="M10 4c0 2 1 2.5 1 4s-1 2-1 2h4s-1-2-1-2 1-2 1-2h-4Z" />
    <path d="M7 11h10l-1.5 6h-7L7 11Z" />
    <path d="M5 19h14" />
  </Svg>
);

/** साझा */
export const IconShare = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4" />
    <path d="m8 8 4-4 4 4" />
    <path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />
  </Svg>
);

/** तिर/lock */
export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="10" width="14" height="9" rx="1.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </Svg>
);

/** ठीक का निशान */
export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

/** घड़ी */
export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 1.5" />
  </Svg>
);

/** डाउनलोड */
export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11" />
    <path d="m7.5 11 4.5 4.5 4.5-4.5" />
    <path d="M5 19h14" />
  </Svg>
);

/** ऊपर लाना (आयात) */
export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20V9" />
    <path d="m7.5 13 4.5-4.5 4.5 4.5" />
    <path d="M5 5h14" />
  </Svg>
);

/** छोटा तीर — "आगे" */
export const IconArrow = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

/** कपड़ा/हुंडी */
export const IconPause = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 6h5v12H5zM14 6h5v12h-5z" />
  </Svg>
);
