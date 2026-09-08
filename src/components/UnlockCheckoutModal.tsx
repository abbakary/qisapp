import React, { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, HeartHandshake, Smartphone, X } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db, normalizePhone } from "../lib/mock/db";
import { formatTzs } from "../lib/entitlements";
import type { MobileMoneyMethod } from "../lib/mock/types";

const MOBILE: { id: MobileMoneyMethod; tint: string; active: string }[] = [
  { id: "M-Pesa", tint: "bg-[#00A651]/10 border-[#00A651]/40 text-[#0B6B38]", active: "border-[#00A651] bg-[#00A651]/15 ring-2 ring-[#00A651]/30" },
  { id: "Tigo Pesa", tint: "bg-[#0054A6]/10 border-[#0054A6]/40 text-[#003E7E]", active: "border-[#0054A6] bg-[#0054A6]/15 ring-2 ring-[#0054A6]/30" },
  { id: "Airtel Money", tint: "bg-[#E4002B]/10 border-[#E4002B]/40 text-[#9B001E]", active: "border-[#E4002B] bg-[#E4002B]/15 ring-2 ring-[#E4002B]/30" },
];

export type CheckoutMode = "unlock" | "bundle" | "sponsor";

type Props = {
  open: boolean;
  mode: CheckoutMode;
  seriesId?: string;
  seriesTitle?: string;
  amountTzs: number;
  onClose: () => void;
  onSuccess?: (mode: CheckoutMode, meta?: { sponsored?: boolean }) => void;
};

function toLocalPhone(raw?: string | null): string {
  const d = digitsOnly(raw || "");
  return d.length >= 8 ? d.slice(0, 10) : "";
}

function digitsOnly(raw: string): string {
  if (!raw || raw.includes("@")) return "";
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("255") && d.length >= 9) d = "0" + d.slice(3);
  if (d.startsWith("0")) return d.slice(0, 10);
  return d.slice(0, 9);
}

