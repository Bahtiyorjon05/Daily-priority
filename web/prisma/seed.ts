import { PrismaClient, QuoteCategory } from '@prisma/client'

const prisma = new PrismaClient()

const islamicQuotes = [
  // Productivity
  {
    text: "The best of you are those who learn the Quran and teach it.",
    source: "Sahih Bukhari",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Take advantage of five before five: your youth before your old age, your health before your illness, your wealth before your poverty, your free time before your busyness, and your life before your death.",
    source: "Hadith",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever is slow in doing good deeds, his lineage will not speed him up.",
    source: "Sahih Muslim",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },

  // Patience
  {
    text: "And be patient, for indeed, Allah does not allow to be lost the reward of those who do good.",
    source: "Quran 11:115",
    category: "PATIENCE"
  },
  {
    text: "Verily, with hardship comes ease.",
    source: "Quran 94:6",
    category: "PATIENCE"
  },
  {
    text: "Allah does not burden a soul beyond that it can bear.",
    source: "Quran 2:286",
    category: "PATIENCE"
  },

  // Gratitude
  {
    text: "If you are grateful, I will surely increase you [in favor].",
    source: "Quran 14:7",
    category: "GRATITUDE"
  },
  {
    text: "He who does not thank people does not thank Allah.",
    source: "Hadith",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },

  // Prayer
  {
    text: "Guard strictly your prayers, especially the middle prayer, and stand before Allah with devotion.",
    source: "Quran 2:238",
    category: "PRAYER"
  },
  {
    text: "The prayer is the pillar of religion. Whoever establishes it has established religion, and whoever abandons it has destroyed religion.",
    source: "Hadith",
    category: "PRAYER",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },

  // Knowledge
  {
    text: "Seeking knowledge is an obligation upon every Muslim.",
    source: "Hadith",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The example of guidance and knowledge with which Allah has sent me is like abundant rain falling on the earth.",
    source: "Sahih Bukhari",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },

  // Family
  {
    text: "The best of you are those who are best to their families, and I am the best of you to my family.",
    source: "Hadith",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Paradise lies at the feet of your mother.",
    source: "Hadith",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },

  // Character
  {
    text: "The most beloved of people to Allah are those who are most beneficial to people.",
    source: "Hadith",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The strong person is not the one who can overpower others, but the strong person is the one who controls himself when he is angry.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },

  // General
  {
    text: "Indeed, with every difficulty there is relief.",
    source: "Quran 94:5",
    category: "GENERAL"
  },
  {
    text: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
    source: "Quran 2:152",
    category: "GENERAL"
  },
  {
    text: "The believer who mixes with people and bears their annoyance with patience will have a greater reward than the believer who does not mix with people and does not put up with their annoyance.",
    source: "Hadith",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Actions are judged by intentions, so each man will have what he intended.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever believes in Allah and the Last Day should speak good or remain silent.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The best charity is that given when one is in need and struggling.",
    source: "Hadith",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Make things easy and do not make them difficult, cheer people up and do not repel them.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The world is a prison for the believer and a paradise for the disbeliever.",
    source: "Sahih Muslim",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Be in this world as if you were a stranger or a traveler.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  }
]

async function main() {
  console.log('Starting seed...')

  // Clear existing quotes
  await prisma.islamicQuote.deleteMany({})
  console.log('Cleared existing quotes')

  // Seed Islamic quotes
  for (const quote of islamicQuotes) {
    await prisma.islamicQuote.create({
      data: {
        ...quote,
        category: quote.category as QuoteCategory
      }
    })
  }

  console.log(`Seeded ${islamicQuotes.length} Islamic quotes`)
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
