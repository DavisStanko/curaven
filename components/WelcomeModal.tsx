'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const WELCOME_DISMISSED_KEY = 'curaven_welcome_dismissed'

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY)
    if (!dismissed) {
      // Small delay so the page renders first, then the modal fades in
      const timer = setTimeout(() => setIsOpen(true), 400)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleDismiss() {
    localStorage.setItem(WELCOME_DISMISSED_KEY, 'true')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleDismiss()
    }}>
      <DialogContent
        className="sm:max-w-[440px] border-white/10 bg-black/80 backdrop-blur-xl text-white shadow-[0_0_80px_rgba(0,0,0,0.6)]"
      >
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-center gap-2.5 pt-2">
            <Image
              src="/icon.png"
              alt="Curaven logo"
              width={28}
              height={28}
              className="rounded-sm"
              priority
            />
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
              Welcome to Curaven.
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-1">
          <p className="text-center text-[15px] leading-relaxed text-white/70">
            A live feed of Carleton&apos;s collective consciousness.
            <br />
            Anyone can watch the chaos, but only Ravens have the floor.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm font-medium">
            <span className="flex items-center gap-1.5 text-white/50">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
              Viewable by all.
            </span>
            <span className="flex items-center gap-1.5 text-white/90">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400/80" />
              Voiced only by us.
            </span>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-center">
            <p className="text-[13px] leading-relaxed text-white/50">
              Sign in with your{' '}
              <span className="font-semibold text-white/80">@cmail.carleton.ca</span>{' '}
              to enter the chat.
            </p>
          </div>

          <Button
            onClick={handleDismiss}
            className="w-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
          >
            Enter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
