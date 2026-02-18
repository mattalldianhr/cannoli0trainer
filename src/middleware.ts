import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // If user is not authenticated and trying to access a protected athlete route, redirect to login
  if (!req.auth && pathname.startsWith("/athlete")) {
    const loginUrl = new URL("/athlete/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/athlete/((?!login|check-email).*)"],
}
