/**
 * The 114 surahs, bundled rather than fetched.
 *
 * This list has not changed in fourteen centuries and never will, so paying a
 * network round trip for it on every visit to the Quran page would be a
 * self-inflicted delay — and one more thing to fail, on the page where someone
 * least wants a spinner.
 *
 * Generated from api.alquran.cloud/v1/surah. The ayah counts validate a saved
 * reading position, so they must match the source the text comes from.
 */

export type Surah = {
  /** 1-114 */
  n: number
  /** Arabic name */
  ar: string
  /** Transliterated name */
  en: string
  /** What the name means */
  meaning: string
  ayahs: number
  place: 'makkah' | 'madinah'
}

/** Pages in the standard Madani mushaf, so progress can be out of a whole. */
export const QURAN_PAGES = 604

export const QURAN_JUZ = 30

export const SURAHS: readonly Surah[] = [
  { n: 1, ar: "سُورَةُ ٱلْفَاتِحَةِ", en: "Al-Faatiha", meaning: "The Opening", ayahs: 7, place: 'makkah' },
  { n: 2, ar: "سُورَةُ البَقَرَةِ", en: "Al-Baqara", meaning: "The Cow", ayahs: 286, place: 'madinah' },
  { n: 3, ar: "سُورَةُ آلِ عِمۡرَانَ", en: "Aal-i-Imraan", meaning: "The Family of Imraan", ayahs: 200, place: 'madinah' },
  { n: 4, ar: "سُورَةُ النِّسَاءِ", en: "An-Nisaa", meaning: "The Women", ayahs: 176, place: 'madinah' },
  { n: 5, ar: "سُورَةُ المَائـِدَةِ", en: "Al-Maaida", meaning: "The Table", ayahs: 120, place: 'madinah' },
  { n: 6, ar: "سُورَةُ الأَنۡعَامِ", en: "Al-An'aam", meaning: "The Cattle", ayahs: 165, place: 'makkah' },
  { n: 7, ar: "سُورَةُ الأَعۡرَافِ", en: "Al-A'raaf", meaning: "The Heights", ayahs: 206, place: 'makkah' },
  { n: 8, ar: "سُورَةُ الأَنفَالِ", en: "Al-Anfaal", meaning: "The Spoils of War", ayahs: 75, place: 'madinah' },
  { n: 9, ar: "سُورَةُ التَّوۡبَةِ", en: "At-Tawba", meaning: "The Repentance", ayahs: 129, place: 'madinah' },
  { n: 10, ar: "سُورَةُ يُونُسَ", en: "Yunus", meaning: "Jonas", ayahs: 109, place: 'makkah' },
  { n: 11, ar: "سُورَةُ هُودٍ", en: "Hud", meaning: "Hud", ayahs: 123, place: 'makkah' },
  { n: 12, ar: "سُورَةُ يُوسُفَ", en: "Yusuf", meaning: "Joseph", ayahs: 111, place: 'makkah' },
  { n: 13, ar: "سُورَةُ الرَّعۡدِ", en: "Ar-Ra'd", meaning: "The Thunder", ayahs: 43, place: 'madinah' },
  { n: 14, ar: "سُورَةُ إِبۡرَاهِيمَ", en: "Ibrahim", meaning: "Abraham", ayahs: 52, place: 'makkah' },
  { n: 15, ar: "سُورَةُ الحِجۡرِ", en: "Al-Hijr", meaning: "The Rock", ayahs: 99, place: 'makkah' },
  { n: 16, ar: "سُورَةُ النَّحۡلِ", en: "An-Nahl", meaning: "The Bee", ayahs: 128, place: 'makkah' },
  { n: 17, ar: "سُورَةُ الإِسۡرَاءِ", en: "Al-Israa", meaning: "The Night Journey", ayahs: 111, place: 'makkah' },
  { n: 18, ar: "سُورَةُ الكَهۡفِ", en: "Al-Kahf", meaning: "The Cave", ayahs: 110, place: 'makkah' },
  { n: 19, ar: "سُورَةُ مَرۡيَمَ", en: "Maryam", meaning: "Mary", ayahs: 98, place: 'makkah' },
  { n: 20, ar: "سُورَةُ طه", en: "Taa-Haa", meaning: "Taa-Haa", ayahs: 135, place: 'makkah' },
  { n: 21, ar: "سُورَةُ الأَنبِيَاءِ", en: "Al-Anbiyaa", meaning: "The Prophets", ayahs: 112, place: 'makkah' },
  { n: 22, ar: "سُورَةُ الحَجِّ", en: "Al-Hajj", meaning: "The Pilgrimage", ayahs: 78, place: 'madinah' },
  { n: 23, ar: "سُورَةُ المُؤۡمِنُونَ", en: "Al-Muminoon", meaning: "The Believers", ayahs: 118, place: 'makkah' },
  { n: 24, ar: "سُورَةُ النُّورِ", en: "An-Noor", meaning: "The Light", ayahs: 64, place: 'madinah' },
  { n: 25, ar: "سُورَةُ الفُرۡقَانِ", en: "Al-Furqaan", meaning: "The Criterion", ayahs: 77, place: 'makkah' },
  { n: 26, ar: "سُورَةُ الشُّعَرَاءِ", en: "Ash-Shu'araa", meaning: "The Poets", ayahs: 227, place: 'makkah' },
  { n: 27, ar: "سُورَةُ النَّمۡلِ", en: "An-Naml", meaning: "The Ant", ayahs: 93, place: 'makkah' },
  { n: 28, ar: "سُورَةُ القَصَصِ", en: "Al-Qasas", meaning: "The Stories", ayahs: 88, place: 'makkah' },
  { n: 29, ar: "سُورَةُ العَنكَبُوتِ", en: "Al-Ankaboot", meaning: "The Spider", ayahs: 69, place: 'makkah' },
  { n: 30, ar: "سُورَةُ الرُّومِ", en: "Ar-Room", meaning: "The Romans", ayahs: 60, place: 'makkah' },
  { n: 31, ar: "سُورَةُ لُقۡمَانَ", en: "Luqman", meaning: "Luqman", ayahs: 34, place: 'makkah' },
  { n: 32, ar: "سُورَةُ السَّجۡدَةِ", en: "As-Sajda", meaning: "The Prostration", ayahs: 30, place: 'makkah' },
  { n: 33, ar: "سُورَةُ الأَحۡزَابِ", en: "Al-Ahzaab", meaning: "The Clans", ayahs: 73, place: 'madinah' },
  { n: 34, ar: "سُورَةُ سَبَإٍ", en: "Saba", meaning: "Sheba", ayahs: 54, place: 'makkah' },
  { n: 35, ar: "سُورَةُ فَاطِرٍ", en: "Faatir", meaning: "The Originator", ayahs: 45, place: 'makkah' },
  { n: 36, ar: "سُورَةُ يسٓ", en: "Yaseen", meaning: "Yaseen", ayahs: 83, place: 'makkah' },
  { n: 37, ar: "سُورَةُ الصَّافَّاتِ", en: "As-Saaffaat", meaning: "Those drawn up in Ranks", ayahs: 182, place: 'makkah' },
  { n: 38, ar: "سُورَةُ صٓ", en: "Saad", meaning: "The letter Saad", ayahs: 88, place: 'makkah' },
  { n: 39, ar: "سُورَةُ الزُّمَرِ", en: "Az-Zumar", meaning: "The Groups", ayahs: 75, place: 'makkah' },
  { n: 40, ar: "سُورَةُ غَافِرٍ", en: "Ghafir", meaning: "The Forgiver", ayahs: 85, place: 'makkah' },
  { n: 41, ar: "سُورَةُ فُصِّلَتۡ", en: "Fussilat", meaning: "Explained in detail", ayahs: 54, place: 'makkah' },
  { n: 42, ar: "سُورَةُ الشُّورَىٰ", en: "Ash-Shura", meaning: "Consultation", ayahs: 53, place: 'makkah' },
  { n: 43, ar: "سُورَةُ الزُّخۡرُفِ", en: "Az-Zukhruf", meaning: "Ornaments of gold", ayahs: 89, place: 'makkah' },
  { n: 44, ar: "سُورَةُ الدُّخَانِ", en: "Ad-Dukhaan", meaning: "The Smoke", ayahs: 59, place: 'makkah' },
  { n: 45, ar: "سُورَةُ الجَاثِيَةِ", en: "Al-Jaathiya", meaning: "Crouching", ayahs: 37, place: 'makkah' },
  { n: 46, ar: "سُورَةُ الأَحۡقَافِ", en: "Al-Ahqaf", meaning: "The Dunes", ayahs: 35, place: 'makkah' },
  { n: 47, ar: "سُورَةُ مُحَمَّدٍ", en: "Muhammad", meaning: "Muhammad", ayahs: 38, place: 'madinah' },
  { n: 48, ar: "سُورَةُ الفَتۡحِ", en: "Al-Fath", meaning: "The Victory", ayahs: 29, place: 'madinah' },
  { n: 49, ar: "سُورَةُ الحُجُرَاتِ", en: "Al-Hujuraat", meaning: "The Inner Apartments", ayahs: 18, place: 'madinah' },
  { n: 50, ar: "سُورَةُ قٓ", en: "Qaaf", meaning: "The letter Qaaf", ayahs: 45, place: 'makkah' },
  { n: 51, ar: "سُورَةُ الذَّارِيَاتِ", en: "Adh-Dhaariyat", meaning: "The Winnowing Winds", ayahs: 60, place: 'makkah' },
  { n: 52, ar: "سُورَةُ الطُّورِ", en: "At-Tur", meaning: "The Mount", ayahs: 49, place: 'makkah' },
  { n: 53, ar: "سُورَةُ النَّجۡمِ", en: "An-Najm", meaning: "The Star", ayahs: 62, place: 'makkah' },
  { n: 54, ar: "سُورَةُ القَمَرِ", en: "Al-Qamar", meaning: "The Moon", ayahs: 55, place: 'makkah' },
  { n: 55, ar: "سُورَةُ الرَّحۡمَٰن", en: "Ar-Rahmaan", meaning: "The Beneficent", ayahs: 78, place: 'madinah' },
  { n: 56, ar: "سُورَةُ الوَاقِعَةِ", en: "Al-Waaqia", meaning: "The Inevitable", ayahs: 96, place: 'makkah' },
  { n: 57, ar: "سُورَةُ الحَدِيدِ", en: "Al-Hadid", meaning: "The Iron", ayahs: 29, place: 'madinah' },
  { n: 58, ar: "سُورَةُ المُجَادلَةِ", en: "Al-Mujaadila", meaning: "The Pleading Woman", ayahs: 22, place: 'madinah' },
  { n: 59, ar: "سُورَةُ الحَشۡرِ", en: "Al-Hashr", meaning: "The Exile", ayahs: 24, place: 'madinah' },
  { n: 60, ar: "سُورَةُ المُمۡتَحنَةِ", en: "Al-Mumtahana", meaning: "She that is to be examined", ayahs: 13, place: 'madinah' },
  { n: 61, ar: "سُورَةُ الصَّفِّ", en: "As-Saff", meaning: "The Ranks", ayahs: 14, place: 'madinah' },
  { n: 62, ar: "سُورَةُ الجُمُعَةِ", en: "Al-Jumu'a", meaning: "Friday", ayahs: 11, place: 'madinah' },
  { n: 63, ar: "سُورَةُ المُنَافِقُونَ", en: "Al-Munaafiqoon", meaning: "The Hypocrites", ayahs: 11, place: 'madinah' },
  { n: 64, ar: "سُورَةُ التَّغَابُنِ", en: "At-Taghaabun", meaning: "Mutual Disillusion", ayahs: 18, place: 'madinah' },
  { n: 65, ar: "سُورَةُ الطَّلَاقِ", en: "At-Talaaq", meaning: "Divorce", ayahs: 12, place: 'madinah' },
  { n: 66, ar: "سُورَةُ التَّحۡرِيمِ", en: "At-Tahrim", meaning: "The Prohibition", ayahs: 12, place: 'madinah' },
  { n: 67, ar: "سُورَةُ المُلۡكِ", en: "Al-Mulk", meaning: "The Sovereignty", ayahs: 30, place: 'makkah' },
  { n: 68, ar: "سُورَةُ القَلَمِ", en: "Al-Qalam", meaning: "The Pen", ayahs: 52, place: 'makkah' },
  { n: 69, ar: "سُورَةُ الحَاقَّةِ", en: "Al-Haaqqa", meaning: "The Reality", ayahs: 52, place: 'makkah' },
  { n: 70, ar: "سُورَةُ المَعَارِجِ", en: "Al-Ma'aarij", meaning: "The Ascending Stairways", ayahs: 44, place: 'makkah' },
  { n: 71, ar: "سُورَةُ نُوحٍ", en: "Nooh", meaning: "Noah", ayahs: 28, place: 'makkah' },
  { n: 72, ar: "سُورَةُ الجِنِّ", en: "Al-Jinn", meaning: "The Jinn", ayahs: 28, place: 'makkah' },
  { n: 73, ar: "سُورَةُ المُزَّمِّلِ", en: "Al-Muzzammil", meaning: "The Enshrouded One", ayahs: 20, place: 'makkah' },
  { n: 74, ar: "سُورَةُ المُدَّثِّرِ", en: "Al-Muddaththir", meaning: "The Cloaked One", ayahs: 56, place: 'makkah' },
  { n: 75, ar: "سُورَةُ القِيَامَةِ", en: "Al-Qiyaama", meaning: "The Resurrection", ayahs: 40, place: 'makkah' },
  { n: 76, ar: "سُورَةُ الإِنسَانِ", en: "Al-Insaan", meaning: "Man", ayahs: 31, place: 'madinah' },
  { n: 77, ar: "سُورَةُ المُرۡسَلَاتِ", en: "Al-Mursalaat", meaning: "The Emissaries", ayahs: 50, place: 'makkah' },
  { n: 78, ar: "سُورَةُ النَّبَإِ", en: "An-Naba", meaning: "The Announcement", ayahs: 40, place: 'makkah' },
  { n: 79, ar: "سُورَةُ النَّازِعَاتِ", en: "An-Naazi'aat", meaning: "Those who drag forth", ayahs: 46, place: 'makkah' },
  { n: 80, ar: "سُورَةُ عَبَسَ", en: "Abasa", meaning: "He frowned", ayahs: 42, place: 'makkah' },
  { n: 81, ar: "سُورَةُ التَّكۡوِيرِ", en: "At-Takwir", meaning: "The Overthrowing", ayahs: 29, place: 'makkah' },
  { n: 82, ar: "سُورَةُ الانفِطَارِ", en: "Al-Infitaar", meaning: "The Cleaving", ayahs: 19, place: 'makkah' },
  { n: 83, ar: "سُورَةُ المُطَفِّفِينَ", en: "Al-Mutaffifin", meaning: "Defrauding", ayahs: 36, place: 'makkah' },
  { n: 84, ar: "سُورَةُ الانشِقَاقِ", en: "Al-Inshiqaaq", meaning: "The Splitting Open", ayahs: 25, place: 'makkah' },
  { n: 85, ar: "سُورَةُ البُرُوجِ", en: "Al-Burooj", meaning: "The Constellations", ayahs: 22, place: 'makkah' },
  { n: 86, ar: "سُورَةُ الطَّارِقِ", en: "At-Taariq", meaning: "The Morning Star", ayahs: 17, place: 'makkah' },
  { n: 87, ar: "سُورَةُ الأَعۡلَىٰ", en: "Al-A'laa", meaning: "The Most High", ayahs: 19, place: 'makkah' },
  { n: 88, ar: "سُورَةُ الغَاشِيَةِ", en: "Al-Ghaashiya", meaning: "The Overwhelming", ayahs: 26, place: 'makkah' },
  { n: 89, ar: "سُورَةُ الفَجۡرِ", en: "Al-Fajr", meaning: "The Dawn", ayahs: 30, place: 'makkah' },
  { n: 90, ar: "سُورَةُ البَلَدِ", en: "Al-Balad", meaning: "The City", ayahs: 20, place: 'makkah' },
  { n: 91, ar: "سُورَةُ الشَّمۡسِ", en: "Ash-Shams", meaning: "The Sun", ayahs: 15, place: 'makkah' },
  { n: 92, ar: "سُورَةُ اللَّيۡلِ", en: "Al-Lail", meaning: "The Night", ayahs: 21, place: 'makkah' },
  { n: 93, ar: "سُورَةُ الضُّحَىٰ", en: "Ad-Dhuhaa", meaning: "The Morning Hours", ayahs: 11, place: 'makkah' },
  { n: 94, ar: "سُورَةُ الشَّرۡحِ", en: "Ash-Sharh", meaning: "The Consolation", ayahs: 8, place: 'makkah' },
  { n: 95, ar: "سُورَةُ التِّينِ", en: "At-Tin", meaning: "The Fig", ayahs: 8, place: 'makkah' },
  { n: 96, ar: "سُورَةُ العَلَقِ", en: "Al-Alaq", meaning: "The Clot", ayahs: 19, place: 'makkah' },
  { n: 97, ar: "سُورَةُ القَدۡرِ", en: "Al-Qadr", meaning: "The Power, Fate", ayahs: 5, place: 'makkah' },
  { n: 98, ar: "سُورَةُ البَيِّنَةِ", en: "Al-Bayyina", meaning: "The Evidence", ayahs: 8, place: 'madinah' },
  { n: 99, ar: "سُورَةُ الزَّلۡزَلَةِ", en: "Az-Zalzala", meaning: "The Earthquake", ayahs: 8, place: 'madinah' },
  { n: 100, ar: "سُورَةُ العَادِيَاتِ", en: "Al-Aadiyaat", meaning: "The Chargers", ayahs: 11, place: 'makkah' },
  { n: 101, ar: "سُورَةُ القَارِعَةِ", en: "Al-Qaari'a", meaning: "The Calamity", ayahs: 11, place: 'makkah' },
  { n: 102, ar: "سُورَةُ التَّكَاثُرِ", en: "At-Takaathur", meaning: "Competition", ayahs: 8, place: 'makkah' },
  { n: 103, ar: "سُورَةُ العَصۡرِ", en: "Al-Asr", meaning: "The Declining Day, Epoch", ayahs: 3, place: 'makkah' },
  { n: 104, ar: "سُورَةُ الهُمَزَةِ", en: "Al-Humaza", meaning: "The Traducer", ayahs: 9, place: 'makkah' },
  { n: 105, ar: "سُورَةُ الفِيلِ", en: "Al-Fil", meaning: "The Elephant", ayahs: 5, place: 'makkah' },
  { n: 106, ar: "سُورَةُ قُرَيۡشٍ", en: "Quraish", meaning: "Quraysh", ayahs: 4, place: 'makkah' },
  { n: 107, ar: "سُورَةُ المَاعُونِ", en: "Al-Maa'un", meaning: "Almsgiving", ayahs: 7, place: 'makkah' },
  { n: 108, ar: "سُورَةُ الكَوۡثَرِ", en: "Al-Kawthar", meaning: "Abundance", ayahs: 3, place: 'makkah' },
  { n: 109, ar: "سُورَةُ الكَافِرُونَ", en: "Al-Kaafiroon", meaning: "The Disbelievers", ayahs: 6, place: 'makkah' },
  { n: 110, ar: "سُورَةُ النَّصۡرِ", en: "An-Nasr", meaning: "Divine Support", ayahs: 3, place: 'madinah' },
  { n: 111, ar: "سُورَةُ المَسَدِ", en: "Al-Masad", meaning: "The Palm Fibre", ayahs: 5, place: 'makkah' },
  { n: 112, ar: "سُورَةُ الإِخۡلَاصِ", en: "Al-Ikhlaas", meaning: "Sincerity", ayahs: 4, place: 'makkah' },
  { n: 113, ar: "سُورَةُ الفَلَقِ", en: "Al-Falaq", meaning: "The Dawn", ayahs: 5, place: 'makkah' },
  { n: 114, ar: "سُورَةُ النَّاسِ", en: "An-Naas", meaning: "Mankind", ayahs: 6, place: 'makkah' },
] as const

export const surahByNumber = (n: number): Surah | undefined =>
  SURAHS.find((s) => s.n === n)
