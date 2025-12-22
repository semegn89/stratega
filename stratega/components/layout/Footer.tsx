import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8">
          <div className="space-y-4">
            <h3 className="font-medium text-base text-foreground">STRATEGA-LAM S.R.L.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trading Agent. Showcase of products and services.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground">Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/catalog" className="text-muted-foreground hover:text-primary transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-muted-foreground hover:text-primary transition-colors">
                  Contacts
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground">Information</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/delivery" className="text-muted-foreground hover:text-primary transition-colors">
                  Delivery
                </Link>
              </li>
              <li>
                <Link href="/guarantees" className="text-muted-foreground hover:text-primary transition-colors">
                  Guarantees
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground">Contacts</h4>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>Jud. Vaslui, Municipiul Vaslui</p>
              <p>Strada Radu Negru, Bl. 274, Scara C, Ap. B14</p>
              <p>CUI: 52815066</p>
              <p>EUID: ROONRC.J2025083844000</p>
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

