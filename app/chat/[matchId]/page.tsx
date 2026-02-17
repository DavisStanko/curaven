import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ChatPageClient from "./chat-page-client";
import type { Message, Match } from "@/lib/types";

export default async function ChatPage({
  params,
}: {
  params: { matchId: string };
}) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch match
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", params.matchId)
    .single();

  if (!match) {
    redirect("/");
  }

  // Ensure user is part of this match
  if (match.user_a !== user.id && match.user_b !== user.id) {
    redirect("/");
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", params.matchId)
    .order("created_at", { ascending: true });

  return (
    <ChatPageClient
      match={match as Match}
      userId={user.id}
      initialMessages={(messages as Message[]) || []}
    />
  );
}
