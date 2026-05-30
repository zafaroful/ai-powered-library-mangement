/** Env for Edge middleware — never throws (Vercel 500 if getSupabaseUrl throws). */
export function getMiddlewareSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim()

  if (!url || !anonKey) return null
  return { url, anonKey }
}
