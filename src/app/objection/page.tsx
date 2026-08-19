import { Wizard } from '@/components/wizard/Wizard'
import { demoCampaign, demoClauses, KERALA_DISTRICTS } from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

/** Bundled Forest Bill 2024 letter — works without Supabase or a live consultation flag. */
export default function ObjectionPage() {
  return (
    <Wizard
      campaign={demoCampaign}
      clauses={demoClauses}
      districts={KERALA_DISTRICTS}
      mode="preview"
      testerEmail={null}
    />
  )
}
