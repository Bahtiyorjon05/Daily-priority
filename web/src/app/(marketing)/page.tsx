'use client'

import { Navbar } from '@/components/marketing/Navbar'
import { Hero } from '@/components/marketing/Hero'
import { Features } from '@/components/marketing/Features'
import { PrayerDayShowcase } from '@/components/marketing/PrayerDayShowcase'
import { Contact } from '@/components/marketing/Contact'
import { Footer } from '@/components/marketing/Footer'
import { BackToTopButton } from '@/components/marketing/BackToTopButton'
import { InstallPrompt, InstallSection } from '@/components/shared/InstallPrompt'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PrayerDayShowcase />
        <InstallSection />
        <Features />
        <Contact />
      </main>
      <Footer />
      <BackToTopButton />
      <InstallPrompt />
    </>
  )
}