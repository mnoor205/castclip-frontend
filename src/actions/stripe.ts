"use server"

import { prismaDB } from "@/lib/prisma"
import { getUserData } from "./user"
import Stripe from "stripe"
import { redirect } from "next/navigation"
import { PriceId } from "@/lib/types"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
})


const PRICE_IDS: Record<PriceId, string> = {
    small: process.env.STRIPE_SMALL_CREDIT_PACK!,
    medium: process.env.STRIPE_MEDIUM_CREDIT_PACK!,
    large: process.env.STRIPE_LARGE_CREDIT_PACK!
}

export async function createCheckoutSession(priceId: PriceId) {
    const currentUser = await getUserData()

    const user = await prismaDB.user.findUniqueOrThrow({
        where:{
            id: currentUser?.id
        },
        select: { stripeCustomerId: true }
    })


    if(!user.stripeCustomerId) {
        throw new Error("User has no stripe customer ID")
    }

    const stripeSession = await stripe.checkout.sessions.create({
        line_items: [{
            price: PRICE_IDS[priceId],
            quantity: 1,
        }],
        allow_promotion_codes: true,
        customer: user.stripeCustomerId!,
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`
    })

    if(!stripeSession.url) {
        throw new Error("Failed to create session URL")
    }

    redirect(stripeSession.url)
}