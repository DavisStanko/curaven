'use client'

import { AuthModal } from '@/components/AuthModal'
import { ChatInterface } from '@/components/ChatInterface'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'

export default function Home() {
  const { user, signOut } = useAuth()

  return (
    <main className="flex min-h-screen items-stretch sm:items-center justify-center p-0 sm:p-4 bg-black/20">
      <div className="w-full sm:max-w-3xl bg-black/40 backdrop-blur-md border border-white/10 sm:rounded-xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-[85vh]">

        {/* Header */}
        <header className="w-full flex items-center justify-between p-4 border-b border-white/5 bg-black/20 backdrop-blur sticky top-0 z-10">
          <h1 className="text-xl font-bold tracking-tight text-white font-sans">cuRaven</h1>
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm font-medium text-white/80 hidden sm:inline-block">
                    {user.user_metadata.username || 'User'}
                  </span>
                  <Avatar className="h-8 w-8 ring-1 ring-white/10">
                    <AvatarImage src={user.user_metadata.avatar_url} />
                    <AvatarFallback className="bg-white/10 text-white text-xs">
                      {user.user_metadata.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={signOut} 
                  title="Sign Out"
                  className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <AuthModal />
            )}
          </div>
        </header>
        
        {/* Chat Area */}
        <ChatInterface />
      </div>
    </main>
  )
}
