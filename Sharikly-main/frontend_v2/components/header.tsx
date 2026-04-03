"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useLocale } from "./LocaleProvider";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import axiosInstance from "@/lib/axios";
import {
  Bell,
  Calendar,
  Compass,
  Heart,
  Home,
  Menu,
  MessageCircle,
  Search,
  Settings2,
  TrendingUp as TrendingUpIcon,
  User as UserIcon,
  X,
} from "lucide-react";

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsBellRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowNotificationsDropdown(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
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

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  const unreadCount = notificationsUnreadCount || notifications.filter((n) => !n.read).length;

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
      setNotificationsUnreadCount(0);
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

  // Fetch unread notifications count (fast)
  useEffect(() => {
    if (!user || !API) {
      setNotificationsUnreadCount(0);
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) return;
    axiosInstance
      .get(`${API}/notifications/unread-count/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setNotificationsUnreadCount(typeof res.data?.count === "number" ? res.data.count : 0))
      .catch(() => setNotificationsUnreadCount(0));
  }, [user, pathname]);

  const markNotificationRead = async (id: number) => {
    if (!API) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      await axiosInstance.patch(
        `${API}/notifications/mark-read/`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => (n?.id === id ? { ...n, read: true } : n)));
      setNotificationsUnreadCount((c) => Math.max(0, (typeof c === "number" ? c : 0) - 1));
    } catch (_) {}
  };

  const markAllNotificationsRead = async () => {
    if (!API) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      await axiosInstance.patch(
        `${API}/notifications/mark-read/`,
        { all: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, read: true })));
      setNotificationsUnreadCount(0);
    } catch (_) {}
  };

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/"; // refresh UI after logout
  }

  const desktopLinks = [
    { href: "/listings", label: "Rent" },
    { href: "/listings", label: "Categories" },
    { href: "/how-it-works", label: "How it Works" },
  ];

  const mobileNavItems = [
    { href: "/", label: "Explore", icon: Home, active: pathname === "/" },
    {
      href: "/bookings",
      label: "Bookings",
      icon: Compass,
      active: pathname === "/bookings",
    },
    {
      href: "/chat",
      label: "Messages",
      icon: MessageCircle,
      active: pathname === "/chat" || pathname.startsWith("/chat/"),
      badge: chatUnreadCount,
    },
    {
      href: user ? "/profile" : "/auth/login",
      label: user ? "My items" : "Account",
      icon: UserIcon,
      active: pathname === "/profile" || pathname === "/auth/login",
    },
  ];
  const hideMobileBottomNav =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/chat/") ||
    pathname.startsWith("/listings/") ||
    pathname.startsWith("/bookings/") ||
    pathname.startsWith("/messages");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/50 bg-background/70 backdrop-blur-xl">
        <div className="marketplace-shell flex min-h-[80px] items-center justify-between gap-3 py-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-full px-1.5 py-1.5 transition hover:bg-white/40"
          >
            <img src="/logo.png" alt="EKRA" className="h-10 w-10 flex-shrink-0" />
            <div className="min-w-0">
              <span className="block truncate text-xl font-black tracking-tight text-foreground">
                Ekra
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Rent Anything Nearby
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/60 bg-white/70 p-1 shadow-sm lg:flex">
            {desktopLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user && (
              <>
                <Link
                  href="/chat"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-muted-foreground shadow-sm transition hover:bg-accent/70 hover:text-foreground"
                  aria-label="Chat"
                >
                  <MessageCircle className="h-4 w-4" />
                  {chatUnreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <div className="relative" ref={notificationsDropdownRef}>
              <button
                ref={notificationsBellRef}
                type="button"
                onClick={() => setShowNotificationsDropdown((v) => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-muted-foreground shadow-sm transition hover:bg-accent/70 hover:text-foreground"
                aria-label="Notifications"
                aria-expanded={showNotificationsDropdown}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotificationsDropdown && (
                <div className="surface-panel absolute right-0 top-full z-50 mt-3 flex max-h-[420px] w-[340px] flex-col overflow-hidden rounded-[28px] bg-popover/95">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllNotificationsRead()}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      <ul className="p-2">
                        {notifications.slice(0, 5).map((n) => (
                          <li key={n.id}>
                            <Link
                              href={n.link || "/notifications"}
                              onClick={() => {
                                setShowNotificationsDropdown(false);
                                if (n?.id && !n?.read) markNotificationRead(n.id);
                              }}
                              className={`mb-2 block rounded-2xl px-4 py-3 transition hover:bg-accent/60 ${
                                !n.read ? "bg-primary/8 dark:bg-primary/12" : "bg-transparent"
                              }`}
                            >
                              <p className="text-sm font-semibold text-foreground">{n.title}</p>
                              {n.body ? (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {n.body}
                                </p>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="border-t border-border p-2">
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotificationsDropdown(false)}
                      className="block rounded-2xl py-2.5 text-center text-sm font-medium text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                    >
                      View more
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/listings/new"
                  className="ekra-gradient inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-semibold text-primary-foreground shadow-[0_14px_34px_rgba(124,58,237,0.34)]"
                >
                  List an Item
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu((v) => !v)}
                    className="flex h-11 min-w-[44px] items-center justify-center rounded-full border border-white/60 bg-white/85 px-1.5 text-sm font-semibold text-foreground shadow-sm hover:bg-accent/70"
                    aria-haspopup="menu"
                    aria-expanded={showProfileMenu}
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar.startsWith("http") ? user.avatar : `/api${user.avatar}`}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </button>
                  {showProfileMenu && (
                    <div className="surface-panel absolute right-0 top-[120%] z-40 w-60 overflow-hidden rounded-[22px] border border-border bg-popover/95 shadow-lg">
                      <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.username || user.email}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="px-2 py-2 space-y-1">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <UserIcon className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/favorites"
                          className="flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Heart className="h-4 w-4" />
                          <span>{t("favorites")}</span>
                        </Link>
                        <Link
                          href="/bookings"
                          className="flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Calendar className="h-4 w-4" />
                          <span>{t("my_bookings")}</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Settings2 className="h-4 w-4" />
                          <span>{t("settings")}</span>
                        </Link>
                        <div className="mt-1 flex items-center justify-between rounded-[18px] bg-background/90 px-3 py-2 text-sm text-muted-foreground">
                          <span>Dark mode</span>
                          <ThemeToggle />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center justify-center border-t border-border px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                      >
                        {t("logout")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
                >
                  {t("sign_in") || "Log In"}
                </button>
                <button
                  onClick={() => setShowSignup(true)}
                  className="ekra-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_34px_rgba(124,58,237,0.34)]"
                >
                  List an Item
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => window.location.assign("/listings")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/85 text-muted-foreground shadow-sm"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/85 text-muted-foreground shadow-sm"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            ref={mobileMenuRef}
            className="absolute inset-x-3 top-[calc(var(--safe-area-inset-top)+5.4rem)] bottom-[calc(var(--safe-area-inset-bottom)+1rem)] overflow-hidden rounded-[32px] border border-white/70 bg-background/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Menu
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Browse Ekra on mobile</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/80 text-muted-foreground shadow-sm"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {user ? (
            <div className="py-2">
              {/* User info */}
              <div className="mb-1 flex items-center gap-3 border-b border-border px-5 py-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {user.avatar ? (
                    <img src={user.avatar.startsWith('http') ? user.avatar : `/api${user.avatar}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{user.username}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>

              {/* Menu links */}
              <Link
                href="/bookings"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="w-5 h-5 text-muted-foreground" />
                {t("my_bookings")}
              </Link>
              <Link
                href="/favorites"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart className="w-5 h-5 text-muted-foreground" />
                {t("favorites")}
              </Link>
              <Link
                href="/notifications"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Bell
                  className={`w-5 h-5 ${
                    unreadCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
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
                href="/earnings"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUpIcon className="w-5 h-5 text-muted-foreground" />
                Earnings Dashboard
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </Link>
              <Link
                href="/listings/new"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                List an Item
              </Link>
              <Link
                href="/community-earnings"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUpIcon className="w-5 h-5 text-muted-foreground" />
                Community Earnings
              </Link>
              <Link
                href="/top-hosts"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUpIcon className="w-5 h-5 text-muted-foreground" />
                Top Hosts
              </Link>
              <Link
                href="/start-renting"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUpIcon className="w-5 h-5 text-muted-foreground" />
                Start Renting
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                About
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                Contact
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Blog
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                {t("settings")}
              </Link>

              {/* Divider + Logout */}
              <div className="mt-1 border-t border-border pt-1">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3 text-sm text-destructive transition hover:bg-destructive/10"
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
                href="/community-earnings"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUpIcon className="w-5 h-5 text-muted-foreground" />
                Community Earnings
              </Link>
              <Link
                href="/start-renting"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUpIcon className="w-5 h-5 text-muted-foreground" />
                Start Renting
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                About
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                Contact
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Blog
              </Link>
              <div className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="mb-3 w-full rounded-full border border-border bg-white px-4 py-3 text-sm font-medium text-foreground"
                >
                  {t("sign_in") || "Log in"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignup(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="ekra-gradient w-full rounded-full px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_34px_rgba(124,58,237,0.34)]"
                >
                  List an Item
                </button>
              </div>
            </div>
          )}
              </div>
            </div>
          </div>
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
      {!hideMobileBottomNav && !isMobileMenuOpen && (
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 mobile-bottom-nav-enter"
        style={{
          paddingBottom: "var(--safe-area-inset-bottom)",
          paddingLeft: "max(0.75rem, var(--safe-area-inset-left))",
          paddingRight: "max(0.75rem, var(--safe-area-inset-right))",
        }}
      >
        <div className="mx-auto mb-2 flex max-w-sm items-end justify-between rounded-[32px] border border-white/60 bg-background/95 px-3.5 py-3 shadow-[0_-12px_45px_rgba(124,58,237,0.22)] backdrop-blur-xl">
          {mobileNavItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex min-h-[52px] min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition ${
                  item.active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${item.active ? "scale-105" : ""}`} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="absolute right-2 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <Link
            href="/favorites"
            className={`-mt-8 flex h-16 w-16 items-center justify-center rounded-[24px] ekra-gradient text-primary-foreground shadow-[0_16px_35px_rgba(124,58,237,0.42)] transition ${
              pathname.startsWith("/favorites") ? "ring-4 ring-primary/35 ring-offset-2 ring-offset-background" : ""
            }`}
            title="Saved items"
            aria-label="Saved items"
            aria-current={pathname.startsWith("/favorites") ? "page" : undefined}
          >
            <Heart className="h-7 w-7" strokeWidth={2.25} />
          </Link>

          {mobileNavItems.slice(2).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex min-h-[52px] min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition ${
                  item.active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${item.active ? "scale-105" : ""}`} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="absolute right-2 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </>
  );
}