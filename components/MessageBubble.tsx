'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

type MessageBubbleProps = {
  content: string
  isOwnMessage: boolean
  username?: string
  timestamp: string
}

export function MessageBubble({ content, isOwnMessage, username, timestamp }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex w-full mb-2",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-2 text-sm shadow-sm relative group",
          isOwnMessage
            ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm"
            : "bg-white/10 text-white rounded-2xl rounded-tl-sm backdrop-blur-md border border-white/5"
        )}
      >
        {!isOwnMessage && (
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-bold text-white/80 tracking-tight">{username}</span>
                <span className="text-[10px] text-white/40">{format(new Date(timestamp), 'HH:mm')}</span>
            </div>
        )}
        
        <p className="text-[15px] break-words leading-6 font-normal tracking-wide text-white/90">
            {content}
        </p>

        {isOwnMessage && (
             <div className="text-[10px] text-white/50 text-right mt-1 select-none">
                {format(new Date(timestamp), 'HH:mm')}
             </div>
        )}
      </div>
    </motion.div>
  )
}
