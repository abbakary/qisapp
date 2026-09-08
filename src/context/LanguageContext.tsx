import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DEFAULT_LANG, dict, type Lang } from "../lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: keyof typeof dict) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = window.localStorage.getItem("qisas.lang") as Lang | null;
      if (stored === "sw" || stored === "en") return stored;
    } catch {
      /* ignore */
    }
    return initial ?? DEFAULT_LANG;
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("qisas.lang", l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => setLang(lang === "sw" ? "en" : "sw"), [lang, setLang]);

  const tt = useCallback((key: keyof typeof dict) => dict[key]?.[lang] ?? key, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t: tt }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

/** Pick the right field for the active language, falling back to the other. */
export function pick(lang: Lang, sw: string, en: string) {
  if (lang === "sw") return sw || en;
  return en || sw;
}
