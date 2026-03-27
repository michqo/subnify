export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
  },
  calculations: {
    all: ["calculations"] as const,
    list: (userId: string) => ["calculations", "list", userId] as const,
    byId: (id: string, userId: string) => ["calculations", "by-id", id, userId] as const,
  },
  aiDesigner: {
    quotaUnknown: ["ai-designer", "quota", "unknown-user"] as const,
    quota: (userId: string) => ["ai-designer", "quota", userId] as const,
  },
}
