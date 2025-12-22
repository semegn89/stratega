import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8">
          <div className="space-y-4">
            <h3 className="font-medium text-base text-foreground">STRATEGA-LAM S.R.L.</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              European trade representation and sourcing company.
            </p>
            <div className="text-sm text-foreground/80 space-y-1 leading-relaxed">
              <p>CUI: 52815066</p>
              <p>EUID: ROONRC.J2025083844000</p>
              <p>Registered: Romania, 2025</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground">Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/catalog" className="text-foreground/80 hover:text-primary transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-foreground/80 hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/how-we-work" className="text-foreground/80 hover:text-primary transition-colors">
                  How We Work
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-foreground/80 hover:text-primary transition-colors">
                  Contacts
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground">Legal & Compliance</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/compliance" className="text-foreground/80 hover:text-primary transition-colors">
                  Compliance & Legal
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-foreground/80 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-foreground/80 hover:text-primary transition-colors">
                  Delivery
                </Link>
              </li>
              <li>
                <Link href="/guarantees" className="text-foreground/80 hover:text-primary transition-colors">
                  Guarantees
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground">Contact</h4>
            <div className="text-sm text-foreground/80 space-y-2 leading-relaxed">
              <p>
                <a href="mailto:info@strategalam.com" className="hover:text-primary transition-colors">
                  info@strategalam.com
                </a>
              </p>
              <p>
                <a href="mailto:compliance@strategalam.com" className="hover:text-primary transition-colors">
                  compliance@strategalam.com
                </a>
              </p>
              <p className="pt-2">Business Hours:<br />Mon–Fri, 09:00–17:00 (CET)</p>
              <p className="pt-2">Legal Address:<br />Jud. Vaslui, Municipiul Vaslui<br />Strada Radu Negru, Bl. 274, Scara C, Ap. B14</p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} STRATEGA-LAM S.R.L. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

