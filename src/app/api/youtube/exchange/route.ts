import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prismaDB as prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"
import { headers } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session?.user) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: "missing_code" }, { status: 400 })
    }

    const client_id = process.env.GOOGLE_CLIENT_ID
    const client_secret = process.env.GOOGLE_CLIENT_SECRET
    if (!client_id || !client_secret) {
      return NextResponse.json({ error: "server_misconfigured" }, { status: 500 })
    }

    const params = new URLSearchParams()
    params.set("code", code)
    params.set("client_id", client_id)
    params.set("client_secret", client_secret)
    params.set("redirect_uri", "postmessage")
    params.set("grant_type", "authorization_code")

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: "token_exchange_failed", details: data }, { status: 400 })
    }

    const { access_token, refresh_token, expires_in, scope, id_token } = data
    const expires_at = new Date(Date.now() + expires_in * 1000)

    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "google",
      },
    })

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token ?? existingAccount.refreshToken,
          accessTokenExpiresAt: expires_at,
          scope,
          idToken: id_token,
        },
      })
    } else {
      await prisma.account.create({
        data: {
          id: uuidv4(),
          userId: session.user.id,
          accountId: session.user.id,
          providerId: "google",
          accessToken: access_token,
          refreshToken: refresh_token,
          accessTokenExpiresAt: expires_at,
          scope,
          idToken: id_token,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json({ 
      error: "unexpected_error", 
      message: err instanceof Error ? err.message : "An unexpected error occurred" 
    }, { status: 500 })
  }
}
