"use client"

import { useMemo } from "react"
import { useMutation } from "@tanstack/react-query"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function useUpdateUsernameMutation() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  return useMutation({
    mutationFn: async (displayName: string | null) => {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      })

      if (error) {
        throw new Error(error.message)
      }
    },
  })
}

export function useChangePasswordMutation() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw new Error(error.message)
      }
    },
  })
}
