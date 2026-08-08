/**
 * Shared email layout.
 *
 * Email clients are not browsers. This template deliberately uses:
 *  - table-based layout (Outlook/Word rendering engine ignores flex/grid)
 *  - inline styles for anything structural (Gmail strips <head> styles in some
 *    contexts, but keeps media queries — so those are progressive enhancement)
 *  - a preheader, so the inbox preview isn't the first line of boilerplate
 *  - `prefers-color-scheme` support, so we don't get auto-inverted into mud
 *
 * Every sender goes through `renderEmail` — previously the same gradient header
 * was copy-pasted seven times and drifted.
 *
 * It is also locale-aware: `lang` on <html> matters for screen readers and for
 * Gmail's "translate this message?" prompt, which would otherwise offer to
 * translate an Uzbek email it believes is English.
 */
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'

const BRAND = {
  name: 'Daily Priority',
  /** Matches the app icon's backdrop, so the header reads as the same product. */
  accent: '#0e493c',
  accentDark: '#062a2c',
  accentBright: '#10b981',
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff',
  canvas: '#f1f5f9',
}

export interface EmailOptions {
  /** Shown large at the top of the card. */
  title: string
  /** Small line under the wordmark in the header. */
  eyebrow?: string
  /** Inbox preview text. Falls back to the title. */
  preheader?: string
  /** Main body — already-escaped HTML. */
  body: string
  /** Optional primary action. */
  cta?: { label: string; url: string }
  /** Small print under the divider (unsubscribe hints etc). */
  footnote?: string
  appUrl?: string
  /** Recipient's language. Sets `lang` and picks the footer copy. */
  locale?: Locale
  /** Footer line above the copyright. */
  footerNote?: string
}

export function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  )
}

/** A large, easy-to-read one-time code block. */
export function codeBlock(code: string, note?: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#ecfdf5;border:2px dashed ${BRAND.accent};border-radius:12px;padding:20px 32px;text-align:center;">
              <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;line-height:1.1;font-weight:700;color:${BRAND.accentDark};letter-spacing:8px;">${escapeHtml(code)}</div>
              ${note ? `<div style="color:${BRAND.muted};font-size:13px;margin-top:10px;letter-spacing:0;">${escapeHtml(note)}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

/** Label/value row used by the weekly review. */
export function statRow(label: string, value: string, hint?: string): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:14px;color:${BRAND.ink};">${escapeHtml(label)}
            ${hint ? `<span style="color:${BRAND.muted};font-size:12px;"> · ${escapeHtml(hint)}</span>` : ''}
          </td>
          <td align="right" style="font-size:16px;font-weight:700;color:${BRAND.accentDark};white-space:nowrap;">${escapeHtml(value)}</td>
        </tr>
      </table>
    </td>
  </tr>`
}

/** Horizontal progress bar that degrades to a plain block in old clients. */
export function meter(percent: number, label: string): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)))
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;">
    <tr>
      <td style="font-size:12px;color:${BRAND.muted};padding-bottom:6px;">${escapeHtml(label)} — <strong style="color:${BRAND.accentDark};">${p}%</strong></td>
    </tr>
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e2e8f0;border-radius:999px;">
          <tr>
            <td width="${p}%" style="background:${BRAND.accent};border-radius:999px;height:8px;line-height:8px;font-size:0;">&nbsp;</td>
            <td width="${100 - p}%" style="font-size:0;line-height:8px;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

export function renderEmail(options: EmailOptions): string {
  const appUrl = options.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://daily-priority.vercel.app'
  const year = new Date().getFullYear()
  const preheader = options.preheader || options.title
  const locale = options.locale || DEFAULT_LOCALE

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(options.title)}</title>
  <style>
    /* Progressive enhancement only — structural styles stay inline. */
    @media (max-width:620px) {
      .container { width:100% !important; }
      .pad { padding-left:20px !important; padding-right:20px !important; }
      .h1 { font-size:22px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .canvas { background:#0b1220 !important; }
      .card { background:#111a2b !important; border-color:#1f2b3f !important; }
      .ink { color:#e2e8f0 !important; }
      .muted { color:#94a3b8 !important; }
      .divider { border-color:#1f2b3f !important; }
    }
    a { color:${BRAND.accentDark}; }
  </style>
</head>
<body class="canvas" style="margin:0;padding:0;background:${BRAND.canvas};">
  <!-- Inbox preview text, then whitespace so the body copy doesn't leak into it -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(preheader)}
    ${'&#8203;&nbsp;'.repeat(60)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="canvas" style="background:${BRAND.canvas};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.accent},${BRAND.accentDark});background-color:${BRAND.accent};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <!-- The real app icon. Referenced by URL because embedding it as a
                   CID attachment makes the message heavier and trips spam
                   heuristics on transactional mail. -->
              <img src="${appUrl}/icon-192.png" width="52" height="52" alt=""
                   style="display:block;margin:0 auto 12px;width:52px;height:52px;border-radius:13px;">
              <div style="font-size:21px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">${BRAND.name}</div>
              ${
                options.eyebrow
                  ? `<div style="display:inline-block;margin-top:9px;padding:4px 11px;border-radius:999px;background:rgba(255,255,255,0.14);font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.94);">${escapeHtml(options.eyebrow)}</div>`
                  : ''
              }
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="card pad" style="background:${BRAND.surface};border:1px solid ${BRAND.border};border-top:0;border-radius:0 0 14px 14px;padding:30px 32px;">
              <h1 class="h1 ink" style="margin:0 0 14px;font-size:24px;line-height:1.3;color:${BRAND.ink};font-weight:700;">${escapeHtml(options.title)}</h1>

              <div class="ink" style="font-size:15px;line-height:1.65;color:${BRAND.ink};">
                ${options.body}
              </div>

              ${
                options.cta
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
                       <tr>
                         <td style="background:${BRAND.accentBright};border-radius:11px;">
                           <a href="${options.cta.url}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(options.cta.label)}</a>
                         </td>
                       </tr>
                     </table>`
                  : ''
              }

              ${
                options.footnote
                  ? `<div class="divider" style="margin-top:26px;padding-top:18px;border-top:1px solid ${BRAND.border};">
                       <p class="muted" style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};">${options.footnote}</p>
                     </div>`
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 12px;text-align:center;">
              ${
                options.footerNote
                  ? `<p class="muted" style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(options.footerNote)}</p>`
                  : ''
              }
              <p class="muted" style="margin:0 0 4px;font-size:12px;color:${BRAND.muted};">
                <a href="${appUrl}" style="color:${BRAND.muted};text-decoration:underline;">${appUrl.replace(/^https?:\/\//, '')}</a>
              </p>
              <p class="muted" style="margin:0;font-size:12px;color:${BRAND.muted};">© ${year} ${BRAND.name}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
