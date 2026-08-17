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

### Phase 2.5 — Bilingual (Uzbek + English) ✅
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
- [x] ✅ CI check that fails on a hard-coded user-facing string (`i18n-coverage.test.ts`), plus
      a guard that every `t()` key resolves — a typo'd key renders the literal "ui.someKey" to users

**Measured constraint worth keeping:** resolving the locale in the root layout via `cookies()` opts the
entire app out of static rendering — the build flipped every route, including the marketing page, from
○ to ƒ. The provider renders the default and corrects itself in a *layout* effect instead: before paint,
so no flash, and the pages stay on the CDN.

**Superseded 2026-08-06: the full sweep was done in one pass, not per feature.** Staging it
across Phase 3 meant shipping a translated sidebar wrapped around ten English pages, which is
worse than either language alone. 757 strings across 104 files, verified by re-running the
extractor against the modified tree — 0 translatable strings remain. Feature deep-dives now
inherit translated copy instead of owing it.

- [x] ✅ **Every page**: prayers, habits, journal, goals, focus, calendar, analytics, adhkar,
      settings, admin, auth, marketing — plus every dialog, filter, toast, empty and error state.
      Prayer names use the Uzbek terms (Bomdod, Peshin, Shom, Xufton), not transliterated Arabic.
- [ ] Emails (verification, weekly review) follow the user's locale — `getUserTranslator()` is ready
- [ ] Notification/push copy follows the user's locale

### Phase 3 — Feature deep-dives 🟨

**Editing is missing, not just unpolished.** Audited 2026-08-08:

| Entity | API | UI |
|---|---|---|
| Journal | `[id]` route has **DELETE only** — no PATCH exists | no edit |
| Habits | PATCH exists | **no edit affordance at all** |
| Goals | PATCH exists but only ever called with `{progress, completed}` | `editingGoal` state is declared and never read — dead |

So a user can create a habit and delete it, but never correct a typo in it.
That is a functionality gap, and it comes before any restyling.

**Order of work:**

1. [ ] **Journal** — add PATCH to `/api/journal/[id]`, then edit in the UI
2. [ ] **Habits** — edit UI reusing the create form, prefilled
3. [ ] **Goals** — edit UI; remove the dead `editingGoal` state
4. [ ] Shared list-page furniture (header, stat tiles, empty states) on the phase
      palette, so the four pages read as one app rather than four
5. [ ] **Prayers** page design
6. [ ] **Habits / Goals / Journal** design passes

