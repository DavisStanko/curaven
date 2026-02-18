'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const CARLETON_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@cmail\.carleton\.ca$/

const authSchema = z.object({
  email: z.string().email().regex(CARLETON_EMAIL_REGEX, {
    message: 'Must be a valid @cmail.carleton.ca email address',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
})

const signupSchema = authSchema.extend({
    username: z.string().min(3, {
        message: 'Username must be at least 3 characters',
    })
})


export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const loginForm = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
    },
  })

  const handleAuthError = (error: any) => {
    const message = error?.message?.toLowerCase() || ''
    if (
      message.includes('rate limit') || 
      message.includes('too many requests') || 
      message.includes('limit exceeded') ||
      error?.status === 429
    ) {
      toast.error("Daily signup limit reached. Resetting at midnight.")
    } else {
      toast.error(error.message)
    }
  }

  async function onLogin(values: z.infer<typeof authSchema>) {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      handleAuthError(error)
    } else {
      toast.success('Successfully logged in')
      setIsOpen(false)
    }
    setIsLoading(false)
  }

  async function onSignup(values: z.infer<typeof signupSchema>) {
    setIsLoading(true)

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', values.username)
      .maybeSingle()

    if (existingUser) {
      toast.error('That username is already taken')
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          username: values.username,
        },
      },
    })

    if (error) {
      handleAuthError(error)
    } else {
      toast.success('Check your email to confirm your account')
      setIsOpen(false)
    }
    setIsLoading(false)
  }

  async function onResetPassword() {
      const email = loginForm.getValues('email')
      if (!email || !CARLETON_EMAIL_REGEX.test(email)) {
          toast.error("Please enter a valid Carleton email in the login tab first")
          return
      }

      setIsLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      if (error) {
          handleAuthError(error)
      } else {
          toast.success("Password reset email sent")
      }
      setIsLoading(false)

  }


  async function onResendConfirmation() {
    const email = loginForm.getValues('email')
    if (!email || !CARLETON_EMAIL_REGEX.test(email)) {
        toast.error("Please enter a valid Carleton email in the login tab first")
        return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      handleAuthError(error)
    } else {
      toast.success("Verification email sent")
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign In</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>
            Sign in or create an account to start chatting. Only @cmail.carleton.ca emails are allowed.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="student@cmail.carleton.ca" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground" type="button" onClick={onResetPassword}>
                            Forgot password?
                        </Button>
                        <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground" type="button" onClick={onResendConfirmation}>
                            Resend verification?
                        </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                    </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="signup">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <FormField
                  control={signupForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="raven_fan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="student@cmail.carleton.ca" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
