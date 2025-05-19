import { prismaDB } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
    try {
        const body = await req.text()
        const signature = req.headers.get("stripe-signature") || ""

        let event: Stripe.Event

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret!)
        } catch (error) {
            console.error("Webhook verification failed: ", error)
            return new NextResponse("Webhook signature verification failed", {
                status: 400
            })
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session
            const customerId = session.customer as string

            const retreivedSession = await stripe.checkout.sessions.retrieve(
                session.id,
                { expand: ["line_items"] }
            )

            const lineItems = retreivedSession.line_items
            if (lineItems && lineItems.data.length > 0) {
                const priceId = lineItems.data[0]?.price?.id ?? undefined

                if (priceId) {
                    let creditsToAdd = 0

                    switch (priceId) {
                        case process.env.STRIPE_SMALL_CREDIT_PACK!:
                            creditsToAdd = 50
                            break

                        case process.env.STRIPE_MEDIUM_CREDIT_PACK!:
                            creditsToAdd = 150
                            break

                        case process.env.STRIPE_LARGE_CREDIT_PACK!:
                            creditsToAdd = 500
                            break
                    }

                    await prismaDB.user.update({
                        where: {
                            stripeCustomerId: customerId
                        },
                        data: {
                            credits: {
                                increment: creditsToAdd
                            }
                        }
                    })
                }
            }
        }

        return new NextResponse(null, { status: 200 })
    } catch (error) {
        console.error("Error processing webhook: " + error)
        return new NextResponse("Webhook error", { status: 500 })
    }
}