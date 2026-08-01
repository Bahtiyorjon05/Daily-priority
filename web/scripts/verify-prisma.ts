import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // One read against the database.
  const userCount = await prisma.user.count()
  const quoteCount = await prisma.islamicQuote.count()

  console.log('✅ Connected')
  console.log(`   users:          ${userCount}`)
  console.log(`   islamic_quotes: ${quoteCount}`)
}

main()
  .catch((error) => {
    console.error('❌ Prisma verification failed')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
