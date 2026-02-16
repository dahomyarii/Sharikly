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
    <>
      <header className="bg-gray-100 p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="EKRA" className="h-8 w-8" />
          <span className="text-xl font-bold">EKRA</span>
        </Link>

        <div className="hidden md:flex gap-2 items-center">
          <Link
            href="/listings"
            className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
          >
            Browse
          </Link>
          {user ? (
            <>
              <Link
                href="/listings/new"
                className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                List Item
              </Link>
              <Link
                href="/chat"
                className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                Chat
              </Link>
              <Link
                href="/favorites"
                className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                {t("favorites")}
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                Profile
              </Link>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <LanguageSwitcher />
              <button
                onClick={() => handleLogout()}
                className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all text-sm font-medium"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                {t("sign_in") || "Log In"}
              </button>
              <button
                onClick={() => setShowSignup(true)}
                className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all text-sm font-medium"
              >
                {t("sign_up") || "Sign Up"}
              </button>
            </>
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

       {/* Mobile Bottom Navigation — Glass Effect */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 animate-[slideUp_0.4s_ease-out]">
        <div className="mx-3 mb-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex justify-around items-center h-16 px-1">
            {/* Home */}
            <Link 
              href="/" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-xl active:scale-90 transition-all duration-200 group"
              title="Home"
            >
              <svg className="w-[22px] h-[22px] text-neutral-500 group-active:text-black transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="text-[10px] text-neutral-500 group-active:text-black mt-0.5 font-medium transition-colors duration-200">Home</span>
            </Link>

            {/* Browse */}
            <Link 
              href="/listings" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-xl active:scale-90 transition-all duration-200 group"
              title="Browse"
            >
              <svg className="w-[22px] h-[22px] text-neutral-500 group-active:text-black transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="text-[10px] text-neutral-500 group-active:text-black mt-0.5 font-medium transition-colors duration-200">Browse</span>
            </Link>

            {/* Favorites */}
            <Link 
              href="/favorites" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-xl active:scale-90 transition-all duration-200 group relative"
              title="Favorites"
            >
              <svg className="w-[22px] h-[22px] text-neutral-500 group-active:text-black transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="text-[10px] text-neutral-500 group-active:text-black mt-0.5 font-medium transition-colors duration-200">Saved</span>
            </Link>

            {/* Messages */}
            <Link 
              href="/chat" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-xl active:scale-90 transition-all duration-200 group relative"
              title="Messages"
            >
              <svg className="w-[22px] h-[22px] text-neutral-500 group-active:text-black transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-[10px] text-neutral-500 group-active:text-black mt-0.5 font-medium transition-colors duration-200">Chat</span>
            </Link>

            {/* Profile / Login */}
            {user ? (
              <Link 
                href="/profile" 
                className="flex flex-col items-center justify-center w-14 h-14 rounded-xl active:scale-90 transition-all duration-200 group"
                title="Profile"
              >
                <svg className="w-[22px] h-[22px] text-neutral-500 group-active:text-black transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="text-[10px] text-neutral-500 group-active:text-black mt-0.5 font-medium transition-colors duration-200">Profile</span>
              </Link>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-xl active:scale-90 transition-all duration-200 group"
                title="Login"
              >
                <svg className="w-[22px] h-[22px] text-neutral-500 group-active:text-black transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span className="text-[10px] text-neutral-500 group-active:text-black mt-0.5 font-medium transition-colors duration-200">Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile spacing to prevent content overlap with bottom nav */}
      <div className="md:hidden h-24"></div>
    </>
  );
}