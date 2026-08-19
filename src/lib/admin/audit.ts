import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'

export type AuditInput = {
  adminEmail: string
  action: string
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
}

export async function writeAdminAudit(input: AuditInput): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('admin_audit_log').insert({
      admin_email: input.adminEmail,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      before_data: input.before ?? null,
      after_data: input.after ?? null,
    })
  } catch {
    // Audit must never block the administrator.
  }
}