function formatLocal(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

export default function UnlockCheckoutModal({
  open,
  mode,
  seriesId,
  seriesTitle,
  amountTzs,
  onClose,
  onSuccess,
}: Props) {
  const { lang } = useLang();
  const { user, sessionFromPhone, acceptSession } = useAuth();
  const [method, setMethod] = useState<MobileMoneyMethod | "Card">("M-Pesa");
  const [phone, setPhone] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [target, setTarget] = useState("Watoto na wasikilizaji wa bure");
  const [phase, setPhase] = useState<"form" | "push" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState("");
  const [sponsored, setSponsored] = useState(false);
  const [localMode, setLocalMode] = useState<CheckoutMode>(mode);
  const bundle = db.monetize.starterBundle();
  const firstPurchase = db.unlocks.mine().filter((u) => u.kind !== "SPONSORED_GRANT").length === 0;
  const payAmount = localMode === "bundle" ? bundle?.amountTzs || 2000 : amountTzs;
  const localPhone = useMemo(() => formatLocal(phone), [phone]);

  useEffect(() => {
    if (!open) return;
    setPhase("form");
    setError(null);
    setPhone(toLocalPhone(user?.phone));
    setLocalMode(firstPurchase && mode === "unlock" ? "bundle" : mode);
    setMethod("M-Pesa");
    setSponsored(false);
  }, [open, user?.phone, mode]);

  if (!open) return null;

  const copy =
    localMode === "sponsor"
      ? {
          kicker: "Sadaqah",
          title: lang === "sw" ? "Wape wengine pia" : "Share this blessing",
          hint:
            lang === "sw"
              ? "Bei ileile. Zawadi inafika kwa wasikilizaji wa bure, bila kujitangaza."
              : "Same price. Your gift reaches free listeners, without display.",
          done:
            lang === "sw"
              ? "Allah akubali. Zawadi yako itafika kwa waliotakiwa."
              : "May Allah accept it. Your gift will reach those who need it.",
          cta: lang === "sw" ? `Thibitisha sadaqah` : `Confirm sadaqah`,
        }
      : localMode === "bundle"
      ? {
          kicker: lang === "sw" ? "Kifurushi" : "Starter bundle",
          title: lang === "sw" ? "Tatu kwa bei ya mbili" : "Three for the price of two",
          hint:
            lang === "sw"
              ? "Malipo ya mara moja — hadithi zinabaki kwako, bila kuisha."
              : "One payment — the stories stay yours, with no expiry.",
          done:
            lang === "sw"
              ? "Barakallah feek. Hadithi hizi ziko mikononi mwako."
              : "Barakallah feek. These stories are now with you.",
          cta: lang === "sw" ? "Thibitisha kifurushi" : "Confirm bundle",
        }
      : {
          kicker: lang === "sw" ? "Fungua milele" : "Unlock forever",
          title: lang === "sw" ? "Endelea na hadithi" : "Continue this story",
          hint:
            lang === "sw"
              ? "Vipindi 1–3 ni bure. Lipa mara moja — hakuna kuisha wala kufanya upya."
              : "Episodes 1–3 are free. Pay once — no expiry, no renewal.",
          done:
            lang === "sw"
              ? "Barakallah feek. Hadithi iko mikononi mwako."
              : "Barakallah feek. This story is now yours.",
          cta: lang === "sw" ? `Lipa kwa ${method === "Card" ? "kadi" : method}` : `Pay with ${method}`,
        };

  async function ensureSession() {
    if (user) return true;
    const clean = phone.replace(/\s/g, "");
    if (clean.length < 8 || clean.includes("@")) {
      setError(lang === "sw" ? "Weka namba ya simu, si barua pepe." : "Enter a phone number, not an email.");
      return false;
    }
    const res = await sessionFromPhone(clean, undefined, lang);
    if (!res.ok) {
      setError(res.error || (lang === "sw" ? "Namba haijakubaliwa." : "That number could not be used."));
      return false;
    }
    return true;
  }

  async function pay() {
    setError(null);
    setPhase("push");
    try {
      const ok = await ensureSession();
      if (!ok) {
        setPhase("form");
        return;
      }
      const msisdn = normalizePhone(phone) || phone;
      if (localMode === "sponsor") {
        if (!seriesId) throw new Error("Missing series");
        const gift = await db.sponsorships.create({
          seriesId,
          paymentMethod: method,
          anonymous,
          targetLabel: target,
        });
        setRefCode(gift.referenceCode);
        setSponsored(false);
      } else {
        const res = await db.unlocks.request({
          seriesId,
          kind: localMode === "bundle" ? "BUNDLE" : "PURCHASE",
          paymentMethod: method,
          phone: msisdn,
        });
        if (res.token && res.user) await acceptSession(res.token, res.user);
        setRefCode(res.unlocks[0]?.referenceCode || "");
        setSponsored(Boolean(res.sponsored));
        setPhase("done");
        onSuccess?.(localMode, { sponsored: Boolean(res.sponsored) });
        try {
          sessionStorage.removeItem("qisas.pendingUnlock");
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        sessionStorage.removeItem("qisas.pendingUnlock");
      } catch {
        /* ignore */
      }
      setPhase("done");
      onSuccess?.(localMode);
    } catch (err: any) {
      setError(err?.message || (lang === "sw" ? "Tafadhali jaribu tena, kwa utulivu." : "Please try again when you are ready."));
      setPhase("form");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/55 p-0 sm:p-4">
      <div className="flex w-full max-w-md max-h-[100dvh] sm:max-h-[min(92dvh,640px)] flex-col rounded-t-3xl sm:rounded-3xl bg-warm-white shadow-2xl overflow-hidden">
        <div className="shrink-0 bg-deep-green px-4 pt-3 pb-4 text-warm-white">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/25 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-light/90">
                {copy.kicker}
              </div>
              <h3 className="font-display text-lg font-bold mt-0.5 leading-snug">{copy.title}</h3>
              {seriesTitle && (
                <p className="text-[12px] text-gold-light/90 mt-0.5 truncate">{seriesTitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label={lang === "sw" ? "Funga" : "Close"}
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-baseline gap-1.5 rounded-full bg-gold px-3 py-1 text-deep-green">
              <span className="text-sm font-black">{formatTzs(payAmount)}</span>
              <span className="text-[10px] font-semibold opacity-80">
                {lang === "sw" ? "mara moja, milele" : "once, forever"}
              </span>
            </div>
            <p className="text-[10px] text-gold-light/80 text-right leading-tight max-w-[46%]">
              {copy.hint}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
          {phase === "done" ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 text-center">
              <Check className="mx-auto text-emerald-700" size={26} />
              <p className="mt-3 font-display text-[17px] text-deep-green leading-snug">
                {sponsored
                  ? lang === "sw"
                    ? "Mtu alidhamini ufikiaji huu. Hadithi iko kwako — bila malipo."
                    : "Someone sponsored this seat. The story is yours — no charge."
                  : copy.done}
              </p>
              {refCode && <p className="mt-2 text-[11px] text-muted font-mono">{refCode}</p>}
            </div>
          ) : phase === "push" ? (
            <div className="rounded-2xl border border-line bg-white p-6 text-center">
              <Smartphone className="mx-auto text-gold animate-pulse" size={28} />
              <p className="mt-3 font-display text-lg text-deep-green">
                {method === "Card"
                  ? lang === "sw"
                    ? "Tafadhali subiri kidogo…"
                    : "A moment, please…"
                  : lang === "sw"
                    ? `Angalia simu — ${method}`
                    : `Check your phone — ${method}`}
              </p>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                {lang === "sw"
                  ? `Thibitisha STK kwenye ${localPhone || "simu yako"}. Baada ya hapo, ufikiaji hautaisha.`
                  : `Confirm the STK on ${localPhone || "your phone"}. After that, access does not expire.`}
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
                  {lang === "sw" ? "Lipa kwa pesa za simu" : "Pay with mobile money"}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MOBILE.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`rounded-xl border px-1.5 py-2.5 text-[10px] font-extrabold leading-tight ${
                        method === m.id ? m.active : m.tint
                      }`}
                    >
                      {m.id}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMethod("Card")}
                  className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-[11px] text-left flex items-center gap-2 ${
                    method === "Card" ? "border-gold bg-gold/10 text-deep-green" : "border-dashed border-line text-muted"
                  }`}
                >
                  <CreditCard size={14} />
                  {lang === "sw" ? "Kadi — ikiwa ni rahisi zaidi" : "Card — fallback only"}
                </button>
              </div>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {method === "Card"
                    ? lang === "sw"
                      ? "Namba ya simu (akaunti)"
                      : "Phone (for your account)"
                    : lang === "sw"
                      ? `Namba ya ${method}`
                      : `${method} number`}
                </span>
                <div className="mt-1 flex overflow-hidden rounded-xl border-[1.4px] border-line bg-white focus-within:border-gold">
                  <span className="shrink-0 px-3 py-3 text-[13px] font-bold text-deep-green bg-sand/80 border-r border-line">
                    +255
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    name="msisdn"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="min-w-0 w-full bg-transparent px-3 py-3 text-[15px] font-semibold tracking-wide text-ink outline-none"
                    value={localPhone}
                    onChange={(e) => setPhone(digitsOnly(e.target.value))}
                    placeholder="0712 345 678"
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  {method === "Card"
                    ? lang === "sw"
                      ? "Tutaitumia kuweka umiliki wako, si kwa malipo ya kadi."
                      : "Used to save ownership — not for the card charge."
                    : lang === "sw"
                      ? "STK push itatumwa hapa. Hakikisha namba iko sahihi."
                      : "The STK push is sent here. Use the number on this SIM."}
                </p>
              </label>

              {firstPurchase && localMode !== "sponsor" && (
                <button
                  type="button"
                  onClick={() => setLocalMode(localMode === "bundle" ? "unlock" : "bundle")}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-[12px] ${
                    localMode === "bundle" ? "border-gold bg-gold/15 text-deep-green" : "border-line bg-white text-ink"
                  }`}
                >
                  <span className="font-bold">{lang === "sw" ? "Kifurushi cha kuanza — ununuzi wa kwanza" : "Starter bundle — first purchase"}</span>
                  <span className="block text-[11px] text-muted">
                    {lang === "sw"
                      ? `Hadithi 3 kwa bei ya 2 — ${formatTzs(bundle?.amountTzs || 2000)}, mara moja.`
                      : `3 stories for the price of 2 — ${formatTzs(bundle?.amountTzs || 2000)}, once.`}
                  </span>
                </button>
              )}

              {!user && (
                <p className="text-[11px] text-muted leading-relaxed">
                  {lang === "sw"
                    ? "Namba ya simu tu — kuweka umiliki au kuhifadhi maendeleo. Hakuna ukuta wa kuingia kabla ya kuvinjari."
                    : "Phone number only — to keep ownership or save progress. No login wall before browsing."}
                </p>
              )}

              {localMode === "sponsor" && (
                <>
                  <select
                    className="field-box mt-0"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="Watoto na wasikilizaji wa bure">
                      {lang === "sw" ? "Watoto na wasikilizaji wa bure" : "Children and free listeners"}
                    </option>
                    <option value="Watoto wa Tanzania">
                      {lang === "sw" ? "Watoto wa Tanzania" : "Children in Tanzania"}
                    </option>
                    <option value="Madrasa">Madrasa</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-ink">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="accent-gold"
                    />
                    {lang === "sw" ? "Toa bila jina — hii ndiyo kawaida" : "Give without a name — the default"}
                  </label>
                </>
              )}

              {error && <p className="text-xs text-red-700 bg-red-50 rounded-xl p-2.5">{error}</p>}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-warm-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {phase === "done" ? (
            <button type="button" onClick={onClose} className="btn-primary">
              {lang === "sw" ? "Alhamdulillah, endelea" : "Alhamdulillah — continue"}
            </button>
          ) : phase === "push" ? (
            <p className="text-center text-[11px] text-muted py-1">
              {lang === "sw" ? "Subiri kidogo…" : "Please wait…"}
            </p>
          ) : (
            <>
              <button type="button" onClick={pay} className="btn-primary flex items-center justify-center gap-2">
                {localMode === "sponsor" ? <HeartHandshake size={16} /> : <Smartphone size={16} />}
                {copy.cta} · {formatTzs(payAmount)}
              </button>
              <p className="mt-1.5 text-[10px] text-center text-muted">
                {lang === "sw"
                  ? "Hakuna kufanya upya. Unaweza kufunga wakati wowote."
                  : "No renewal. You can close this whenever you wish."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
