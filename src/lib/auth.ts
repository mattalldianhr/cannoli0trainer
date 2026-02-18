import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

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
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM || "Cannoli Trainer <noreply@cannoli.mattalldian.com>",
    }),
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
    async jwt({ token }) {
      if (token.email) {
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
