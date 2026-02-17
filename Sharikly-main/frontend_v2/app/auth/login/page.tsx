"use client";
import React, { useState } from "react";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import FloatingModal from "@/components/FloatingModal";
import { useLocale } from "@/components/LocaleProvider";

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

      localStorage.setItem("access_token", token);
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
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Go back
      </button>
      <h1 className="text-2xl font-semibold text-center mb-6">{t("login")}</h1>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t("email")}</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">{t("password")}</label>
            <button
              type="button"
              onClick={() => router.push("/auth/forgot-password")}
              className="text-sm text-blue-600 hover:underline"
            >
              {t("forgot_password")}
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("password")}
              className="w-full h-12 border rounded-lg px-4 pr-10 focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        {/* Message */}
        {msg && <p className="text-center text-sm text-red-600">{msg}</p>}
        {msgSuccess && (
          <p className="text-center text-sm text-green-600">{msgSuccess}</p>
        )}

        {/* Resend verification (when login failed due to unverified email) */}
        {isVerifyEmailError && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="w-full py-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Sending…" : t("resend_verification_email")}
          </button>
        )}

        {/* Login button */}
        <button
          type="submit"
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t("login")}
        </button>

        {/* Switch to signup */}
        <p className="text-center text-sm text-gray-600">
          {t("dont_have_account")}{" "}
          <span
            onClick={() => router.push("/auth/signup")}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            {t("sign_up")}
          </span>
        </p>
      </form>
    </FloatingModal>
  );
}
