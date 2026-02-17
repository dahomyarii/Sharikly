"use client";
import React, { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import FloatingModal from "@/components/FloatingModal";
import { useLocale } from "@/components/LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_BASE;

function ResetPasswordForm() {
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  useEffect(() => {
    setUid(searchParams.get("uid") || "");
    setToken(searchParams.get("token") || "");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (newPassword !== confirmPassword) {
      setMsg(t("password_mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (!uid || !token) {
      setMsg("Invalid or missing reset link. Request a new one.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/password-reset/confirm/`, {
        uid,
        token,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <FloatingModal>
        <h1 className="text-2xl font-semibold text-center mb-6">
          {t("reset_password")}
        </h1>
        <p className="text-center text-gray-600 mb-6">
          {t("password_reset_success")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t("login")}
        </button>
      </FloatingModal>
    );
  }

  if (!uid || !token) {
    return (
      <FloatingModal>
        <button
          onClick={() => router.push("/auth/forgot-password")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
        <p className="text-center text-gray-600 mb-6">
          Invalid or missing reset link. Please request a new password reset.
        </p>
        <button
          type="button"
          onClick={() => router.push("/auth/forgot-password")}
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Request reset link
        </button>
      </FloatingModal>
    );
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
      <h1 className="text-2xl font-semibold text-center mb-6">
        {t("reset_password")}
      </h1>
      <p className="text-center text-gray-600 text-sm mb-6">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t("new_password")}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("new_password")}
              className="w-full h-12 border rounded-lg px-4 pr-10 focus:ring-2 focus:ring-blue-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t("confirm_password")}</label>
          <input
            type="password"
            placeholder={t("confirm_password")}
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
          />
        </div>
        {msg && <p className="text-center text-sm text-red-600">{msg}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Set new password"}
        </button>
      </form>
    </FloatingModal>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<FloatingModal><p className="text-center text-gray-500">Loading…</p></FloatingModal>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
