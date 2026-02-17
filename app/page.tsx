"use client";

import { AuthModal } from "@/components/AuthModal";
import { ChatInterface } from "@/components/ChatInterface";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <main className="flex min-h-screen items-stretch justify-center px-3 sm:px-4">
      <div className="flex h-dvh w-full max-w-3xl flex-col overflow-hidden border border-white/10 bg-black/60 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-10 w-full items-center justify-between border-b border-white/10 bg-black/20 px-3">
          <h1 className="flex items-center gap-2 text-sm font-bold tracking-tight text-white font-sans">
            <Image
              src="/icon.png"
              alt="cuRaven logo"
              width={16}
              height={16}
              className="rounded-sm"
              priority
            />
            <span>cuRaven</span>
          </h1>
          <div className="flex items-center">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                title="Sign Out"
                className="h-7 px-2 text-xs text-white/80 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="mr-1 h-3.5 w-3.5" />
                Log Out
              </Button>
            ) : (
              <AuthModal />
            )}
          </div>
        </header>

        {/* Chat Area */}
        <ChatInterface />
      </div>
    </main>
  );
}
