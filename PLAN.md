# Daily Priority — Product & Engineering Plan

Living document. Updated at the end of every working session.
**Status key:** ⬜ not started · 🟨 in progress · ✅ done · ⏸️ blocked/waiting on you

---

## Where we are (baseline, measured 2026-08-02)

Live at https://daily-priority.vercel.app · 54,458 lines · 24 pages · 78 API routes · 24 models

| Feature | Users using it (of 24) | Rows |
|---|---|---|
| Prayer tracking | **7** | 62 |
| Adhkar | — | 54 |
| Tasks | 5 | 17 |
| Habits | 5 | 11 |
| Goals | — | 4 |
| Focus | 1 | 7 |
| Journal | 1 | 1 |

**The core problem: 19 of 24 users never created anything.** Activation, not features.
**The core asset: prayers + adhkar are the most-used surfaces.** That's the real product;
tasks/goals/focus are commodity features every competitor has.

---

## Design direction — "The Prayer Day"

The current UI is competent but generic: emerald gradients, glassmorphism, heavy shadows —
it looks like a 2023 SaaS template. The differentiator we already own is **the rhythm of the
Islamic day**, and nothing in the market expresses it visually.

**Concept:** the app's entire palette breathes with the prayer day.

| Period | Mood | Palette |
|---|---|---|
| Fajr → sunrise | still, blue hour | deep indigo → soft rose |
| Duha → Dhuhr | bright, productive | clean white, sharp emerald |
| Asr → Maghrib | warm, golden | amber → terracotta |
| Maghrib → Isha | calm, dusk | violet → deep teal |
| Isha → Fajr | quiet, night | near-black, muted jewel tones |

Supporting rules:
- **Islamic geometry** as structural texture (we already ship `islamic-pattern.svg`), not decoration
- **Arabic typography** as a first-class design element (adhkar/duas set properly, not as an afterthought)
- **Dunya/Akhirah duality** already exists in the `Goal` model — express it visually
- Restraint: fewer gradients, fewer shadows, more space, one accent per screen

---

## Phases

### Phase 0 — Foundation 🟨
Safety net so we stop finding bugs by reading production logs.
- [x] ✅ Error tracking live — self-hosted (`ErrorLog` + `/api/errors` + admin **Errors** tab). Chose this over an APM SDK: no DSN to manage, no bundle cost. Verified in prod (grouping confirmed: duplicate → count=2, not a second row).
- [x] ✅ Indexes added: `Habit[userId]`, `Habit[userId, frequency]`, `IslamicQuote[category]`. (`Tag`, `UserPreference`, `NotificationPreference` already covered by unique constraints — no action needed.)
- [x] ✅ Test suite green: **59 tests**, up from a *failing* 20. Covers the timezone bug (client + server, incl. DST), streak freezes (incl. the trailing-gap regression), and error fingerprinting.
  - Found and fixed 4 real bugs in `sanitize.ts` while doing it: `Infinity` passed validation, out-of-range numbers were silently clamped instead of rejected, `<script>` bodies survived tag-stripping, boolean parsing missed `yes`/`on`.
  - Found and fixed a bug in my own fingerprinting: cuids aren't hex, so per-user errors would have flooded the Errors tab instead of grouping.
- [x] 🟨 Prayer-reminder scheduler — endpoint verified in prod, heartbeat + admin health panel added so a dead schedule is visible instead of silent. **Last step is yours:** follow `docs/SCHEDULER.md` to point cron-job.org at it (5 min for the free account).
- [x] 🟨 Bundle: **3.5 MB → 3.1 MB**. recharts was statically imported in 3 places (~370 kB each); all are now lazy, so it's out of the initial load everywhere. Deleted a dead duplicate `PrayerChart` (185 lines).
  - *Remaining:* recharts still emits 3 separate lazy chunks. A shared chart wrapper would collapse them into one.

### Phase 1 — Design system 🟨  ·  see DESIGN.md
- [x] ✅ Prayer-time-aware tokens + provider + header control (`PhaseIndicator`), 15 tests. Additive: never overrides surface/foreground, so light/dark keeps contrast.
- [x] ✅ `DESIGN.md` written — the system, restraint rules, Arabic typography, a11y constraints
- [x] 🟨 Dashboard hero converted off the fixed emerald gradient onto `.phase-hero`. Remaining surfaces convert during their Phase 3 deep-dive.
- [ ] Type scale, spacing scale, motion language; Arabic font pairing (`--font-amiri` already loaded)
- [ ] Rebuild core primitives: Card, Button, Tile, EmptyState, PageHeader, Sheet

### Phase 2 — Activation 🟨
The highest-leverage work in the whole plan.
- [x] ✅ First-run onboarding shipped: location → first habit → reminders, all three steps skippable. `onboardedAt` migration backfills `createdAt` so no existing user is ever trapped in it.
- [x] ✅ Landing page now *shows* the differentiator instead of asserting it (`PrayerDayShowcase` cycles all six phases). Homepage ambient background works on phones for the first time.
- [ ] Starter content so the app is never empty
- [ ] Prayer streak as the hero element of the dashboard
- [ ] Re-measure the activation table above; target ≥60% of new users creating something
  · **Not yet measurable** — onboarding shipped 2026-08-03, needs a cohort of new signups before the numbers mean anything.

### Phase 2.5 — Bilingual (Uzbek + English) 🟨
Every visible string in both languages, switchable from the top of any page.
The user base is clearly not English-first, so this is an activation lever, not a nice-to-have.

