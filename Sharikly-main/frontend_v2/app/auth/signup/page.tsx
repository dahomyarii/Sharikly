"use client";

import type React from "react";
import { useState } from "react";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import FloatingModal from "@/components/FloatingModal";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/components/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Go back
      </button>
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary/80">
          Become a host
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
          {t("create_account")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your account to book rentals or start earning from your own items.
        </p>
      </div>
      <form onSubmit={handleSignup} className="space-y-5">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">{t("username")}</label>
          <Input
            type="text"
            placeholder={t("username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
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
          <label className="text-sm font-medium text-foreground">{t("phone_number")}</label>
          <Input
            type="tel"
            placeholder={t("phone_number")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">{t("password")}</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              className="pr-11"
              placeholder={t("password")}
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
        {msg && (
          <p
            className={`text-center text-sm ${msg.includes("created") ? "text-green-600" : "text-red-600"}`}
          >
            {msg}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? t("creating_account") : t("sign_up")}
        </Button>
        <div className="rounded-[24px] bg-accent/40 px-4 py-4 text-center text-sm text-muted-foreground">
          {t("already_have_account")}{" "}
          <span
            onClick={() => router.push("/auth/login")}
            className="cursor-pointer font-semibold text-primary hover:underline"
          >
            {t("login")}
          </span>
        </div>
      </form>
    </FloatingModal>
  );
}
