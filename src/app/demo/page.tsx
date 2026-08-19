import type { Metadata } from 'next'

import { Wizard } from '@/components/wizard/Wizard'
import { loadComposeData } from '@/lib/campaigns'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ജനശബ്ദം — ഡെമോ',
  description: 'തത്സമയ കൂടിയാലോചനയല്ല. ജനശബ്ദം എങ്ങനെ പ്രവർത്തിക്കുന്നു എന്ന് കാണുക. സർക്കാർ ഓഫീസിലേക്ക് ഒന്നും അയയ്ക്കില്ല.',
  robots: { index: false, follow: false },
}

export default async function DemoPage() {
  const data = await loadComposeData()

  return (
    <Wizard
      campaign={data.campaign}
      clauses={data.clauses}
      districts={data.districts}
      mode="compose"
      testerEmail={null}
    />
  )
}
