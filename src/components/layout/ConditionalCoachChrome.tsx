"use client"

import { usePathname } from "next/navigation"
import { Header } from "./Header"
import { Footer } from "./Footer"

export function ConditionalCoachChrome({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAthleteRoute = pathname.startsWith("/athlete")

  if (isAthleteRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
