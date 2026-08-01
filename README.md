# Daily Priority - Islamic Productivity App

<div align="center">

![Daily Priority Banner](web/public/islamic-pattern.svg)

**Organize Your Daily Tasks Around Prayer Times**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📖 About

**Daily Priority** is a comprehensive Islamic productivity application that helps Muslims organize their daily tasks around prayer times while maintaining a balance between Dunya (worldly life) and Akhirah (hereafter). Built as **Sadaqah Jariyah** for the Muslim Ummah.

### 🎯 Vision

To provide Muslims worldwide with a productivity tool that seamlessly integrates Islamic principles, helping them stay organized while keeping Allah (SWT) at the center of their daily activities.

### ✨ Key Highlights

- 🕌 **Prayer Times Integration** - Automatic prayer time calculations based on your location
- 📊 **Analytics & Insights** - Track your productivity with beautiful charts
- 📝 **Habit Tracker** - Build positive habits with streak tracking
- 📖 **Daily Journal** - Reflect on your day with gratitude journaling
- 🎯 **Goal Management** - Set and track Dunya & Akhirah goals
- 🌙 **Islamic Calendar** - Hijri date support with Islamic events
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode
- 📱 **Progressive Web App** - Install on mobile devices
- 🆓 **100% Free** - Always free, no premium plans, no ads

---

## 🚀 Features

### Core Features

#### 1. **Task Management**
- ✅ Create, edit, and organize tasks
- 🏷️ Categories and tags support
- ⏰ Due dates and time estimates
- 📋 Subtasks for complex projects
- 🎨 Priority levels (High, Medium, Low)
- ⚡ Energy level indicators
- 🔄 Recurring tasks support
- 🗂️ Eisenhower Matrix view

#### 2. **Prayer Times**
- 🕌 Accurate prayer times based on location
- 📍 Automatic location detection
- 🔔 Prayer notifications
- 🧭 Qibla direction finder
- 🌙 Islamic (Hijri) calendar
- ⏰ Customizable reminders
- 📱 Prayer tracking

#### 4. **Habit Tracking**
- 📅 Daily, weekly, monthly habits
- 🔥 Streak counters
- 📈 Progress visualization
- 🎯 Custom habit goals
- 🏆 Achievement tracking
- 📊 Habit analytics

#### 5. **Analytics & Insights**
- 📊 Task completion charts
- ⏱️ Time tracking analytics
- 🎯 Goal progress tracking
- 📈 Productivity trends
- 🔥 Heatmap calendar
- 📉 Weekly/monthly reports

#### 6. **Journal**
- 📝 Daily reflection entries
- 🙏 Gratitude journal
- 📖 Islamic quotes
- 🌙 Hijri date support
- 🔍 Search and filter
- 📅 Calendar view

