import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConditionalCoachChrome } from "@/components/layout/ConditionalCoachChrome";
import { Toaster } from "sonner";
import { Agentation } from "agentation";

export const metadata: Metadata = {
  title: "Cannoli Trainer",
  description: "Powerlifting coaching platform for Cannoli Strength",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cannoli Trainer",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ConditionalCoachChrome>
          {children}
        </ConditionalCoachChrome>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "text-sm",
          }}
        />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
