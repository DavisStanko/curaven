"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function joinQueue() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Call the find_match database function
  const { data, error } = await supabase.rpc("find_match", {
    requesting_user_id: user.id,
  });

  if (error) {
    console.error("joinQueue error:", error);
    throw new Error(error.message);
  }

  // data is the match_id (uuid) or null
  return { matchId: data as string | null };
}

export async function leaveQueue() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ is_looking: false })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
}

export async function disconnectMatch(matchId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify user is part of the match
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match) throw new Error("Match not found");
  if (match.user_a !== user.id && match.user_b !== user.id) {
    throw new Error("Not part of this match");
  }

  // Expire the match immediately
  const { error } = await supabase
    .from("matches")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", matchId);

  if (error) throw new Error(error.message);
}

export async function checkMatchStatus() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Find an active match for this user
  const { data: match, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code !== "PGRST116") { // Ignore "No rows found" if using single(), but we use maybeSingle()
      console.error("checkMatchStatus error:", error);
    }
    throw new Error(error.message);
  }

  return { match, userId: user.id };
}

export async function sendMessage(matchId: string, content: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("messages").insert({
    match_id: matchId,
    sender_id: user.id,
    content: content.trim(),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/chat/${matchId}`);
}

export async function revealIdentity(matchId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get the match to figure out if user is user_a or user_b
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) throw new Error("Match not found");

  const isUserA = match.user_a === user.id;
  const isUserB = match.user_b === user.id;

  if (!isUserA && !isUserB) throw new Error("Not part of this match");

  const updateField = isUserA ? "user_a_revealed" : "user_b_revealed";

  const { error } = await supabase
    .from("matches")
    .update({ [updateField]: true })
    .eq("id", matchId);

  if (error) throw new Error(error.message);

  revalidatePath(`/chat/${matchId}`);
}

export async function getPartnerPhone(matchId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match) throw new Error("Match not found");

  // Only reveal if both have opted in
  if (!match.user_a_revealed || !match.user_b_revealed) {
    return { phone: null };
  }

  const partnerId =
    match.user_a === user.id ? match.user_b : match.user_a;

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", partnerId)
    .single();

  return { phone: profile?.phone_number ?? null };
}
