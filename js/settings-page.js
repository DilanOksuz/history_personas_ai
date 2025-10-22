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

const initLng =
  getCookie("app_lang") ||
  localStorage.getItem("lang") ||
  loadSettings().language;

i18next.use(i18nextHttpBackend).init(
  {
    lng: initLng,
    fallbackLng: "tr",
    backend: {
      loadPath: "/locales/{{lng}}.json",
      requestOptions: { cache: "no-store" },
    },
  },
  (err) => {
    if (err) console.error("i18next init error:", err);
    renderI18n();
  }
);

function renderI18n() {
  if (!window.i18next) return;
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
      const lng = btn.getAttribute("data-lang"); // tr | en
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
  const handler = () => {
    const cur = loadSettings();
    if (cur.theme === "system") applyTheme("system");
  };
  if (mql.addEventListener) mql.addEventListener("change", handler);
  else if (mql.addListener) mql.addListener(handler);
})();

function setActiveChip(container, selector) {
  [...container.querySelectorAll(".chip")].forEach((ch) =>
    ch.classList.remove("is-active")
  );
  const active = container.querySelector(selector);
  active?.classList.add("is-active");
}
