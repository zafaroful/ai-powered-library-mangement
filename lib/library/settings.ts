import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_LIBRARY_SETTINGS } from '@/lib/library/constants'
import type { LibrarySettings } from '@/types'

export { DEFAULT_LIBRARY_SETTINGS }

export async function getLibrarySettings(): Promise<LibrarySettings> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()

  if (error || !data) return DEFAULT_LIBRARY_SETTINGS

  return {
    id: data.id,
    fine_rate_per_day: Number(data.fine_rate_per_day),
    default_loan_days: data.default_loan_days,
    updated_at: data.updated_at,
    updated_by: data.updated_by,
  }
}

export async function updateLibrarySettings(
  updates: Pick<LibrarySettings, 'fine_rate_per_day' | 'default_loan_days'>,
  adminUserId: string
): Promise<{ settings: LibrarySettings | null; error: string | null }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('settings')
    .update({
      fine_rate_per_day: updates.fine_rate_per_day,
      default_loan_days: updates.default_loan_days,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId,
    })
    .eq('id', 1)
    .select('*')
    .single()

  if (error) return { settings: null, error: error.message }

  return {
    settings: {
      id: data.id,
      fine_rate_per_day: Number(data.fine_rate_per_day),
      default_loan_days: data.default_loan_days,
      updated_at: data.updated_at,
      updated_by: data.updated_by,
    },
    error: null,
  }
}
