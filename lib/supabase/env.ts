/** Supabase URL — required for all clients */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env or .env.local (see .env.local.example).'
    )
  }
  return url
}

/**
 * Anon / publishable key (client-safe).
 * Supports both legacy anon JWT and newer Supabase publishable keys.
 */
export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). ' +
        'Find it in Supabase Dashboard → Project Settings → API.'
    )
  }
  return key
}
