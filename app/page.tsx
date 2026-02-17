"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sparkles, Timer, Users, ArrowRight, Loader2, LogIn, LogOut, Chrome } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { joinQueue, leaveQueue, checkMatchStatus } from "@/actions/match";

export default function HomePage() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Phone number collection state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const checkUserProfile = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("phone_number")
      .eq("id", uid)
      .single();
    
    if (!error && profile && !profile.phone_number) {
      setShowPhoneModal(true);
    }
  }, []);

  // Check auth status
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setIsLoggedIn(!!user);
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        checkUserProfile(user.id);
      }
      setAuthLoading(false);
    });
  }, [checkUserProfile]);

  // Check for existing match on load
  useEffect(() => {
    if (!isLoggedIn) return;
    checkMatchStatus()
      .then(({ match }) => {
        if (match) {
          router.push(`/chat/${match.id}`);
        }
      })
      .catch(() => {});
  }, [isLoggedIn, router]);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSavePhone = async () => {
    if (!userId || !phoneNumber.trim()) return;
    setPhoneSubmitting(true);
    setPhoneError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ phone_number: phoneNumber })
      .eq("id", userId);

    setPhoneSubmitting(false);

    if (error) {
      setPhoneError(error.message);
    } else {
      setShowPhoneModal(false);
      // After saving phone number, we can proceed to match? 
      // User might want to click "Find Connection" again or we can trigger something.
      // For now, just close modal.
    }
  };

  const handleFindConnection = useCallback(async () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }

    // Double check phone number if for some reason modal was closed without saving
    // Fetch profile to be sure? Or rely on initial check + local state?
    // Let's do a quick check to be safe before queuing.
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_number")
      .eq("id", userId!)
      .single();
      
    if (profile && !profile.phone_number) {
      setShowPhoneModal(true);
      return;
    }

    setIsSearching(true);

    try {
      const { matchId } = await joinQueue();
      if (matchId) {
        router.push(`/chat/${matchId}`);
        return;
      }

      // Poll for match — no timeout, runs until matched or cancelled
      pollRef.current = setInterval(async () => {
        try {
          const { match } = await checkMatchStatus();
          if (match) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            router.push(`/chat/${match.id}`);
          }
        } catch {
          // Don't kill polling on transient errors — just retry next tick
        }
      }, 3000);
    } catch {
      setIsSearching(false);
    }
  }, [isLoggedIn, userId]);

  const handleCancelSearch = useCallback(async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsSearching(false);
    try {
      await leaveQueue();
    } catch {
      // Best-effort — user is already out of the UI
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserEmail("");
    setUserId(null);
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4">
      {/* User bar */}
      {isLoggedIn && userEmail && (
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}

      <div className="w-full max-w-md space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 pulse-glow">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Friendr
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Get paired anonymously for{" "}
            <span className="text-primary font-semibold">24 hours</span>.
            <br />
            Chat, vibe, and decide if the connection is real.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-3">
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Anonymous Matching
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xs text-muted-foreground">
                Paired with a random person. No names, no photos—just
                conversation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                24-Hour Window
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xs text-muted-foreground">
                A ticking clock keeps it real. Make the most of your time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Mutual Reveal
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xs text-muted-foreground">
                Both opt in? Contact info is revealed. No pressure, no
                awkwardness.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-base"
          onClick={handleFindConnection}
          disabled={isSearching || authLoading}
        >
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isSearching ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Searching for a connection...
            </>
          ) : (
            <>
              Find a Connection
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        {isSearching && (
          <div className="space-y-3">
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              Hang tight — we&apos;re matching you with someone special.
            </p>
            <button
              onClick={handleCancelSearch}
              className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Auth dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-sm bg-card border-border/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Sign In
            </DialogTitle>
            <DialogDescription>
              Sign in with Google to start connecting.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2 border border-gray-200"
            >
               <Chrome className="h-4 w-4" />
               Continue with Google
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Number Dialog */}
      <Dialog open={showPhoneModal} onOpenChange={(open) => {
        if (!open) {
          setShowPhoneModal(false);
          // User closed it without saving. That's fine, but they won't be able to match.
        }
      }}>
        <DialogContent className="sm:max-w-sm bg-card border-border/30">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              We need a phone number to reveal to your matches only when you both vibe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
             <div className="text-xs text-muted-foreground mb-2">
                 Your number is <strong>never</strong> shown to anyone unless you explicitly agree to reveal it during a chat.
             </div>
            <Input
              type="tel"
              placeholder="Your Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-secondary/50 border-border/30"
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleSavePhone}
              disabled={phoneSubmitting || !phoneNumber}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {phoneSubmitting ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save & Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
