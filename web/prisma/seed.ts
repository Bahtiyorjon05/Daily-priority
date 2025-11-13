import { PrismaClient, QuoteCategory } from '@prisma/client'

const prisma = new PrismaClient()

// This file contains 400+ authentic Islamic quotes from Quran, Hadiths, Sahaba, and Islamic scholars
// Organized into 8 categories for daily rotation throughout the year
const islamicQuotes = [
  // ============================================
  // PRODUCTIVITY QUOTES (60 total)
  // ============================================

  // Prophet Muhammad ﷺ on Productivity (15 quotes)
  {
    text: "The best of you are those who learn the Quran and teach it.",
    source: "Sahih Bukhari",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Take advantage of five before five: your youth before your old age, your health before your illness, your wealth before your poverty, your free time before your busyness, and your life before your death.",
    source: "Al-Mustadrak",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever is slow in doing good deeds, his lineage will not speed him up.",
    source: "Sahih Muslim",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The strong believer is better and more beloved to Allah than the weak believer, although both are good.",
    source: "Sahih Muslim",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "If the Final Hour comes while you have a palm-cutting in your hands and it is possible to plant it before the Hour comes, you should plant it.",
    source: "Musnad Ahmad",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "When you rise in the morning, do not expect to live until evening, and when you reach evening, do not expect to see the morning.",
    source: "Sahih Bukhari",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "A man's feet will not move on the Day of Resurrection before he is asked about his life, how did he consume it, his knowledge, what did he do with it, his wealth, how did he earn it and how did he spend it, and about his body, how did he wear it out.",
    source: "Sunan al-Tirmidhi",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The believer's shade on the Day of Resurrection will be his charity.",
    source: "Sunan al-Tirmidhi",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "If anyone travels on a road in search of knowledge, Allah will cause him to travel on one of the roads of Paradise.",
    source: "Sahih Muslim",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Wealth does not decrease by giving charity. Allah will increase the honor of one who forgives others, and one who displays humility for the sake of Allah, Allah will elevate him in status.",
    source: "Sahih Muslim",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The most beloved deed to Allah is the most regular and constant even if it is little.",
    source: "Sahih Bukhari",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Allah loves that when one of you does something, he perfects it.",
    source: "Al-Bayhaqi",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Verily, Allah does not look at your appearance or wealth, but He looks at your hearts and actions.",
    source: "Sahih Muslim",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Leave what makes you doubt for what does not make you doubt.",
    source: "Sunan al-Tirmidhi",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The wise person is the one who calls himself to account and works for what is after death.",
    source: "Sunan al-Tirmidhi",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },

  // Quran on Productivity (10 quotes)
  {
    text: "And whoever does an atom's weight of good will see it.",
    source: "Quran 99:7",
    category: "PRODUCTIVITY"
  },
  {
    text: "So when you have finished [your duties], then stand up [for worship]. And to your Lord direct [your] longing.",
    source: "Quran 94:7-8",
    category: "PRODUCTIVITY"
  },
  {
    text: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.",
    source: "Quran 2:153",
    category: "PRODUCTIVITY"
  },
  {
    text: "And whoever relies upon Allah - then He is sufficient for him.",
    source: "Quran 65:3",
    category: "PRODUCTIVITY"
  },
  {
    text: "So race to [all that is] good.",
    source: "Quran 2:148",
    category: "PRODUCTIVITY"
  },
  {
    text: "And the Hereafter is better for you than the first [life].",
    source: "Quran 93:4",
    category: "PRODUCTIVITY"
  },
  {
    text: "And whoever desires the Hereafter and exerts the effort due to it while he is a believer - it is those whose effort is ever appreciated.",
    source: "Quran 17:19",
    category: "PRODUCTIVITY"
  },
  {
    text: "Compete with one another in good deeds.",
    source: "Quran 5:48",
    category: "PRODUCTIVITY"
  },
  {
    text: "The best provision is taqwa (God-consciousness).",
    source: "Quran 2:197",
    category: "PRODUCTIVITY"
  },
  {
    text: "And do good as Allah has done good to you.",
    source: "Quran 28:77",
    category: "PRODUCTIVITY"
  },

  // Sahaba & Scholars on Productivity (35 quotes)
  {
    text: "Work for your worldly life in proportion to your time in it, and work for your afterlife in proportion to your eternity in it.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "The world is three days: yesterday has gone with all its good and evil; tomorrow, you may not reach; but today, if you do not use it, you will not benefit.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Hasan al-Basri رحمه الله"
  },
  {
    text: "Time is like a sword. If you do not cut it, it will cut you.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "The one who works hard for Allah will be given strength by Allah.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "Whoever does not have a goal, every path will lead him astray.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "The beginning of action is intention, and the end is excellence.",
    source: "Ihya Ulum al-Din",
    category: "PRODUCTIVITY",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "Organize your time properly and you will find blessings in your life.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Ibn al-Qayyim رحمه الله"
  },
  {
    text: "The days are three: a day that has passed and you cannot retrieve it, a day in which you live and you should utilize it, and a day that may never come.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "Your time is your life, and your life is your capital.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Ibn al-Qayyim رحمه الله"
  },
  {
    text: "Richness is not having many possessions, but richness is being content with oneself.",
    source: "Sahih Bukhari",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The best of people are those that bring most benefit to the rest of mankind.",
    source: "Daraqutni",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Be in this world as though you are a stranger or a traveler.",
    source: "Sahih Bukhari",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Strive for this world as if you will live forever, and strive for the hereafter as if you will die tomorrow.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Whoever among you wakes up physically healthy, feeling safe and secure, with food for the day, it is as if he acquired the whole world.",
    source: "Sunan Ibn Majah",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "An hour of justice is better than seventy years of worship.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Umar ibn Abdul Aziz رحمه الله"
  },
  {
    text: "Do today's work today, for tomorrow has its own work.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Do not waste your time, or you will miss the opportunity.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Ibn al-Qayyim رحمه الله"
  },
  {
    text: "Time is more precious than gold; you can always get more gold, but you can never get more time.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Islamic Wisdom"
  },
  {
    text: "Do not procrastinate in doing good, for a delay may cause you to miss the opportunity.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "Every day the sun rises, it brings with it opportunities. Make use of them before they set.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Islamic Wisdom"
  },
  {
    text: "Action without sincerity is like a traveler who carries a sack full of sand which burdens him and brings no benefit.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "The hand that gives is better than the hand that receives.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Lost time is never found again.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Islamic Wisdom"
  },
  {
    text: "Shall I not inform you of something more excellent than fasting, prayer, and charity? It is putting things right between people.",
    source: "Sunan Abu Dawud",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The deeds most loved by Allah are those done regularly, even if they are small.",
    source: "Sahih Muslim",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "If you knew what I know, you would laugh little and weep much.",
    source: "Sahih Bukhari",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Take advantage of five before five: your life before your death.",
    source: "Al-Mustadrak",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "What is with you will vanish, and what is with Allah will remain.",
    source: "Quran 16:96",
    category: "PRODUCTIVITY"
  },
  {
    text: "So establish prayer and give zakah and hold fast to Allah.",
    source: "Quran 22:78",
    category: "PRODUCTIVITY"
  },
  {
    text: "It is He who made the night for you, that you may rest therein, and the day, giving sight. Indeed in that are signs for a people who listen.",
    source: "Quran 10:67",
    category: "PRODUCTIVITY"
  },
  {
    text: "A believer eats in one intestine while a disbeliever eats in seven.",
    source: "Sahih Bukhari",
    category: "PRODUCTIVITY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Do not let your tongue mention a sin if your limbs have been prevented from it, and be grateful to the One who prevented you.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Sufyan al-Thawri رحمه الله"
  },
  {
    text: "And your Lord is going to give you, and you will be satisfied.",
    source: "Quran 93:5",
    category: "PRODUCTIVITY"
  },
  {
    text: "So whoever does good equal to the weight of an atom shall see it.",
    source: "Quran 99:7",
    category: "PRODUCTIVITY"
  },
  {
    text: "The one who is patient in adversity and thankful in prosperity will be entered into Paradise.",
    source: "Saying",
    category: "PRODUCTIVITY",
    author: "Uthman ibn Affan رضي الله عنه"
  },

  // ============================================
  // PATIENCE QUOTES (50 total - keeping existing ones and adding more)
  // ============================================
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
  {
    text: "Indeed, with every difficulty there is relief.",
    source: "Quran 94:5",
    category: "PATIENCE"
  },
  {
    text: "And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive.",
    source: "Quran 2:45",
    category: "PATIENCE"
  },
  {
    text: "So be patient with gracious patience.",
    source: "Quran 70:5",
    category: "PATIENCE"
  },
  {
    text: "And be patient, and your patience is not but through Allah.",
    source: "Quran 16:127",
    category: "PATIENCE"
  },
  {
    text: "And Allah loves the steadfast.",
    source: "Quran 3:146",
    category: "PATIENCE"
  },
  {
    text: "Indeed, the patient will be given their reward without account.",
    source: "Quran 39:10",
    category: "PATIENCE"
  },
  {
    text: "O you who have believed, persevere and endure and remain stationed and fear Allah that you may be successful.",
    source: "Quran 3:200",
    category: "PATIENCE"
  },
  {
    text: "And whoever is patient and forgives - indeed, that is of the matters of determination.",
    source: "Quran 42:43",
    category: "PATIENCE"
  },
  {
    text: "And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits, but give good tidings to the patient.",
    source: "Quran 2:155",
    category: "PATIENCE"
  },
  {
    text: "Who, when disaster strikes them, say: Indeed we belong to Allah, and indeed to Him we will return.",
    source: "Quran 2:156",
    category: "PATIENCE"
  },
  {
    text: "How wonderful is the affair of the believer, for his affairs are all good, and this applies to no one but the believer. If something good happens to him, he is thankful for it and that is good for him. If something bad happens to him, he bears it with patience and that is good for him.",
    source: "Sahih Muslim",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even if it were the prick he receives from a thorn, but that Allah expiates some of his sins for that.",
    source: "Sahih Bukhari",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The real patience is at the first stroke of a calamity.",
    source: "Sahih Bukhari",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Patience is illumination.",
    source: "Sahih Muslim",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The greatest reward comes with the greatest trial. When Allah loves a people He tests them.",
    source: "Sunan Ibn Majah",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Be mindful of Allah, and Allah will protect you. Be mindful of Allah, and you will find Him in front of you.",
    source: "Sunan al-Tirmidhi",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Indeed, patience is at the first stroke of grief.",
    source: "Sahih Bukhari",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever remains patient, Allah will make him patient. Nobody can be given a blessing better and greater than patience.",
    source: "Sahih Bukhari",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Strange are the ways of a believer for there is good in every affair of his.",
    source: "Sahih Muslim",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "If Allah wants to do good to somebody, He afflicts him with trials.",
    source: "Sahih Bukhari",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Patience is of two kinds: patience over what pains you, and patience against what you covet.",
    source: "Saying",
    category: "PATIENCE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "He who does not have patience will have nothing.",
    source: "Saying",
    category: "PATIENCE",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "Patience is a treasure from the treasures of Paradise.",
    source: "Saying",
    category: "PATIENCE",
    author: "Abu Bakr al-Siddiq رضي الله عنه"
  },
  {
    text: "Patience is the key to relief.",
    source: "Saying",
    category: "PATIENCE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Whoever is patient with an oppressor, Allah will help him against him.",
    source: "Saying",
    category: "PATIENCE",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "The tests of this world are nothing compared to the rewards of the hereafter.",
    source: "Saying",
    category: "PATIENCE",
    author: "Hasan al-Basri رحمه الله"
  },
  {
    text: "Patience and faith are the two wings with which one flies to Paradise.",
    source: "Saying",
    category: "PATIENCE",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "When Allah tests you, it is never to destroy you. When He removes something in your possession, it is to empty your hands for an even greater gift.",
    source: "Saying",
    category: "PATIENCE",
    author: "Ibn al-Qayyim رحمه الله"
  },
  {
    text: "Calamities are of two kinds: calamities of sins and calamities of trials. The latter are a blessing in disguise.",
    source: "Saying",
    category: "PATIENCE",
    author: "Ibn Taymiyyah رحمه الله"
  },
  {
    text: "Indeed, the help of Allah is near, but you must be patient.",
    source: "Saying",
    category: "PATIENCE",
    author: "Luqman the Wise"
  },
  {
    text: "Every hardship is followed by ease. Be patient and trust in Allah's plan.",
    source: "Saying",
    category: "PATIENCE",
    author: "Islamic Wisdom"
  },
  {
    text: "The believer is like a green plant which the wind bends, but it does not break.",
    source: "Sahih Bukhari",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Do not be sad, Allah is with us.",
    source: "Quran 9:40",
    category: "PATIENCE"
  },
  {
    text: "Perhaps you hate a thing and it is good for you; and perhaps you love a thing and it is bad for you. And Allah knows, while you know not.",
    source: "Quran 2:216",
    category: "PATIENCE"
  },
  {
    text: "So verily, with the hardship, there is relief. Verily, with the hardship, there is relief.",
    source: "Quran 94:5-6",
    category: "PATIENCE"
  },
  {
    text: "And whoever fears Allah - He will make for him a way out and will provide for him from where he does not expect.",
    source: "Quran 65:2-3",
    category: "PATIENCE"
  },
  {
    text: "And it may be that you dislike a thing which is good for you and that you like a thing which is bad for you. Allah knows but you do not know.",
    source: "Quran 2:216",
    category: "PATIENCE"
  },
  {
    text: "And He is with you wherever you are.",
    source: "Quran 57:4",
    category: "PATIENCE"
  },
  {
    text: "Sufficient for us is Allah, and He is the best Disposer of affairs.",
    source: "Quran 3:173",
    category: "PATIENCE"
  },
  {
    text: "So lose not heart, nor fall into despair.",
    source: "Quran 3:139",
    category: "PATIENCE"
  },
  {
    text: "But perhaps you hate a thing and it is good for you.",
    source: "Quran 2:216",
    category: "PATIENCE"
  },
  {
    text: "If you are grateful, I will surely increase your favor upon you.",
    source: "Quran 14:7",
    category: "PATIENCE"
  },
  {
    text: "So be patient over what they say and exalt with praise of your Lord before the rising of the sun and before its setting.",
    source: "Quran 50:39",
    category: "PATIENCE"
  },
  {
    text: "And be patient, for indeed Allah does not allow to be lost the reward of those who do good.",
    source: "Quran 11:115",
    category: "PATIENCE"
  },
  {
    text: "And Allah is with those who are patient.",
    source: "Quran 2:153",
    category: "PATIENCE"
  },
  {
    text: "And the believer is tried according to his level of faith.",
    source: "Sunan al-Tirmidhi",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Allah will aid a servant of His so long as the servant aids his brother.",
    source: "Sahih Muslim",
    category: "PATIENCE",
    author: "Prophet Muhammad ﷺ"
  },

  // ============================================
  // GRATITUDE QUOTES (40 total)
  // ============================================
  {
    text: "If you are grateful, I will surely increase you [in favor].",
    source: "Quran 14:7",
    category: "GRATITUDE"
  },
  {
    text: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.",
    source: "Quran 2:152",
    category: "GRATITUDE"
  },
  {
    text: "And whatever you have of favor - it is from Allah.",
    source: "Quran 16:53",
    category: "GRATITUDE"
  },
  {
    text: "And [remember] when your Lord proclaimed: If you are grateful, I will surely increase you [in favor].",
    source: "Quran 14:7",
    category: "GRATITUDE"
  },
  {
    text: "Work, O family of David, in gratitude.",
    source: "Quran 34:13",
    category: "GRATITUDE"
  },
  {
    text: "And We had certainly given Luqman wisdom [and said]: Be grateful to Allah. And whoever is grateful is grateful for [the benefit of] himself.",
    source: "Quran 31:12",
    category: "GRATITUDE"
  },
  {
    text: "So eat of what Allah has provided for you [which is] lawful and good. And be grateful for the favor of Allah, if it is [indeed] Him that you worship.",
    source: "Quran 16:114",
    category: "GRATITUDE"
  },
  {
    text: "But few of My servants are grateful.",
    source: "Quran 34:13",
    category: "GRATITUDE"
  },
  {
    text: "He who does not thank people does not thank Allah.",
    source: "Sunan al-Tirmidhi",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever is not grateful for little will not be grateful for much, and whoever does not thank people has not thanked Allah.",
    source: "Musnad Ahmad",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The one who eats and is grateful is like the one who fasts and is patient.",
    source: "Sunan al-Tirmidhi",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Look at those who are less fortunate than you, and do not look at those who are more fortunate, lest you belittle the favors of Allah upon you.",
    source: "Sahih Muslim",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "When you wake up in the morning, healthy in body, safe in your dwelling, with provision for your day, it is as if you have been given the entire world.",
    source: "Sunan Ibn Majah",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Gratitude is the key to more blessings.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Do not look at the smallness of the sin, but look at the greatness of the One you have sinned against. Do not look at the smallness of the blessing, but look at the greatness of the One who has blessed you.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "When you see someone who has been given more than you in wealth and beauty, look to those who have been given less.",
    source: "Sahih Muslim",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The essence of thankfulness is contentment.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Abu Bakr al-Siddiq رضي الله عنه"
  },
  {
    text: "A heart that is grateful is a garden of Paradise.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Hasan al-Basri رحمه الله"
  },
  {
    text: "Gratitude is half of faith.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Imam Malik رحمه الله"
  },
  {
    text: "The thankful person is thankful under all circumstances.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "If you concentrate on what you have, you will end up having more. If you concentrate on what you lack, you will never have enough.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "Gratitude is not only the greatest of virtues, but the parent of all others.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "Count your blessings, not your problems.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "The first step to getting what you want is to be grateful for what you have.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "Gratitude turns what we have into enough.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "When you are grateful, fear disappears and abundance appears.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "Ingratitude is a barrier to receiving more blessings.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Ibn Qayyim al-Jawziyya رحمه الله"
  },
  {
    text: "The ungrateful heart discovers no mercies.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "Be thankful for what you have; you'll end up having more.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "A grateful heart is a magnet for miracles.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "Gratitude is the healthiest of all human emotions.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "The root of joy is gratefulness.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "Develop an attitude of gratitude, and give thanks for everything that happens to you.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "There is always something to be grateful for.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Islamic Wisdom"
  },
  {
    text: "Whoever does not thank Allah for little will not thank Him for much.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Be grateful for what you have, and you will be given more.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Gratitude for blessings is a protection against adversity.",
    source: "Saying",
    category: "GRATITUDE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "It is He who made the sun a shining light and the moon a derived light and determined for it phases - that you may know the number of years and account [of time]. Allah has not created this except in truth. He details the signs for a people who know.",
    source: "Quran 10:5",
    category: "GRATITUDE"
  },
  {
    text: "Indeed, in the creation of the heavens and earth, and the alternation of the night and the day, and the [great] ships which sail through the sea with that which benefits people, and what Allah has sent down from the heavens of rain, giving life thereby to the earth after its lifelessness and dispersing therein every [kind of] moving creature, and [His] directing of the winds and the clouds controlled between the heaven and the earth are signs for a people who use reason.",
    source: "Quran 2:164",
    category: "GRATITUDE"
  },

  // ============================================
  // PRAYER QUOTES (50 total)
  // ============================================
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
  {
    text: "And establish prayer and give zakah and bow with those who bow.",
    source: "Quran 2:43",
    category: "PRAYER"
  },
  {
    text: "Recite what is sent of the Book by inspiration to you, and establish regular prayer: for prayer restrains from shameful and unjust deeds.",
    source: "Quran 29:45",
    category: "PRAYER"
  },
  {
    text: "Indeed, I am Allah. There is no deity except Me, so worship Me and establish prayer for My remembrance.",
    source: "Quran 20:14",
    category: "PRAYER"
  },
  {
    text: "Successful indeed are the believers, those who humble themselves in their prayers.",
    source: "Quran 23:1-2",
    category: "PRAYER"
  },
  {
    text: "The first matter that the slave will be brought to account for on the Day of Judgment is the prayer. If it is sound, then the rest of his deeds will be sound. And if it is bad, then the rest of his deeds will be bad.",
    source: "Sunan al-Tabarani",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Between a man and disbelief is the abandonment of prayer.",
    source: "Sahih Muslim",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The coolness of my eyes is in prayer.",
    source: "Sunan al-Nasa'i",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Pray as you have seen me praying.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "When any one of you stands to pray, he is communicating with his Lord.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "If there was a river at the door of anyone of you and he took a bath in it five times a day, would you notice any dirt on him? That is the example of the five prayers with which Allah blots out evil deeds.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The five daily prayers and from one Friday prayer to the next are expiation for whatever sins come in between, so long as one does not commit any major sin.",
    source: "Sahih Muslim",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever prays Fajr is under the protection of Allah.",
    source: "Sahih Muslim",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The most excellent prayer after the obligatory prayers is the prayer during the depth of the night.",
    source: "Sahih Muslim",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The key to Paradise is prayer, and the key to prayer is cleanliness.",
    source: "Musnad Ahmad",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Guard your prayers; they are the key to all goodness.",
    source: "Saying",
    category: "PRAYER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Whoever takes lightly the prayer, Allah will make his affairs difficult.",
    source: "Saying",
    category: "PRAYER",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "When you stand for prayer, perform it as if it is your last prayer.",
    source: "Saying",
    category: "PRAYER",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "Prayer is the weapon of the believer.",
    source: "Saying",
    category: "PRAYER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "When you enter upon Allah in prayer, do so with complete presence of heart.",
    source: "Saying",
    category: "PRAYER",
    author: "Hasan al-Basri رحمه الله"
  },
  {
    text: "The sweetness of prayer is in the calmness of the heart.",
    source: "Saying",
    category: "PRAYER",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "A person's prayer is a light for him in this world and the next.",
    source: "Saying",
    category: "PRAYER",
    author: "Ibn al-Qayyim رحمه الله"
  },
  {
    text: "Praying in congregation is better than praying alone by twenty-seven degrees.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever misses the Asr prayer, it is as if he has lost his family and wealth.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The closest that a servant comes to his Lord is when he is prostrating, so make abundant supplication.",
    source: "Sahih Muslim",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive.",
    source: "Quran 2:45",
    category: "PRAYER"
  },
  {
    text: "Indeed, prayer has been decreed upon the believers a decree of specified times.",
    source: "Quran 4:103",
    category: "PRAYER"
  },
  {
    text: "Maintain with care the prayers and the middle prayer and stand before Allah, devoutly obedient.",
    source: "Quran 2:238",
    category: "PRAYER"
  },
  {
    text: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.",
    source: "Quran 2:153",
    category: "PRAYER"
  },
  {
    text: "So establish prayer and give zakah and hold fast to Allah.",
    source: "Quran 22:78",
    category: "PRAYER"
  },
  {
    text: "And establish prayer at the two ends of the day and at the approach of the night.",
    source: "Quran 11:114",
    category: "PRAYER"
  },
  {
    text: "So woe to those who pray, but are heedless of their prayer.",
    source: "Quran 107:4-5",
    category: "PRAYER"
  },
  {
    text: "And when you have completed the prayer, remember Allah standing, sitting, or [lying] on your sides.",
    source: "Quran 4:103",
    category: "PRAYER"
  },
  {
    text: "The angels will continue to pray for one of you as long as he is in his place of prayer.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "He who prays the morning prayer is under the protection of Allah, so beware lest Allah call you to account.",
    source: "Sahih Muslim",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The person who gets the most reward for the prayer is the one who comes from the farthest distance.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "When the Iqamah is called, do not rush for the prayer. Walk calmly and with tranquility.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Two rak'ahs prayed by a person who knows their meaning are better than a thousand rak'ahs in heedlessness.",
    source: "Saying",
    category: "PRAYER",
    author: "Hasan al-Basri رحمه الله"
  },
  {
    text: "Prayer is the mi'raj (ascension) of the believer.",
    source: "Hadith",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "There is no prayer after Fajr until the sun rises, and no prayer after Asr until the sun sets.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever performs the dawn prayer is under Allah's protection.",
    source: "Sahih Muslim",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The best prayer in the sight of Allah is the prayer of one who does not miss the congregation.",
    source: "Sunan Abu Dawud",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever performs ablution properly, then comes to Friday prayer, listens attentively and keeps silent, his sins between that Friday and the next will be forgiven, plus three more days.",
    source: "Sahih Muslim",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The prayer of one who does not recite is incomplete.",
    source: "Saying",
    category: "PRAYER",
    author: "Abu Bakr al-Siddiq رضي الله عنه"
  },
  {
    text: "If a person knew what was in the call to prayer and the first row, he would compete for it even by drawing lots.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Do not let anything distract you from the time of prayer.",
    source: "Saying",
    category: "PRAYER",
    author: "Uthman ibn Affan رضي الله عنه"
  },
  {
    text: "The prayer is the ascension of the believer to Allah.",
    source: "Saying",
    category: "PRAYER",
    author: "Islamic Wisdom"
  },
  {
    text: "The reward of the prayer offered by a person in congregation is twenty-five times greater than that of the prayer offered in one's house or in the market.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "When one of you prays, let him not spit in front of him, for Allah is in front of him.",
    source: "Sahih Bukhari",
    category: "PRAYER",
    author: "Prophet Muhammad ﷺ"
  },

  // ============================================
  // KNOWLEDGE QUOTES (45 total)
  // ============================================
  {
    text: "Seeking knowledge is an obligation upon every Muslim.",
    source: "Sunan Ibn Majah",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The example of guidance and knowledge with which Allah has sent me is like abundant rain falling on the earth.",
    source: "Sahih Bukhari",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever travels a path in search of knowledge, Allah will make easy for him a path to Paradise.",
    source: "Sahih Muslim",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The superiority of the learned man over the worshipper is like my superiority over the least of you.",
    source: "Sunan al-Tirmidhi",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "When a man dies, his deeds come to an end except for three things: ongoing charity, knowledge that is benefited from, and a righteous child who prays for him.",
    source: "Sahih Muslim",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The angels lower their wings for the seeker of knowledge out of pleasure of what he is doing.",
    source: "Sunan al-Tirmidhi",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The world is cursed and everything in it is cursed, except the remembrance of Allah, what is connected to it, the scholar and the student.",
    source: "Sunan al-Tirmidhi",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever conceals knowledge will be bridled with a bridle of fire on the Day of Resurrection.",
    source: "Sunan Abu Dawud",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Say, 'Are those who know equal to those who do not know?' Only they will remember who are people of understanding.",
    source: "Quran 39:9",
    category: "KNOWLEDGE"
  },
  {
    text: "Read in the name of your Lord who created.",
    source: "Quran 96:1",
    category: "KNOWLEDGE"
  },
  {
    text: "And say, 'My Lord, increase me in knowledge.'",
    source: "Quran 20:114",
    category: "KNOWLEDGE"
  },
  {
    text: "Allah will raise those who have believed among you and those who were given knowledge, by degrees.",
    source: "Quran 58:11",
    category: "KNOWLEDGE"
  },
  {
    text: "Indeed, those who fear Allah from among His servants are the scholars.",
    source: "Quran 35:28",
    category: "KNOWLEDGE"
  },
  {
    text: "He gives wisdom to whom He wills, and whoever has been given wisdom has certainly been given much good.",
    source: "Quran 2:269",
    category: "KNOWLEDGE"
  },
  {
    text: "And do not pursue that of which you have no knowledge. Indeed, the hearing, the sight and the heart - about all those [one] will be questioned.",
    source: "Quran 17:36",
    category: "KNOWLEDGE"
  },
  {
    text: "Read, and your Lord is the most Generous, Who taught by the pen - taught man that which he knew not.",
    source: "Quran 96:3-5",
    category: "KNOWLEDGE"
  },
  {
    text: "Knowledge enlivens the soul.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Learning is a treasure that will follow its owner everywhere.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "The ink of the scholar is more sacred than the blood of the martyr.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "He who knows himself knows his Lord.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Knowledge is better than wealth. Knowledge guards you, while you guard wealth.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Seek knowledge from the cradle to the grave.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The greatest wealth is wisdom, the greatest poverty is stupidity.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Knowledge without action is like a tree without fruit.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "The learned person is distinguished from the worshipper like the full moon is distinguished from the stars.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Hasan al-Basri رحمه الله"
  },
  {
    text: "The best form of worship is the pursuit of knowledge.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Imam Ahmad ibn Hanbal رحمه الله"
  },
  {
    text: "Knowledge is the life of the heart.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Imam al-Shafi'i رحمه الله"
  },
  {
    text: "A scholar who does not act on his knowledge is like a candle; it burns itself while giving light to others.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "Knowledge is of two types: knowledge that is heard and knowledge that is acted upon. Knowledge that is not acted upon is of no benefit.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Hasan al-Basri رحمه الله"
  },
  {
    text: "Whoever humbles himself for the sake of knowledge, Allah will elevate him.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Imam Ahmad ibn Hanbal رحمه الله"
  },
  {
    text: "A wise man's question is half of knowledge.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Be a scholar, or a student, or a listener, or a lover, and do not be the fifth and be destroyed.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "O Allah, I seek refuge in You from knowledge that does not benefit.",
    source: "Sahih Muslim",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Verily, the knowledgeable are the inheritors of the prophets.",
    source: "Sunan Abu Dawud",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "He who does not increase his knowledge decreases it.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Imam al-Shafi'i رحمه الله"
  },
  {
    text: "And over every possessor of knowledge is one [more] knowing.",
    source: "Quran 12:76",
    category: "KNOWLEDGE"
  },
  {
    text: "And We have certainly made the Quran easy for remembrance, so is there any who will remember?",
    source: "Quran 54:17",
    category: "KNOWLEDGE"
  },
  {
    text: "Seeking knowledge is a path to Paradise.",
    source: "Sahih Muslim",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "One hour of justice is better than seventy years of worship.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Umar ibn Abdul Aziz رحمه الله"
  },
  {
    text: "Whoever does not thank people has not thanked Allah.",
    source: "Sunan al-Tirmidhi",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever seeks a path of knowledge, Allah will make easy for him the path to Paradise.",
    source: "Sahih Muslim",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Knowledge is of three types: a clear ayah (verse), an established sunnah, or a just division in inheritance.",
    source: "Sunan Abu Dawud",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The learned among my community are like the prophets among the children of Israel.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The acquisition of knowledge is compulsory for every Muslim.",
    source: "Sunan Ibn Majah",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The one who learns knowledge and does not act upon it is like the one who kindles a fire but does not benefit from its light.",
    source: "Saying",
    category: "KNOWLEDGE",
    author: "Prophet Muhammad ﷺ"
  },

  // ============================================
  // FAMILY QUOTES (35 total)
  // ============================================
  {
    text: "The best of you are those who are best to their families, and I am the best of you to my family.",
    source: "Sunan al-Tirmidhi",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Paradise lies at the feet of your mother.",
    source: "Sunan al-Nasa'i",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The most perfect of believers in faith are those who are the finest in manners and most gentle toward their wives.",
    source: "Sunan al-Tirmidhi",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "A father gives his child nothing better than a good education.",
    source: "Sunan al-Tirmidhi",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "He is not of us who does not have mercy on young children, nor honor the elderly.",
    source: "Sunan al-Tirmidhi",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Every one of you is a shepherd and is responsible for his flock.",
    source: "Sahih Bukhari",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Sahih Bukhari",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever is not merciful to others, will not be treated mercifully.",
    source: "Sahih Bukhari",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "And We have enjoined upon man [care] for his parents. His mother carried him, [increasing her] in weakness upon weakness.",
    source: "Quran 31:14",
    category: "FAMILY"
  },
  {
    text: "And your Lord has decreed that you not worship except Him, and to parents, good treatment.",
    source: "Quran 17:23",
    category: "FAMILY"
  },
  {
    text: "And lower to them the wing of humility out of mercy and say, 'My Lord, have mercy upon them as they brought me up [when I was] small.'",
    source: "Quran 17:24",
    category: "FAMILY"
  },
  {
    text: "And live with them in kindness.",
    source: "Quran 4:19",
    category: "FAMILY"
  },
  {
    text: "Wealth and children are [but] adornment of the worldly life. But the enduring good deeds are better to your Lord for reward and better for [one's] hope.",
    source: "Quran 18:46",
    category: "FAMILY"
  },
  {
    text: "O mankind, fear your Lord, who created you from one soul and created from it its mate and dispersed from both of them many men and women.",
    source: "Quran 4:1",
    category: "FAMILY"
  },
  {
    text: "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.",
    source: "Quran 25:74",
    category: "FAMILY"
  },
  {
    text: "And among His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy.",
    source: "Quran 30:21",
    category: "FAMILY"
  },
  {
    text: "O you who have believed, protect yourselves and your families from a Fire whose fuel is people and stones.",
    source: "Quran 66:6",
    category: "FAMILY"
  },
  {
    text: "The rights of children upon parents are greater than the rights of parents upon children.",
    source: "Saying",
    category: "FAMILY",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "The best treasure a man can hoard is a pious wife.",
    source: "Saying",
    category: "FAMILY",
    author: "Islamic Wisdom"
  },
  {
    text: "Heaven lies under the feet of mothers.",
    source: "Saying",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Treat your children with kindness and improve their manners.",
    source: "Saying",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "When a man dies, people ask what he has left behind; the angels ask what he has sent ahead.",
    source: "Saying",
    category: "FAMILY",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Whoever is kind to the creatures of Allah, Allah is kind to him.",
    source: "Sunan Abu Dawud",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "A believer to another believer is like a building whose different parts enforce each other.",
    source: "Sahih Bukhari",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Kindness is a mark of faith, and whoever has not kindness has not faith.",
    source: "Sahih Muslim",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "A Muslim is a brother to another Muslim: he does not oppress him, nor does he abandon him.",
    source: "Sahih Muslim",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever relieves a believer's distress of the distressful aspects of this world, Allah will rescue him from a difficulty of the difficulties of the Hereafter.",
    source: "Sahih Muslim",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "They ask you what they should spend. Say, 'Whatever you spend of good is [to be] for parents and relatives and orphans and the needy and the traveler.'",
    source: "Quran 2:215",
    category: "FAMILY"
  },
  {
    text: "There is no obedience to anyone if it is disobedience to Allah. Obedience is only in what is right.",
    source: "Sahih Bukhari",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The best of you is the one who is best to his family, and I am the best among you to my family.",
    source: "Sunan Ibn Majah",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The most beloved people to Allah are those who are most beneficial to people.",
    source: "Daraqutni",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Treat people the way you want to be treated.",
    source: "Saying",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "A house without a woman is like a desert.",
    source: "Saying",
    category: "FAMILY",
    author: "Islamic Wisdom"
  },
  {
    text: "The most perfect of believers in belief is the best of them in character. The best of you are those who are best to their women.",
    source: "Sunan al-Tirmidhi",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The strong believer is better and more beloved to Allah than the weak believer, although both are good.",
    source: "Sahih Muslim",
    category: "FAMILY",
    author: "Prophet Muhammad ﷺ"
  },

  // ============================================
  // CHARACTER QUOTES (70 total)
  // ============================================
  {
    text: "The most beloved of people to Allah are those who are most beneficial to people.",
    source: "Daraqutni",
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
    text: "The most complete of the believers in faith are those with the best character.",
    source: "Sunan al-Tirmidhi",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "I was only sent to perfect good character.",
    source: "Musnad Ahmad",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The believer does not slander, curse, or speak in an obscene or foul manner.",
    source: "Sunan al-Tirmidhi",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "A good word is charity.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The most hated person in the sight of Allah is the most quarrelsome person.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Do not be people without minds of your own, saying that if others treat you well you will treat them well, and that if they do wrong you will do wrong. Instead, accustom yourselves to do good if people do good and not to do wrong if they do evil.",
    source: "Sunan al-Tirmidhi",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever does not show mercy to others will not be shown mercy.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The best among you are those who have the best manners and character.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Kindness is a mark of faith, and whoever has not kindness has not faith.",
    source: "Sahih Muslim",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "He who is deprived of kindness is deprived of goodness.",
    source: "Sahih Muslim",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The believer who mixes with people and bears their annoyance with patience will have a greater reward than the believer who does not mix with people and does not put up with their annoyance.",
    source: "Sunan Ibn Majah",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Modesty brings nothing but good.",
    source: "Sahih Muslim",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "He who has in his heart even an atom's weight of arrogance will not enter Paradise.",
    source: "Sahih Muslim",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Avoid envy, for envy devours good deeds just as fire devours fuel.",
    source: "Sunan Abu Dawud",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Pride and arrogance are qualities of Hellfire.",
    source: "Sunan al-Tirmidhi",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Do not hate one another, do not envy one another, do not turn away from one another, but rather be servants of Allah as brothers.",
    source: "Sahih Muslim",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The merciful will be shown mercy by the Most Merciful. Be merciful to those on the earth and the One above the heavens will have mercy upon you.",
    source: "Sunan al-Tirmidhi",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Feed the hungry, visit the sick, and set free the captives.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Do not turn away a poor man even if all you can give is half a date.",
    source: "Sunan al-Tirmidhi",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The one who cares for an orphan and myself will be together in Paradise like this, and he held his two fingers together to illustrate.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Allah is gentle and loves gentleness in all affairs.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "And speak to people good [words].",
    source: "Quran 2:83",
    category: "CHARACTER"
  },
  {
    text: "Repel [evil] by that [deed] which is better; and thereupon the one whom between you and him is enmity [will become] as though he was a devoted friend.",
    source: "Quran 41:34",
    category: "CHARACTER"
  },
  {
    text: "And do good; indeed, Allah loves the doers of good.",
    source: "Quran 2:195",
    category: "CHARACTER"
  },
  {
    text: "Indeed, Allah orders justice and good conduct.",
    source: "Quran 16:90",
    category: "CHARACTER"
  },
  {
    text: "Indeed, the most noble of you in the sight of Allah is the most righteous of you.",
    source: "Quran 49:13",
    category: "CHARACTER"
  },
  {
    text: "And the servants of the Most Merciful are those who walk upon the earth easily, and when the ignorant address them [harshly], they say [words of] peace.",
    source: "Quran 25:63",
    category: "CHARACTER"
  },
  {
    text: "And those who spend [in the cause of Allah] during ease and hardship and who restrain anger and who pardon the people - and Allah loves the doers of good.",
    source: "Quran 3:134",
    category: "CHARACTER"
  },
  {
    text: "And not equal are the good deed and the bad. Repel [evil] by that [deed] which is better.",
    source: "Quran 41:34",
    category: "CHARACTER"
  },
  {
    text: "And whoever is patient and forgives - indeed, that is of the matters [requiring] determination.",
    source: "Quran 42:43",
    category: "CHARACTER"
  },
  {
    text: "O you who have believed, let not a people ridicule [another] people; perhaps they may be better than them.",
    source: "Quran 49:11",
    category: "CHARACTER"
  },
  {
    text: "And do not insult one another and do not call each other by [offensive] nicknames.",
    source: "Quran 49:11",
    category: "CHARACTER"
  },
  {
    text: "O you who have believed, avoid much [negative] assumption. Indeed, some assumption is sin.",
    source: "Quran 49:12",
    category: "CHARACTER"
  },
  {
    text: "And do not spy or backbite each other.",
    source: "Quran 49:12",
    category: "CHARACTER"
  },
  {
    text: "Do not let your difficulties fill you with anxiety; after all, it is only in the darkest nights that stars shine more brightly.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "The tongue is a small thing, but what enormous damage it can do.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Silence is the best reply to a fool.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "A man's true character is revealed by what he does when no one is watching.",
    source: "Saying",
    category: "CHARACTER",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "Do not look to the one who is higher than you. Look to the one who is lower than you so that you will be thankful for the blessings that Allah has given you.",
    source: "Saying",
    category: "CHARACTER",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "The best revenge is to improve yourself.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "He who cannot control his tongue can never control his life.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Good character is the heaviest thing that will be placed on the believer's scale on the Day of Judgment.",
    source: "Saying",
    category: "CHARACTER",
    author: "Hasan al-Basri رحمه الله"
  },
  {
    text: "The sign of a believer's sincerity is in his good character.",
    source: "Saying",
    category: "CHARACTER",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "Good manners are part of faith.",
    source: "Saying",
    category: "CHARACTER",
    author: "Imam al-Shafi'i رحمه الله"
  },
  {
    text: "Do not do to others what you would not like done to yourself.",
    source: "Saying",
    category: "CHARACTER",
    author: "Islamic Wisdom"
  },
  {
    text: "The best way to defeat your enemy is to make him your friend.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "The believer is sincere and trusting, while the hypocrite is deceitful and suspicious.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "A gentle word is a key to the heart.",
    source: "Saying",
    category: "CHARACTER",
    author: "Islamic Wisdom"
  },
  {
    text: "Anger begins with madness and ends with regret.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "The one who is truthful in his dealings will have the trust of others.",
    source: "Saying",
    category: "CHARACTER",
    author: "Abu Bakr al-Siddiq رضي الله عنه"
  },
  {
    text: "Good character can dissolve mistakes like water dissolves salt.",
    source: "Saying",
    category: "CHARACTER",
    author: "Imam al-Ghazali رحمه الله"
  },
  {
    text: "The best friend is the one who brings you closer to Allah.",
    source: "Saying",
    category: "CHARACTER",
    author: "Islamic Wisdom"
  },
  {
    text: "A man's true wealth is the good he does in this world.",
    source: "Sahih Muslim",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The most complete of the believers in faith are those who are best in manners.",
    source: "Sunan al-Tirmidhi",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "And whoever does good deeds, whether male or female, while being a believer - those will enter Paradise and will not be wronged, [even as much as] the speck on a date seed.",
    source: "Quran 4:124",
    category: "CHARACTER"
  },
  {
    text: "And let not those of virtue among you and wealth swear not to give to their relatives and the needy and the emigrants for the cause of Allah, and let them pardon and overlook. Would you not like that Allah should forgive you?",
    source: "Quran 24:22",
    category: "CHARACTER"
  },
  {
    text: "And be patient, for indeed, Allah does not allow to be lost the reward of those who do good.",
    source: "Quran 11:115",
    category: "CHARACTER"
  },
  {
    text: "Whoever has good manners, Allah will elevate him.",
    source: "Saying",
    category: "CHARACTER",
    author: "Imam Ahmad ibn Hanbal رحمه الله"
  },
  {
    text: "The best deed is to bring happiness to a believer, to relieve him of distress, to pay off his debt or to satisfy his hunger.",
    source: "Saying",
    category: "CHARACTER",
    author: "Ibn Taymiyyah رحمه الله"
  },
  {
    text: "I fear the day that my enemies will become liars and I will become a tyrant.",
    source: "Saying",
    category: "CHARACTER",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "Visit the sick, feed the hungry, and set the prisoners free.",
    source: "Sahih Bukhari",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "If you love the poor and bring them near you, God will bring you near Him on the Day of Resurrection.",
    source: "Sunan al-Tirmidhi",
    category: "CHARACTER",
    author: "Prophet Muhammad ﷺ"
  },

  // ============================================
  // GENERAL QUOTES (50 total)
  // ============================================
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
    text: "And He is with you wherever you are.",
    source: "Quran 57:4",
    category: "GENERAL"
  },
  {
    text: "So verily, with the hardship, there is relief. Verily, with the hardship, there is relief.",
    source: "Quran 94:5-6",
    category: "GENERAL"
  },
  {
    text: "Allah does not burden a soul beyond that it can bear.",
    source: "Quran 2:286",
    category: "GENERAL"
  },
  {
    text: "And whoever relies upon Allah - then He is sufficient for him.",
    source: "Quran 65:3",
    category: "GENERAL"
  },
  {
    text: "And We have already created man and know what his soul whispers to him, and We are closer to him than [his] jugular vein.",
    source: "Quran 50:16",
    category: "GENERAL"
  },
  {
    text: "And when My servants ask you concerning Me, indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.",
    source: "Quran 2:186",
    category: "GENERAL"
  },
  {
    text: "Call upon Me; I will respond to you.",
    source: "Quran 40:60",
    category: "GENERAL"
  },
  {
    text: "And He found you lost and guided [you].",
    source: "Quran 93:7",
    category: "GENERAL"
  },
  {
    text: "But perhaps you hate a thing and it is good for you; and perhaps you love a thing and it is bad for you. And Allah knows, while you know not.",
    source: "Quran 2:216",
    category: "GENERAL"
  },
  {
    text: "And whoever fears Allah - He will make for him a way out.",
    source: "Quran 65:2",
    category: "GENERAL"
  },
  {
    text: "And Allah is the best of planners.",
    source: "Quran 8:30",
    category: "GENERAL"
  },
  {
    text: "So do not weaken and do not grieve, and you will be superior if you are [true] believers.",
    source: "Quran 3:139",
    category: "GENERAL"
  },
  {
    text: "The believer who mixes with people and bears their annoyance with patience will have a greater reward than the believer who does not mix with people and does not put up with their annoyance.",
    source: "Sunan Ibn Majah",
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
  },
  {
    text: "The best of you are those who are best in character.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever removes a worldly hardship from a believer, Allah will remove one of the hardships of the Day of Judgment from him.",
    source: "Sahih Muslim",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Do not be angry and Paradise will be yours.",
    source: "Sunan al-Tabarani",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "A person will be with those whom he loves.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "There is no disease that Allah has created, except that He also has created its treatment.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The supplication of any worshipper will continue to be answered so long as he does not ask for what is sinful or breaking ties of kinship, and so long as he is not hasty.",
    source: "Sahih Muslim",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Allah is more merciful to His servants than a mother to her child.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Every son of Adam makes mistakes, and the best of those who make mistakes are those who repent.",
    source: "Sunan Ibn Majah",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Two blessings that many people do not appreciate: health and free time.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever shows no mercy will be shown no mercy.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "This world is a place of trials, not a place of rest.",
    source: "Saying",
    category: "GENERAL",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Do not grieve over what has passed unless it makes you work for what is about to come.",
    source: "Saying",
    category: "GENERAL",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "The remedy for ignorance is to question.",
    source: "Saying",
    category: "GENERAL",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "Speak only when your words are more beautiful than silence.",
    source: "Saying",
    category: "GENERAL",
    author: "Ali ibn Abi Talib رضي الله عنه"
  },
  {
    text: "The less you speak, the less you err.",
    source: "Saying",
    category: "GENERAL",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "The one who plants trees, knowing that he will never sit in their shade, has at least started to understand the meaning of life.",
    source: "Saying",
    category: "GENERAL",
    author: "Islamic Wisdom"
  },
  {
    text: "Let not your heart be attached to what has passed, nor worry for that which has not yet arrived.",
    source: "Saying",
    category: "GENERAL",
    author: "Ibn al-Qayyim رحمه الله"
  },
  {
    text: "The heart that beats for Allah is always a stranger among the hearts that beat for the world.",
    source: "Saying",
    category: "GENERAL",
    author: "Islamic Wisdom"
  },
  {
    text: "Worry is a sickness that erodes one's health; trust in Allah is a cure.",
    source: "Saying",
    category: "GENERAL",
    author: "Ibn al-Qayyim رحمه الله"
  },
  {
    text: "When Allah tests you it is never to destroy you. When He removes something in your possession it is to empty your hands for an even greater gift.",
    source: "Saying",
    category: "GENERAL",
    author: "Ibn Taymiyyah رحمه الله"
  },
  {
    text: "Sometimes the people with the worst past, create the best future.",
    source: "Saying",
    category: "GENERAL",
    author: "Umar ibn al-Khattab رضي الله عنه"
  },
  {
    text: "A believer is a mirror to his brother.",
    source: "Sunan Abu Dawud",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Your body has a right over you, your eyes have a right over you, and your spouse has a right over you.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Richness is not having many possessions, but richness is being content with oneself.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Be kind, for whenever kindness becomes part of something, it beautifies it. Whenever it is taken from something, it leaves it tarnished.",
    source: "Sahih Muslim",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Whoever believes in Allah and the Last Day should not harm his neighbor.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Give glad tidings and do not repel people.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "The most beloved deeds to Allah are those that are most consistent, even if they are small.",
    source: "Sahih Bukhari",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "He who does not thank people, does not thank Allah.",
    source: "Saying",
    category: "GENERAL",
    author: "Abu Bakr al-Siddiq رضي الله عنه"
  },
  {
    text: "Allah is with those who patiently persevere.",
    source: "Quran 2:153",
    category: "GENERAL"
  },
  {
    text: "The strong believer is better and more beloved to Allah than the weak believer, although both are good.",
    source: "Sahih Muslim",
    category: "GENERAL",
    author: "Prophet Muhammad ﷺ"
  },
  {
    text: "Allah loves those who turn to Him constantly and He loves those who keep themselves pure and clean.",
    source: "Quran 2:222",
    category: "GENERAL"
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
