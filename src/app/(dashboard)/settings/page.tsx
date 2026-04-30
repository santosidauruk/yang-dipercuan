import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
        <Settings className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">Coming soon</p>
        <p className="text-sm">Profile, risk assessment, and preferences</p>
      </div>
    </div>
  )
}
