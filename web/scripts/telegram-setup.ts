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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

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
  for (const [name, value] of Object.entries({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_WEBHOOK_SECRET: SECRET, NEXT_PUBLIC_APP_URL: APP_URL })) {
    if (!value) throw new Error(`${name} is not set`)
  }

  const me = await call('getMe')
  console.log(`bot: @${me.username} (${me.id})`)

  await call('setWebhook', {
    url: `${APP_URL}/api/telegram/webhook`,
    secret_token: SECRET,
    // Only what the bot acts on. Anything else is bandwidth and a bigger surface.
    allowed_updates: ['message', 'edited_message'],
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
      web_app: { url: `${APP_URL}/dashboard` },
    },
  })
  console.log('menu button: Open -> /dashboard')

  const commands = [
    { command: 'app', description: 'Open Daily Priority' },
    { command: 'prayers', description: 'Today’s prayer times' },
    { command: 'quran', description: 'Carry on reading' },
    { command: 'streak', description: 'Your streaks' },
    { command: 'reminders', description: 'Prayer reminders on/off' },
    { command: 'help', description: 'What I can do' },
  ]
  await call('setMyCommands', { commands })

  // Uzbek gets its own list. Telegram picks by the client's language, so an
  // Uzbek phone sees Uzbek descriptions in the command menu.
  await call('setMyCommands', {
    language_code: 'uz',
    commands: [
      { command: 'app', description: 'Daily Priority ochish' },
      { command: 'prayers', description: 'Bugungi namoz vaqtlari' },
      { command: 'quran', description: 'O‘qishni davom ettirish' },
      { command: 'streak', description: 'Ketma-ketliklaringiz' },
      { command: 'reminders', description: 'Namoz eslatmalari' },
      { command: 'help', description: 'Nima qila olaman' },
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
