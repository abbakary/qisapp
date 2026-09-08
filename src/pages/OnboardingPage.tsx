import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext";
import KhatamStar from "../components/KhatamStar";

const slides = [
  {
    sw: "Kila hadithi, kwa lugha yako.",
    en: "Every story, in your language.",
    bodySw:
      "Sikiliza na tazama hadithi za Manabii, Maswahaba na Wanazuoni — zimeandaliwa kwa uangalifu wa kielimu, kwa Kiswahili na Kiingereza.",
    bodyEn:
      "Listen to and watch stories of the Prophets, Companions and Scholars — carefully prepared, in Swahili and English.",
  },
  {
    sw: "Vipindi vifupi, dakika 1.5–3.",
    en: "Short episodes, 1.5–3 minutes.",
    bodySw: "Kila kipindi ni kifupi — rahisi kusikiliza njiani au kabla ya kulala.",
    bodyEn: "Each episode is short — easy to hear on the way or before bed.",
  },
  {
    sw: "Endelea pale ulipoishia.",
    en: "Pick up where you left off.",
    bodySw: "App inakumbuka maendeleo yako na kukurudisha mahali sahihi.",
    bodyEn: "The app remembers your progress and returns you to the right spot.",
  },
];

export default function OnboardingPage() {
  const { lang, toggle } = useLang();
  const [i, setI] = useState(0);
  const s = slides[i];
  const last = i === slides.length - 1;

  return (
    <div className="app-shell flex min-h-[100dvh] flex-col bg-deep-green text-warm-white">
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <KhatamStar size={18} className="text-gold" />
          <span className="font-display text-[15px]">Qisas al-Anbiyaa</span>
        </div>
        <button
          onClick={toggle}
          className="cursor-pointer rounded-lg bg-white/10 px-3 py-1 text-[11px] font-bold text-gold-light transition hover:bg-white/20"
        >
          {lang === "sw" ? "EN" : "SW"}
        </button>
      </div>

      <div className="relative mx-6 mt-8 flex-1 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_30%_20%,rgba(231,199,103,0.25),transparent_55%),linear-gradient(200deg,#15665C_0%,#0D3128_100%)] min-h-[220px]">
        <div className="absolute right-5 top-5 opacity-40">
          <KhatamStar size={64} className="text-gold-light" />
        </div>
        <div className="absolute bottom-4 left-4 font-display text-[13px] text-gold-light">
          ✦ {lang === "sw" ? "Hadithi 25+ za Manabii" : "25+ Prophet stories"}
        </div>
      </div>

      <div className="px-6 pb-8 pt-6">
        <div className="mb-4 flex gap-1.5">
          {slides.map((_, n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                n === i ? "w-5 bg-gold" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>
        <h2 className="font-display text-[21px] leading-snug">
          {lang === "sw" ? s.sw : s.en}
        </h2>
        <p className="mb-5 mt-2 text-[12.5px] leading-relaxed text-[#CFC9AE]">
          {lang === "sw" ? s.bodySw : s.bodyEn}
        </p>

        {last ? (
          <Link to="/home" className="btn-primary block text-center">
            {lang === "sw" ? "Endelea" : "Next"}
          </Link>
        ) : (
          <button onClick={() => setI(i + 1)} className="btn-primary">
            {lang === "sw" ? "Endelea" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
