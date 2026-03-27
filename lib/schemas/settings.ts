import { z } from "zod"

export const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .max(40, "Username must be 40 characters or less."),
})

export const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
