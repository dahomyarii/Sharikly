"use client";
import React, { useState } from "react";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import FloatingModal from "@/components/FloatingModal";
import { useLocale } from "@/components/LocaleProvider";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { t } = useLocale();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

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

  return (
    <FloatingModal>
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
          <label className="text-sm text-gray-700">{t("password")}</label>
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
