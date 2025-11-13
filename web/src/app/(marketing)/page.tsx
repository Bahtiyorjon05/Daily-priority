'use client'

import { Navbar } from '@/components/marketing/Navbar'
import { Hero } from '@/components/marketing/Hero'
import { Features } from '@/components/marketing/Features'
import { Contact } from '@/components/marketing/Contact'
import { Footer } from '@/components/marketing/Footer'
import { BackToTopButton } from '@/components/marketing/BackToTopButton'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Contact />
      </main>
      <Footer />
      <BackToTopButton />
    </>
  )
}