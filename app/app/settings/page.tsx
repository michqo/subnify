"use client"

import { useMemo, useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/core/auth-provider"

export default function SettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { user, isAuthenticated, refreshUser } = useAuth()
  const providers = Array.isArray(user?.app_metadata?.providers)
    ? (user?.app_metadata?.providers as string[])
    : []
  const primaryProvider = typeof user?.app_metadata?.provider === "string" ? user.app_metadata.provider : null
  const isGithubAccount = primaryProvider === "github" || providers.includes("github")
  const hasPasswordLogin = primaryProvider === "email" || providers.includes("email")
  const canChangePassword = isAuthenticated && hasPasswordLogin && !isGithubAccount

  const currentDisplayName = (user?.user_metadata?.display_name as string | undefined) ?? ""
  const [usernameDraft, setUsernameDraft] = useState("")
  const [isUsernameDirty, setIsUsernameDirty] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [usernameMessage, setUsernameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !user) {
      return
    }

    setIsLoading(true)
    setUsernameMessage(null)

    const usernameToSave = (isUsernameDirty ? usernameDraft : currentDisplayName).trim()

    const { error } = await supabase.auth.updateUser({
      data: { display_name: usernameToSave || null },
    })

    if (error) {
      setUsernameMessage({ type: "error", text: `Failed to update username: ${error.message}` })
    } else {
      await refreshUser()
      setIsUsernameDirty(false)
      setUsernameDraft("")
      setUsernameMessage({ type: "success", text: "Username updated successfully." })
    }

    setIsLoading(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." })
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setPasswordMessage({ type: "error", text: `Failed to change password: ${error.message}` })
    } else {
      setPasswordMessage({ type: "success", text: "Password changed successfully." })
      setNewPassword("")
      setConfirmPassword("")
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (!usernameMessage && !passwordMessage) {
      return
    }

    const timeout = setTimeout(() => {
      setUsernameMessage(null)
      setPasswordMessage(null)
    }, 4200)

    return () => clearTimeout(timeout)
  }, [usernameMessage, passwordMessage])

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Username Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameUpdate} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={user?.email ?? ""}
                    disabled
                    className="h-11 border-border bg-secondary/50"
                  />
                  <FieldDescription>Your email cannot be changed.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="username">Username (optional)</FieldLabel>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={isUsernameDirty ? usernameDraft : currentDisplayName}
                    onChange={(e) => {
                      setIsUsernameDirty(true)
                      setUsernameDraft(e.target.value)
                    }}
                    placeholder="Set a display name"
                    className="h-11 border-border bg-secondary/50"
                  />
                  <FieldDescription>This will be shown instead of your email.</FieldDescription>
                </Field>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Username"}
                </Button>

                <AnimatePresence mode="popLayout" initial={false}>
                  {usernameMessage ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className={`text-sm ${
                        usernameMessage.type === "error" ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {usernameMessage.text}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {canChangePassword ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="password"
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="h-11 border-border bg-secondary/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldDescription>Use at least 6 characters.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        className="h-11 border-border bg-secondary/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Button type="submit" disabled={isLoading} variant="destructive">
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>

                  <AnimatePresence mode="popLayout" initial={false}>
                    {passwordMessage ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className={`text-sm ${
                          passwordMessage.type === "error" ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {passwordMessage.text}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
