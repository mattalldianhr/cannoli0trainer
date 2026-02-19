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
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    athleteId?: string
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
            name: "Dev Login",
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
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      // Only allow sign-in if an athlete exists with this email
      if (!user.email) return false
      const athlete = await prisma.athlete.findFirst({
        where: { email: user.email },
      })
      return !!athlete
    },
    async jwt({ token, trigger }) {
      // Only look up athleteId on sign-in (not every request) to avoid
      // Prisma calls in Edge Runtime where middleware validates the JWT.
      if (trigger === "signIn" && token.email) {
        const athlete = await prisma.athlete.findFirst({
          where: { email: token.email },
        })
        if (athlete) {
          token.athleteId = athlete.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.athleteId) {
        session.user.athleteId = token.athleteId as string
      }
      if (token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    signIn: "/athlete/login",
    verifyRequest: "/athlete/check-email",
    error: "/athlete/login",
  },
})
