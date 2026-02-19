"use client"

import { usePathname } from "next/navigation"
import { Header } from "./Header"

const NO_CHROME_ROUTES = ["/login", "/check-email"]

export function ConditionalCoachChrome({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAthleteRoute = pathname === "/athlete" || pathname.startsWith("/athlete/")
  const isAuthRoute = NO_CHROME_ROUTES.includes(pathname)

  if (isAthleteRoute || isAuthRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
    </>
  )
}
