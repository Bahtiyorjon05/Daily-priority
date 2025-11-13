// Centralized adhkar data so it can be shared between API routes
export const ADHKAR_LIST = {
  morning: [
    {
      id: 'morning_1',
      arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
      transliteration: "A'udhu billahi minash-shaytanir-rajim",
      translation: 'I seek refuge in Allah from Satan, the accursed.',
      target: 1,
    },
    {
      id: 'morning_2',
      arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      transliteration: "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum",
      translation: 'Allah! There is no deity except Him, the Ever-Living, the Sustainer.',
      target: 1,
    },
    {
      id: 'morning_3',
      arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      transliteration: 'Subhanallahi wa bihamdihi',
      translation: 'Glory is to Allah and praise is to Him.',
      target: 100,
    },
    {
      id: 'morning_4',
      arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
      transliteration: 'Subhanallahi wa bihamdihi, Subhanallahil-Azeem',
      translation: 'Glory is to Allah and praise is to Him, Glory is to Allah the Most Great.',
      target: 10,
    },
  ],
  evening: [
    {
      id: 'evening_1',
      arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
      transliteration: 'Amsayna wa amsal-mulku lillah',
      translation: 'We have entered the evening and the kingdom belongs to Allah.',
      target: 1,
    },
    {
      id: 'evening_2',
      arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ',
      transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'",
      translation: 'In the Name of Allah, who with His Name nothing can cause harm in the earth nor in the heavens.',
      target: 3,
    },
    {
      id: 'evening_3',
      arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      transliteration: 'Subhanallahi wa bihamdihi',
      translation: 'Glory is to Allah and praise is to Him.',
      target: 100,
    },
  ],
  after_prayer: [
    {
      id: 'after_prayer_1',
      arabic: 'سُبْحَانَ اللَّهِ',
      transliteration: 'Subhanallah',
      translation: 'Glory is to Allah.',
      target: 33,
    },
    {
      id: 'after_prayer_2',
      arabic: 'الْحَمْدُ لِلَّهِ',
      transliteration: 'Alhamdulillah',
      translation: 'All praise is to Allah.',
      target: 33,
    },
    {
      id: 'after_prayer_3',
      arabic: 'اللَّهُ أَكْبَرُ',
      transliteration: 'Allahu Akbar',
      translation: 'Allah is the Greatest.',
      target: 34,
    },
    {
      id: 'after_prayer_4',
      arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
      transliteration: 'La ilaha illallahu wahdahu la sharika lah',
      translation: 'There is no deity except Allah alone, with no partner.',
      target: 1,
    },
  ],
  general: [
    {
      id: 'general_1',
      arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
      transliteration: 'La ilaha illallah',
      translation: 'There is no deity except Allah.',
      target: 100,
    },
    {
      id: 'general_2',
      arabic: 'أَسْتَغْفِرُ اللَّهَ',
      transliteration: 'Astaghfirullah',
      translation: 'I seek forgiveness from Allah.',
      target: 100,
    },
    {
      id: 'general_3',
      arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
      transliteration: 'La hawla wa la quwwata illa billah',
      translation: 'There is no power and no strength except with Allah.',
      target: 10,
    },
  ],
}

export type AdhkarCategory = keyof typeof ADHKAR_LIST
