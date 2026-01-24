"use client";

import React, { useState } from "react";
import { useLocale } from "./LocaleProvider";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";

export default function Header() {
  const { t } = useLocale();
  const [user, setUser] = React.useState<any>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    };

    // Load user on mount
    loadUser();

    // Listen for login events
    const handleLogin = (event: CustomEvent) => {
      if (event.detail?.user) {
        setUser(event.detail.user);
      } else {
        loadUser();
      }
    };

    window.addEventListener("userLogin", handleLogin as EventListener);

    return () => {
      window.removeEventListener("userLogin", handleLogin as EventListener);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/"; // refresh UI after logout
  }

  return (
<<<<<<< HEAD
    <header className="bg-gray-100 p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        EKRA
      </Link>

      <div className="flex gap-4 items-center">
        <LanguageSwitcher />
        <Link
          href="/contact"
          className="px-4 py-2 border rounded-full"
        >
          {t("Contact us")}
        </Link>
        {user ? (
          <>
            <Link href="/favorites" className="px-4 py-2 border rounded-full">
              {t("favorites")}
            </Link>
            <span className="font-semibold">{user.username}</span>
=======
    <>
      <header className="bg-gray-100 p-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          EKRA
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-4 items-center">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link href="/favorites" className="px-4 py-2 border rounded-full hover:bg-gray-200 transition">
                {t("favorites")}
              </Link>
              <span className="font-semibold text-gray-800">{user.username}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border rounded-full hover:bg-gray-200 transition"
              >
                {t("logout")}
              </button>
            </>
          ) : (
>>>>>>> 0302a5eb520144585eca19846f3803c34bc01a18
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
            >
              {t("join_us")}
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex gap-2 items-center">
          <LanguageSwitcher />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 border rounded-lg hover:bg-gray-200 transition"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-200 p-4 flex flex-col gap-3">
          {user ? (
            <>
              <div className="font-semibold text-gray-800 px-2 py-1">
                {user.username}
              </div>
              <Link
                href="/favorites"
                className="px-4 py-2 border rounded-lg text-center hover:bg-gray-200 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("favorites")}
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-200 transition text-left"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setShowLogin(true);
                setIsMobileMenuOpen(false);
              }}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              {t("join_us")}
            </button>
          )}
        </div>
      )}

      {showSignup && (
        <SignupModal 
          onClose={() => setShowSignup(false)} 
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}
<<<<<<< HEAD
    </header> 
=======
    </>
>>>>>>> 0302a5eb520144585eca19846f3803c34bc01a18
  );
}