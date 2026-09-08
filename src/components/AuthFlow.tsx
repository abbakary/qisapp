import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import KhatamStar from "./KhatamStar";
import TermsModal from "./TermsModal";
import { normalizePhone } from "../lib/mock/db";

type AuthStep = "IDENTIFIER_CHECK" | "OTP_VERIFY" | "PASSWORD_LOGIN" | "CREATE_ACCOUNT";

type AuthFlowProps = {
  initialStep?: AuthStep;
  defaultPhone?: string;
};

export default function AuthFlow({ initialStep = "IDENTIFIER_CHECK", defaultPhone = "" }: AuthFlowProps) {
  const { lang, toggle } = useLang();
  const { checkPhoneExists, loginWithPhone, registerWithPhone, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";

  // Flow step state
  const [step, setStep] = useState<AuthStep>(initialStep);

  // Form states
  const [phone, setPhone] = useState(defaultPhone);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; phone: string } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpTicket, setOtpTicket] = useState("");
  const [otpChallengeId, setOtpChallengeId] = useState("");
  const [otpDevAny, setOtpDevAny] = useState(true);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone);
  }, [defaultPhone]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Handle Step 1: Identifier Check
  async function handleIdentifierSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = phone.trim();

    if (!clean || clean.length < 8) {
      setError(
        lang === "sw"
          ? "Tafadhali weka nambari sahihi ya simu (mfano: 07XXXXXXXX)."
          : "Please enter a valid phone number (e.g. 07XXXXXXXX)."
      );
      return;
    }

    setBusy(true);
    const check = await checkPhoneExists(clean);
    setBusy(false);

    if (check.error) {
      setError(
        lang === "sw"
          ? "Imeshindikana kuungana na seva. Jaribu tena."
          : "Could not reach the server. Try again."
      );
      return;
    }

    if (check.exists && check.user) {
      setMatchedUser({ name: check.user.name, phone: check.user.phone });
      setStep("PASSWORD_LOGIN");
      setPassword("");
    } else {
      setMatchedUser(null);
      setStep("CREATE_ACCOUNT");
      setPassword("");
      setConfirmPassword("");
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!otpCode.trim()) {
      setError(lang === "sw" ? "Weka nambari uliyopokea." : "Enter the code sent to your phone.");
      return;
    }

    setBusy(true);
    const verified = await verifyOtp(phone, otpCode.trim(), otpChallengeId || undefined);
    if (!verified.ok || !verified.otpTicket) {
      setBusy(false);
      setError(verified.error || (lang === "sw" ? "Nambari si sahihi." : "That code is not valid."));
      return;
    }
    setOtpTicket(verified.otpTicket);

    const check = await checkPhoneExists(phone);
    setBusy(false);

    if (check.exists && check.user) {
      setMatchedUser({ name: check.user.name, phone: check.user.phone });
      setStep("PASSWORD_LOGIN");
      setPassword("");
    } else {
      setMatchedUser(null);
      setStep("CREATE_ACCOUNT");
      setPassword("");
      setConfirmPassword("");
    }
  }

  async function handleResendOtp() {
    if (resendIn > 0) return;
    setError(null);
    setBusy(true);
    const sent = await sendOtp(phone);
    setBusy(false);
    if (!sent.ok) {
      setError(sent.error || (lang === "sw" ? "Imeshindikana kutuma tena." : "Could not resend."));
      return;
    }
    setOtpChallengeId(sent.challengeId || "");
    setOtpDevAny(Boolean(sent.devAcceptAny));
    setResendIn(sent.resendIn || 45);
    setOtpCode("");
  }

  // Handle Step 2: Login with Password
  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError(lang === "sw" ? "Weka nywila yako kuendelea." : "Enter your password to continue.");
      return;
    }

    setBusy(true);
    const res = await loginWithPhone(phone, password);
    setBusy(false);

    if (!res.ok) {
      setError(res.error || (lang === "sw" ? "Nywila si sahihi." : "Incorrect password."));
      return;
    }

    // Success! Redirect to intended destination
    setSuccessToast(
      lang === "sw"
        ? `Karibu tena, ${matchedUser?.name || "Mtumiaji"}!`
        : `Welcome back, ${matchedUser?.name || "User"}!`
    );
    setTimeout(() => {
      navigate(callbackUrl, { replace: true });
    }, 600);
  }

  // Handle Step 2: Create Account (Register)
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError(lang === "sw" ? "Tafadhali weka jina lako kamili." : "Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setError(lang === "sw" ? "Nambari ya simu inahitajika." : "Phone number is required.");
      return;
    }
    if (password.length < 6) {
      setError(
        lang === "sw"
          ? "Nywila lazima iwe na angalau herufi 6."
          : "Password must be at least 6 characters."
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === "sw" ? "Nywila hazilingani." : "Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError(
        lang === "sw"
          ? "Tafadhali kubali Masharti na Sera ya Faragha ili kuendelea."
          : "Please agree to the Terms and Conditions and Privacy Policy to continue."
      );
      return;
    }

    setBusy(true);
    const res = await registerWithPhone(fullName, phone, password, lang);
    if (!res.ok) {
      const msg = (res.error || "").toLowerCase();
      const alreadyHasAccount =
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("verify your phone");
      if (alreadyHasAccount) {
        const signedIn = await loginWithPhone(phone, password);
        setBusy(false);
        if (signedIn.ok) {
          setSuccessToast(
            lang === "sw"
              ? `Karibu tena, ${fullName}!`
              : `Welcome back, ${fullName}!`
          );
          setTimeout(() => {
            navigate(callbackUrl, { replace: true });
          }, 600);
          return;
        }
        setMatchedUser({ name: fullName, phone });
        setStep("PASSWORD_LOGIN");
        setError(
          lang === "sw"
            ? "Nambari hii ina akaunti. Weka nywila yako kuingia."
            : "This number already has an account. Sign in with your password."
        );
        return;
      }
      setBusy(false);
      setError(res.error || (lang === "sw" ? "Hitilafu imetokea wakati wa usajili." : "Registration failed."));
      return;
    }
    setBusy(false);

    // Success!
    setSuccessToast(
      lang === "sw"
        ? `Akaunti yako imeundwa! Karibu ${fullName}.`
        : `Account created! Welcome to Qisas, ${fullName}.`
    );
    setTimeout(() => {
      navigate(callbackUrl, { replace: true });
    }, 700);
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#051812] text-warm-white flex flex-col justify-between overflow-x-hidden selection:bg-gold selection:text-deep-green">
      {/* Background with Islamic Geometric / Hexagonal Lattice texture */}
      <div className="fixed inset-0 pointer-events-none opacity-25">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="hex-grid" width="48" height="83.14" patternUnits="userSpaceOnUse">
              <path
                d="M48 0L24 13.86L0 0v27.71L24 41.57l24-13.86V0zm0 83.14L24 69.28L0 83.14v-27.7l24-13.86l24 13.86v27.7zM0 41.57l24-13.86l24 13.86l-24 13.86L0 41.57z"
                fill="none"
                stroke="#1E8477"
                strokeWidth="1.2"
                strokeOpacity="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-grid)" />
        </svg>
      </div>

      {/* Radial soft emerald & gold ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[radial-gradient(circle_at_50%_0%,rgba(30,132,119,0.35),rgba(201,162,39,0.12),transparent_70%)] pointer-events-none" />

      {/* Top Navbar: Language switch & back button */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-6 flex items-center justify-between">
        {step !== "IDENTIFIER_CHECK" ? (
          <button
            onClick={() => {
              setStep("IDENTIFIER_CHECK");
              setError(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#cfc9ae] hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === "sw" ? "Badili Nambari" : "Back / Change"}</span>
          </button>
        ) : (
          <Link
            to="/home"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#cfc9ae] hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === "sw" ? "Rudi" : "Back"}</span>
          </Link>
        )}

        {/* Language switch toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gold-light border border-white/10 transition cursor-pointer"
          title="Switch Language"
        >
          <span>{lang === "sw" ? "🇹🇿 SW · Swahili" : "🇬🇧 EN · English"}</span>
        </button>
      </div>

      {/* Main Centered Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 w-full max-w-md mx-auto">
        {/* Success Toast */}
        {successToast && (
          <div className="mb-5 w-full p-3.5 rounded-2xl bg-emerald-900/90 border border-emerald-400 text-emerald-100 flex items-center gap-2.5 shadow-xl animate-fade-in text-xs font-bold">
            <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Circular Brand Emblem matching the user's screenshot */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center p-2 border-2 border-gold/40 hover:scale-105 transition-transform duration-300">
            <div className="flex flex-col items-center justify-center text-center">
              <KhatamStar size={34} className="text-gold" />
              <span className="font-display font-bold text-[13px] text-deep-green tracking-wide mt-0.5">
                QISAS
              </span>
              <span className="text-[8px] font-bold text-teal tracking-widest uppercase">
                XTRA
              </span>
            </div>
            {/* Subtle glow rim */}
            <div className="absolute inset-0 rounded-full ring-4 ring-gold/20 animate-pulse pointer-events-none" />
          </div>
        </div>

        {/* STEP 1: IDENTIFIER CHECK (Landing page for phone entry) */}
        {step === "IDENTIFIER_CHECK" && (
          <div className="w-full space-y-6">
            <div className="text-center space-y-1.5">
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-white tracking-tight">
                {lang === "sw" ? "Karibu Qisas al-Anbiyaa" : "Welcome to Qisas Xtra"}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#cfc9ae]">
                {lang === "sw"
                  ? "Weka nambari yako ya simu kuendelea"
                  : "Enter your phone number to continue"}
              </p>
            </div>

            <form onSubmit={handleIdentifierSubmit} className="space-y-4">
              {/* Phone Input Box matching screenshot */}
              <div className="relative rounded-2xl bg-[#0c2a21]/90 border border-emerald-500/30 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 transition shadow-inner">
                <div className="flex items-center px-4 py-3.5 gap-3">
                  <Phone className="h-5 w-5 text-gold-light shrink-0 opacity-80" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={
                      lang === "sw"
                        ? "Nambari ya Simu (mfano: 07XXXXXXXX)"
                        : "Phone number (e.g. 07XXXXXXXX)"
                    }
                    className="w-full bg-transparent text-white placeholder:text-white/40 text-sm sm:text-base font-medium focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Gold Continue Button matching screenshot */}
              <button
                type="submit"
                disabled={busy}
                className="w-full cursor-pointer py-3.5 px-6 rounded-xl bg-[#F3B728] hover:bg-[#ffc636] active:bg-[#e0a618] text-[#0A261E] font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-gold/20 hover:shadow-gold/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{busy ? "..." : lang === "sw" ? "Endelea" : "Continue"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Bottom guidance text matching screenshot */}
              <p className="text-center text-xs text-[#a59d81] leading-relaxed pt-1">
                {lang === "sw"
                  ? "Tutaangalia kama una akaunti na kukuongoza ipasavyo"
                  : "We'll check if you have an account and guide you accordingly"}
              </p>
            </form>

          </div>
        )}

        {step === "OTP_VERIFY" && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-1.5">
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-white tracking-tight">
                {lang === "sw" ? "Thibitisha nambari" : "Verify your phone"}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#cfc9ae]">
                {lang === "sw"
                  ? `Tumekutumia nambari ya uthibitisho kwa ${phone}`
                  : `We sent a verification code to ${phone}`}
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="relative rounded-2xl bg-[#0c2a21]/90 border border-emerald-500/30 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 transition shadow-inner">
                <div className="flex items-center px-4 py-3.5 gap-3">
                  <ShieldCheck className="h-5 w-5 text-gold-light shrink-0 opacity-80" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={lang === "sw" ? "Weka nambari ya uthibitisho" : "Enter verification code"}
                    className="w-full bg-transparent text-white placeholder:text-white/40 text-sm sm:text-base font-medium tracking-widest focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {otpDevAny && (
                <p className="text-center text-[11px] text-[#a59d81]">
                  {lang === "sw"
                    ? "Kwa sasa weka nambari yoyote — SMS halisi itaunganishwa baadaye."
                    : "For now enter any code — real SMS will be connected later."}
                </p>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full cursor-pointer py-3.5 px-6 rounded-xl bg-[#F3B728] hover:bg-[#ffc636] active:bg-[#e0a618] text-[#0A261E] font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-gold/20 hover:shadow-gold/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{busy ? "..." : lang === "sw" ? "Thibitisha" : "Verify"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={busy || resendIn > 0}
                onClick={() => void handleResendOtp()}
                className="w-full text-center text-xs font-bold text-gold-light disabled:text-[#a59d81] disabled:no-underline hover:underline cursor-pointer disabled:cursor-default"
              >
                {resendIn > 0
                  ? lang === "sw"
                    ? `Tuma tena baada ya ${resendIn}s`
                    : `Resend in ${resendIn}s`
                  : lang === "sw"
                    ? "Tuma nambari tena"
                    : "Resend code"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2A: PASSWORD LOGIN (Existing Account) */}
        {step === "PASSWORD_LOGIN" && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-1.5">
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-white tracking-tight">
                {lang === "sw" ? "Karibu Tena" : "Welcome Back"}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#cfc9ae]">
                {lang === "sw"
                  ? `Weka nywila yako kuendelea (${matchedUser?.name || phone})`
                  : `Enter your password to continue as ${matchedUser?.name || phone}`}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Pre-filled Phone Display */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0c2a21]/90 border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2.5 text-white/80">
                  <Phone className="h-4 w-4 text-gold" />
                  <span className="font-mono text-sm font-bold text-white">{phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("IDENTIFIER_CHECK");
                    setError(null);
                  }}
                  className="text-gold-light hover:underline font-bold text-xs cursor-pointer"
                >
                  {lang === "sw" ? "Badilisha" : "Change"}
                </button>
              </div>

              {/* Password Input Box */}
              <div className="relative rounded-2xl bg-[#0c2a21]/90 border border-emerald-500/30 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 transition shadow-inner">
                <div className="flex items-center px-4 py-3.5 gap-3">
                  <Lock className="h-5 w-5 text-gold-light shrink-0 opacity-80" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={lang === "sw" ? "Weka nywila yako" : "Enter your password"}
                    className="w-full bg-transparent text-white placeholder:text-white/40 text-sm sm:text-base font-medium focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/50 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Gold Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full cursor-pointer py-3.5 px-6 rounded-xl bg-[#F3B728] hover:bg-[#ffc636] active:bg-[#e0a618] text-[#0A261E] font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-gold/20 hover:shadow-gold/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{busy ? "..." : lang === "sw" ? "Ingia" : "Sign In"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-[#cfc9ae]">
                {lang === "sw" ? "Huna akaunti bado? " : "Don't have an account yet? "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("CREATE_ACCOUNT");
                    setError(null);
                  }}
                  className="font-bold text-gold-light hover:underline cursor-pointer"
                >
                  {lang === "sw" ? "Jisajili Hapa" : "Create Account"}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* STEP 2B: CREATE ACCOUNT / REGISTER (Exact layout of Image 2) */}
        {step === "CREATE_ACCOUNT" && (
          <div className="w-full space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-white tracking-tight">
                {lang === "sw" ? "Fungua Akaunti" : "Create Account"}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#cfc9ae]">
                {lang === "sw"
                  ? "Jiunge na Qisas na uanze safari yako ya kiroho"
                  : "Join Qisas and start your spiritual streaming journey"}
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* 1. Full Name Input */}
              <div className="relative rounded-2xl bg-[#0c2a21]/90 border border-emerald-500/30 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 transition shadow-inner">
                <div className="flex items-center px-4 py-3.5 gap-3">
                  <User className="h-5 w-5 text-gold-light shrink-0 opacity-80" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={lang === "sw" ? "Jina Kamili" : "Full Name"}
                    className="w-full bg-transparent text-white placeholder:text-white/40 text-sm sm:text-base font-medium focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* 2. Phone Input (pre-filled from Step 1) */}
              <div className="relative rounded-2xl bg-[#0c2a21]/90 border border-emerald-500/30 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 transition shadow-inner">
                <div className="flex flex-col px-4 pt-1.5 pb-2.5">
                  <span className="text-[10px] uppercase font-bold text-gold-light/70 tracking-wider">
                    {lang === "sw" ? "Nambari ya Simu" : "Phone Number"}
                  </span>
                  <div className="flex items-center gap-3 mt-0.5">
                    <Phone className="h-4 w-4 text-gold-light shrink-0 opacity-80" />
                    <input
                      type="tel"
                      required
                      readOnly
                      value={phone}
                      className="w-full bg-transparent text-white font-mono text-sm sm:text-base font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setStep("IDENTIFIER_CHECK")}
                      className="text-[11px] text-gold-light hover:underline font-semibold cursor-pointer shrink-0"
                    >
                      {lang === "sw" ? "Badili" : "Change"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Password Input */}
              <div className="relative rounded-2xl bg-[#0c2a21]/90 border border-emerald-500/30 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 transition shadow-inner">
                <div className="flex items-center px-4 py-3.5 gap-3">
                  <Lock className="h-5 w-5 text-gold-light shrink-0 opacity-80" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={lang === "sw" ? "Nywila (angalau herufi 6)" : "Password"}
                    className="w-full bg-transparent text-white placeholder:text-white/40 text-sm sm:text-base font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/50 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* 4. Confirm Password Input */}
              <div className="relative rounded-2xl bg-[#0c2a21]/90 border border-emerald-500/30 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 transition shadow-inner">
                <div className="flex items-center px-4 py-3.5 gap-3">
                  <Lock className="h-5 w-5 text-gold-light shrink-0 opacity-80" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={lang === "sw" ? "Thibitisha Nywila" : "Confirm Password"}
                    className="w-full bg-transparent text-white placeholder:text-white/40 text-sm sm:text-base font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-white/50 hover:text-white transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* 5. Terms and Conditions Checkbox matching Image 2 */}
              <div className="pt-1 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (error) setError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded accent-[#F3B728] cursor-pointer"
                  />
                  <span className="text-xs text-[#cfc9ae] leading-tight">
                    {lang === "sw" ? (
                      <>
                        Ninakubali{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setTermsModalOpen(true);
                          }}
                          className="font-bold text-gold-light hover:underline"
                        >
                          Masharti ya Huduma
                        </button>{" "}
                        na{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setTermsModalOpen(true);
                          }}
                          className="font-bold text-gold-light hover:underline"
                        >
                          Sera ya Faragha
                        </button>
                      </>
                    ) : (
                      <>
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setTermsModalOpen(true);
                          }}
                          className="font-bold text-gold-light hover:underline"
                        >
                          Terms and Conditions
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setTermsModalOpen(true);
                          }}
                          className="font-bold text-gold-light hover:underline"
                        >
                          Privacy Policy
                        </button>
                      </>
                    )}
                  </span>
                </label>

                {/* Subtext under checkbox matching Image 2 */}
                <p className="text-[11px] text-[#9b9379] leading-tight pl-7">
                  {lang === "sw" ? (
                    <>
                      Kwa kujiandikisha, unakubali{" "}
                      <span className="text-gold-light font-medium">Masharti</span> na{" "}
                      <span className="text-gold-light font-medium">Sera ya Faragha</span>.
                    </>
                  ) : (
                    <>
                      By signing up, you agree to our{" "}
                      <span className="text-gold-light font-medium">Terms</span> and{" "}
                      <span className="text-gold-light font-medium">Privacy Policy</span>.
                    </>
                  )}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Gold Button matching Image 2 */}
              <button
                type="submit"
                disabled={busy}
                className="w-full cursor-pointer py-3.5 px-6 rounded-xl bg-[#F3B728] hover:bg-[#ffc636] active:bg-[#e0a618] text-[#0A261E] font-extrabold text-sm sm:text-base tracking-wide shadow-lg shadow-gold/20 hover:shadow-gold/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 !mt-4"
              >
                <span>{busy ? "..." : lang === "sw" ? "Fungua Akaunti" : "Create Account"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Footer link matching Image 2 */}
            <div className="text-center pt-3">
              <p className="text-xs text-[#cfc9ae]">
                {lang === "sw" ? "Una akaunti tayari? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    void checkPhoneExists(phone).then((check) => {
                      if (check.exists && check.user) {
                        setMatchedUser({ name: check.user.name, phone: check.user.phone });
                        setStep("PASSWORD_LOGIN");
                      } else {
                        setStep("IDENTIFIER_CHECK");
                      }
                    });
                    setError(null);
                  }}
                  className="font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                >
                  {lang === "sw" ? "Ingia" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Copyright info */}
      <div className="relative z-10 w-full text-center py-4 text-[11px] text-[#787158]">
        <span>Qisas al-Anbiyaa · Swahili & English Islamic Audio & Video</span>
      </div>

      {/* Terms and Privacy Policy Modal */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => setAgreeTerms(true)}
      />
    </div>
  );
}
