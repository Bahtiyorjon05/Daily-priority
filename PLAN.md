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

### Phase 0 — Foundation ⬜
Safety net so we stop finding bugs by reading production logs.
- [ ] Sentry (or equivalent) actually reporting — `src/lib/error-tracking.ts` has it commented out
- [ ] Missing DB indexes: `Habit.userId`, `IslamicQuote`, `Tag`, `UserPreference`, `NotificationPreference`
- [ ] Tests for the paths that already broke: auth/register, streaks, timezone, offline queue, middleware matcher
- [ ] Prayer-reminder scheduler (cron-job.org or Vercel Pro) — feature is built and idle
- [ ] Bundle audit: 3.5 MB client JS, three ~368 KB chunks

### Phase 1 — Design system ⬜
- [ ] Prayer-time-aware theme tokens (the table above) with a manual override
- [ ] Type scale, spacing scale, motion language; Arabic font pairing
- [ ] Rebuild core primitives: Card, Button, Tile, EmptyState, PageHeader, Sheet
- [ ] Kill the generic gradient/shadow stack; one accent per screen
- [ ] Document in `DESIGN.md` so every later feature inherits it

### Phase 2 — Activation ⬜
The highest-leverage work in the whole plan.
- [ ] First-run onboarding: city → prayers to track → one habit → land on a *populated* dashboard
- [ ] Starter content so the app is never empty
- [ ] Prayer streak as the hero element of the dashboard
- [ ] Re-measure the activation table above; target ≥60% of new users creating something

### Phase 2.5 — Bilingual (Uzbek + English) ⬜
Every visible string in both languages, switchable from the top of any page.
The user base is clearly not English-first, so this is an activation lever, not a nice-to-have.

**Infrastructure (do once, up front):**
- [ ] `next-intl` wired for the App Router with `uz` (default for existing users) and `en`
- [ ] Locale switcher in the dashboard header — visible on every page, one tap, no reload
- [ ] Persist choice: `User.locale` in the DB + localStorage so it survives devices and refreshes
- [ ] Detect from `Accept-Language` on first visit; never guess again after the user chooses
- [ ] Locale-aware dates/numbers; keep Hijri formatting correct in both
- [ ] `messages/en.json` + `messages/uz.json`, namespaced per feature
- [ ] Lint rule / CI check that fails on a hard-coded user-facing string

**Translation itself is done per feature, inside Phase 3.** Each feature deep-dive extracts and
translates its own strings as part of its definition of done — a single 24-page translation
sweep would be error-prone and would rot immediately. Auth, marketing and error/empty states
are translated with the infrastructure since they sit outside Phase 3.

- [ ] Auth pages + marketing + global empty/error states
- [ ] Emails (verification, weekly review) follow the user's locale
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
| 2026-08-02 | Baseline audit; Prisma 7 + Accelerate outage fix; SW stale-cache fix; admin dashboard; AES password vault; notifications/push/adhan; offline queue; streak freeze; mobile pass; this plan |
