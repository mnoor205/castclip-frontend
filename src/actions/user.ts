"use server"

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getUserData() {
    const session = await auth.api.getSession({
        headers: await headers() // you need to pass the headers object.
    })

    return session?.user
}