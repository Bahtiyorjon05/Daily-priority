/**
 * Islamic daily inspiration — Qur'anic verses and authentic ahadith.
 *
 * `textKey` holds a message key rather than English, so a quote follows the
 * language switch like every other string. Arabic is the source text and is
 * never translated; `reference` names the surah/collection so a reader can
 * check it.
 */

export interface DailyInspiration {
  id: string
  /** Message key — resolve with t() at the render site. */
  textKey: string
  source: string
  type: 'quran' | 'hadith'
  category: 'productivity' | 'patience' | 'gratitude' | 'guidance' | 'motivation' | 'reflection'
  arabic: string
  reference: string
}

export const dailyInspirations: DailyInspiration[] = [
  {
    id: 'q1',
    textKey: 'quote.tawakkul',
    source: 'Quran 65:3',
    type: 'quran',
    category: 'guidance',
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ',
    reference: 'At-Talaq 65:3',
  },
  {
    id: 'q2',
    textKey: 'quote.wayOut',
    source: 'Quran 65:2',
    type: 'quran',
    category: 'guidance',
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    reference: 'At-Talaq 65:2',
  },
  {
    id: 'q3',
    textKey: 'quote.easeAfterHardship',
    source: 'Quran 94:5',
    type: 'quran',
    category: 'patience',
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    reference: 'Ash-Sharh 94:5',
  },
  {
    id: 'q4',
    textKey: 'quote.rememberMe',
    source: 'Quran 2:152',
    type: 'quran',
    category: 'gratitude',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    reference: 'Al-Baqarah 2:152',
  },
  {
    id: 'q5',
    textKey: 'quote.patiencePrayer',
    source: 'Quran 2:153',
    type: 'quran',
    category: 'patience',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    reference: 'Al-Baqarah 2:153',
  },
  {
    id: 'q6',
    textKey: 'quote.capacity',
    source: 'Quran 2:286',
    type: 'quran',
    category: 'patience',
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    reference: 'Al-Baqarah 2:286',
  },
  {
    id: 'q7',
    textKey: 'quote.heartsAtRest',
    source: 'Quran 13:28',
    type: 'quran',
    category: 'reflection',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    reference: 'Ar-Ra‘d 13:28',
  },
  {
    id: 'q8',
    textKey: 'quote.sufficient',
    source: 'Quran 3:173',
    type: 'quran',
    category: 'guidance',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    reference: 'Aal-i-Imran 3:173',
  },
  {
    id: 'q9',
    textKey: 'quote.bestGuardian',
    source: 'Quran 12:64',
    type: 'quran',
    category: 'guidance',
    arabic: 'فَاللَّهُ خَيْرٌ حَافِظًا ۖ وَهُوَ أَرْحَمُ الرَّاحِمِينَ',
    reference: 'Yusuf 12:64',
  },
  {
    id: 'q10',
    textKey: 'quote.rewardNotLost',
    source: 'Quran 11:115',
    type: 'quran',
    category: 'motivation',
    arabic: 'وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ',
    reference: 'Hud 11:115',
  },
  {
    id: 'q11',
    textKey: 'quote.goodLife',
    source: 'Quran 16:97',
    type: 'quran',
    category: 'motivation',
    arabic: 'مَنْ عَمِلَ صَالِحًا مِّن ذَكَرٍ أَوْ أُنثَىٰ وَهُوَ مُؤْمِنٌ فَلَنُحْيِيَنَّهُ حَيَاةً طَيِّبَةً',
    reference: 'An-Nahl 16:97',
  },
  {
    id: 'q12',
    textKey: 'quote.striveGuided',
    source: 'Quran 29:69',
    type: 'quran',
    category: 'motivation',
    arabic: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
    reference: 'Al-Ankabut 29:69',
  },
  {
    id: 'q13',
    textKey: 'quote.thenStandUp',
    source: 'Quran 94:7',
    type: 'quran',
    category: 'productivity',
    arabic: 'فَإِذَا فَرَغْتَ فَانصَبْ',
    reference: 'Ash-Sharh 94:7',
  },
  {
    id: 'q14',
    textKey: 'quote.doNotDespair',
    source: 'Quran 39:53',
    type: 'quran',
    category: 'guidance',
    arabic: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    reference: 'Az-Zumar 39:53',
  },
  {
    id: 'q15',
    textKey: 'quote.gratitudeIncrease',
    source: 'Quran 14:7',
    type: 'quran',
    category: 'gratitude',
    arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    reference: 'Ibrahim 14:7',
  },
  {
    id: 'q16',
    textKey: 'quote.believersSucceed',
    source: 'Quran 23:1-2',
    type: 'quran',
    category: 'reflection',
    arabic: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ',
    reference: 'Al-Mu’minun 23:1-2',
  },
  {
    id: 'q17',
    textKey: 'quote.prayerForRemembrance',
    source: 'Quran 20:14',
    type: 'quran',
    category: 'reflection',
    arabic: 'وَأَقِمِ الصَّلَاةَ لِذِكْرِي',
    reference: 'Ta-Ha 20:14',
  },
  {
    id: 'q18',
    textKey: 'quote.byTime',
    source: 'Quran 103:1-2',
    type: 'quran',
    category: 'productivity',
    arabic: 'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
    reference: 'Al-Asr 103:1-2',
  },
  {
    id: 'q19',
    textKey: 'quote.helpThroughPatience',
    source: 'Quran 2:45',
    type: 'quran',
    category: 'patience',
    arabic: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    reference: 'Al-Baqarah 2:45',
  },
  {
    id: 'q20',
    textKey: 'quote.everLiving',
    source: 'Quran 2:255',
    type: 'quran',
    category: 'reflection',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    reference: 'Al-Baqarah 2:255',
  },
  {
    id: 'h1',
    textKey: 'quote.consistentDeeds',
    source: 'Bukhari & Muslim',
    type: 'hadith',
    category: 'productivity',
    arabic: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    reference: 'Bukhari & Muslim',
  },
  {
    id: 'h2',
    textKey: 'quote.fiveBeforeFive',
    source: 'Al-Hakim',
    type: 'hadith',
    category: 'motivation',
    arabic: 'اغْتَنِمْ خَمْسًا قَبْلَ خَمْسٍ',
    reference: 'Al-Hakim',
  },
  {
    id: 'h3',
    textKey: 'quote.benefitOthers',
    source: 'Daraqutni',
    type: 'hadith',
    category: 'motivation',
    arabic: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
    reference: 'Daraqutni',
  },
  {
    id: 'h4',
    textKey: 'quote.speakGoodOrSilent',
    source: 'Bukhari & Muslim',
    type: 'hadith',
    category: 'reflection',
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    reference: 'Bukhari & Muslim',
  },
  {
    id: 'h5',
    textKey: 'quote.actionsByIntention',
    source: 'Bukhari & Muslim',
    type: 'hadith',
    category: 'reflection',
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
    reference: 'Bukhari & Muslim',
  },
  {
    id: 'h6',
    textKey: 'quote.loveForBrother',
    source: 'Bukhari & Muslim',
    type: 'hadith',
    category: 'reflection',
    arabic: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    reference: 'Bukhari & Muslim',
  },
  {
    id: 'h7',
    textKey: 'quote.strongBeliever',
    source: 'Muslim',
    type: 'hadith',
    category: 'motivation',
    arabic: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ',
    reference: 'Muslim',
  },
  {
    id: 'h8',
    textKey: 'quote.looksAtHearts',
    source: 'Muslim',
    type: 'hadith',
    category: 'reflection',
    arabic: 'إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ',
    reference: 'Muslim',
  },
  {
    id: 'h9',
    textKey: 'quote.strangerTraveler',
    source: 'Bukhari',
    type: 'hadith',
    category: 'reflection',
    arabic: 'كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ',
    reference: 'Bukhari',
  },
  {
    id: 'h10',
    textKey: 'quote.fourQuestions',
    source: 'Tirmidhi',
    type: 'hadith',
    category: 'productivity',
    arabic: 'لاَ تَزُولُ قَدَمَا عَبْدٍ يَوْمَ الْقِيَامَةِ حَتَّى يُسْأَلَ عَنْ عُمُرِهِ',
    reference: 'Tirmidhi',
  },
]

/** Deterministic pick so everyone sees the same quote on the same day. */
export function getDailyInspiration(date = new Date()): DailyInspiration {
  const dayIndex = Math.floor(date.getTime() / 86_400_000)
  return dailyInspirations[dayIndex % dailyInspirations.length]
}

export function getInspirationsByType(type: DailyInspiration['type']) {
  return dailyInspirations.filter((q) => q.type === type)
}
