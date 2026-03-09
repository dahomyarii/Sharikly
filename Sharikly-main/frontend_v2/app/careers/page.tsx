'use client'

import { ArrowLeft, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function CareersPage() {
  const router = useRouter()

  const jobs = [
    {
      title: 'Full Stack Developer',
      department: 'Engineering',
      type: 'Full-time'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      type: 'Full-time'
    },
    {
      title: 'Community Manager',
      department: 'Community',
      type: 'Full-time'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 md:py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-800 hover:bg-gray-100 h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Careers</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Join Our Team</h2>
          <p className="text-lg text-muted-foreground">
            Help us build the future of peer-to-peer sharing.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Open Positions</h3>
          <div className="space-y-3">
            {jobs.map((job, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
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

        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Benefits</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Competitive salary</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Health insurance</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Flexible work hours</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">✓</span>
              <span>Professional growth</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
