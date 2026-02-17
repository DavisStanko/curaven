'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { MessageBubble } from '@/components/MessageBubble'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

type Message = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
  } | null
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .order('created_at', { ascending: true })

      if (error) {
        toast.error('Failed to load messages')
      } else {
        setMessages(data as unknown as Message[]) // Type assertion due to join
      }
    }

    fetchMessages()

    // Realtime subscription
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Fetch the new message with profile data
          const { data, error } = await supabase
            .from('messages')
            .select('*, profiles(username)')
            .eq('id', payload.new.id)
            .single()

          if (!error && data) {
            setMessages((prev) => [...prev, data as unknown as Message])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if(scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
    }
  }, [messages])


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    setIsSending(true)
    const { error } = await supabase.from('messages').insert({
      content: newMessage,
      user_id: user.id,
    })

    if (error) {
      toast.error('Failed to send message')
    } else {
      setNewMessage('')
    }
    setIsSending(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden w-full relative">
      <ScrollArea ref={scrollRef} className="flex-1 w-full">
        <div className="flex flex-col space-y-4 p-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              isOwnMessage={user?.id === msg.user_id}
              username={msg.profiles?.username || 'Unknown'}
              timestamp={msg.created_at}
            />
          ))}
          {/* Invisible element to scroll to */}
          <div /> 
        </div>
      </ScrollArea>

      <div className="p-4 pt-2">
        {user ? (
          <form 
            onSubmit={handleSendMessage} 
            className="flex items-center gap-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-lg transition-all focus-within:ring-1 focus-within:ring-white/20 focus-within:border-white/30 hover:border-white/20"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${user.user_metadata.username || 'general'}`}
              disabled={isSending}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 text-white h-10 px-4"
            />
            <Button 
                type="submit" 
                size="icon" 
                disabled={isSending || !newMessage.trim()}
                className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all h-9 w-9 shrink-0 shadow-md"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 p-3 bg-black/40 rounded-full border border-white/5 backdrop-blur-sm select-none">
                <Lock className="h-3 w-3" />
                <span>Sign in to join the conversation</span>
            </div>
        )}
      </div>
    </div>
  )
}
