'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[#FCFCFD] backdrop-blur-[12px] supports-[backdrop-filter]:bg-[#FCFCFD]">
      <div className="container mx-auto px-4">
        <div className="flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
            <span className="text-lg font-semibold text-foreground tracking-tight">STRATEGA-LAM</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground">
              Home
            </Link>
            <Link href="/catalog" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground">
              Products
            </Link>
            <Link href="/services" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground">
              Services
            </Link>
            <Link href="/how-we-work" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground">
              How We Work
            </Link>
            <Link href="/about" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground">
              About
            </Link>
            <Link href="/contacts" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground">
              Contacts
            </Link>
          </nav>

          <div className="hidden md:flex items-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">Admin</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-border/50">
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/catalog" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                Products
              </Link>
              <Link href="/services" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                Services
              </Link>
              <Link href="/how-we-work" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                How We Work
              </Link>
              <Link href="/about" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <Link href="/contacts" className="text-sm font-semibold text-foreground/90 px-3 py-2.5 rounded-xl transition-all hover:bg-[rgba(17,24,39,0.06)] hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                Contacts
              </Link>
              <Button asChild variant="ghost" size="sm" className="justify-start">
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

