'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import { useLang } from '@/components/LanguageProvider'
import { CONSENT_VERSION } from '@/lib/consent'
import { focusRing } from '@/lib/ui'

const GRIEVANCE_EMAIL = 'privacy@janashabdam.in'

export function PrivacyPageContent() {
  const { lang } = useLang()
  const isMl = lang === 'ml'

  return (
    <PageContainer>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{isMl ? 'സ്വകാര്യതാ അറിയിപ്പ്' : 'Privacy notice'}</h1>

      <aside className="mt-6 rounded-[8px] border border-rule bg-raised p-4 text-base font-medium text-ink">
        {isMl
          ? 'ഈ സൈറ്റ് ഒരു സർക്കാർ സ്ഥാപനവുമായി ബന്ധപ്പെട്ടതല്ല, അവരുടെ അംഗീകാരം ലഭിച്ചതല്ല, അവരെ പ്രതിനിധീകരിക്കുന്നതുമല്ല.'
          : 'This site is not affiliated with, endorsed by, or representing any government entity.'}
      </aside>

      <p className="mt-4 font-mono text-sm text-muted">
        {isMl ? 'സമ്മത പതിപ്പ്:' : 'Consent version:'} {CONSENT_VERSION}
      </p>

      <article className="mt-8 space-y-6 text-base leading-relaxed text-body">
        <Section
          title={isMl ? 'എന്ത് ശേഖരിക്കുന്നു' : 'What we collect'}
          body={
            isMl
              ? 'പേര്, ഇമെയിൽ, ഫോൺ, വിലാസം, ജില്ല, പഞ്ചായത്ത്, പിൻകോഡ്, തിരഞ്ഞെടുത്ത ആശങ്കകൾ, ഐച്ഛിക അനുഭവ വാചകം, നിയോജകമണ്ഡലം, IP-യുടെ ഹാഷ്, ബ്രൗസർ വിവരം.'
              : 'Name, email, phone, address, district, panchayat, PIN code, selected concerns, optional personal experience text, constituency, hashed IP, and browser user-agent.'
          }
        />
        <Section
          title={isMl ? 'എന്തിന്' : 'Why'}
          body={
            isMl
              ? 'നിങ്ങളുടെ സ്വന്തം ഇമെയിൽ വിലാസത്തിൽ നിന്ന് എതിർപ്പ് തയ്യാറാക്കാനും, OTP സ്ഥിരീകരണത്തിനും, DPDP അനുസരണത്തിനും, aggregate സ്ഥിതിവിവരത്തിനും.'
              : 'To compose an objection from your own email, verify identity via OTP, comply with the DPDP Act 2023, and publish aggregate statistics.'
          }
        />
        <Section
          title={isMl ? 'ആർക്ക് കാണാം' : 'Who can see it'}
          body={
            isMl
              ? 'സമർപ്പണ വിവരം service-role സെർവർ കോഡിലൂടെ മാത്രം. അഡ്മിൻ allowlist-ിലെ ഇമെയിൽക്കാർക്ക് മാത്രം /admin. പൊതു /data-യിൽ വ്യക്തിഗത ഡാറ്റ ഇല്ല.'
              : 'Submission data is accessible only via server-side service-role code. /admin is restricted to allowlisted emails. /data shows no personal data.'
          }
        />
        <Section
          title={isMl ? 'സൂക്ഷിക്കുന്ന കാലം' : 'Retention'}
          body={
            isMl
              ? 'കാമ്പെയ്ൻ deadline-ന് 180 ദിവസം കഴിഞ്ഞാൽ PII (പേര്, ഇമെയിൽ, ഫോൺ, വിലാസം, custom text, IP) ഇല്ലാതാക്കുന്നു. ജില്ല/നിയോജകമണ്ഡല aggregate നിലനിൽക്കും.'
              : '180 days after the campaign deadline, personal fields (name, email, phone, address, custom text, IP) are purged. District and constituency aggregates remain.'
          }
        />
        <Section
          title={isMl ? 'മായ്ക്കൽ അവകാശം' : 'Deletion rights'}
          body={
            isMl
              ? `/delete-ൽ അഭ്യർത്ഥിക്കാം. 30 ദിവസത്തിനുള്ളിൽ honour ചെയ്യും.`
              : `Request erasure at /delete. Honoured within 30 days under the DPDP Act 2023.`
          }
        />
        <Section
          title={isMl ? 'പരാതി / grievance' : 'Grievance contact'}
          body={
            isMl
              ? `DPDP Act 2023 പ്രകാരം: ${GRIEVANCE_EMAIL}`
              : `Under the DPDP Act 2023: ${GRIEVANCE_EMAIL}`
          }
        />
      </article>
      <p className="mt-8">
        <a href={`mailto:${GRIEVANCE_EMAIL}`} className={`text-accent underline ${focusRing}`}>
          {GRIEVANCE_EMAIL}
        </a>
      </p>
    </PageContainer>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2">{body}</p>
    </section>
  )
}
