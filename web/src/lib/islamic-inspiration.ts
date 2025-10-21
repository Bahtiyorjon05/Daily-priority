/**
 * Islamic Daily Inspiration - Verses, Quotes, and Wisdom
 * Beautiful collection for the Daily Priority Islamic productivity app
 */

export interface DailyInspiration {
  id: string
  text: string
  source: string
  type: 'quran' | 'hadith' | 'wisdom'
  category: 'productivity' | 'patience' | 'gratitude' | 'guidance' | 'motivation' | 'reflection'
  arabic?: string
  reference?: string
}

export const dailyInspirations: DailyInspiration[] = [
  // Quran Verses
  {
    id: '1',
    text: 'And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose.',
    source: 'Quran 65:3',
    type: 'quran',
    category: 'guidance',
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ',
    reference: 'At-Talaq 65:3'
  },
  {
    id: '2',
    text: 'And it is He who created the heavens and earth in truth. And the day He says, "Be," and it is, His word is the truth.',
    source: 'Quran 6:73',
    type: 'quran',
    category: 'reflection',
    arabic: 'وَهُوَ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ بِالْحَقِّ ۖ وَيَوْمَ يَقُولُ كُن فَيَكُونُ ۚ قَوْلُهُ الْحَقُّ',
    reference: 'Al-An\'am 6:73'
  },
  {
    id: '3',
    text: 'But whoever does righteous deeds, whether male or female, while being a believer - those will enter Paradise.',
    source: 'Quran 4:124',
    type: 'quran',
    category: 'motivation',
    arabic: 'وَمَن يَعْمَلْ مِنَ الصَّالِحَاتِ مِن ذَكَرٍ أَوْ أُنثَىٰ وَهُوَ مُؤْمِنٌ فَأُولَٰئِكَ يَدْخُلُونَ الْجَنَّةَ',
    reference: 'An-Nisa 4:124'
  },
  {
    id: '4',
    text: 'And Allah is the best of planners.',
    source: 'Quran 8:30',
    type: 'quran',
    category: 'patience',
    arabic: 'وَاللَّهُ خَيْرُ الْمَاكِرِينَ',
    reference: 'Al-Anfal 8:30'
  },
  {
    id: '5',
    text: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
    source: 'Quran 2:152',
    type: 'quran',
    category: 'gratitude',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    reference: 'Al-Baqarah 2:152'
  },
  
  // Hadith
  {
    id: '6',
    text: 'The believer who mixes with people and bears their annoyance with patience will have a greater reward than the believer who does not mix with people.',
    source: 'Hadith - Tirmidhi',
    type: 'hadith',
    category: 'patience',
    reference: 'Tirmidhi 2507'
  },
  {
    id: '7',
    text: 'Allah does not look at your forms and possessions, but He looks at your hearts and your deeds.',
    source: 'Hadith - Muslim',
    type: 'hadith',
    category: 'reflection',
    reference: 'Muslim 2564'
  },
  {
    id: '8',
    text: 'The best of people are those who benefit others.',
    source: 'Hadith - Ahmad',
    type: 'hadith',
    category: 'productivity',
    reference: 'Ahmad 3641'
  },
  {
    id: '9',
    text: 'Be in this world as if you were a stranger or a traveler along a path.',
    source: 'Hadith - Bukhari',
    type: 'hadith',
    category: 'guidance',
    reference: 'Bukhari 6416'
  },
  {
    id: '10',
    text: 'Make the most of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your preoccupation, and your life before your death.',
    source: 'Hadith - Hakim',
    type: 'hadith',
    category: 'productivity',
    reference: 'Al-Hakim 7846'
  },
  
  // Islamic Wisdom
  {
    id: '11',
    text: 'Work for your life as if you will live forever, and work for your afterlife as if you will die tomorrow.',
    source: 'Islamic Wisdom',
    type: 'wisdom',
    category: 'productivity'
  },
  {
    id: '12',
    text: 'The hour that you spend in the remembrance of Allah is better than a thousand hours spent in the worldly activities.',
    source: 'Islamic Wisdom',
    type: 'wisdom',
    category: 'reflection'
  },
  {
    id: '13',
    text: 'A moment of patience in a moment of anger saves you a hundred moments of regret.',
    source: 'Islamic Wisdom',
    type: 'wisdom',
    category: 'patience'
  },
  {
    id: '14',
    text: 'Be grateful for what you have while working for what you want.',
    source: 'Islamic Wisdom',
    type: 'wisdom',
    category: 'gratitude'
  },
  {
    id: '15',
    text: 'Trust Allah when things don\'t work out the way you wanted. Allah has something better planned for you.',
    source: 'Islamic Wisdom',
    type: 'wisdom',
    category: 'guidance'
  }
]

/**
 * Get daily inspiration based on current date
 */
export function getDailyInspiration(): DailyInspiration {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  const index = dayOfYear % dailyInspirations.length
  return dailyInspirations[index]
}

/**
 * Get inspiration by category
 */
export function getInspirationByCategory(category: DailyInspiration['category']): DailyInspiration[] {
  return dailyInspirations.filter(inspiration => inspiration.category === category)
}

/**
 * Get inspiration by type
 */
export function getInspirationByType(type: DailyInspiration['type']): DailyInspiration[] {
  return dailyInspirations.filter(inspiration => inspiration.type === type)
}

/**
 * Get random inspiration
 */
export function getRandomInspiration(): DailyInspiration {
  const randomIndex = Math.floor(Math.random() * dailyInspirations.length)
  return dailyInspirations[randomIndex]
}