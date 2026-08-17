/**
 * The 114 surahs in Uzbek.
 *
 * Kept separate from `surahs.ts` because that file is generated from
 * api.alquran.cloud and would lose hand-written fields the next time it is
 * regenerated. This one is written by hand and stays.
 *
 * Two things were English on an Uzbek screen:
 *
 *  1. The transliteration. The source gives the English convention with the
 *     article attached — "Al-Baqara", "An-Nisaa". Uzbek mushafs drop the article
 *     and use Uzbek orthography: "Baqara", "Niso". Someone reading in Uzbek is
 *     looking for the name they know from their own copy.
 *  2. The meaning. "The Cow" told an Uzbek reader nothing at all.
 *
 * Spellings follow the convention of Shayx Muhammad Sodiq Muhammad Yusuf's
 * "Tafsiri Hilol", which is also the translation this app serves (uz.sodik), so
 * the list and the text agree with each other.
 *
 * Where a surah is named after a person or is a set of letters, the meaning is
 * the name itself rather than an invented gloss — that is what the name means.
 */

export type UzName = {
  /** Uzbek transliteration, no article. */
  uz: string
  /** What the name means, in Uzbek. */
  meaning: string
}

export const SURAH_NAMES_UZ: Readonly<Record<number, UzName>> = {
  1: { uz: 'Fotiha', meaning: 'Ochilish' },
  2: { uz: 'Baqara', meaning: 'Sigir' },
  3: { uz: 'Oli Imron', meaning: 'Imron xonadoni' },
  4: { uz: 'Niso', meaning: 'Ayollar' },
  5: { uz: 'Moida', meaning: 'Dasturxon' },
  6: { uz: "An'om", meaning: 'Chorva mollari' },
  7: { uz: "A'rof", meaning: 'Baland joylar' },
  8: { uz: 'Anfol', meaning: "O'ljalar" },
  9: { uz: 'Tavba', meaning: 'Tavba' },
  10: { uz: 'Yunus', meaning: 'Yunus alayhissalom' },
  11: { uz: 'Hud', meaning: 'Hud alayhissalom' },
  12: { uz: 'Yusuf', meaning: 'Yusuf alayhissalom' },
  13: { uz: "Ra'd", meaning: 'Momaqaldiroq' },
  14: { uz: 'Ibrohim', meaning: 'Ibrohim alayhissalom' },
  15: { uz: 'Hijr', meaning: 'Hijr vodiysi' },
  16: { uz: 'Nahl', meaning: 'Asalari' },
  17: { uz: 'Isro', meaning: 'Tungi sayr' },
  18: { uz: 'Kahf', meaning: "G'or" },
  19: { uz: 'Maryam', meaning: 'Maryam' },
  20: { uz: 'Toha', meaning: 'Toha' },
  21: { uz: 'Anbiyo', meaning: "Payg'ambarlar" },
  22: { uz: 'Haj', meaning: 'Haj' },
  23: { uz: "Mu'minun", meaning: "Mo'minlar" },
  24: { uz: 'Nur', meaning: 'Nur' },
  25: { uz: 'Furqon', meaning: 'Haqni ajratuvchi' },
  26: { uz: 'Shuaro', meaning: 'Shoirlar' },
  27: { uz: 'Naml', meaning: 'Chumoli' },
  28: { uz: 'Qasas', meaning: 'Qissalar' },
  29: { uz: 'Ankabut', meaning: "O'rgimchak" },
  30: { uz: 'Rum', meaning: 'Rumlar' },
  31: { uz: 'Luqmon', meaning: 'Luqmon' },
  32: { uz: 'Sajda', meaning: 'Sajda' },
  33: { uz: 'Ahzob', meaning: 'Lashkarlar' },
  34: { uz: "Saba'", meaning: "Saba' xalqi" },
  35: { uz: 'Fotir', meaning: 'Yaratguvchi' },
  36: { uz: 'Yosin', meaning: 'Yosin' },
  37: { uz: 'Soffot', meaning: 'Saf tortganlar' },
  38: { uz: 'Sod', meaning: 'Sod' },
  39: { uz: 'Zumar', meaning: "To'dalar" },
  40: { uz: "G'ofir", meaning: 'Kechiruvchi' },
  41: { uz: 'Fussilat', meaning: 'Batafsil bayon' },
  42: { uz: 'Shuro', meaning: 'Kengash' },
  43: { uz: 'Zuxruf', meaning: 'Zeb-ziynat' },
  44: { uz: 'Duxon', meaning: 'Tutun' },
  45: { uz: 'Josiya', meaning: "Cho'kkalaganlar" },
  46: { uz: 'Ahqof', meaning: 'Qumtepalar' },
  47: { uz: 'Muhammad', meaning: 'Muhammad sollallohu alayhi vasallam' },
  48: { uz: 'Fath', meaning: "G'alaba" },
  49: { uz: 'Hujurot', meaning: 'Hujralar' },
  50: { uz: 'Qof', meaning: 'Qof' },
  51: { uz: 'Zoriyot', meaning: 'Sovuruvchi shamollar' },
  52: { uz: 'Tur', meaning: "Tur tog'i" },
  53: { uz: 'Najm', meaning: 'Yulduz' },
  54: { uz: 'Qamar', meaning: 'Oy' },
  55: { uz: 'Rahmon', meaning: 'Rahmon' },
  56: { uz: 'Voqia', meaning: 'Buyuk voqea' },
  57: { uz: 'Hadid', meaning: 'Temir' },
  58: { uz: 'Mujodala', meaning: 'Tortishuv' },
  59: { uz: 'Hashr', meaning: "Quvg'in" },
  60: { uz: 'Mumtahana', meaning: 'Sinaladigan ayol' },
  61: { uz: 'Saff', meaning: 'Saf' },
  62: { uz: 'Juma', meaning: 'Juma' },
  63: { uz: 'Munofiqun', meaning: 'Munofiqlar' },
  64: { uz: "Tag'obun", meaning: 'Aldanish kuni' },
  65: { uz: 'Taloq', meaning: 'Taloq' },
  66: { uz: 'Tahrim', meaning: 'Harom qilish' },
  67: { uz: 'Mulk', meaning: 'Podshohlik' },
  68: { uz: 'Qalam', meaning: 'Qalam' },
  69: { uz: 'Haaqqa', meaning: 'Muqarrar voqea' },
  70: { uz: 'Maorij', meaning: "Ko'tarilish yo'llari" },
  71: { uz: 'Nuh', meaning: 'Nuh alayhissalom' },
  72: { uz: 'Jin', meaning: 'Jinlar' },
  73: { uz: 'Muzzammil', meaning: 'Yopinib olgan' },
  74: { uz: 'Muddassir', meaning: 'Kiyinib olgan' },
  75: { uz: 'Qiyoma', meaning: 'Qiyomat' },
  76: { uz: 'Inson', meaning: 'Inson' },
  77: { uz: 'Mursalot', meaning: 'Yuborilganlar' },
  78: { uz: "Naba'", meaning: 'Xabar' },
  79: { uz: "Nazi'ot", meaning: 'Yulib oluvchilar' },
  80: { uz: 'Abasa', meaning: 'Yuzini burdi' },
  81: { uz: 'Takvir', meaning: "O'ralish" },
  82: { uz: 'Infitor', meaning: 'Yorilish' },
  83: { uz: 'Mutaffifin', meaning: "Aldamchi o'lchovchilar" },
  84: { uz: 'Inshiqoq', meaning: "Bo'linish" },
  85: { uz: 'Buruj', meaning: 'Burjlar' },
  86: { uz: 'Toriq', meaning: 'Tungi yulduz' },
  87: { uz: "A'lo", meaning: 'Eng oliy' },
  88: { uz: "G'oshiya", meaning: 'Qoplovchi' },
  89: { uz: 'Fajr', meaning: 'Tong' },
  90: { uz: 'Balad', meaning: 'Shahar' },
  91: { uz: 'Shams', meaning: 'Quyosh' },
  92: { uz: 'Layl', meaning: 'Tun' },
  93: { uz: 'Duho', meaning: 'Choshgoh' },
  94: { uz: 'Sharh', meaning: "Ko'ngil kengligi" },
  95: { uz: 'Tin', meaning: 'Anjir' },
  96: { uz: 'Alaq', meaning: 'Laxta qon' },
  97: { uz: 'Qadr', meaning: 'Qadr' },
  98: { uz: 'Bayyina', meaning: 'Aniq hujjat' },
  99: { uz: 'Zalzala', meaning: 'Zilzila' },
  100: { uz: 'Odiyot', meaning: 'Chopqir otlar' },
  101: { uz: 'Qoria', meaning: 'Dahshatli voqea' },
  102: { uz: 'Takosur', meaning: 'Mol-dunyo talashish' },
  103: { uz: 'Asr', meaning: 'Zamon' },
  104: { uz: 'Humaza', meaning: "G'iybatchi" },
  105: { uz: 'Fil', meaning: 'Fil' },
  106: { uz: 'Quraysh', meaning: 'Quraysh' },
  107: { uz: 'Maun', meaning: 'Yordam berish' },
  108: { uz: 'Kavsar', meaning: 'Kavsar' },
  109: { uz: 'Kofirun', meaning: 'Kofirlar' },
  110: { uz: 'Nasr', meaning: 'Ilohiy nusrat' },
  111: { uz: 'Masad', meaning: 'Xurmo tolasi' },
  112: { uz: 'Ixlos', meaning: "Sof e'tiqod" },
  113: { uz: 'Falaq', meaning: 'Tong yorishi' },
  114: { uz: 'Nos', meaning: 'Odamlar' },
}
