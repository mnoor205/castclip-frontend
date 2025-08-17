"use client"

import { UserObject } from "@/lib/types"
import Link from "next/link"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { useState, useEffect } from "react"
import { BillingData, getBillingData, getRecentActivity } from "@/actions/billing"
import { 
  CreditCard, 
  Video,
  Scissors,
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react"
// Custom date formatting function to avoid external dependencies
const formatDistanceToNow = (date: Date) => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInMinutes < 1) return "just now"
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

interface RecentActivity {
  id: string
  title: string
  createdAt: Date
  status: string
  source: string
  clipsGenerated: number
  creditsUsed: number
}

export function BillingSettings({ user }: { user: UserObject }) {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [billing, activity] = await Promise.all([
          getBillingData(),
          getRecentActivity()
        ])
        setBillingData(billing)
        setRecentActivity(activity)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load billing data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!billingData) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">Billing & Usage</h3>
        <p className="text-muted-foreground mt-1">
          Manage your credits, view usage, and track your spending
        </p>
      </div>

      {/* Credits Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{billingData.credits}</div>
            <p className="text-xs text-muted-foreground">
              Ready to use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData.totalCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clips Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData.totalClipsGenerated}</div>
            <p className="text-xs text-muted-foreground">
              Total clips created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Credit Usage Overview
          </CardTitle>
          <CardDescription>
            Track your credit consumption over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Credits Used vs Available</span>
              <span>{billingData.totalCreditsUsed} / {billingData.credits}</span>
            </div>
            <Progress value={creditUsagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Each clip generation costs 2 credits
            </p>
          </div>
        </CardContent>
      </Card> */}


      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest project generations and credit usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(activity.createdAt))}</span>
                        <Badge variant="secondary" className="text-xs">
                          {activity.source.replace('_', ' ').toLowerCase()}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          {activity.clipsGenerated} clips
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">-{activity.creditsUsed} credits</p>
                      <p className="text-xs text-muted-foreground">Used</p>
                    </div>
                  </div>
                  {index < Math.min(recentActivity.length, 5) - 1 && <Separator className="mt-4" />}
                </div>
              ))}
              {recentActivity.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  And {recentActivity.length - 5} more projects...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Advanced Billing
          </CardTitle>
          <CardDescription>
            Manage your billing details and view detailed invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`https://billing.stripe.com/p/login/cNiaEW5MV7g90GbddO2cg00?prefilled_email=${encodeURIComponent(user.email)}`}
            className="w-full block"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full bg-gradient-primary text-white" size="lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Stripe Customer Portal
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            View invoices, update payment methods, and download receipts
          </p>
        </CardContent>
      </Card>
    </div>
  )
}