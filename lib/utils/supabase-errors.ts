/** Map PostgREST / Supabase errors to user-facing messages. */
export function formatSupabaseError(message: string): string {
  if (
    message.includes("Could not find the 'status' column") ||
    message.includes('column loans.status does not exist')
  ) {
    return (
      'Borrow approval is not set up on the database yet. ' +
      'Run supabase/migrations/007_loan_approval.sql in Supabase Dashboard → SQL Editor, then try again.'
    )
  }
  return message
}
