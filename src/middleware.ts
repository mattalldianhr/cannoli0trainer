import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Routes that require coach role
const COACH_ROUTES = [
  "/dashboard",
  "/athletes",
  "/programs",
  "/schedule",
  "/exercises",
  "/meets",
  "/analytics",
  "/messages",
  "/settings",
  "/train",
  // Formerly public, now coach-only
  "/docs",
  "/research",
  "/findings",
  "/interview",
  "/submissions",
]

// Coach API route prefixes
const COACH_API_ROUTES = [
  "/api/athletes",
  "/api/programs",
  "/api/schedule",
  "/api/exercises",
  "/api/meets",
  "/api/analytics",
  "/api/messages",
  "/api/settings",
  "/api/coaches",
  "/api/submissions",
]

// API routes accessible by both coaches and athletes (auth still required)
const SHARED_API_ROUTES = [
  "/api/train",
  "/api/bodyweight",
  "/api/sets",
  "/api/sessions",
  "/api/workout-exercises",
]

function isCoachRoute(pathname: string): boolean {
  return COACH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
}

function isCoachApiRoute(pathname: string): boolean {
  return COACH_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
}

function isAthleteRoute(pathname: string): boolean {
  return pathname === "/athlete" || pathname.startsWith("/athlete/")
}

function isAthleteApiRoute(pathname: string): boolean {
  return pathname === "/api/athlete" || pathname.startsWith("/api/athlete/")
}

// Public routes that skip auth entirely
const PUBLIC_ROUTES = ["/docs/api"]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // --- Public routes: allow without auth ---
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const session = req.auth
  const isApi = pathname.startsWith("/api/")

  // --- No session: redirect to login (or 401 for API) ---
  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user?.role

  // --- Role enforcement for page routes ---
  if (!isApi) {
    // Athlete trying to access coach routes → redirect to /athlete
    if (role === "athlete" && isCoachRoute(pathname)) {
      return NextResponse.redirect(new URL("/athlete", req.url))
    }

    // Coach trying to access athlete routes → redirect to /dashboard
    if (role === "coach" && isAthleteRoute(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  // --- Role enforcement for API routes ---
  if (isApi) {
    // Athlete trying to access coach API routes
    if (role === "athlete" && isCoachApiRoute(pathname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Coach trying to access athlete API routes
    if (role === "coach" && isAthleteApiRoute(pathname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Coach page routes
    "/dashboard/:path*",
    "/athletes/:path*",
    "/programs/:path*",
    "/schedule/:path*",
    "/exercises/:path*",
    "/meets/:path*",
    "/analytics/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/train/:path*",
    // Formerly public, now coach-only
    "/docs/:path*",
    "/research/:path*",
    "/findings/:path*",
    "/interview/:path*",
    "/submissions/:path*",
    // Athlete routes (excluding redirected login/check-email)
    "/athlete/((?!login|check-email).*)",
    // Coach API routes
    "/api/athletes/:path*",
    "/api/programs/:path*",
    "/api/schedule/:path*",
    "/api/exercises/:path*",
    "/api/meets/:path*",
    "/api/analytics/:path*",
    "/api/messages/:path*",
    "/api/settings/:path*",
    "/api/train/:path*",
    "/api/bodyweight/:path*",
    "/api/sets/:path*",
    "/api/sessions/:path*",
    "/api/workout-exercises/:path*",
    "/api/coaches/:path*",
    "/api/submissions/:path*",
    // Athlete API routes
    "/api/athlete/:path*",
  ],
}
