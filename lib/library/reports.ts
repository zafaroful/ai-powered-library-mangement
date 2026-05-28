import { createClient } from '@/lib/supabase/server'
import type { ReportMetrics } from '@/types'

export async function upsertReportSnapshot(
  metrics: ReportMetrics,
  periodStart: string,
  periodEnd: string,
  generatedBy: string
): Promise<{ generatedAt: string | null; error: string | null }> {
  const supabase = await createClient()
  const generatedAt = new Date().toISOString()

  const { error } = await supabase.from('reports').upsert(
    {
      report_type: 'dashboard_30d',
      period_start: periodStart,
      period_end: periodEnd,
      metrics,
      generated_at: generatedAt,
      generated_by: generatedBy,
    },
    { onConflict: 'report_type,period_start,period_end' }
  )

  if (error) return { generatedAt: null, error: error.message }
  return { generatedAt, error: null }
}
