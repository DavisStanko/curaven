"use client";

import { AuthModal } from "@/components/AuthModal";
import { ChatInterface } from "@/components/ChatInterface";
import { OnlineUsersCounter } from "@/components/OnlineUsersCounter";
import { UserMenu } from "@/components/UserMenu";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <WelcomeModal />
    <main className="flex h-dvh items-stretch justify-center sm:px-4">
      <div className="flex h-dvh w-full max-w-3xl flex-col overflow-hidden border-x-0 border-y border-white/10 bg-black/60 shadow-2xl backdrop-blur-sm sm:border-x">
        {/* Header */}
        <header className="sticky top-0 z-10 grid min-h-12 w-full grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 bg-black/20 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 h-auto">
          <div className="justify-self-start">
            <OnlineUsersCounter />
          </div>

          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white font-sans justify-self-center">
            <span>cuRaven</span>
            <Image
              src="/icon.png"
              alt="cuRaven logo"
              width={22}
              height={22}
              className="rounded-sm"
              priority
            />
          </h1>

          <div className="flex items-center justify-self-end">
            {user ? <UserMenu /> : <AuthModal />}
          </div>
        </header>

        {/* Chat Area */}
        <ChatInterface />
      </div>
    </main>
    </>
  );
}
