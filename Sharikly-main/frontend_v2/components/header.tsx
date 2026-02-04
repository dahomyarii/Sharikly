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
        <Link href="/" className="text-xl font-bold">
          EKRA
        </Link>

        <div className="hidden md:flex gap-4 items-center">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link href="/favorites" className="px-4 py-2 border rounded-full">
                {t("favorites")}
              </Link>
              <span className="font-semibold">{user.username}</span>
              <button
                onClick={() => handleLogout()}
                className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
              >
                {t("logout")}
              </button>
            </>
          ) : (
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

       {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-40">
        <div className="flex justify-around items-center h-20 px-2">
          {/* Home */}
          <Link 
            href="/" 
            className="flex flex-col items-center justify-center w-14 h-14 rounded-lg hover:bg-amber-50 transition-colors group"
            title="Home"
          >
            <svg className="w-6 h-6 text-gray-700 group-hover:text-amber-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs text-gray-700 group-hover:text-amber-600 mt-0.5 font-medium">Home</span>
          </Link>

          {/* Browse */}
          <Link 
            href="/listings" 
            className="flex flex-col items-center justify-center w-14 h-14 rounded-lg hover:bg-amber-50 transition-colors group"
            title="Browse"
          >
            <svg className="w-6 h-6 text-gray-700 group-hover:text-amber-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
            <span className="text-xs text-gray-700 group-hover:text-amber-600 mt-0.5 font-medium">Browse</span>
          </Link>

          {/* Favorites */}
          <Link 
            href="/favorites" 
            className="flex flex-col items-center justify-center w-14 h-14 rounded-lg hover:bg-amber-50 transition-colors group relative"
            title="Favorites"
          >
            <svg className="w-6 h-6 text-gray-700 group-hover:text-amber-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-xs text-gray-700 group-hover:text-amber-600 mt-0.5 font-medium">Saved</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
          </Link>

          {/* Messages */}
          <Link 
            href="/messages" 
            className="flex flex-col items-center justify-center w-14 h-14 rounded-lg hover:bg-amber-50 transition-colors group relative"
            title="Messages"
          >
            <svg className="w-6 h-6 text-gray-700 group-hover:text-amber-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="text-xs text-gray-700 group-hover:text-amber-600 mt-0.5 font-medium">Chat</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
          </Link>

          {/* Profile */}
          {user ? (
            <Link 
              href="/profile" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-lg hover:bg-amber-50 transition-colors group"
              title="Profile"
            >
              <svg className="w-6 h-6 text-gray-700 group-hover:text-amber-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span className="text-xs text-gray-700 group-hover:text-amber-600 mt-0.5 font-medium">Profile</span>
            </Link>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-lg hover:bg-amber-50 transition-colors group"
              title="Login"
            >
              <svg className="w-6 h-6 text-gray-700 group-hover:text-amber-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 7L9.6 8.4l2.05 2.05H4v2h7.65L9.6 14.5 11 16l5-5-5-5zm6 6h2V7h-2v6zm0 6h2v-2h-2v2z"/>
              </svg>
              <span className="text-xs text-gray-700 group-hover:text-amber-600 mt-0.5 font-medium">Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile spacing to prevent content overlap with bottom nav */}
      <div className="md:hidden h-20"></div>
    </>
  );
}