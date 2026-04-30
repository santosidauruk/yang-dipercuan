'use client'
import { Progress } from '@/components/ui/progress'
import { useState } from 'react'
import QuestionnaireForm from '@/components/risk-profile/QuestionnaireForm'

export default function OnboardPage() {
  const [progress, setProgress] = useState(40)
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Risk Profile Assesment</h1>
      <div>
        <Progress value={progress}></Progress>
        <QuestionnaireForm />
      </div>
      <p className="text-muted-foreground">
        Let&apos;s set up your profile and investment preferences.
      </p>
    </div>
  )
}
