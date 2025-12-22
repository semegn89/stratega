import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Briefcase, FileText, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Clean, Airy */}
      <section className="bg-background py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-foreground">
              Trading Agent
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Your reliable partner for sourcing and supply operations across Europe
            </p>
            <div className="pt-4">
              <Button asChild size="lg">
                <Link href="/catalog">Request Price / Commercial Offer</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Airy, Clean */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">Why Work With Us</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Verified supplier network. Clear workflow. Fast response.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="border-0 bg-card">
              <CardHeader>
                <Package className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
                <CardTitle>Wide Range</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Products from verified suppliers with quality guarantee
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card">
              <CardHeader>
                <Briefcase className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
                <CardTitle>Professional Services</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  End-to-end support for trade and supply operations
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
                <CardTitle>Fast Response</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Request processing within 24 hours. Transparent terms.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card">
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
                <CardTitle>Reliability</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Operating across Europe. We meet deadlines and guarantee quality.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Minimal */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight">Ready to Start Cooperation?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Send a price request or order a consultation right now
            </p>
            <div className="pt-2">
              <Button asChild size="lg">
                <Link href="/catalog">View Catalog</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

