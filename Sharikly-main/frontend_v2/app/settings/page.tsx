'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useLocale } from '@/components/LocaleProvider'
import {
  User,
  Lock,
  Settings2,
  AlertTriangle,
  Camera,
  Eye,
  EyeOff,
  Globe,
  Check,
  Ban,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE

type Section = 'profile' | 'account' | 'preferences' | 'blocked' | 'danger'

const NAV_ITEMS: { id: Section; icon: typeof User; labelKey: string }[] = [
  { id: 'profile', icon: User, labelKey: 'profile' },
  { id: 'account', icon: Lock, labelKey: 'account' },
  { id: 'preferences', icon: Settings2, labelKey: 'preferences' },
  { id: 'blocked', icon: Ban, labelKey: 'blocked_users' },
  { id: 'danger', icon: AlertTriangle, labelKey: 'danger_zone' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { t, lang, setLang } = useLocale()

  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Profile form
  const [profileForm, setProfileForm] = useState({ username: '', bio: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [blockedLoading, setBlockedLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    fetchUser()
  }, [router])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await axiosInstance.get(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(res.data)
      setProfileForm({
        username: res.data.username || '',
        bio: res.data.bio || '',
      })
      if (res.data.avatar) {
        setAvatarPreview(res.data.avatar)
      }
    } catch (err: any) {
      if (err.response?.status === 401) router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  const getFullImageUrl = (imgPath: string) => {
    if (!imgPath) return ''
    if (imgPath.startsWith('http')) return imgPath
    return `${API?.replace('/api', '')}${imgPath}`
  }

  // ── Profile handlers ──

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const token = localStorage.getItem('access_token')
      const fd = new FormData()
      fd.append('username', profileForm.username)
      if (profileForm.bio) fd.append('bio', profileForm.bio)
      if (avatarFile) fd.append('avatar', avatarFile)

      const res = await axiosInstance.patch(`${API}/auth/me/`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setUser(res.data)
      setAvatarFile(null)
      localStorage.setItem('user', JSON.stringify(res.data))
      window.dispatchEvent(
        new CustomEvent('userLogin', { detail: { user: res.data, token } })
      )
      showToast(t('profile_updated'), 'success')
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // ── Password handlers ──

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (passwordForm.new_password.length < 8) {
      showToast('New password must be at least 8 characters', 'error')
      return
    }
    setIsChangingPassword(true)
    try {
      const token = localStorage.getItem('access_token')
      await axiosInstance.post(
        `${API}/auth/change-password/`,
        {
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showToast(t('password_changed'), 'success')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to change password', 'error')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // ── Delete account handlers ──

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('access_token')
      await axiosInstance.delete(`${API}/auth/delete-account/`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword },
      })
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      showToast(t('account_deleted'), 'success')
      window.location.href = '/'
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete account', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Loading / auth guard ──

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access settings</p>
          <Button onClick={() => router.push('/auth/login')}>Log In</Button>
        </div>
      </div>
    )
  }

  // ── Render sections ──

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('profile')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your public profile information.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {avatarPreview ? (
              <img
                src={getFullImageUrl(avatarPreview)}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-black text-white p-1.5 rounded-full hover:bg-gray-800 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <p className="font-medium text-gray-900">{user.username}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('username')}
        </label>
        <Input
          value={profileForm.username}
          onChange={(e) =>
            setProfileForm((p) => ({ ...p, username: e.target.value }))
          }
          className="max-w-md"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('bio')}
        </label>
        <textarea
          value={profileForm.bio}
          onChange={(e) =>
            setProfileForm((p) => ({ ...p, bio: e.target.value }))
          }
          rows={4}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="Tell us about yourself..."
        />
      </div>

      <Button
        onClick={handleSaveProfile}
        disabled={isSavingProfile}
        className="flex items-center gap-2"
      >
        {isSavingProfile ? t('saving') : t('save_changes')}
      </Button>
    </div>
  )

  const renderAccount = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('account')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account security and email.
        </p>
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('email')}
        </label>
        <div className="flex items-center gap-3 max-w-md">
          <Input value={user.email} disabled className="flex-1 bg-gray-50" />
          {user.is_email_verified && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full whitespace-nowrap">
              <Check className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('change_password')}
        </h3>

        <div className="space-y-4 max-w-md">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('current_password')}
            </label>
            <div className="relative">
              <Input
                type={showOldPassword ? 'text' : 'password'}
                value={passwordForm.old_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, old_password: e.target.value }))
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showOldPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('new_password')}
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, new_password: e.target.value }))
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('confirm_password')}
            </label>
            <Input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) =>
                setPasswordForm((p) => ({
                  ...p,
                  confirm_password: e.target.value,
                }))
              }
            />
            {passwordForm.confirm_password &&
              passwordForm.new_password !== passwordForm.confirm_password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={
              isChangingPassword ||
              !passwordForm.old_password ||
              !passwordForm.new_password ||
              !passwordForm.confirm_password ||
              passwordForm.new_password !== passwordForm.confirm_password
            }
          >
            {isChangingPassword ? '...' : t('change_password')}
          </Button>
        </div>
      </div>
    </div>
  )

  const fetchBlockedUsers = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    setBlockedLoading(true)
    try {
      const res = await axiosInstance.get(`${API}/users/blocked/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBlockedUsers(Array.isArray(res.data) ? res.data : [])
    } catch {
      setBlockedUsers([])
    } finally {
      setBlockedLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'blocked') fetchBlockedUsers()
  }, [activeSection])

  const renderBlocked = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('blocked_users')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Users you have blocked. They cannot see you in chat or message you.
        </p>
      </div>
      {blockedLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : blockedUsers.length === 0 ? (
        <p className="text-sm text-gray-500">You have not blocked anyone.</p>
      ) : (
        <ul className="space-y-3">
          {blockedUsers.map((u: any) => (
            <li
              key={u.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {u.avatar ? (
                    <img
                      src={u.avatar.startsWith('http') ? u.avatar : `${API?.replace('/api', '')}${u.avatar}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{u.username || u.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('access_token')
                    await axiosInstance.delete(`${API}/users/${u.id}/unblock/`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                    setBlockedUsers((prev) => prev.filter((x: any) => x.id !== u.id))
                    showToast(t('unblock_user'), 'success')
                  } catch (err: any) {
                    showToast(err?.response?.data?.detail || 'Failed to unblock', 'error')
                  }
                }}
              >
                {t('unblock_user')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const renderPreferences = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('preferences')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize your experience.
        </p>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Globe className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          {t('language')}
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setLang('en')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              lang === 'en'
                ? 'border-black bg-black text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {lang === 'en' && <Check className="w-4 h-4" />}
            {t('english')}
          </button>
          <button
            onClick={() => setLang('ar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              lang === 'ar'
                ? 'border-black bg-black text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {lang === 'ar' && <Check className="w-4 h-4" />}
            {t('arabic')}
          </button>
        </div>
      </div>
    </div>
  )

  const renderDangerZone = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-red-600">{t('danger_zone')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Irreversible actions on your account.
        </p>
      </div>

      <Card className="border-red-200 bg-red-50/50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-medium text-gray-900">{t('delete_account')}</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              {t('delete_account_warning')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 whitespace-nowrap"
          >
            {t('delete_account')}
          </Button>
        </div>
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('delete_account')}
              </h3>
            </div>

            <p className="text-sm text-gray-600">{t('delete_account_warning')}</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('type_password_to_confirm')}
              </label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletePassword('')
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? '...' : t('confirm_delete')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )

  const sectionRenderers: Record<Section, () => React.ReactNode> = {
    profile: renderProfile,
    account: renderAccount,
    preferences: renderPreferences,
    blocked: renderBlocked,
    danger: renderDangerZone,
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-32 md:pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('settings')}</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar (desktop) / Tabs (mobile) */}
          <nav className="md:w-56 flex-shrink-0">
            {/* Mobile: horizontal scroll tabs */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    } ${item.id === 'danger' && !isActive ? 'text-red-500 border-red-200' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(item.labelKey)}
                  </button>
                )
              })}
            </div>

            {/* Desktop: vertical sidebar */}
            <div className="hidden md:block space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                      isActive
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    } ${item.id === 'danger' && !isActive ? 'text-red-500 hover:bg-red-50' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(item.labelKey)}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Main content */}
          <Card className="flex-1 p-6 md:p-8">
            {sectionRenderers[activeSection]()}
          </Card>
        </div>
      </div>
    </div>
  )
}
