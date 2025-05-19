import { betterAuth } from 'better-auth';
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from 'better-auth/next-js';
import Stripe from 'stripe';
import { stripe } from '@better-auth/stripe';

const prisma = new PrismaClient();

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
})

export const auth = betterAuth({
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        },
        // tiktok: {
        //     clientId: process.env.TIKTOK_CLIENT_ID!,
        //     clientSecret: process.env.TIKTOK_CLIENT_SECRET!
        // },
        // facebook: {
        //     clientId: process.env.FACEBOOK_CLIENT_ID!,
        //     clientSecret: process.env.FACEBOOK_CLIENT_SECRET!
        // },
        // twitter: {
        //     clientId: process.env.TWITTER_CLIENT_ID!,
        //     clientSecret: process.env.TWITTER_CLIENT_SECRET!
        // }
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache duration in seconds
        }
    },
    plugins: [
        stripe({
            stripeClient,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: true,
        }),
        nextCookies() // make sure this is the last plugin in the array
    ],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    })
});