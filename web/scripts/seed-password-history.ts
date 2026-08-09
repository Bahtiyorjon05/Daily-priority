import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/**
 * Backfills PasswordHistory from the current vault copy.
 *
 * Accounts that already have a `passwordEnc` get one history row for it, so the
 * admin timeline is not empty for everyone who existed before the table did.
 * There is only ever one row to create per user — the past is genuinely not
 * recoverable, it was never stored.
 *
 * Idempotent: skips any user that already has history.
 */
async function main() {
  const users = await prisma.user.findMany({
    where: { passwordEnc: { not: null } },
    select: { id: true, email: true, passwordEnc: true, updatedAt: true },
  })

  let created = 0
  let skipped = 0

  for (const user of users) {
    const existing = await prisma.passwordHistory.count({ where: { userId: user.id } })
    if (existing > 0) {
      skipped++
      continue
    }
    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        passwordEnc: user.passwordEnc!,
        // We know it is the current password, not how it came to be set.
        source: 'signin',
        createdAt: user.updatedAt,
      },
    })
    created++
  }

  console.log(`users with a vault copy: ${users.length}`)
  console.log(`history rows created:    ${created}`)
  console.log(`already had history:     ${skipped}`)

  const total = await prisma.passwordHistory.count()
  console.log(`password_history total:  ${total}`)
}

main().finally(() => prisma.$disconnect())
