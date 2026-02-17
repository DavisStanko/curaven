'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { LogOut, Pencil, Check, X, User } from 'lucide-react'
import { toast } from 'sonner'
import { stringToColor } from '@/lib/utils'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const supabase = createClient()
  const [username, setUsername] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Fetch the current username from the profiles table
  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setUsername(data.username || '')
      }
    }

    fetchProfile()
  }, [user, supabase])

  const handleStartEditing = () => {
    setEditValue(username)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleSave = async () => {
    const trimmed = editValue.trim()

    if (trimmed.length < 3) {
      toast.error('Display name must be at least 3 characters')
      return
    }

    if (trimmed === username) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user!.id)

    if (error) {
      if (error.code === '23505') {
        toast.error('That display name is already taken')
      } else {
        toast.error('Failed to update display name')
      }
    } else {
      setUsername(trimmed)
      toast.success('Display name updated!')
      setIsEditing(false)

      await supabase.from('messages').insert({
        content: `${username} is now known as ${trimmed}`,
        user_id: user!.id,
        author_name: 'System',
        is_system_message: true,
      })
    }

    setIsSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!user) return null

  const displayName = username || 'Anonymous'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-white/10"
          style={{ color: stringToColor(displayName) }}
        >
          <User className="h-3.5 w-3.5 text-white/60" />
          <span className="max-w-[100px] truncate">{displayName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 border-white/10 bg-zinc-900/95 p-0 backdrop-blur-xl"
      >
        {/* Profile section */}
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            Display Name
          </p>

          {isEditing ? (
            <div className="mt-2 flex items-center gap-1.5">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                autoFocus
                className="h-7 flex-1 border-white/15 bg-white/5 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Enter new name…"
                maxLength={24}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSave}
                disabled={isSaving}
                className="h-7 w-7 shrink-0 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-7 w-7 shrink-0 text-white/40 hover:bg-white/10 hover:text-white/60"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between">
              <span
                className="text-sm font-semibold"
                style={{ color: stringToColor(displayName) }}
              >
                {displayName}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleStartEditing}
                className="h-6 w-6 text-white/40 hover:bg-white/10 hover:text-white/70"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="border-b border-white/10 px-4 py-2.5">
          <p className="truncate text-xs text-white/40">
            {user.email}
          </p>
        </div>

        {/* Sign out */}
        <div className="px-2 py-1.5">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-400/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
