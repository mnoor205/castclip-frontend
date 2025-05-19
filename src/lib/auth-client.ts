import {
    createAuthClient
} from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    plugins:[
        stripeClient({
            subscription: false
        })
    ]
})

export const {
    signIn,
    signOut,
    signUp,
    useSession
} = authClient;