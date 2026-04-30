import { MessageSquare } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">AI Chat</h1>
      <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
        <MessageSquare className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">Coming soon</p>
        <p className="text-sm">
          Chat with an AI advisor about Indonesian stocks
        </p>
      </div>
    </div>
  )
}
