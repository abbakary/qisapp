import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AUTH_LOST_EVENT, api, getToken, setToken } from "../lib/api/client";
import { hydrate, normalizePhone } from "../lib/mock/db";
import type { SessionUser, Role } from "../lib/mock/types";

type AuthCtx = {
  user: SessionUser | null;
  loading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithPhone: (phone: string, password: string, otpTicket?: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, emailOrPhone: string, password: string, language?: string) => Promise<{ ok: boolean; error?: string }>;
  registerWithPhone: (name: string, phone: string, password: string, language?: string, otpTicket?: string) => Promise<{ ok: boolean; error?: string }>;
  sessionFromPhone: (phone: string, name?: string, language?: string) => Promise<{ ok: boolean; error?: string }>;
  acceptSession: (token: string, user: SessionUser) => Promise<void>;
  checkPhoneExists: (phone: string) => Promise<{ exists: boolean; error?: string; user?: { id: string; name: string; phone: string; role: Role } }>;
  sendOtp: (phone: string) => Promise<{ ok: boolean; challengeId?: string; resendIn?: number; devAcceptAny?: boolean; error?: string }>;
  verifyOtp: (phone: string, code: string, challengeId?: string) => Promise<{ ok: boolean; otpTicket?: string; error?: string }>;
  logout: () => void;
  updateUser: (patch: Partial<SessionUser>) => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);
const AUTH_STORAGE_KEY = "qisas.react.session";

function persistSession(u: SessionUser | null) {
  try {
    if (u) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (!getToken()) return null;
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const saveUser = useCallback((u: SessionUser | null) => {
    setUser(u);
    persistSession(u);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!getToken()) return;
    try {
      const me = await api<SessionUser>("/api/auth/me");
      saveUser(me);
      await hydrate();
    } catch {
      setToken(null);
      saveUser(null);
    }
  }, [saveUser]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const onLost = () => saveUser(null);
    window.addEventListener(AUTH_LOST_EVENT, onLost);
    return () => window.removeEventListener(AUTH_LOST_EVENT, onLost);
  }, [saveUser]);

  const checkPhoneExists = useCallback(async (phoneInput: string) => {
    try {
      return await api("/api/auth/check-phone", {
        method: "POST",
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
    } catch (err: any) {
      return { exists: false, error: err?.message || "Cannot reach the server." };
    }
  }, []);

  const sendOtp = useCallback(async (phoneInput: string) => {
    try {
      return await api("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
    } catch (err: any) {
      return { ok: false, error: err?.message || "Could not send code." };
    }
  }, []);

  const verifyOtp = useCallback(async (phoneInput: string, code: string, challengeId?: string) => {
    try {
      return await api("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: phoneInput.trim(), code, challengeId }),
      });
    } catch (err: any) {
      return { ok: false, error: err?.message || "Incorrect code." };
    }
  }, []);

  const acceptSession = useCallback(
    async (token: string, sessionUser: SessionUser) => {
      setToken(token);
      saveUser(sessionUser);
      await hydrate();
    },
    [saveUser],
  );

  const sessionFromPhone = useCallback(
    async (phoneInput: string, name?: string, language = "sw") => {
      try {
        const res = await api<{ token: string; user: SessionUser }>("/api/auth/phone-session", {
          method: "POST",
          body: JSON.stringify({
            phone: phoneInput.trim(),
            name: (name || "").trim() || undefined,
            language,
          }),
        });
        await acceptSession(res.token, res.user);
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || "Could not continue with that number." };
      }
    },
    [acceptSession],
  );

  const loginWithPhone = useCallback(
    async (phoneInput: string, passwordInput: string, otpTicket?: string) => {
      setLoading(true);
      try {
        const res = await api<{ token: string; user: SessionUser }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            phone: phoneInput.trim(),
            password: passwordInput,
            ...(otpTicket ? { otpTicket } : {}),
          }),
        });
        setToken(res.token);
        saveUser(res.user);
        await hydrate();
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || "Invalid phone or password." };
      } finally {
        setLoading(false);
      }
    },
    [saveUser]
  );

  const login = useCallback(
    async (identifierInput: string, passwordInput: string) => {
      setLoading(true);
      try {
        const res = await api<{ token: string; user: SessionUser }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ identifier: identifierInput.trim(), password: passwordInput }),
        });
        setToken(res.token);
        saveUser(res.user);
        await hydrate();
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || "Wrong credentials." };
      } finally {
        setLoading(false);
      }
    },
    [saveUser]
  );

  const registerWithPhone = useCallback(
    async (name: string, phoneInput: string, passwordInput: string, language = "sw", otpTicket?: string) => {
      setLoading(true);
      try {
        const res = await api<{ token: string; user: SessionUser }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            phone: normalizePhone(phoneInput),
            password: passwordInput,
            language,
            ...(otpTicket ? { otpTicket } : {}),
          }),
        });
        setToken(res.token);
        saveUser(res.user);
        await hydrate();
        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || "Could not create account." };
      } finally {
        setLoading(false);
      }
    },
    [saveUser]
  );

  const register = useCallback(
    async (name: string, emailOrPhone: string, passwordInput: string, language = "sw") => {
      const trimmed = emailOrPhone.trim();
      if (!trimmed.includes("@")) {
        return registerWithPhone(name, trimmed, passwordInput, language);
      }
      return registerWithPhone(name, trimmed, passwordInput, language);
    },
    [registerWithPhone]
  );

  const logout = useCallback(() => {
    setToken(null);
    saveUser(null);
  }, [saveUser]);

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...patch };
      persistSession(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithPhone,
        sessionFromPhone,
        acceptSession,
        register,
        registerWithPhone,
        checkPhoneExists,
        sendOtp,
        verifyOtp,
        logout,
        updateUser,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
