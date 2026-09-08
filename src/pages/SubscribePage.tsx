import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Gift, HeartHandshake, Lock, Smartphone, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang, pick } from "../context/LanguageContext";
import { db, subscribeDb } from "../lib/mock/db";
import { formatTzs, ownsSeries, seriesUnlockPrice } from "../lib/entitlements";
import { activeGivingCampaign } from "../lib/giving-seasons";
import UnlockCheckoutModal, { type CheckoutMode } from "../components/UnlockCheckoutModal";
import type { Series } from "../lib/mock/types";

export default function SubscribePage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusId = params.get("series");
  const [dbVersion, setDbVersion] = useState(0);
  const [checkout, setCheckout] = useState<{
    mode: CheckoutMode;
    series?: Series;
    amountTzs: number;
  } | null>(null);
  const [showVip, setShowVip] = useState(false);

  React.useEffect(() => subscribeDb(() => setDbVersion((v) => v + 1)), []);

  const unlocks = db.unlocks.mine();
  const bundle = db.monetize.starterBundle();
  const campaign = activeGivingCampaign();
  const published = useMemo(() => db.series.findMany({ published: true }), [dbVersion]);
  const ownedIds = new Set(unlocks.map((u) => u.seriesId));
  const firstPurchase = unlocks.filter((u) => u.kind !== "SPONSORED_GRANT").length === 0;

  const catalog = useMemo(() => {
    return [...published].sort((a, b) => {
      if (focusId && a.id === focusId) return -1;
      if (focusId && b.id === focusId) return 1;
      return (b.views || 0) - (a.views || 0);
    });
  }, [published, focusId]);

  function openCheckout(mode: CheckoutMode, series?: Series, amount?: number) {
    const count = series ? db.episodes.findBySeries(series.id).length : 0;
    setCheckout({
      mode,
      series,
      amountTzs: amount ?? (series ? seriesUnlockPrice(series, count) : bundle?.amountTzs || 2000),
    });
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-28">
      <div className="rounded-3xl bg-deep-green text-warm-white p-5 shadow-md overflow-hidden relative">
        <Sparkles className="absolute right-4 top-4 text-gold/40" size={36} />
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-gold-light">
          {lang === "sw" ? "Malipo ya Phase 1" : "Phase 1 payments"}
        </div>
        <h1 className="font-display text-2xl font-bold mt-1">
          {lang === "sw" ? "Fungua hadithi, umiliki milele" : "Unlock a story, own it forever"}
        </h1>
        <p className="mt-2 text-xs text-gold-light/90 leading-relaxed max-w-lg">
          {lang === "sw"
            ? "Kipindi cha kwanza cha kila msururu ni bure daima. Lipa mara moja 500–1,500 TZS — hakuna kuisha wala kufanya upya. Pesa za simu ndio njia kuu."
            : "Episode 1 of every series stays free. Pay once — 500–1,500 TZS — no expiry, no renewal. Mobile money is the primary rail."}
        </p>
      </div>

      {campaign && (
        <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <div className="flex items-start gap-2">
            <HeartHandshake className="text-gold-dark flex-shrink-0" size={18} />
            <div>
              <div className="font-bold text-sm text-deep-green">
                {lang === "sw" ? campaign.titleSw : campaign.titleEn}
              </div>
              <p className="text-xs text-ink/80 mt-0.5">
                {lang === "sw" ? campaign.blurbSw : campaign.blurbEn}
              </p>
            </div>
          </div>
        </div>
      )}

      {firstPurchase && bundle && (
        <button
          type="button"
          onClick={() => openCheckout("bundle", undefined, bundle.amountTzs)}
          className="mt-4 w-full rounded-2xl border-2 border-gold bg-white p-4 text-left shadow-sm hover:bg-gold/5 transition"
        >
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-gold-dark">
            <Gift size={14} />
            {lang === "sw" ? "Ununuzi wa kwanza" : "First purchase"}
          </div>
          <div className="mt-1 font-display text-lg text-deep-green">
            {lang === "sw" ? bundle.planNameSw : `${bundle.seriesCount} stories for the price of 2`}
          </div>
          <div className="mt-1 text-xs text-muted">
            {formatTzs(bundle.amountTzs)} · {lang === "sw" ? "umiliki milele, bila kuisha" : "owned forever, no expiry"}
          </div>
        </button>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-base text-deep-green">
          {lang === "sw" ? "Hadithi za kufungua" : "Stories to unlock"}
        </h2>
        <span className="text-[11px] text-muted">{catalog.length}</span>
      </div>

      <div className="mt-3 space-y-2.5">
        {catalog.map((s) => {
          const count = db.episodes.findBySeries(s.id).length;
          const price = seriesUnlockPrice(s, count);
          const owned = ownsSeries(s.id, user, unlocks);
          const sow = db.monetize.storyOfWeekId() === s.id;
          const focused = focusId === s.id;
          return (
            <div
              key={s.id}
              className={`rounded-2xl border bg-white p-3.5 ${
                focused ? "border-gold shadow-md" : "border-line"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-deep-green truncate">
                    {pick(lang, s.titleSw, s.title)}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {count} {lang === "sw" ? "vipindi" : "episodes"} ·{" "}
                    {lang === "sw" ? "kipindi 1–3 bure" : "ep 1–3 free"}
                    {s.sponsoredPlays
                      ? ` · ${s.sponsoredPlays} ${lang === "sw" ? "watoto walifika kwa wadhamini" : "children accessed this because of sponsors"}`
                      : ""}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {sow && (
                      <span className="rounded-full bg-gold/20 text-gold-dark px-2 py-0.5 text-[9px] font-extrabold uppercase">
                        {lang === "sw" ? "Wiki hii bure" : "Free this week"}
                      </span>
                    )}
                    {owned && (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                        {lang === "sw" ? "Yako milele" : "Owned forever"}
                      </span>
                    )}
                  </div>
                </div>
                {owned || sow ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/series/${s.slug}`)}
                    className="rounded-full bg-deep-green text-warm-white px-3 py-1.5 text-[11px] font-bold"
                  >
                    {lang === "sw" ? "Sikiliza" : "Listen"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCheckout("unlock", s, price)}
                    className="rounded-full bg-gold text-deep-green px-3 py-1.5 text-[11px] font-black whitespace-nowrap"
                  >
                    {formatTzs(price)}
                  </button>
                )}
              </div>
              {owned && !sow && (
                <button
                  type="button"
                  onClick={() => openCheckout("sponsor", s, price)}
                  className="mt-2 text-[11px] font-bold text-teal hover:underline"
                >
                  {lang === "sw" ? "Dhamini hii kwa wengine" : "Sponsor this for others"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-4">
        <button
          type="button"
          onClick={() => setShowVip((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-xs font-bold text-muted">
            {lang === "sw" ? "Maktaba kamili (si lazima)" : "Full library pass (optional)"}
          </span>
          <span className="text-[11px] text-teal">{showVip ? "−" : "+"}</span>
        </button>
        {showVip && (
          <p className="mt-2 text-xs text-muted leading-relaxed">
            {lang === "sw"
              ? "VIP ya maktaba yote bado ipo kwa wanaotaka kila kitu kwa pamoja. Phase 1 inapendekeza kufungua hadithi moja moja — bila ahadi ya kila mwezi."
              : "A full-library VIP pass remains for people who want everything at once. Phase 1 leads with one-time unlocks — no recurring commitment."}
          </p>
        )}
      </div>

      {user && unlocks.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-deep-green mb-2">
            {lang === "sw" ? "Umiliki wako" : "Your unlocks"}
          </h2>
          <div className="space-y-2">
            {unlocks.map((u) => {
              const s = db.series.findById(u.seriesId);
              return (
                <div key={u.id} className="rounded-xl bg-white border border-line p-3 text-xs flex items-center gap-2">
                  <Check size={14} className="text-teal" />
                  <div className="min-w-0">
                    <div className="font-bold text-deep-green truncate">
                      {s ? pick(lang, s.titleSw, s.title) : u.seriesId}
                    </div>
                    <div className="text-muted">
                      {u.kind} · {u.paymentMethod} · {formatTzs(u.amountTzs)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-6 text-[11px] text-muted flex items-center gap-1.5">
        <Smartphone size={12} />
        {lang === "sw"
          ? "M-Pesa, Tigo Pesa, Airtel Money kwanza. Kadi ni mbadala tu."
          : "M-Pesa, Tigo Pesa, Airtel Money first. Card is fallback only."}
      </p>
      <p className="mt-1 text-[11px] text-muted flex items-center gap-1.5">
        <Lock size={12} />
        {lang === "sw"
          ? "Hakuna kuhesabu siku. Hakuna “majaribio yanaisha.”"
          : "No day-counting. No “trial expires” copy."}
      </p>

      {checkout && (
        <UnlockCheckoutModal
          open
          mode={checkout.mode}
          seriesId={checkout.series?.id}
          seriesTitle={checkout.series ? pick(lang, checkout.series.titleSw, checkout.series.title) : undefined}
          amountTzs={checkout.amountTzs}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
}
