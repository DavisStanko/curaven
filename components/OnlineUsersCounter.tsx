"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/utils/supabase/client";

type PresencePayload = {
  session_id: string;
  user_id: string | null;
  status: "watching" | "logged_in";
};

type PresenceCounts = {
  total: number;
  watching: number;
  loggedIn: number;
};

function countPresence(
  state: Record<string, PresencePayload[]>,
): PresenceCounts {
  const loggedInUsers = new Set<string>();
  const watchingSessions = new Set<string>();

  for (const presences of Object.values(state)) {
    for (const presence of presences) {
      if (presence.status === "logged_in" && presence.user_id) {
        loggedInUsers.add(presence.user_id);
      } else {
        watchingSessions.add(presence.session_id);
      }
    }
  }

  const loggedIn = loggedInUsers.size;
  const watching = watchingSessions.size;

  return {
    loggedIn,
    watching,
    total: loggedIn + watching,
  };
}

export function OnlineUsersCounter() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [counts, setCounts] = useState<PresenceCounts>({
    total: 0,
    watching: 0,
    loggedIn: 0,
  });

  const updateCounts = () => {
    const channel = channelRef.current;
    if (!channel) return;

    const state = channel.presenceState() as Record<string, PresencePayload[]>;
    setCounts(countPresence(state));
  };

  useEffect(() => {
    const channel = supabase.channel("presence:online-users", {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, updateCounts);
    channel.on("presence", { event: "join" }, updateCounts);
    channel.on("presence", { event: "leave" }, updateCounts);

    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") {
        return;
      }

      setIsSubscribed(true);
      updateCounts();
    });

    return () => {
      channelRef.current = null;
      setIsSubscribed(false);
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [supabase, sessionId]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !isSubscribed) {
      return;
    }

    const syncPresence = async () => {
      await channel.track({
        session_id: sessionId,
        user_id: user?.id ?? null,
        status: user ? "logged_in" : "watching",
      });

      updateCounts();
    };

    void syncPresence();
  }, [isSubscribed, sessionId, user]);

  return (
    <div className="flex select-none items-center gap-1.5 whitespace-nowrap text-[11px] text-white/70 sm:gap-2 sm:text-xs">
      <span className="text-emerald-300">{counts.loggedIn} logged in</span>
      <span className="text-white/40">•</span>
      <span className="text-amber-300">{counts.watching} watching</span>
    </div>
  );
}
