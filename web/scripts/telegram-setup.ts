import 'dotenv/config'

/**
 * Register the bot with Telegram: webhook, menu button, commands.
 *
 * Run after a deploy that changes any of them:
 *
 *   npx tsx scripts/telegram-setup.ts
 *
 * Idempotent — every call sets the same state, so running it twice is harmless.
 * The token is read from the environment and never printed: this script is
 * committed, the token is not.
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

/*
  The PUBLIC url, which is not what the local .env holds.

  `NEXT_PUBLIC_APP_URL` is http://localhost:3000 during development, and running
  this script from a dev machine would then point Telegram's webhook at a
  loopback address -- or, worse, silently open the Mini App on a URL that only
  works on that one laptop. Telegram requires HTTPS for both, so it is demanded
  here with a message that says what to do rather than "bad webhook".

  Override with TELEGRAM_PUBLIC_URL, or pass the url as the first argument.
*/
const APP_URL =
  process.argv[2] ??
  process.env.TELEGRAM_PUBLIC_URL ??
  (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')
    ? process.env.NEXT_PUBLIC_APP_URL
    : undefined)

async function call(method: string, payload: Record<string, unknown> = {}) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(`${method}: ${json.description}`)
  return json.result
}

async function main() {
  for (const [name, value] of Object.entries({
    TELEGRAM_BOT_TOKEN: TOKEN,
    TELEGRAM_WEBHOOK_SECRET: SECRET,
  })) {
    if (!value) throw new Error(`${name} is not set`)
  }
  if (!APP_URL?.startsWith('https://')) {
    throw new Error(
      [
        'Need the public HTTPS url. Telegram accepts nothing else for a webhook',
        'or a Mini App, and the local NEXT_PUBLIC_APP_URL is a localhost address.',
        '',
        '  npx tsx scripts/telegram-setup.ts https://your-domain.com',
      ].join('\n')
    )
  }

  const me = await call('getMe')
  console.log(`bot: @${me.username} (${me.id})`)

  await call('setWebhook', {
    url: `${APP_URL}/api/telegram/webhook`,
    secret_token: SECRET,
    /*
      Only what the bot acts on -- but `callback_query` is not optional: it is
      how every inline button reports a tap, and leaving it out means the buttons
      render, spin and never do anything.
    */
    /*
      Messages only. The bot has no buttons of its own and no inline mode any
      more -- subscribing to updates nothing handles is just traffic.
    */
    allowed_updates: ['message'],
    drop_pending_updates: true,
  })
  console.log(`webhook: ${APP_URL}/api/telegram/webhook`)

  /*
    The menu button beside the message box. This is the "Open" everyone sees, and
    the single most important thing on this list: it is how a Mini App is
    launched without the person having to know a command exists.
  */
  await call('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Open',
      /*
        /tg, not /dashboard.

        Telegram appends `initData` to the URL as a FRAGMENT, and a fragment does
        not survive a server-side redirect in its webview. /dashboard is behind
        auth, so opening it there redirected to /signin and threw the sign-in
        blob away before any of our code ran -- the app opened signed out and the
        bot never learned who anyone was. /tg is public, signs in, then forwards.
      */
      web_app: { url: `${APP_URL}/tg?to=%2Fdashboard` },
    },
  })
  console.log('menu button: Open -> /tg?to=/dashboard')

  /*
    Two commands, because there are two things to say.

    There were ten. Every one beyond these depended on the chat knowing which
    account it was talking to, and while that link was failing they all answered
    "open the app first" -- which is worse than not offering them.
  */
  const commands = [
    { command: 'start', description: 'Open Daily Priority' },
    { command: 'help', description: 'What this is' },
  ]
  await call('setMyCommands', { commands })

  await call('setMyCommands', {
    language_code: 'uz',
    commands: [
      { command: 'start', description: 'Daily Priority ochish' },
      { command: 'help', description: 'Bu nima' },
    ],
  })
  console.log(`commands: ${commands.map((c) => '/' + c.command).join(' ')} (en + uz)`)

  await call('setMyDescription', {
    description:
      'Prayers, Quran, habits and tasks — built around the five prayers. Open it right here in Telegram.',
  })
  await call('setMyShortDescription', {
    short_description: 'Your day, around the five prayers.',
  })

  const info = await call('getWebhookInfo')
  console.log(`\npending updates: ${info.pending_update_count}`)
  console.log(`last error: ${info.last_error_message ?? 'none'}`)
  console.log('\nDone.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
