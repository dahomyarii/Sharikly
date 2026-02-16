"use client";

import type React from "react";
import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import FloatingModal from "@/components/FloatingModal";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/components/LocaleProvider";
const API = process.env.NEXT_PUBLIC_API_BASE;

export default function SignupPage({ onClose }: { onClose?: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLocale();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setIsLoading(true);
    try {
      // Register the user
      const registerRes = await axiosInstance.post(`${API}/auth/register/`, {
        username,
        email,
        phone_number: phone,
        password,
      });

      // Show success message and prompt for email verification
      showToast(
        "Account created! Please check your email to verify your account.",
        "success",
      );
      setIsLoading(false);

      // Close signup modal if provided
      if (onClose) {
        onClose();
      }

      // Redirect to login page
      setTimeout(() => router.push("/auth/login"), 1000);
    } catch (err: any) {
      let errorMsg = "Signup failed";
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else {
          // Parse field-specific errors like {"email": ["already exists"]}
          errorMsg = Object.entries(data)
            .map(
              ([key, val]) =>
                `${key}: ${Array.isArray(val) ? val.join(", ") : val}`,
            )
            .join(" | ");
        }
      }
      showToast(errorMsg, "error");
      setMsg(errorMsg);
      setIsLoading(false);
    }
  }

  return (
    <FloatingModal onClose={onClose}>
      <h1 className="text-2xl font-semibold text-center mb-6">
        {t("create_account")}
      </h1>
      <form onSubmit={handleSignup} className="space-y-5">
        {/* Username */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t("username")}</label>
          <input
            type="text"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            placeholder={t("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t("email")}</label>
          <input
            type="email"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t("phone_number")}</label>
          <input
            type="tel"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            placeholder={t("phone_number")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t("password")}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full h-12 border rounded-lg px-4 pr-10 focus:ring-2 focus:ring-blue-500"
              placeholder={t("password")}
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
        {msg && (
          <p
            className={`text-center text-sm ${msg.includes("created") ? "text-green-600" : "text-red-600"}`}
          >
            {msg}
          </p>
        )}
        {/* Signup button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? t("creating_account") : t("sign_up")}
        </button>
        {/* Login link */}
        <p className="text-center text-sm text-gray-600">
          {t("already_have_account")}{" "}
          <span
            onClick={() => router.push("/auth/login")}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            {t("login")}
          </span>
        </p>
      </form>
    </FloatingModal>
  );
}
