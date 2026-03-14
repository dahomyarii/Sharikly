"use client";
import React, { useState } from "react";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import FloatingModal from "@/components/FloatingModal";
import { useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_BASE;

const VERIFY_EMAIL_MSG = "verify your email";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const router = useRouter();
  const { t } = useLocale();

  const isVerifyEmailError =
    msg && msg.toLowerCase().includes(VERIFY_EMAIL_MSG);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsgSuccess("");

    try {
      const res = await axiosInstance.post(`${API}/auth/token/`, {
        email,
        password,
      });
      const token = res.data.access;
      const refreshToken = res.data.refresh;

      localStorage.setItem("access_token", token);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }
      axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${token}`;

      const me = await axiosInstance.get(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.setItem("user", JSON.stringify(me.data));

      // Dispatch custom event to notify components about login
      window.dispatchEvent(
        new CustomEvent("userLogin", { detail: { user: me.data, token } }),
      );

      // Soft refresh using router
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Login failed");
    }
  }

  async function handleResendVerification() {
    if (!email.trim() || resendLoading) return;
    setResendLoading(true);
    setMsgSuccess("");
    try {
      await axiosInstance.post(`${API}/auth/resend-verification/`, {
        email: email.trim(),
      });
      setMsgSuccess(t("resend_verification_sent"));
    } catch (_) {
      setMsgSuccess(t("resend_verification_sent")); // Same UX as backend
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <FloatingModal>
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Go back
      </button>
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary/80">
          Welcome back
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">{t("login")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access your bookings, saved listings, and host dashboard.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">{t("email")}</label>
          <Input
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">{t("password")}</label>
            <button
              type="button"
              onClick={() => router.push("/auth/forgot-password")}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("forgot_password")}
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("password")}
              className="pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        {msg && <p className="text-center text-sm text-red-600">{msg}</p>}
        {msgSuccess && (
          <p className="text-center text-sm text-green-600">{msgSuccess}</p>
        )}

        {isVerifyEmailError && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="w-full py-2 text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Sending…" : t("resend_verification_email")}
          </button>
        )}

        <Button type="submit" size="lg" className="w-full">
          {t("login")}
        </Button>

        <div className="rounded-[24px] bg-accent/40 px-4 py-4 text-center text-sm text-muted-foreground">
          {t("dont_have_account")}{" "}
          <span
            onClick={() => router.push("/auth/signup")}
            className="cursor-pointer font-semibold text-primary hover:underline"
          >
            {t("sign_up")}
          </span>
        </div>
      </form>
    </FloatingModal>
  );
}
