import React from "react";
import { useLang } from "../context/LanguageContext";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex w-fit rounded-lg bg-sand p-0.5">
      {(["sw", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`cursor-pointer rounded-md px-3 py-1 text-[11px] font-bold uppercase transition ${
            lang === l ? "bg-deep-green text-warm-white" : "text-muted hover:text-deep-green"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