**Infrastructure — done 2026-08-06:**
- [x] ✅ Custom cookie-based i18n, **not `next-intl`**. next-intl wants a `/[locale]/` segment, which
      would have rewritten all 25 routes plus `start_url`, the SW cache keys, the NextAuth callbacks
      and the new SEO work. Same result without touching routing.
- [x] ✅ Locale switcher in the dashboard header and the marketing navbar (desktop + mobile drawer)
- [x] ✅ Persisted to a cookie **and** `UserPreferences.language` — the column already existed, so no migration
- [x] ✅ `Accept-Language` / `navigator.languages` on first visit only; the guess is never written to
      the cookie, so an explicit choice stays distinguishable from one made for the user
- [x] ✅ `messages/en.json` + `messages/uz.json`, flat namespaced keys; `en` is the typed source of truth
- [x] ✅ 25 tests: header weighting (incl. `q=0`, wildcard), precedence, interpolation, dictionary parity
- [ ] Locale-aware dates/numbers; keep Hijri formatting correct in both
- [ ] Lint rule / CI check that fails on a hard-coded user-facing string

**Measured constraint worth keeping:** resolving the locale in the root layout via `cookies()` opts the
entire app out of static rendering — the build flipped every route, including the marketing page, from
○ to ƒ. The provider renders the default and corrects itself in a *layout* effect instead: before paint,
so no flash, and the pages stay on the CDN.

**Translation itself is done per feature, inside Phase 3.** Each feature deep-dive extracts and
translates its own strings as part of its definition of done — a single 24-page translation
sweep would be error-prone and would rot immediately. Auth, marketing and error/empty states
are translated with the infrastructure since they sit outside Phase 3.

- [x] ✅ Auth pages + marketing + global empty/error states + navigation + prayer names (Bomdod,
      Peshin, Shom, Xufton — the Uzbek terms, not transliterated Arabic)
- [ ] Emails (verification, weekly review) follow the user's locale — `getUserTranslator()` is ready
- [ ] Notification/push copy follows the user's locale

### Phase 3 — Feature deep-dives ⬜
One feature at a time, **finished completely** before moving on.
Definition of done for each: data model · API (validated, indexed, no N+1) · UI/UX to the new
design system · **all strings in `uz` + `en`** · empty + loading + error states · mobile &
tablet · offline behaviour · notifications where relevant · accessibility · tests · measured.

Order (by real usage, most-used first):
1. [ ] **Prayers** — qada' tracker, per-prayer streaks, adhan settings, jamaah vs alone, monthly view
2. [ ] **Adhkar** — morning/evening flows, counter UX, Arabic typography, audio, progress
3. [ ] **Habits** — richer scheduling, freeze UI, heatmap, reminders
4. [ ] **Tasks** — prayer-time blocking (the moat), subtasks, recurring, quick capture
5. [ ] **Focus** — session types, ambient audio, link to tasks, stats
6. [ ] **Journal** — prompts, mood trends, gratitude streaks, Hijri dating
7. [ ] **Goals** — Dunya/Akhirah split made visual, milestones, review cadence
8. [ ] **Calendar** — Hijri-first, prayer overlay, agenda view
9. [ ] **Analytics** — one honest insight per card, not chart soup

### Phase 4 — Growth ⬜
- [ ] Weekly review email live (built, needs the scheduler)
- [ ] Shareable streak cards
- [ ] Family/friends accountability circles
- [ ] More locales once the uz/en groundwork is proven: Russian, Turkish, Arabic
- [ ] Ramadan mode (seasonal spike)

### Phase 5 — Play Store ⬜
Only after Phase 2 numbers improve.
- [ ] Bubblewrap/PWABuilder wrap + `assetlinks.json`
- [ ] Privacy policy page, data-safety form, store assets
- [ ] Closed testing (12 testers × 14 days for personal accounts)

---

## Working agreement
- One phase at a time; inside Phase 3, one feature at a time, finished before the next.
- Every change: typecheck + build + deploy + verify on production.
- Nothing destructive to the live DB without asking.
- This file is updated at the end of every session.

## Session log
| Date | Work |
|---|---|
| 2026-08-02 | Phase 0 started: error tracking + indexes shipped. Baseline audit; Prisma 7 + Accelerate outage fix; SW stale-cache fix; admin dashboard; AES password vault; notifications/push/adhan; offline queue; streak freeze; mobile pass; this plan |
| 2026-08-06 | Phase 2.5 infrastructure shipped: cookie-based uz/en, switcher on every page, nav + auth + marketing translated. Backed out a static-rendering regression found in the build (root-layout `cookies()` made all 25 routes dynamic). Fixed `/api/user/locale` 401ing before its handler ran, and the navbar's emerald-gradient contrast bug. Suite 79 -> 104 |
| 2026-08-03 | Phase 1: fixed the white Prayer Day surfaces — root cause was `background:` shorthand with an undefined var wiping `background-image`; split `--phase-accent` (hue) from `--phase-ink-on-surface` (readable) after all 6 phases failed WCAG AA. Restored keyboard focus rings (`ring:` isn't a CSS property). Phase 2: onboarding shipped. Landing page: `PrayerDayShowcase`, mobile ambient background, reduced-motion honoured. Habits restored to the mobile More menu. Suite 20 failing → 79 passing |
