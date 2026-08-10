"use client"

import { useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Eye, EyeOff } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/components/core/auth-provider"
import { useChangePasswordMutation, useUpdateUsernameMutation } from "@/lib/queries/settings"
import { passwordSchema, usernameSchema } from "@/lib/schemas/settings"

export default function SettingsPage() {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const updateUsernameMutation = useUpdateUsernameMutation()
  const changePasswordMutation = useChangePasswordMutation()
  const providers = Array.isArray(user?.app_metadata?.providers)
    ? (user?.app_metadata?.providers as string[])
    : []
  const primaryProvider = typeof user?.app_metadata?.provider === "string" ? user.app_metadata.provider : null
  const isGithubAccount = primaryProvider === "github" || providers.includes("github")
  const hasPasswordLogin = primaryProvider === "email" || providers.includes("email")
  const canChangePassword = isAuthenticated && hasPasswordLogin && !isGithubAccount

  const currentDisplayName = (user?.user_metadata?.display_name as string | undefined) ?? ""
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [usernameMessage, setUsernameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const usernameForm = useForm({
    defaultValues: {
      username: currentDisplayName,
    },
    onSubmit: async ({ value }) => {
      setUsernameMessage(null)

      if (!isAuthenticated || !user) {
        return
      }

      const parsed = usernameSchema.safeParse(value)
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid username."
        setUsernameMessage({ type: "error", text: message })
        return
      }

      const usernameToSave = parsed.data.username.trim()

      try {
        await updateUsernameMutation.mutateAsync(usernameToSave.length > 0 ? usernameToSave : null)
        await refreshUser()
        setUsernameMessage({ type: "success", text: "Username updated successfully." })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update username."
        setUsernameMessage({ type: "error", text: `Failed to update username: ${message}` })
      }
    },
  })

  const passwordForm = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value, formApi }) => {
      setPasswordMessage(null)

      const parsed = passwordSchema.safeParse(value)
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Invalid password."
        setPasswordMessage({ type: "error", text: message })
        return
      }

      try {
        await changePasswordMutation.mutateAsync(parsed.data.newPassword)
        setPasswordMessage({ type: "success", text: "Password changed successfully." })
        formApi.reset()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to change password."
        setPasswordMessage({ type: "error", text: `Failed to change password: ${message}` })
      }
    },
  })

  useEffect(() => {
    usernameForm.setFieldValue("username", currentDisplayName)
  }, [currentDisplayName, usernameForm])

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
    <div className="flex-1 overflow-auto px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Preferences</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1></div>
        <Card className="rounded-md border-border">
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Theme</FieldLabel>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <FieldDescription>Choose light, dark, or system theme.</FieldDescription>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Username Section */}
        {isAuthenticated ? (
          <Card className="rounded-md border-border">
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void usernameForm.handleSubmit()
                }}
                className="space-y-4"
              >
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
                    <usernameForm.Field name="username">
                      {(field) => (
                        <Input
                          id="username"
                          name={field.name}
                          type="text"
                          autoComplete="username"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Set a display name"
                          className="h-11 border-border bg-secondary/50"
                        />
                      )}
                    </usernameForm.Field>
                    <FieldDescription>This will be shown instead of your email.</FieldDescription>
                  </Field>

                  <Button type="submit" disabled={updateUsernameMutation.isPending}>
                    {updateUsernameMutation.isPending ? "Saving..." : "Save Username"}
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
        ) : null}

        {canChangePassword ? (
          <Card className="rounded-md border-border">
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void passwordForm.handleSubmit()
                }}
                className="space-y-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                    <div className="relative">
                      <passwordForm.Field name="newPassword">
                        {(field) => (
                          <Input
                            id="newPassword"
                            name={field.name}
                            type={showNewPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="Enter new password"
                            required
                            className="h-11 border-border bg-secondary/50 pr-10"
                          />
                        )}
                      </passwordForm.Field>
                      <button
                        type="button"
                        aria-label={showNewPassword ? "Hide new password" : "Show new password"}
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
                      <passwordForm.Field name="confirmPassword">
                        {(field) => (
                          <Input
                            id="confirmPassword"
                            name={field.name}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="Repeat new password"
                            required
                            className="h-11 border-border bg-secondary/50 pr-10"
                          />
                        )}
                      </passwordForm.Field>
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Button type="submit" disabled={changePasswordMutation.isPending} variant="destructive">
                    {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
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
