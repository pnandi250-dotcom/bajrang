import { useEffect, useRef, useState } from "react";
import { useDerivedState } from "./lib/store";
import { unlockAudio } from "./lib/audio";
import { scheduleReminder } from "./lib/reminder";
import { isIOS } from "./lib/device";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Katha } from "./screens/Katha";
import { Ritual } from "./screens/Ritual";
import { Calendar } from "./screens/Calendar";
import { Sankalp } from "./screens/Sankalp";
import { Settings } from "./screens/Settings";
import { BottomNav, type Tab } from "./components/BottomNav";
import { track } from "./lib/analytics";
import { InstallBanner } from "./components/InstallBanner";
import { ShareCardSheet } from "./components/ShareCardSheet";

export default function App() {
  const state = useDerivedState();
  const [tab, setTab] = useState<Tab>("home");
  const [ritualOpen, setRitualOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  /** हर टैब की अपनी स्क्रॉल याद रहती है, ताकि लौटने पर वहीं रहें */
  const scrollByTab = useRef<Partial<Record<Tab, number>>>({});

  useEffect(() => {
    const cleanup = scheduleReminder({
      enabled: state.profile.reminderEnabled,
      time: state.profile.reminderTime,
      name: state.profile.name,
      doneToday: state.doneToday,
    });
    return cleanup;
  }, [
    state.profile.reminderEnabled,
    state.profile.reminderTime,
    state.profile.name,
    state.doneToday,
  ]);

  // हर खुलाव पर एक गिनती — सिर्फ़ इसी फ़ोन में (lib/analytics.ts देखिए)
  useEffect(() => {
    track("app_open");
  }, []);

  // टैब बदलते ही पिछली जगह लाइटवे, नया टैब अपनी जगह खुले
  useEffect(() => {
    const saved = scrollByTab.current[tab];
    if (!saved) return;
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, saved));
    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

  if (!state.profile.onboarded) {
    return <Onboarding onDone={() => setTab("home")} />;
  }

  if (ritualOpen) {
    return (
      <Ritual
        onExit={() => {
          unlockAudio();
          setRitualOpen(false);
        }}
        onOpenKatha={() => {
          unlockAudio();
          setRitualOpen(false);
          setTab("katha");
        }}
      />
    );
  }

  function changeTab(next: Tab) {
    if (next === tab) {
      // दोबारा उसी टैब पर दबाया तो ऊपर चले जाएँ
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    scrollByTab.current[tab] = window.scrollY;
    setTab(next);
  }

  return (
    <div className="app-shell relative min-h-[100dvh] bg-linear-to-b from-cream-100 to-cream-200">
      <AmbientBackdrop />

      <main key={tab} className="relative z-10 pb-28">
        {tab === "home" ? (
          <Home
            onStartRitual={() => setRitualOpen(true)}
            onOpenShare={() => setShareOpen(true)}
            onOpenSankalp={() => changeTab("sankalp")}
            onOpenSettings={() => changeTab("settings")}
            onOpenKatha={() => changeTab("katha")}
          />
        ) : null}
        {tab === "katha" ? <Katha /> : null}
        {tab === "calendar" ? <Calendar /> : null}
        {tab === "sankalp" ? <Sankalp /> : null}
        {tab === "settings" ? (
          <Settings
            onReset={() => {
              scrollByTab.current = {};
              setTab("home");
              window.scrollTo(0, 0);
            }}
          />
        ) : null}
      </main>

      <BottomNav tab={tab} onChange={changeTab} />

      <ShareCardSheet open={shareOpen} onClose={() => setShareOpen(false)} />
      <InstallBanner isIOS={isIOS()} />
    </div>
  );
}

function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-saffron-300/25 blur-3xl" />
      <div className="absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-gold-300/20 blur-3xl" />
    </div>
  );
}