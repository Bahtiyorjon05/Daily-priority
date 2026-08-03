# Daily Priority — Design System

> **"The Prayer Day"** — the interface breathes with the rhythm of the Islamic day.

Every feature built from Phase 3 onward inherits this. If something here is
inconvenient for a screen you're building, change the system — don't work around it.

---

## 1. The idea

Most productivity apps pick a brand colour and hold it all day. We already own something
better: **the day is structured by prayer**, and that structure is felt, not just recorded.
So the interface's atmosphere moves with it.

At Fajr the app is still and blue. By Dhuhr it's bright and businesslike. At Asr it warms.
Maghrib brings dusk. After Isha it goes quiet and dark. The user never configures this —
it simply matches where they are in their day.

This is the single strongest differentiator available to us, and it costs the user nothing.

---

## 2. Phases

| Phase | Window | Mood | Accent |
|---|---|---|---|
| `dawn` | Fajr → sunrise | still, blue hour | indigo, drifting to soft rose |
| `morning` | sunrise → Dhuhr | clean, productive | emerald |
| `midday` | Dhuhr → Asr | bright, high sun | teal |
| `afternoon` | Asr → Maghrib | warm, golden | amber → terracotta |
| `dusk` | Maghrib → Isha | calm, closing | violet → deep teal |
| `night` | Isha → Fajr | quiet, restful | near-black, muted jewel teal |

Resolved by `src/lib/prayer-phase.ts` from the prayer times the Prayers page already
caches — **no extra request, no second location prompt**. If those aren't known yet it
falls back to a clock approximation, so the app is never without an atmosphere.
Covered by 15 tests including full-day coverage and the midnight wrap.

---

## 3. Tokens

Set as `data-phase` on `<html>` by `PrayerPhaseProvider`. All atmosphere tokens are
**additive** — they never touch `--color-background`, `--color-foreground` or
`--color-card`, so light/dark keeps full control of surfaces and text contrast.

| Token | Use |
|---|---|
| `--phase-accent` | primary accent for this period |
| `--phase-accent-soft` | tinted fills, chips, subtle backgrounds |
| `--phase-glow` | halos, shadows, gradient highlights |
| `--phase-from` / `--phase-to` | the quiet page/section wash |
| `--phase-ink` | text that sits on a phase-tinted surface |

### Utilities

| Class | Use |
|---|---|
| `.phase-accent` | text in the current accent |
| `.phase-bg-accent` | solid accent fill |
| `.phase-border` | accent-tinted border |
| `.phase-surface` | quiet gradient wash for panels/sections |
| `.phase-hero` | saturated hero wash; **always safe for white text**, including at night |
| `.phase-glow` | soft halo for hero numbers/icons |
| `.phase-pattern` | Islamic geometry as background texture |

**Never** hard-code `emerald-500` etc. for accents in new work. Use the tokens, or the
semantic `--color-primary` when the element genuinely isn't time-of-day dependent.

---

## 4. Rules

**Restraint.** The old UI leaned on gradients, glass and heavy shadows everywhere, which
flattened hierarchy — when everything is emphasised, nothing is. New work:

- **One accent per screen.** The hero owns it. Everything else is neutral until it earns attention.
- **Gradients are atmospheric, not decorative.** `phase-surface`/`phase-hero` only.
- **Shadows communicate elevation**, not importance. Prefer borders and spacing.
- **Space over borders** where possible; let content breathe.

**Islamic geometry is structure.** Use `.phase-pattern` at low opacity for texture behind
hero areas. It should feel like paper stock, not wallpaper.

**Arabic typography is first-class.** The `Amiri` serif is already loaded as
`--font-amiri`. Any Arabic (adhkar, du'a, Qur'an) is set in it, at a **larger size and
looser line-height** than the surrounding Latin text — never as a cramped afterthought.

**Motion is light moving.** Phase changes cross-fade over 600ms. Nothing about the
atmosphere should feel like a theme "toggle". All motion respects
`prefers-reduced-motion`.

**Dunya / Akhirah.** The `Goal` model already carries this split. Express it visually:
worldly goals in the phase accent, spiritual goals in a consistent complementary
treatment — so the balance is legible at a glance.

---

## 5. User control

The header `PhaseIndicator` shows the current period and lets the user either follow the
prayer day (default) or pin a phase they prefer. The choice persists locally.

This matters: the atmosphere is expressive, and some people will want it fixed. It should
never feel imposed.

---

## 6. Accessibility

- Phase tokens must never be the **only** signal for state — pair with icon or text.
- `.phase-hero` is contrast-checked for white text at every phase, night included.
- Contrast is owned by light/dark, not by the phase; that's why phases don't touch
  surface/foreground tokens.
- All interactive targets ≥ 44px.

---

## 7. Status

- ✅ Phase engine + tokens + provider + header control
- ✅ Dashboard hero converted as the first surface
- ⬜ Core primitives (Card, Button, Tile, EmptyState, PageHeader, Sheet) rebuilt on the system
- ⬜ Remaining surfaces converted during their Phase 3 deep-dive
