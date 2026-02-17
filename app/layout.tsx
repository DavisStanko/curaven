import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { BackgroundLayer } from "@/components/BackgroundLayer";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });
const BACKGROUND_IMAGES = [
  "/bg/20191108_124057-1251675282.jpg",
  "/bg/4028686-scaled-494128580.jpg",
  "/bg/Carleton-University-scaled-3661958822.webp",
  "/bg/CarletonUniversity-2736941696.jpg",
  "/bg/MacOdrum-Library-Exterior-2749083799.jpg",
  "/bg/OIP-3142483453.jpg",
  "/bg/carleton-student-residence-exterior-day-2945896839.jpg",
  "/bg/d50ee7_969590294c8a4ead94ac1d22b014c556~mv2-3796330513.jpg",
  "/bg/tunnel.jpg",
] as const;

export const metadata: Metadata = {
  title: "Curaven - Carleton Chat",
  description: "Real-time chat for Carleton University students",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const randomBackground =
    BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];

  return (
    <html lang="en">
      <body
        className={cn(inter.className, "min-h-screen font-sans antialiased")}
      >
        <BackgroundLayer initialBackgroundImage={randomBackground} />
        <AuthProvider>
          {children}
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
