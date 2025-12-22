import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-8 text-foreground">About STRATEGA-LAM S.R.L.</h1>

            <div className="space-y-8 text-base md:text-lg text-foreground leading-relaxed">
              <p className="text-foreground/90">
                STRATEGA-LAM S.R.L. is a European trading agent operating in B2B supply and commercial mediation.
              </p>
              <p className="text-foreground/90">
                We connect buyers with verified suppliers and manage the commercial process from request to final offer.
              </p>

              <div>
                <h2 className="text-xl md:text-2xl font-medium mb-6 text-foreground">Why work with us:</h2>
                <ul className="space-y-3 list-disc list-inside ml-2 text-foreground/80">
                  <li>Verified supplier network</li>
                  <li>Clear and transparent workflow</li>
                  <li>Fast request processing (up to 24h)</li>
                  <li>Cross-border trade expertise</li>
                  <li>No warehouse bias — only best-fit solutions</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-medium mb-6 text-foreground">Company details:</h2>
                <div className="space-y-2 text-base text-foreground/80">
                  <p className="font-medium text-foreground">STRATEGA-LAM S.R.L.</p>
                  <p><span className="font-medium text-foreground">CUI:</span> 52815066</p>
                  <p><span className="font-medium text-foreground">EUID:</span> ROONRC.J2025083844000</p>
                  <p className="font-medium text-foreground">Registered in Romania</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] lg:h-[500px] rounded-[18px] overflow-hidden bg-muted/30">
            <Image
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop"
              alt="About STRATEGA-LAM"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}

