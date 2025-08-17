"use server"

import { prismaDB } from "@/lib/prisma"
import { getUserData } from "./user"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

export interface BillingData {
  credits: number
  totalCreditsUsed: number
  totalClipsGenerated: number
  totalProjectsCreated: number
  memberSince: Date
  lastPurchaseDate?: Date
  totalSpent: number
}

export async function getBillingData(): Promise<BillingData> {
  try {
    const user = await getUserData()
    if (!user?.id) {
      throw new Error("User not authenticated")
    }

    // Get user data with credits
    const userData = await prismaDB.user.findUnique({
      where: { id: user.id },
      select: {
        credits: true,
        createdAt: true,
        stripeCustomerId: true,
        projects: {
          select: {
            id: true,
            createdAt: true,
            Clip: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!userData) {
      throw new Error("User not found")
    }

    // Calculate usage statistics
    const totalProjectsCreated = userData.projects.length
    const totalClipsGenerated = userData.projects.reduce(
      (total, project) => total + project.Clip.length,
      0
    )

    // Calculate total credits used (assuming each clip costs 2 credits)
    const totalCreditsUsed = totalClipsGenerated * 2

    let totalSpent = 0
    let lastPurchaseDate: Date | undefined

    // Get Stripe payment data if customer exists
    if (userData.stripeCustomerId) {
      try {
        const charges = await stripe.charges.list({
          customer: userData.stripeCustomerId,
          limit: 100,
        })

        totalSpent = charges.data.reduce((sum, charge) => {
          if (charge.status === "succeeded") {
            return sum + (charge.amount / 100) // Convert from cents
          }
          return sum
        }, 0)

        if (charges.data.length > 0) {
          const lastCharge = charges.data.find(charge => charge.status === "succeeded")
          if (lastCharge) {
            lastPurchaseDate = new Date(lastCharge.created * 1000)
          }
        }
      } catch (error) {
        console.warn("Failed to fetch Stripe data:", error)
        // Continue without Stripe data
      }
    }

    return {
      credits: userData.credits,
      totalCreditsUsed,
      totalClipsGenerated,
      totalProjectsCreated,
      memberSince: userData.createdAt,
      lastPurchaseDate,
      totalSpent,
    }
  } catch (error: unknown) {
    console.error("Failed to get billing data:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to get billing data")
  }
}

export async function getRecentActivity() {
  try {
    const user = await getUserData()
    if (!user?.id) {
      throw new Error("User not authenticated")
    }

    // Get recent projects and clips
    const recentProjects = await prismaDB.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        displayName: true,
        createdAt: true,
        status: true,
        source: true,
        Clip: {
          select: {
            id: true,
          },
        },
      },
    })

    return recentProjects.map(project => ({
      id: project.id,
      title: project.displayName || "Untitled Project",
      createdAt: project.createdAt,
      status: project.status,
      source: project.source,
      clipsGenerated: project.Clip.length,
      creditsUsed: project.Clip.length * 2,
    }))
  } catch (error: unknown) {
    console.error("Failed to get recent activity:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to get recent activity")
  }
}
