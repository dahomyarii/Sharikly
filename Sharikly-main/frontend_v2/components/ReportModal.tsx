'use client'

import React, { useState } from 'react'
import axiosInstance from '@/lib/axios'
import { useLocale } from '@/components/LocaleProvider'
import { useToast } from '@/components/ui/toast'
import { X, AlertCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BASE

const REASON_OPTIONS = [
  { value: 'SPAM', labelKey: 'report_reason_spam' },
  { value: 'INAPPROPRIATE', labelKey: 'report_reason_inappropriate' },
  { value: 'SCAM', labelKey: 'report_reason_scam' },
  { value: 'HARASSMENT', labelKey: 'report_reason_harassment' },
  { value: 'OTHER', labelKey: 'report_reason_other' },
] as const

type ReportTarget = 'listing' | 'user'

interface ReportModalProps {
  target: ReportTarget
  targetId: number
  onClose: () => void
  title?: string
}

export default function ReportModal({ target, targetId, onClose, title }: ReportModalProps) {
  const { t } = useLocale()
  const { showToast } = useToast()
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    const token = localStorage.getItem('access_token')
    if (!token) {
      showToast('Please log in to report', 'error')
      return
    }
    setSubmitting(true)
    try {
      const payload: { reason: string; details?: string; listing?: number; reported_user?: number } = {
        reason,
        details: details.trim() || undefined,
      }
      if (target === 'listing') {
        payload.listing = targetId
      } else {
        payload.reported_user = targetId
      }
      await axiosInstance.post(`${API}/reports/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      showToast(t('report_success'), 'success')
      onClose()
    } catch (err: any) {
      showToast(err?.response?.data?.detail || err?.response?.data?.reason?.[0] || 'Failed to submit report', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const displayTitle = title ?? (target === 'listing' ? t('report_listing') : t('report_user'))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{displayTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('report_reason')} *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
            >
              <option value="">Select a reason</option>
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('report_details')}
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder={t('report_details')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {submitting ? '...' : t('report_submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
