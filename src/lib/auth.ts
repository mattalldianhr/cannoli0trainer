import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { brandedEmailHtml, emailCtaButton, sendEmail } from "@/lib/email"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      athleteId?: string
      coachId?: string
      role: "coach" | "athlete"
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    athleteId?: string
    coachId?: string
    role?: "coach" | "athlete"
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.SENDGRID_API_KEY || process.env.AUTH_RESEND_KEY || "unused",
      from: process.env.EMAIL_FROM || "Cannoli Trainer <noreply@cannoli.mattalldian.com>",
      async sendVerificationRequest({ identifier: to, url }) {
        const { host } = new URL(url)
        const body = `
          <h2 style="margin: 0 0 16px;">Sign in to Cannoli Trainer</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Click the button below to sign in to your account on <strong>${host}</strong>.
            This link expires in 24 hours.
          </p>
          ${emailCtaButton("Sign In", url)}
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">
            If you didn&#39;t request this email, you can safely ignore it.
          </p>
        `
        const sent = await sendEmail({
          to,
          subject: `Sign in to ${host}`,
          html: brandedEmailHtml({ body }),
        })
        if (!sent) {
          throw new Error("Failed to send verification email")
        }
      },
    }),
    // Dev bypass: sign in as first athlete without email verification
    ...(process.env.ENABLE_DEV_LOGIN === "true"
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev Login (Athlete)",
            credentials: {},
            async authorize() {
              const athlete = await prisma.athlete.findFirst({
                where: { email: { not: null } },
                include: { user: true },
                orderBy: { createdAt: "asc" },
              })
              if (!athlete?.user) return null
              return {
                id: athlete.user.id,
                email: athlete.user.email,
                name: athlete.user.name,
              }
            },
          }),
          Credentials({
            id: "dev-coach-login",
            name: "Dev Login (Coach)",
            credentials: {},
            async authorize() {
              const coach = await prisma.coach.findFirst({
                include: { user: true },
                orderBy: { createdAt: "asc" },
              })
              if (!coach?.user) return null
              return {
                id: coach.user.id,
                email: coach.user.email,
                name: coach.user.name,
              }
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Dev credentials providers bypass email check — authorize() already verified
      if (account?.provider === "dev-login" || account?.provider === "dev-coach-login") {
        return true
      }
      // Allow sign-in if email matches an athlete OR a coach
      if (!user.email) return false
      const athlete = await prisma.athlete.findFirst({
        where: { email: user.email },
      })
      if (athlete) return true
      const coach = await prisma.coach.findFirst({
        where: { email: user.email },
      })
      return !!coach
    },
    async jwt({ token, trigger, user }) {
      // On sign-in, populate role info. For Credentials providers, we need
      // to manually set sub/email since there's no adapter session.
      if (trigger === "signIn") {
        if (user?.id) token.sub = user.id
        if (user?.email) token.email = user.email

        if (token.email) {
          const coach = await prisma.coach.findFirst({
            where: { email: token.email },
          })
          if (coach) {
            token.coachId = coach.id
            token.role = "coach"
          }

          const athlete = await prisma.athlete.findFirst({
            where: { email: token.email },
          })
          if (athlete) {
            token.athleteId = athlete.id
            // Coach role takes priority if somehow both
            if (!token.role) {
              token.role = "athlete"
            }
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.athleteId) {
        session.user.athleteId = token.athleteId as string
      }
      if (token?.coachId) {
        session.user.coachId = token.coachId as string
      }
      if (token?.role) {
        session.user.role = token.role as "coach" | "athlete"
      }
      if (token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/check-email",
    error: "/login",
  },
})
