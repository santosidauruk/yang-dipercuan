import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  TrendingUp,
  BarChart3,
  MessageSquare,
  Shield,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Real-time Stock Data',
    description:
      'Track IDX stocks with live prices, candlestick charts, and key financial metrics updated every 30 seconds.'
  },
  {
    icon: TrendingUp,
    title: 'Portfolio Tracker',
    description:
      'Monitor your holdings, calculate unrealized P&L, and compare your portfolio performance against IHSG.'
  },
  {
    icon: MessageSquare,
    title: 'AI-Powered Insights',
    description:
      'Chat with an AI advisor that understands Indonesian stocks and can help with investment analysis.'
  },
  {
    icon: Shield,
    title: 'Risk Profile & Goals',
    description:
      'Assess your risk tolerance, get personalized asset allocation, and set investment goals with projections.'
  }
]

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Hero */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <TrendingUp className="text-primary h-5 w-5" />
          <span>StockIDX</span>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your Personal
            <br />
            <span className="text-primary">Indonesian Stock</span> Tracker
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            Track IDX stocks in real-time, manage your portfolio, and get
            AI-powered investment insights — all in one place.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/login">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/stocks">
              <Button variant="outline" size="lg">
                Browse Stocks
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="text-primary mb-2 h-8 w-8" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-muted-foreground border-t py-6 text-center text-sm">
        <p>StockIDX — Personal Stock Tracker for IDX</p>
      </footer>
    </div>
  )
}
