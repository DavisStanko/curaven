"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Heart, Loader2, PartyPopper, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { revealIdentity, getPartnerPhone } from "@/actions/match";
import confetti from "canvas-confetti";
import type { Match } from "@/lib/types";

interface RevealCheckProps {
  match: Match;
  userId: string;
  timeRemaining: number;
}

export default function RevealCheck({
  match,
  userId,
  timeRemaining,
}: RevealCheckProps) {
  const isUserA = match.user_a === userId;
  const myRevealed = isUserA ? match.user_a_revealed : match.user_b_revealed;
  const partnerRevealed = isUserA
    ? match.user_b_revealed
    : match.user_a_revealed;

  const [checked, setChecked] = useState(myRevealed);
  const [partnerChecked, setPartnerChecked] = useState(partnerRevealed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevealDialog, setShowRevealDialog] = useState(false);
  const [partnerPhone, setPartnerPhone] = useState<string | null>(null);

  const isDisabled = timeRemaining > 0;
  const bothRevealed = checked && partnerChecked;

  // Subscribe to match updates for realtime partner reveal
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`match:${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${match.id}`,
        },
        (payload) => {
          const updated = payload.new as Match;
          const partnerNowRevealed = isUserA
            ? updated.user_b_revealed
            : updated.user_a_revealed;
          setPartnerChecked(partnerNowRevealed);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id, isUserA]);

  // Fire confetti and show dialog when both reveal
  useEffect(() => {
    if (checked && partnerChecked && !showRevealDialog) {
      // Fire confetti 🎉
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#a855f7", "#7c3aed", "#c084fc"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#a855f7", "#7c3aed", "#c084fc"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      // Fetch partner phone
      getPartnerPhone(match.id).then(({ phone }) => {
        setPartnerPhone(phone);
        setShowRevealDialog(true);
      });
    }
  }, [checked, partnerChecked, match.id, showRevealDialog]);

  const handleCheck = useCallback(async () => {
    if (checked || isSubmitting || isDisabled) return;

    setIsSubmitting(true);
    try {
      await revealIdentity(match.id);
      setChecked(true);
    } catch (err) {
      console.error("Failed to reveal identity:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [checked, isSubmitting, isDisabled, match.id]);

  return (
    <>
      <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Checkbox
                  id="reveal"
                  checked={checked}
                  onCheckedChange={handleCheck}
                  disabled={isDisabled || checked || isSubmitting}
                  className="border-primary data-[state=checked]:bg-primary"
                />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <label
                htmlFor="reveal"
                className={`text-sm font-medium leading-none cursor-pointer ${
                  isDisabled
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Share my number
                </div>
              </label>
              <p className="text-xs text-muted-foreground">
                {isDisabled
                  ? "Available when the timer runs out"
                  : checked && !partnerChecked
                  ? "Waiting for partner..."
                  : bothRevealed
                  ? "It's a match! 🎉"
                  : "Your number will only be shared if both of you opt in."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reveal dialog */}
      <Dialog open={showRevealDialog} onOpenChange={setShowRevealDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-primary" />
              It&apos;s a Match!
            </DialogTitle>
            <DialogDescription>
              You both decided to share your contact info. Here&apos;s
              your connection&apos;s number:
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold tracking-wider">
                {partnerPhone || "Not provided"}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
