import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center space-y-3">
          <Image
            src="/logo-white.webp"
            alt="Cannoli Strength"
            width={220}
            height={55}
            className="h-12 w-auto brightness-0 dark:brightness-100"
            priority
          />
          <p className="text-sm text-muted-foreground">Sign in to Cannoli Trainer</p>
        </div>

        {/* Confirmation Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-lg">Check your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              A sign-in link has been sent to your email address. Click the link to log in.
            </p>

            <div className="rounded-md bg-muted p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Tips:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Check your spam or junk folder</li>
                <li>The link expires in 24 hours</li>
                <li>Look for an email from Cannoli Strength</li>
              </ul>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                Try again with a different email
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
