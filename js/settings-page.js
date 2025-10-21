const storage = {
  get(k, fb = null) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fb;
    } catch {
      return fb;
    }
  },
  set(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },
};

function setCookie(name, value, days = 365) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; max-age=${maxAge}; path=/; samesite=lax`;
}
function getCookie(name) {
  const v = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return v ? decodeURIComponent(v.split("=")[1]) : null;
}

const SETTINGS_KEY = "app:settings";
const DEFAULTS = {
  theme: "system",
  language: (navigator.language || "tr").toLowerCase().startsWith("tr")
    ? "tr"
    : "en",
  history: true,
  tts: false,
};

function loadSettings() {
  const cookieTheme = getCookie("app_theme");
  const cookieLang = getCookie("app_lang");

  const ls = storage.get(SETTINGS_KEY, {});
  return {
    ...DEFAULTS,
    ...ls,
    ...(cookieTheme ? { theme: cookieTheme } : {}),
    ...(cookieLang ? { language: cookieLang } : {}),
  };
}
function saveSettings(s) {
  storage.set(SETTINGS_KEY, s);
  if (s.theme) setCookie("app_theme", s.theme);
  if (s.language) setCookie("app_lang", s.language);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
function applyLanguage(lang) {
  document.documentElement.setAttribute("lang", lang);
  renderI18n();
}

const resources = {
  tr: {
    translation: {
      nav: {
        home: "Ana Sayfa",
        explore: "Keşfet",
        my_echoes: "Anılarım",
        community: "Topluluk",
      },
      settings: {
        title: "Ayarlar",
        appearance: "Görünüm",
        language: "Dil",
        light: "Açık",
        dark: "Koyu",
        auto: "Otomatik",
        chat_history: "Sohbet Geçmişi",
        save_history: "Sohbet Geçmişini Kaydet",
        clear_history: "Geçmişi Temizle",
        accessibility: "Erişilebilirlik",
        tts: "Text-to-Speech (Sesli okuma)",
      },
    },
  },
  en: {
    translation: {
      nav: {
        home: "Home",
        explore: "Explore",
        my_echoes: "My Echoes",
        community: "Community",
      },
      settings: {
        title: "Settings",
        appearance: "Appearance",
        language: "Language",
        light: "Light",
        dark: "Dark",
        auto: "Auto",
        chat_history: "Chat History",
        save_history: "Save Chat History",
        clear_history: "Clear Chat History",
        accessibility: "Accessibility",
        tts: "Text-to-Speech",
      },
    },
  },
};

const initLng =
  getCookie("app_lang") ||
  localStorage.getItem("lang") ||
  loadSettings().language;

i18next.init({ lng: initLng, fallbackLng: "tr", resources }, (err) => {
  if (err) console.error(err);
  renderI18n();
});

// data-i18n’leri doldur
function renderI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = i18next.t(key);
  });
}

(function init() {
  const s = loadSettings();

  const appearance = document.getElementById("appearanceChips");
  if (appearance) {
    setActiveChip(appearance, `[data-theme="${s.theme}"]`);
    appearance.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      const val = btn.getAttribute("data-theme");
      s.theme = val;
      saveSettings(s);
      applyTheme(s.theme);
      setActiveChip(appearance, `[data-theme="${val}"]`);
    });
  }

  const language = document.getElementById("languageChips");
  if (language) {
    setActiveChip(language, `[data-lang="${s.language}"]`);
    language.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      const lng = btn.getAttribute("data-lang");
      s.language = lng;
      saveSettings(s);
      localStorage.setItem("lang", lng);
      i18next.changeLanguage(lng, () => applyLanguage(lng));
      setActiveChip(language, `[data-lang="${lng}"]`);
    });
  }

  const saveHistory = document.getElementById("saveHistory");
  const tts = document.getElementById("tts");
  if (saveHistory) {
    saveHistory.checked = !!s.history;
    saveHistory.addEventListener("change", () => {
      s.history = saveHistory.checked;
      saveSettings(s);
    });
  }
  if (tts) {
    tts.checked = !!s.tts;
    tts.addEventListener("change", () => {
      s.tts = tts.checked;
      saveSettings(s);
    });
  }

  document.getElementById("clearHistory")?.addEventListener("click", () => {
    alert(i18next.t("settings.clear_history"));
  });

  applyTheme(s.theme);
  applyLanguage(i18next.language);

  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  (mql.addEventListener || mql.addListener).call(mql, "change", () => {
    const cur = loadSettings();
    if (cur.theme === "system") applyTheme("system");
  });
})();

function setActiveChip(container, selector) {
  [...container.querySelectorAll(".chip")].forEach((ch) =>
    ch.classList.remove("is-active")
  );
  const active = container.querySelector(selector);
  active?.classList.add("is-active");
}
