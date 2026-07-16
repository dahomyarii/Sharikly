'use client'

import { ArrowLeft, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/LocaleProvider'

export default function CareersPage() {
  const router = useRouter()
  const { t } = useLocale()

  const jobs = [
    {
      title: t('job_title_fullstack'),
      department: t('dept_engineering'),
      type: t('job_type_fulltime')
    },
    {
      title: t('job_title_pm'),
      department: t('dept_product'),
      type: t('job_type_fulltime')
    },
    {
      title: t('job_title_cm'),
      department: t('dept_community'),
      type: t('job_type_fulltime')
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3 md:py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{t('careers')}</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Content */}
      <div className="marketplace-shell py-12 space-y-8">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('join_team')}</h2>
          <p className="text-lg text-muted-foreground">
            {t('careers_subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">{t('open_positions')}</h3>
          <div className="space-y-3">
            {jobs.map((job, idx) => (
              <div key={idx} className="border border-border rounded-2xl p-4 bg-card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.department} • {job.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl space-y-4">
          <h3 className="text-2xl font-bold text-foreground">{t('benefits')}</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>{t('benefit_salary')}</span>
            </li>

            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>{t('benefit_hours')}</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>{t('benefit_growth')}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
