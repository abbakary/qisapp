import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

type Props = {
  open: boolean;
  reasonSw: string;
  reasonEn: string;
  onClose: () => void;
  onReady: () => void;
};

/** Phone only — for save progress or posting a comment. */
export default function GuestPhoneGate({ open, reasonSw, reasonEn, onClose, onReady }: Props) {
  const { lang } = useLang();
  const { sessionFromPhone } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (phone.trim().length < 8 || phone.includes("@")) {
      setError(lang === "sw" ? "Weka namba ya simu." : "Enter your phone number.");
      return;
    }
    setBusy(true);
    try {
      const res = await sessionFromPhone(phone.trim(), undefined, lang);
      if (!res.ok) {
        setError(res.error || (lang === "sw" ? "Namba haijakubaliwa." : "That number could not be used."));
        return;
      }
      onReady();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-warm-white p-5 shadow-2xl space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              {lang === "sw" ? "Namba ya simu tu" : "Phone only"}
            </div>
            <p className="mt-1 text-sm text-ink leading-relaxed">{lang === "sw" ? reasonSw : reasonEn}</p>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-full bg-sand flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          name="msisdn"
          className="field-box"
          value={phone}
          onChange={(e) => setPhone(e.target.value.includes("@") ? "" : e.target.value.replace(/[^\d+\s]/g, ""))}
          placeholder="0712 345 678"
        />
        {error && <p className="text-[11px] text-rose-700">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "…" : lang === "sw" ? "Hifadhi na namba" : "Save with this number"}
        </button>
      </form>
    </div>
  );
}
