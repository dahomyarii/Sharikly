"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import FloatingModal from "@/components/FloatingModal";
import { useLocale } from "@/components/LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLocale();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      await axios.post(`${API}/auth/password-reset/`, { email: email.trim() });
      setSuccess(true);
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
        <p className="text-center text-gray-600 mb-6">
          {t("reset_password_sent")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Login
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
        {t("forgot_password")}
      </h1>
      <p className="text-center text-gray-600 text-sm mb-6">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t("email")}</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {msg && <p className="text-center text-sm text-red-600">{msg}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </FloatingModal>
  );
}
