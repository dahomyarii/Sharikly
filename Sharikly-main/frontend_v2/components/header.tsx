'use client'

import React, { useState } from "react"
import { useLocale } from "./LocaleProvider"
import Link from "next/link"
import LanguageSwitcher from "./LanguageSwitcher"
import SignupModal from "./SignupModal"
import LoginModal from './LoginModal';

export default function Header() {
  const { t } = useLocale()
  const [user, setUser] = React.useState<any>(null)
  const [showSignup, setShowSignup] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  React.useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('user')
      if (stored) setUser(JSON.parse(stored))
    }
    
    // Load user on mount
    loadUser()

    // Listen for login events
    const handleLogin = (event: CustomEvent) => {
      if (event.detail?.user) {
        setUser(event.detail.user)
      } else {
        loadUser()
      }
    }

    window.addEventListener('userLogin', handleLogin as EventListener)
    
    return () => {
      window.removeEventListener('userLogin', handleLogin as EventListener)
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/' // refresh UI after logout
  }

  return (
    <header className="bg-gray-100 p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">EKRA</Link>
      <div className="flex gap-4 items-center">
        <LanguageSwitcher />
        {user ? (
          <>
            <span className="font-semibold">{user.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border rounded-full"
            >
              {t('logout')}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowSignup(true)}
              className="px-4 py-2 bg-black text-white rounded-full"
              >
              {t('sign_up')}
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 border rounded-full"
            >
              {t('login')}
            </button>
          </>
        )}
      </div>
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </header>
  )
}
