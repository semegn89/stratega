import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-foreground">About STRATEGA-LAM S.R.L.</h1>
          <div className="mb-12">
            <div className="relative w-full h-[400px] lg:h-[500px] rounded-[18px] overflow-hidden bg-muted/30">
              <Image
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=600&fit=crop"
                alt="About STRATEGA-LAM"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 mb-12">
          <div className="space-y-4 text-base md:text-lg text-foreground leading-relaxed">
            <p className="text-foreground">
              Stratega-Lam S.R.L. is a European trade representation and sourcing company.
              The company operates as an independent intermediary, connecting verified suppliers with business clients and supporting commercial transactions across the supply chain.
            </p>
            <p className="text-foreground">
              Stratega-Lam S.R.L. was established in 2025 and is focused on building transparent, compliant, and long-term B2B partnerships within the European market.
            </p>
          </div>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Legal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-base text-foreground">
                <p className="font-medium text-foreground">Full Legal Name: STRATEGA-LAM S.R.L.</p>
                <p className="text-foreground"><span className="font-medium">Country of Registration:</span> Romania</p>
                <p className="text-foreground"><span className="font-medium">Registration Number (CUI):</span> 52815066</p>
                <p className="text-foreground"><span className="font-medium">EUID:</span> ROONRC.J2025083844000</p>
                <p className="text-foreground"><span className="font-medium">VAT:</span> Pending registration</p>
                <p className="text-foreground"><span className="font-medium">Legal Address:</span> Jud. Vaslui, Municipiul Vaslui, Strada Radu Negru, Bl. 274, Scara C, Ap. B14</p>
                <p className="text-foreground"><span className="font-medium">Jurisdiction:</span> European Union</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Business Model</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                We operate as a commercial intermediary, facilitating B2B transactions between verified suppliers and business clients.
                Our role includes supplier identification, commercial negotiation, transaction coordination, and documentation support.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Why Work With Us</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 list-disc list-inside ml-2 text-foreground">
                <li>Verified supplier network with KYC procedures</li>
                <li>Clear and transparent workflow</li>
                <li>Fast request processing (up to 24h)</li>
                <li>Cross-border trade expertise within EU</li>
                <li>Compliance-focused operations</li>
                <li>Open to partner verification and due diligence</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

