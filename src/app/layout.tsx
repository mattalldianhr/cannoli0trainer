import type { Metadata } from "next";
import "./globals.css";
import { ConditionalCoachChrome } from "@/components/layout/ConditionalCoachChrome";

export const metadata: Metadata = {
  title: "Cannoli Trainer",
  description:
    "Powerlifting coaching platform for Cannoli Strength",
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
      </body>
    </html>
  );
}
