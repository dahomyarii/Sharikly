'use client'
import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_BASE

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await axios.post(`${API}/auth/token/`, { email, password })
      const token = res.data.access

      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      // fetch user info
      const me = await axios.get(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      localStorage.setItem('user', JSON.stringify(me.data))

      router.push('/') // Redirect to main page after login
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input 
          className="w-full border rounded-xl px-4 py-3" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          className="w-full border rounded-xl px-4 py-3" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        <div className="flex items-center gap-4">
          <button 
            className="px-5 py-3 bg-black text-white rounded-full" 
            type="submit"
          >
            Log in
          </button>
          <div className="text-sm text-red-600">{msg}</div>
        </div>
      </form>
    </div>
  )
}
