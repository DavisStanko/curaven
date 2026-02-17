"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { stringToColor } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Lock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  } | null;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(username)")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to load messages");
      } else {
        setMessages(data as unknown as Message[]); // Type assertion due to join
      }
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          // Fetch the new message with profile data
          const { data, error } = await supabase
            .from("messages")
            .select("*, profiles(username)")
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            setMessages((prev) => [...prev, data as unknown as Message]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    const { error } = await supabase.from("messages").insert({
      content: newMessage,
      user_id: user.id,
    });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
    setIsSending(false);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <ScrollArea ref={scrollRef} className="min-h-0 flex-1 w-full">
        <div className="flex flex-col px-2 py-2 font-mono tracking-tight">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-2 rounded-sm px-2 py-1 text-base leading-relaxed font-mono hover:bg-white/5"
            >
              <span className="shrink-0 select-none text-sm text-white/40">
                {format(new Date(msg.created_at), "h:mm a").toLowerCase()}
              </span>
              <span
                className="shrink-0 font-bold"
                style={{
                  color: stringToColor(msg.profiles?.username || "Unknown"),
                }}
              >
                {msg.profiles?.username || "Unknown"}:
              </span>
              <p className="wrap-break-word text-white/90">{msg.content}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="w-full border-t border-white/10 bg-black/20 px-3 py-2">
        {user ? (
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${user.user_metadata.username || "general"}`}
              disabled={isSending}
              className="h-9 flex-1 rounded-sm border-white/15 bg-transparent text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSending || !newMessage.trim()}
              className="h-9 w-9 shrink-0 rounded-sm bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        ) : (
          <div className="flex select-none items-center gap-2 text-sm text-zinc-400">
            <Lock className="h-3 w-3" />
            <span>Sign in to join the conversation</span>
          </div>
        )}
      </div>
    </div>
  );
}
