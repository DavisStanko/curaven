import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { BackgroundLayer } from "@/components/BackgroundLayer";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://www.curaven.ca";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "cuRaven - Carleton Chat",
  description: "Real-time chat for Carleton University students",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    title: "cuRaven - Carleton Chat",
    description: "Real-time chat for Carleton University students",
    siteName: "cuRaven",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(inter.className, "h-full font-sans antialiased")}
      >
        <BackgroundLayer backgroundImage="/bg/bg.jpg" />
        <AuthProvider>
          {children}
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
