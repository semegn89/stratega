'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600">STRATEGA-LAM</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/catalog" className="text-sm font-medium transition-colors hover:text-primary">
              Products
            </Link>
            <Link href="/services" className="text-sm font-medium transition-colors hover:text-primary">
              Services
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              About
            </Link>
            <Link href="/contacts" className="text-sm font-medium transition-colors hover:text-primary">
              Contacts
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Admin</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/catalog" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Products
              </Link>
              <Link href="/services" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Services
              </Link>
              <Link href="/about" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <Link href="/contacts" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Contacts
              </Link>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

