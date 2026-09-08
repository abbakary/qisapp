import React from "react";
import { X, ShieldCheck, FileText, Check } from "lucide-react";
import KhatamStar from "./KhatamStar";

type TermsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
};

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0B2A21] border border-emerald-500/30 text-warm-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-emerald-600/20 bg-[#07241C] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gold/20 flex items-center justify-center text-gold border border-gold/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white flex items-center gap-1.5">
                <span>Terms of Service & Privacy</span>
                <KhatamStar size={12} className="text-gold" />
              </h3>
              <p className="text-[11px] text-[#cfc9ae]">Masharti ya Huduma na Sera ya Faragha</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#cfc9ae] leading-relaxed">
          <section className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <h4 className="font-bold text-sm text-gold-light mb-1 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gold" />
              <span>1. Kanuni za Kiislamu (Islamic Editorial Standards)</span>
            </h4>
            <p>
              Qisas al-Anbiyaa hutoa hadithi na miongozo inayotii vyanzo sahihi vya Qur'ani na Sunnah. 
              Maudhui yote ya video na sauti huheshimu mipaka ya kidini, heshima kwa Manabii (alayhimus-salaam), 
              na nidhamu ya kimaadili ya Kiislamu.
            </p>
          </section>

          <section className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <h4 className="font-bold text-sm text-gold-light mb-1">2. Faragha na Nambari ya Simu (Phone & Privacy)</h4>
            <p>
              Nambari yako ya simu inatumika tu kwa uthibitishaji salama wa akaunti, ulinzi wa ununuzi wa VIP 
              (M-Pesa, Tigo Pesa, Airtel Money), na taarifa za vipindi vipya. Hatuuzi wala hatushiriki nambari yako 
              na washirika wasiohusika.
            </p>
          </section>

          <section className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <h4 className="font-bold text-sm text-gold-light mb-1">3. Ulinzi wa Maudhui (Content Rights)</h4>
            <p>
              Maudhui yote, tafsiri za Kiswahili, video za AI studio, na sauti zinasimamiwa chini ya haki miliki 
              za Qisas al-Anbiyaa. Hairuhusiwi kupakua au kusambaza kibiashara bila kibali cha kimaandishi.
            </p>
          </section>

          <section className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <h4 className="font-bold text-sm text-gold-light mb-1">4. Jamii na Maoni (Community Conduct)</h4>
            <p>
              Watumiaji wanatakiwa kutoa maoni kwa lugha ya staha na staha ya kiimani. Maoni yanayochochea au 
              kutusi yataondolewa mara moja na akaunti kusimamishwa.
            </p>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-emerald-600/20 bg-[#07241C] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
          >
            Funga · Close
          </button>
          {onAccept && (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-[#0A261E] text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Kubali Masharti · Accept</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
