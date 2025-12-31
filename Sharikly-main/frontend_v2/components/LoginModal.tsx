"use client";
import type React from "react";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import FloatingModal from "@/components/FloatingModal";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function LoginModal({ onClose }: { onClose?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMsg("");

    try {
      const res = await axios.post(`${API}/auth/token/`, { email, password });
      const token = res.data.access;

      localStorage.setItem("access_token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const me = await axios.get(`${API}/auth/me/`, {
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
          <label className="text-sm text-gray-700">Password</label>
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
            onClick={() => router.push("/auth/signup")}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </form>
    </FloatingModal>
  );
}
