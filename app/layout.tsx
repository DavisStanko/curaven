import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Curaven - Carleton Chat',
  description: 'Real-time chat for Carleton University students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen font-sans antialiased")}>
        <div className="fixed inset-0 z-[-1]">
          <div className="absolute inset-0 bg-[url('/tunnel.jpg')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