#### 7. **Goals Management**
- 🎯 Dunya & Akhirah goals
- 📊 Progress tracking
- 🗓️ Deadline management
- 🎨 Visual progress indicators
- ✅ Milestone tracking
- 📈 Goal analytics

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State**: [Zustand](https://github.com/pmndrs/zustand)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### Backend
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma 6](https://www.prisma.io/)
- **Auth**: [NextAuth.js v4](https://next-auth.js.org/)
- **Email**: [Nodemailer](https://nodemailer.com/)

- **Prayer Times**: [Aladhan API](https://aladhan.com/prayer-times-api) (Free)
- **Icons**: [Lucide React](https://lucide.dev/)

### Developer Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Testing**: Vitest + Testing Library
- **Deployment**: Vercel (recommended)

---

## 📦 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Bahtiyorjon05/Daily-priority.git
cd daily-priority
```

2. **Install dependencies**
```bash
cd web
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/daily_priority"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-characters"
# Use https://daily-priority.vercel.app or your custom domain when deploying
NEXTAUTH_URL="http://localhost:3000"

# Public base URL used in emails/metadata
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
# Support email displayed in the UI (and fallback sender)
NEXT_PUBLIC_SUPPORT_EMAIL="dailypriorityapp@gmail.com"
SUPPORT_EMAIL="dailypriorityapp@gmail.com"

# Email (Optional - for contact form)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="your-email@gmail.com"
```

> ℹ️ When deploying to Vercel, set `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to your live domain (for example `https://daily-priority.vercel.app`) so all emails and SEO metadata link to the correct site.

4. **Set up the database**
```bash
# Push schema to database
npm run db:push

# Seed Islamic quotes
npm run db:seed
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

---

## 📚 Documentation

### Getting Your API Keys

#### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`

### Database Scripts

```bash
# Push schema changes
npm run db:push

# Seed database with Islamic quotes
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Full setup (push + seed)
npm run db:setup
```

### Development Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

---

## 🗂️ Project Structure

```
daily-priority/
├── web/
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── (auth)/           # Auth pages (signin, signup)
│   │   │   ├── (dashboard)/      # Dashboard pages
│   │   │   ├── (marketing)/      # Marketing pages
│   │   │   ├── api/              # API routes
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── globals.css       # Global styles
│   │   │
│   │   ├── components/           # React components
│   │   │   ├── auth/            # Auth components
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   ├── marketing/       # Marketing components
│   │   │   └── ui/              # UI components (shadcn)
│   │   │
│   │   ├── lib/                  # Utility functions
│   │   │   ├── ai.ts            # AI integration
│   │   │   ├── email.ts         # Email utilities
│   │   │   ├── prayer-times.ts  # Prayer times
│   │   │   └── db.ts            # Database client
│   │   │
│   │   └── types/                # TypeScript types
│   │
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts              # Database seeds
│   │
│   ├── public/                   # Static files
│   │   ├── images/              # Image assets
│   │   └── manifest.json        # PWA manifest
│   │
│   └── package.json              # Dependencies
│
├── IMAGE_ASSETS_GUIDE.md         # Image guide
└── README.md                     # This file
```

---

## 🎨 Features in Detail

### Prayer Times Integration

Daily Priority uses the free [Aladhan API](https://aladhan.com/prayer-times-api) to provide accurate prayer times based on your location.

**Features:**
- Automatic geolocation
- Manual location selection
- Multiple calculation methods
- Prayer notifications
- Qibla direction
- Islamic calendar

**Supported Calculation Methods:**
1. University of Islamic Sciences, Karachi
2. Islamic Society of North America (ISNA)
3. Muslim World League (MWL)
4. Umm al-Qura University, Makkah
5. Egyptian General Authority of Survey
6. And more...

### Habit Tracking

Build positive Islamic habits with our habit tracker:

- **Daily Habits**: Quran reading, dhikr, charity
- **Weekly Habits**: Friday prayer, family time
- **Monthly Habits**: Fast sunnah fasts, donate
- **Custom Habits**: Create your own

**Features:**
- Streak counters
- Completion calendar
- Reminder notifications
- Progress analytics
- Motivational quotes

---

## 🤝 Contributing

We welcome contributions from the Muslim community! Daily Priority is built as Sadaqah Jariyah.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Be respectful and constructive
- Follow Islamic principles

### Areas We Need Help

- 🌐 Translations (Arabic, Urdu, Turkish, etc.)
- 🎨 UI/UX improvements
- 🐛 Bug fixes
- 📖 Documentation
- ✨ New features
- 🧪 Testing

---

## 🌍 Roadmap

### Version 1.1 (Q2 2025)
- [ ] Multi-language support (Arabic, Urdu, Turkish)
- [ ] Mobile apps (iOS & Android)
- [ ] Offline mode support
- [ ] Advanced analytics
- [ ] Team collaboration features

### Version 1.2 (Q3 2025)
- [ ] Quran integration
- [ ] Islamic podcast player
- [ ] Community features
- [ ] Islamic events calendar
- [ ] Zakat calculator

### Version 2.0 (Q4 2025)
- [ ] AI-powered Quran tafsir recommendations
- [ ] Islamic learning platform
- [ ] Mentorship system
- [ ] Community challenges
- [ ] Enhanced privacy features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Open Source Projects
- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components

### APIs & Services
- [Aladhan API](https://aladhan.com/) - Free prayer times API
- [Vercel](https://vercel.com/) - Deployment platform

### Islamic Resources
- All praise is due to Allah (SWT)
- Inspired by Islamic productivity principles
- Built for the Muslim Ummah

---

## 📞 Contact & Support

- **Website**: [dailypriority.com](https://dailypriority.com)
- **Email**: contact@dailypriority.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/daily-priority/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/daily-priority/discussions)

---

## 💝 Support This Project

Daily Priority is **100% free** and built as **Sadaqah Jariyah** (ongoing charity).

### How to Support

1. **⭐ Star this repository** - Show your support
2. **🔄 Share** - Tell other Muslims about it
3. **🐛 Report bugs** - Help us improve
4. **💻 Contribute** - Submit PRs
5. **🤲 Make dua** - Pray for the team

### Our Intention

We built Daily Priority for the sake of Allah (SWT), hoping it will benefit Muslims worldwide. We ask Allah to:
- Accept this as Sadaqah Jariyah
- Benefit the Ummah through this project
- Guide us to create more beneficial tools
- Make this a source of continuous reward

**"The best of people are those who are most beneficial to people."** - Prophet Muhammad (ﷺ)

---

## 🌟 Built With Love For The Ummah

<div align="center">

**100% Free • Always Free • For the Sake of Allah**

Made with ❤️ by Muslims for Muslims

![Islamic Pattern](web/public/islamic-pattern.svg)

</div>
