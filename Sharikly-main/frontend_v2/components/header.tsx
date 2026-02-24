"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useLocale } from "./LocaleProvider";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import axiosInstance from "@/lib/axios";
import { Bell } from "lucide-react";

const SignupModal = dynamic(() => import("./SignupModal"), { ssr: false });
const LoginModal = dynamic(() => import("./LoginModal"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Header() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsBellRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    if (!showNotificationsDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationsDropdownRef.current &&
        !notificationsDropdownRef.current.contains(e.target as Node) &&
        notificationsBellRef.current &&
        !notificationsBellRef.current.contains(e.target as Node)
      ) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotificationsDropdown]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  React.useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem("user");
      const token = localStorage.getItem("access_token");
      if (stored && token) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
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

    // Listen for logout events
    const handleLogoutEvent = () => {
      setUser(null);
    };

    // Listen for storage changes (other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === "user") {
        loadUser();
      }
    };

    // Re-check on focus (e.g. token expired while tab was in background)
    const handleFocus = () => {
      loadUser();
    };

    window.addEventListener("userLogin", handleLogin as EventListener);
    window.addEventListener("userLogout", handleLogoutEvent);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("userLogin", handleLogin as EventListener);
      window.removeEventListener("userLogout", handleLogoutEvent);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Fetch chat unread count when user is logged in
  useEffect(() => {
    if (!user || !API) {
      setChatUnreadCount(0);
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) return;
    axiosInstance
      .get(`${API}/chat/unread-count/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setChatUnreadCount(typeof res.data?.count === "number" ? res.data.count : 0))
      .catch(() => setChatUnreadCount(0));
  }, [user, pathname]);

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (!user || !API) {
      setNotifications([]);
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) return;
    axiosInstance
      .get(`${API}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setNotifications(Array.isArray(data) ? data : data?.results || []);
      })
      .catch(() => setNotifications([]));
  }, [user]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/"; // refresh UI after logout
  }

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-sm px-3 py-3 sm:px-4 sm:py-3 md:p-4 flex justify-between items-center min-h-[52px] md:min-h-0 gap-2 min-w-0">
        <Link href="/" className="flex items-center gap-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 justify-center p-2 -ml-2 rounded-lg active:opacity-80 flex-shrink-0 max-w-[50vw] md:max-w-none">
          <img src="/logo.png" alt="EKRA" className="h-8 w-8 flex-shrink-0" />
          <span className="text-lg sm:text-xl font-bold truncate">EKRA</span>
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
                className="relative px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                Chat
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-medium">
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/favorites"
                className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                {t("favorites")}
              </Link>
              <Link
                href="/bookings"
                className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                {t("my_bookings")}
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-200 rounded-full transition-all text-sm font-medium"
              >
                Settings
              </Link>
              {/* Notifications bell — expandable dropdown */}
              <div className="relative" ref={notificationsDropdownRef}>
                <button
                  ref={notificationsBellRef}
                  type="button"
                  onClick={() => setShowNotificationsDropdown((v) => !v)}
                  className="relative p-2 rounded-full hover:bg-gray-200 transition-all touch-target"
                  aria-label="Notifications"
                  aria-expanded={showNotificationsDropdown}
                >
                  <Bell
                    className={`w-5 h-5 ${
                      unreadCount > 0 ? "text-red-600" : "text-gray-500"
                    }`}
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-semibold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {showNotificationsDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-[320px] max-h-[400px] flex flex-col rounded-xl bg-white border border-gray-200 shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Notifications</span>
                    </div>
                    <div className="overflow-y-auto flex-1 min-h-0">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        <ul className="py-1">
                          {notifications.slice(0, 5).map((n) => (
                            <li key={n.id}>
                              <Link
                                href={n.link || "/notifications"}
                                onClick={() => setShowNotificationsDropdown(false)}
                                className={`block px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 ${
                                  !n.read ? "bg-blue-50/50" : ""
                                }`}
                              >
                                <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                                {n.body ? (
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                                ) : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="border-t border-gray-100 p-2">
                      <Link
                        href="/notifications"
                        onClick={() => setShowNotificationsDropdown(false)}
                        className="block w-full text-center py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition"
                      >
                        View more
                      </Link>
                    </div>
                  </div>
                )}
              </div>
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
        <div className="md:hidden flex gap-1 items-center flex-shrink-0 min-w-0">
          <LanguageSwitcher />
          <button
            ref={menuButtonRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 border rounded-xl hover:bg-gray-200 active:bg-gray-300 transition touch-target"
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
        <div ref={mobileMenuRef} className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          {user ? (
            <div className="py-2">
              {/* User info */}
              <div className="px-5 py-3 flex items-center gap-3 border-b border-gray-100 mb-1">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar.startsWith('http') ? user.avatar : `/api${user.avatar}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{user.username}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>

              {/* Menu links */}
              <Link
                href="/bookings"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("my_bookings")}
              </Link>
              <Link
                href="/notifications"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Bell
                  className={`w-5 h-5 ${
                    unreadCount > 0 ? "text-red-600" : "text-gray-400"
                  }`}
                />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </Link>
              <Link
                href="/listings/new"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                List an Item
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                About
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                Contact
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Blog
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                {t("settings")}
              </Link>

              {/* Divider + Logout */}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 transition text-sm w-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {t("logout")}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <Link
                href="/about"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                About
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                Contact
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Blog
              </Link>
              <div className="border-t border-gray-100 mt-1 pt-1 px-5 py-3 flex gap-2">
                <button
                  onClick={() => {
                    setShowLogin(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setShowSignup(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
                >
                  Sign Up
                </button>
              </div>
            </div>
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

       {/* Mobile Bottom Navigation — glass + orange active state + animations */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 mobile-bottom-nav-enter"
        style={{
          paddingBottom: "var(--safe-area-inset-bottom)",
          paddingLeft: "max(0.75rem, var(--safe-area-inset-left))",
          paddingRight: "max(0.75rem, var(--safe-area-inset-right))",
        }}
      >
        <div className="mb-2 mx-0 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-[0_-4px 24px rgba(0,0,0,0.06)] transition-all duration-300">
          <div className="flex justify-around items-center h-14 px-0.5 gap-0">
            {/* Home */}
            <Link
              href="/"
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[52px] rounded-xl touch-target transition-all duration-200 ease-out active:scale-95 ${
                pathname === "/"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-500 active:bg-neutral-100"
              }`}
              title="Home"
            >
              <svg className="w-[22px] h-[22px] transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="text-[10px] mt-0.5 font-medium">Home</span>
            </Link>

            {/* Browse */}
            <Link
              href="/listings"
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[52px] rounded-xl touch-target transition-all duration-200 ease-out active:scale-95 ${
                pathname === "/listings" || (pathname.startsWith("/listings/") && pathname !== "/listings/new" && !pathname.includes("/request_booking"))
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-500 active:bg-neutral-100"
              }`}
              title="Browse"
            >
              <svg className="w-[22px] h-[22px] transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="text-[10px] mt-0.5 font-medium">Browse</span>
            </Link>

            {/* Favorites */}
            <Link
              href="/favorites"
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[52px] rounded-xl touch-target transition-all duration-200 ease-out active:scale-95 relative ${
                pathname === "/favorites"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-500 active:bg-neutral-100"
              }`}
              title="Favorites"
            >
              <svg className="w-[22px] h-[22px] transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="text-[10px] mt-0.5 font-medium">Saved</span>
            </Link>

            {/* Chat */}
            <Link
              href="/chat"
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[52px] rounded-xl touch-target transition-all duration-200 ease-out active:scale-95 relative ${
                pathname === "/chat" || pathname.startsWith("/chat/")
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-500 active:bg-neutral-100"
              }`}
              title="Messages"
            >
              <svg className="w-[22px] h-[22px] transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {chatUnreadCount > 0 && (
                <span className="absolute top-1 right-2 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-medium">
                  {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                </span>
              )}
              <span className="text-[10px] mt-0.5 font-medium">Chat</span>
            </Link>

            {/* Profile / Login */}
            {user ? (
              <Link
                href="/profile"
className={`flex flex-col items-center justify-center min-w-[52px] min-h-[52px] rounded-xl touch-target transition-all duration-200 ease-out active:scale-95 ${
                    pathname === "/profile"
                      ? "bg-orange-50 text-orange-600"
                      : "text-neutral-500 active:bg-neutral-100"
                  }`}
                title="Profile"
              >
                <svg className="w-[22px] h-[22px] transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="text-[10px] mt-0.5 font-medium">Profile</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="flex flex-col items-center justify-center min-w-[52px] min-h-[52px] rounded-xl text-neutral-500 active:scale-95 active:bg-neutral-100 touch-target transition-all duration-200 ease-out"
                title="Login"
              >
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span className="text-[10px] mt-0.5 font-medium">Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}