Each create form becomes create-or-edit rather than growing a second form —
two forms for one entity is how the fields drift apart.

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
| 2026-08-17 | **Sidebar identity, and the Islamic content in Uzbek.** Quran and Ramadan read as the same tile because both gradients ended in `amber-600` and Quran's emerald start matched Prayers -- three of twelve tiles competing for one identity. Quran is now a mushaf binding (deep green into gold), Ramadan is night into lantern light ending cool-pink, and the other accented pages preview their own already-contrast-checked page accent, so a tile matches the screen it opens. **Quran names:** the Uzbek reader saw "Al-Baqara - The Cow" -- wrong language twice, on the one page that exists to be read in your own language. All 114 surahs got an Uzbek name and meaning following Tafsiri Hilol (the same translation the app already serves), the English article dropped the way an Uzbek mushaf writes it, kept out of the generated `surahs.ts`; four surfaces that each reached into `surah.en` now share one locale-aware helper, and search spans both languages because someone reading in Uzbek may still type "Baqarah". **The wider bug:** every Hijri string came from the API's `month.en` or a hardcoded English sentence -- "5 Rabi' al-Awwal 1448", "Eid al-Fitr" in the calendar grid, an untranslatable English special-day card, `AH` and `Loading...` hardcoded. All of it now passes the month NUMBER and a message KEY. **The keys already existed**: an earlier sweep had translated all twelve months and every special day into both dictionaries but left the code reading its own English table, so none was used -- my first pass added 34 duplicate keys before I found them. sessionStorage bumped to v4 so a payload without the new fields cannot make the holiday badge vanish. `isRamadan()` detected Ramadan by searching for "ramadan" in the formatted date, which in Uzbek ("Ramazon") would have answered false; it compares the month number now. 34 mutations, three missed and all three real gaps (a `` a heredoc had turned into a literal backspace; an assertion satisfied by a `title` while the visible badge rendered the raw key; a row asserting the helper somewhere rather than at the render site) -- tightened and re-run. Suite 376 -> 406 |
| 2026-08-02 | Phase 0 started: error tracking + indexes shipped. Baseline audit; Prisma 7 + Accelerate outage fix; SW stale-cache fix; admin dashboard; AES password vault; notifications/push/adhan; offline queue; streak freeze; mobile pass; this plan |
| 2026-08-09 | Dialogs, the fifth i18n blind spot, per-page identity, and the calendar. `max-h-[90vh]` cut the bottom off every dialog on a phone — `vh` measures the largest viewport, so while the address bar shows it is taller than the screen and the sticky footer sits off it; now a `.modal-panel` utility with a `dvh` rule over a `vh` fallback, plus safe-area insets. The delete confirmation stayed English because of `{saving ? 'Deleting...' : 'Delete'}` — a StringLiteral rendered as a JSX child, invisible to the JsxText check; guarded, with comparisons and case clauses excluded so `c === 'password (decrypted)'` is not mistaken for copy. **Design:** journal/goals/habits/focus/calendar each got a fixed palette via `data-accent`, off the phase system — prayers and the dashboard keep the prayer day. Every value measured: the first focus palette (indigo-600) sat 47 from the journal violet and the new separation check caught it. **Calendar:** shipped as `grid-cols-2 sm:grid-cols-7`, so on a phone the month ran two days per row and the columns stopped lining up under the weekday labels — it was not a calendar. Seven columns always, tap selects instead of opening a form, and a day panel below the grid carries the detail a 45px cell cannot. Suite 180 -> 199 |
| 2026-08-09 | Mobile affordances + the last i18n blind spots. Card edit/delete used `opacity-0 group-hover:opacity-100`; Tailwind compiles `group-hover:` inside `@media (hover:hover)`, so on touch the reveal never fired while the bare `opacity-0` always did — the controls were laid out, focusable and permanently invisible, making editing impossible on a phone. Shared `ROW_ACTIONS` keys the hiding on the pointer, not a breakpoint (a Windows touchscreen is wide and cannot hover). Journal card gained the edit button it never had. Tap targets 32px -> 44px, glyphs 16px -> 20px; removed the mobile `button { padding }` blanket (same unlayered-beats-utilities mistake). Popovers: phase picker had no outside-press dismissal above `sm`, profile menu treated every `[data-dropdown]` as "inside" so siblings never closed each other — both now use one `useDismissable` (pointerdown, capture, + Escape). i18n: the dashboard status chips derived their label from the state key (`charAt(0).toUpperCase()+slice(1)`), so the English text existed nowhere in source and no check could see it; plus copy sitting in JSX *attributes* (`message=`, `subtitle=`). Both now guarded. Suite 167 -> 180 |
| 2026-08-08 | **Root cause of every "white in light mode" report.** globals.css carried `button { background: rgba(255,255,255,.95) }` and `.dark button { background: rgba(15,23,42,.95) }` OUTSIDE any `@layer`. Unlayered rules beat layered ones regardless of specificity and all Tailwind utilities live in `@layer utilities`, so this painted over every `bg-*`; `background` is a shorthand so it also wiped `background-image`, killing gradient CTAs while their `text-white` label stayed white; and `.dark button` gave dark mode a dark fill, so it could only ever break in light mode. That is why the same symptom kept resurfacing one control at a time — the header "Sign Up", "View All Prayer Times", the sign-up code field — and why patching each control individually never ended it. Removed, plus the blanket `button:hover { transform }` that had been overriding every hover-scale utility. Two new guards: no unlayered rule may set background/colour on an element-reaching selector, and the `background` shorthand is confined to the flat `.glass*`/`.card` surfaces. Suite 165 -> 167 |
| 2026-08-08 | Icons, admin closure visibility, light-mode contrast. The emblem had been live for weeks but the service worker precaches the icons and `CACHE_NAME` never moved, so `activate` kept `daily-priority-v3` and every installed PWA served the old tick — home screen, install dialog, push badge, onboarding. Bumped to v4; the comment now says to bump on precached *content* changes, not just strategy changes. Install prompt shows the real icon instead of a lucide moon. Admin: a closed account opened looking live, with `deletedAt`/`deletionReason` in the type and rendered nowhere — now a red banner on the record with the closure time to the minute, the reason, whether the address was released, plus the date on the list card and a Deleted filter. Light mode: the 6-digit sign-up code input had no text colour while every sibling hand-patched one; fixed at the root too, since `outline`/`ghost` Buttons and the base Input all set a hover colour but no resting one — the same omission behind the white "View All Prayer Times". Suite 154 -> 165 |
| 2026-08-08 | Closing an account no longer bans the email address. Soft delete + a unique `email` meant the closed row squatted the address, so signing up again said "account already exists, sign in instead" — advice that could not work, since sign-in refuses deleted accounts. Now the closed row *releases* the address (tombstone `deleted+<id>@account.invalid`, real address to a new `deletedEmail` column) rather than being revived, so the person gets a genuinely empty account and admin keeps the full history. The OAuth path needed the account links dropped too: the Google branch resolves by (provider, providerAccountId) *before* the email and returns early, so a leftover link would have signed them back into the closed account. Also stopped forgot-password emailing reset codes for closed accounts. Suite 145 -> 154 |
| 2026-08-08 | Onboarding fixed and redesigned. Location detection resolved the city and never advanced the step; finishing looped back because the JWT still carried `needsOnboarding: true` and the dashboard shell redirects on it (`await update()` before navigating). Dropped the prayer-phase palette here — a 5am sign-up opened on a near-black screen — for a fixed deep-indigo field with sky/violet/emerald bloom and a glass card, all colours stated explicitly since theme tokens would paint dark-on-dark in light mode. Suggested habits and the Continue label were still hardcoded English (prop/data values, the sweep's blind spot); selection now tracks message keys so switching language mid-flow keeps the picks. Also un-double-encoded the sign-in `callbackUrl`. Six new tests, each verified to fail when its bug is reintroduced. Suite 139 -> 145 |
| 2026-08-06 | Phase 2.5 **complete**: full 757-string sweep across 104 files after the staged approach left feature pages in English. Codemod needed five clean re-runs — multi-line import anchors, `=>` read as a JSX tag, arrow-in-type matched as a component body, a `t` shadowed by a toast param, and `chart('x')` matching a `t('` substring. Deleted 2 dead error-boundary files. Suite 104 -> 107 |
| 2026-08-06 | Phase 2.5 infrastructure shipped: cookie-based uz/en, switcher on every page, nav + auth + marketing translated. Backed out a static-rendering regression found in the build (root-layout `cookies()` made all 25 routes dynamic). Fixed `/api/user/locale` 401ing before its handler ran, and the navbar's emerald-gradient contrast bug. Suite 79 -> 104 |
| 2026-08-03 | Phase 1: fixed the white Prayer Day surfaces — root cause was `background:` shorthand with an undefined var wiping `background-image`; split `--phase-accent` (hue) from `--phase-ink-on-surface` (readable) after all 6 phases failed WCAG AA. Restored keyboard focus rings (`ring:` isn't a CSS property). Phase 2: onboarding shipped. Landing page: `PrayerDayShowcase`, mobile ambient background, reduced-motion honoured. Habits restored to the mobile More menu. Suite 20 failing → 79 passing |
