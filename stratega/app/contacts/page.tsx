import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'
import Image from 'next/image'

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mb-16 md:mb-20">
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-foreground">Contacts</h1>
          <p className="text-lg md:text-xl text-foreground leading-relaxed">
            Ready to start cooperation or request a price?
          </p>
        </div>
        <div className="mb-12">
          <div className="relative w-full h-[400px] lg:h-[500px] rounded-[18px] overflow-hidden bg-muted/30">
            <Image
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop"
              alt="Business communication and contact"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
        <div className="space-y-8">
          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Business Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-foreground mb-2">Business Inquiries:</p>
                <p className="text-foreground">
                  <a href="mailto:info@strategalam.com" className="text-primary hover:underline">
                    info@strategalam.com
                  </a>
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Compliance & Legal:</p>
                <p className="text-foreground">
                  <a href="mailto:compliance@strategalam.com" className="text-primary hover:underline">
                    compliance@strategalam.com
                  </a>
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Business Hours:</p>
                <p className="text-foreground">Monday–Friday, 09:00–17:00 (CET)</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Jurisdiction:</p>
                <p className="text-foreground">European Union</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Office Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                Jud. Vaslui, Municipiul Vaslui<br />
                Strada Radu Negru, Bl. 274, Scara C, Ap. B14<br />
                Romania
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Send Request</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-base text-foreground leading-relaxed">
                <p className="font-medium text-foreground">STRATEGA-LAM S.R.L.</p>
                <p className="text-foreground"><span className="font-medium">CUI:</span> 52815066</p>
                <p className="text-foreground"><span className="font-medium">EUID:</span> ROONRC.J2025083844000</p>
                <p className="text-foreground"><span className="font-medium">VAT:</span> Pending registration</p>
                <p className="text-foreground"><span className="font-medium">Registered:</span> Romania, 2025</p>
                <p className="text-foreground"><span className="font-medium">Country of Operation:</span> European Union</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">How to Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 list-disc list-inside text-foreground ml-2">
                <li>Use the request form on this page</li>
                <li>Send a price request or consultation inquiry via email</li>
                <li>For compliance matters, use the dedicated compliance email</li>
              </ul>
              <p className="font-medium text-foreground pt-2">
                We respond within one business day.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

