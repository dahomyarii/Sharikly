"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import FloatingModal from "@/components/FloatingModal"

const API = process.env.NEXT_PUBLIC_API_BASE

export default function SignupModal({ onClose }: { onClose?: () => void }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState("")
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setMsg("")
    try {
      const res = await axios.post(`${API}/auth/register/`, {
        username,
        email,
        phone_number: phone,
        password,
      })
      setMsg("Account created!")
      setTimeout(() => router.push("/auth/login"), 1000)
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || "Signup failed")
    }
  }

  return (
    <FloatingModal onClose={onClose}>
      <h1 className="text-2xl font-semibold text-center mb-6">Create Account</h1>
      <form onSubmit={handleSignup} className="space-y-5">
        {/* Username */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">Username</label>
          <input
            type="text"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">Email</label>
          <input
            type="email"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">Phone</label>
          <input
            type="tel"
            className="w-full h-12 border rounded-lg px-4 focus:ring-2 focus:ring-blue-500"
            placeholder="05xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full h-12 border rounded-lg px-4 pr-10 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        {msg && (
          <p className={`text-center text-sm ${msg.includes("created") ? "text-green-600" : "text-red-600"}`}>{msg}</p>
        )}

        {/* Signup button */}
        <button type="submit" className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Sign Up
        </button>

        {/* Login link */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/auth/login")}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </form>
    </FloatingModal>
  )
}
