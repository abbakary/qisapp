import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang, pick } from "../context/LanguageContext";
import KhatamStar from "../components/KhatamStar";
import { db, subscribeDb } from "../lib/mock/db";

const tileBg = [
  "linear-gradient(150deg,#1E8477,#0F3D2E)",
  "linear-gradient(150deg,#C9A227,#8A6E19)",
  "linear-gradient(150deg,#3B5744,#14261D)",
  "linear-gradient(150deg,#15665C,#0A2A20)",
  "linear-gradient(150deg,#8A6E19,#4A3B0E)",
  "linear-gradient(150deg,#2E5A4C,#0F3D2E)",
];

export default function CategoriesPage() {
  const { lang, t } = useLang();
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const categories = db.categories.findMany().map((c) => ({
    ...c,
    seriesCount: db.categories.seriesCount(c.id),
  }));

  return (
    <div className="flex-1 flex flex-col bg-warm-white">
      <div className="rounded-b-3xl bg-deep-green px-5 md:px-10 lg:px-16 pb-5 md:pb-7 pt-5 md:pt-6 text-warm-white shadow-md">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-[10.5px] md:text-xs uppercase tracking-[0.05em] text-gold-light font-bold">
            {t("chooseCategory")}
          </div>
          <div className="font-display text-[19px] md:text-2xl font-bold mt-0.5">{t("storyGroups")}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-5 md:px-10 lg:px-16 py-6 md:py-8 pb-24 md:pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="group relative flex h-[120px] sm:h-[135px] md:h-[150px] flex-col justify-end overflow-hidden rounded-2xl p-3.5 text-white shadow-sm transition hover:translate-y-[-2px] hover:shadow-md"
              style={c.image ? undefined : { background: tileBg[i % tileBg.length] }}
            >
              {c.image && (
                <>
                  <img
                    src={c.image}
                    alt=""
                    className="absolute inset-0 h-full w-full scale-110 object-cover object-[50%_30%] blur-[1.5px] transition duration-300 group-hover:scale-115"
                  />
                  <div className="absolute inset-0 bg-deep-green/78" />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-green via-deep-green/50 to-transparent" />
                </>
              )}
              <KhatamStar size={15} className="absolute right-3 top-3 text-white/55 transition duration-300 group-hover:scale-110 group-hover:text-gold-light" />
              <h4 className="relative font-display text-[15px] md:text-[16px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] group-hover:text-gold-light transition">
                {pick(lang, c.nameSw, c.name)}
              </h4>
              <div className="relative mt-0.5 text-[9.5px] md:text-[10.5px] opacity-90">
                {pick(lang, c.name, c.nameSw)} · {c.seriesCount}{" "}
                {lang === "sw" ? "misururu" : "series"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

