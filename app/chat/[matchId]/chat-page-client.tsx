"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "@/components/chat-interface";
import RevealCheck from "@/components/reveal-check";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { LogOut, Loader2 } from "lucide-react";
import { disconnectMatch } from "@/actions/match";
import type { Message, Match } from "@/lib/types";

interface ChatPageClientProps {
  match: Match;
  userId: string;
  initialMessages: Message[];
}

export default function ChatPageClient({
  match,
  userId,
  initialMessages,
}: ChatPageClientProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining =
        new Date(match.expires_at).getTime() - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [match.expires_at]);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnectMatch(match.id);
      router.push("/");
    } catch {
      setIsDisconnecting(false);
    }
  }, [match.id, router]);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
        <div />
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={() => setShowDisconnect(true)}
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Disconnect
        </Button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          matchId={match.id}
          userId={userId}
          expiresAt={match.expires_at}
          initialMessages={initialMessages}
        />
      </div>

      {/* Reveal */}
      <div className="p-4 border-t border-border/30">
        <RevealCheck
          match={match}
          userId={userId}
          timeRemaining={timeRemaining}
        />
      </div>

      {/* Disconnect confirmation */}
      <Dialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <DialogContent className="sm:max-w-sm bg-card border-border/30">
          <DialogHeader>
            <DialogTitle>Disconnect?</DialogTitle>
            <DialogDescription>
              This will end your 24-hour connection. You won&apos;t be
              able to message this person again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowDisconnect(false)}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
