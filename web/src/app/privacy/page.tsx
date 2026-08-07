import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * Privacy policy.
 *
 * Required for the Play Store listing and for the Data Safety form, which has to
 * agree with this page — a mismatch is a rejection.
 *
 * Written against what the code actually does rather than from a template. Two
 * disclosures in particular are easy to leave out and would be misleading:
 * approximate location is sent to a third-party prayer-times API, and the
 * account password is stored in a reversible encrypted form that an
 * administrator can read. Both are true, so both are stated plainly.
 *
 * A server component with no `useT()`: legal text has to be reviewable as a
 * fixed document, and a translated variant would need review of its own before
 * it could carry the same weight.
 */

export const metadata: Metadata = {
  title: 'Privacy Policy · Daily Priority',
  description:
    'What Daily Priority collects, why, who it is shared with, and how to delete your account and data.',
}

const UPDATED = '7 August 2026'
const CONTACT = 'dailypriorityapp@gmail.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-2.5 space-y-2.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        ← Daily Priority
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Last updated {UPDATED}
      </p>

      <p className="mt-6 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
        Daily Priority is a prayer-times and personal-productivity app. This page
        describes exactly what it stores, why, and what you can do about it. It is
        written to match the app&rsquo;s actual behaviour; if you find something here
        that does not match what the app does, that is a bug and we would like to
        hear about it.
      </p>

      <Section title="What we collect">
        <p>
          <strong>Account details.</strong> Your email address, and your name and
          profile picture if you provide them or sign in with Google. Your email
          is how your account is identified.
        </p>
        <p>
          <strong>Your password.</strong> Stored hashed with bcrypt for signing in.
          It is <em>also</em> stored in a separate encrypted form that an
          administrator of this app can decrypt and read. We are telling you this
          because it is unusual: most services cannot recover your password, and
          this one can. Do not reuse a password here that you use anywhere else.
        </p>
        <p>
          <strong>Location.</strong> Approximate coordinates, used to calculate
          prayer times and the Qibla direction for where you are. If you decline
          the browser permission you can type a city instead. A default city can
          be saved to your profile; prayer times otherwise use your current
          position and are not kept as a location history.
        </p>
        <p>
          <strong>What you create in the app.</strong> Prayer records, habits,
          tasks, goals, journal entries, focus sessions, calendar events and
          adhkar progress. Journal entries are personal writing and are treated
          as the most sensitive content here.
        </p>
        <p>
          <strong>Device and settings.</strong> Time zone, language, theme, and —
          if you enable reminders — a push notification token for that device.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>
          We do not sell your data and we do not use it for advertising. It is
          shared only with the services needed to run the app:
        </p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Vercel</strong> — hosting, plus anonymous page-performance
            measurement.
          </li>
          <li>
            <strong>Prisma Postgres</strong> — the database your records are
            stored in.
          </li>
          <li>
            <strong>Al Adhan API</strong> — receives your approximate
            coordinates in order to return prayer times. It does not receive your
            email, your name, or anything you have created in the app.
          </li>
          <li>
            <strong>Google</strong> — only if you choose to sign in with Google.
          </li>
          <li>
            <strong>Email delivery</strong> — sends verification codes, password
            resets, and the weekly summary if you have it switched on.
          </li>
        </ul>
      </Section>

      <Section title="Deleting your account">
        <p>
          You can delete your account yourself: <strong>Settings → Security →
          Delete this account</strong>. You will be asked to type your email
          address to confirm.
        </p>
        <p>
          When you do, sign-in stops working immediately on every device, push
          notifications are cancelled, and your reminders stop. Your records are{' '}
          <strong>retained in our database</strong> rather than erased, and remain
          visible to an administrator of this app. We are stating this plainly
          because &ldquo;delete&rdquo; often implies erasure and here it does not.
        </p>
        <p>
          If you want your records erased rather than closed, email us at{' '}
          <a
            href={`mailto:${CONTACT}`}
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {CONTACT}
          </a>{' '}
          from the address on the account and we will do it.
        </p>
      </Section>

      <Section title="Keeping it secure">
        <p>
          Traffic is encrypted in transit. Passwords are hashed for
          authentication; the separate readable copy described above is encrypted
          with AES-256-GCM. Optional two-factor authentication is available in
          Settings → Security.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Daily Priority is not directed at children under 13, and we do not
          knowingly collect their data. If you believe a child has created an
          account, contact us and we will remove it.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes in a way that affects what we collect or who we
          share it with, we will update the date at the top and notify signed-in
          users.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions, corrections, or a data request:{' '}
          <a
            href={`mailto:${CONTACT}`}
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {CONTACT}
          </a>
          .
        </p>
      </Section>
    </main>
  )
}
