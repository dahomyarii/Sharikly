"use client";
import type React from "react";
import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import FloatingModal from "@/components/FloatingModal";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function LoginModal({
  onClose,
  onSwitchToSignup,
}: {
  onClose?: () => void;
  onSwitchToSignup?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [msgSuccess, setMsgSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const router = useRouter();

  const isVerifyEmailError =
    msg && msg.toLowerCase().includes("verify your email");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMsg("");
    setMsgSuccess("");

    try {
      const res = await axiosInstance.post(`${API}/auth/token/`, { email, password });
      const token = res.data.access;

      localStorage.setItem("access_token", token);
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const me = await axiosInstance.get(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.setItem("user", JSON.stringify(me.data));

      // Close the modal first
      if (onClose) {
        onClose();
      }

      // Dispatch custom event to notify components about login
      window.dispatchEvent(
        new CustomEvent("userLogin", { detail: { user: me.data, token } })
      );

      // Soft refresh using router
      router.refresh();
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Login failed");
      setIsLoading(false);
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
      setMsgSuccess("If your email is not verified, we've sent a new link. Check your inbox.");
    } catch (_) {
      setMsgSuccess("If your email is not verified, we've sent a new link. Check your inbox.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <FloatingModal onClose={onClose}>
      <h1 className="text-2xl font-semibold text-center mb-6">Login</h1>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">Email</label>
          <input
            type="email"
            placeholder="example@gmail.com"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Password</label>
            <Link
              href="/auth/forgot-password"
              onClick={onClose}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full h-12 border rounded-lg px-4 pr-10 focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
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

        {/* Resend verification when login failed due to unverified email */}
        {isVerifyEmailError && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="w-full py-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
        )}

        {/* Login button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Logging in..." : "Login"}
        </button>

        {/* Switch to signup */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <span
            onClick={() => {
              if (onSwitchToSignup) {
                onSwitchToSignup();
              } else {
                router.push("/auth/signup");
              }
            }}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </form>
    </FloatingModal>
  );
}