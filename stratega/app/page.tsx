import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Briefcase, FileText, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Clean, Airy */}
      <section className="section bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-[48px] leading-[1.15] tracking-[-0.02em] font-semibold text-foreground">
                Trading Agent
              </h1>
              <p className="text-xl leading-[1.75] text-foreground/90">
                Your reliable partner for sourcing and supply operations across Europe
              </p>
              <div className="pt-4 flex gap-4 flex-wrap">
                <Button asChild size="lg">
                  <Link href="/catalog">Request Price</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/services">Services</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-[18px] overflow-hidden bg-muted/30">
              <Image
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
                alt="Business partnership and trade"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Airy, Clean */}
      <section className="section bg-[#F9FAFB]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-[32px] leading-[1.2] tracking-[-0.015em] font-semibold mb-4 text-foreground">Why Work With Us</h2>
            <p className="text-lg text-foreground/90 leading-[1.75]">
              Verified supplier network. Clear workflow. Fast response.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card>
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

            <Card>
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

            <Card>
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

            <Card>
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
      <section className="section bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-[32px] leading-[1.2] tracking-[-0.015em] font-semibold text-foreground">Ready to Start Cooperation?</h2>
            <p className="text-lg text-foreground/90 leading-[1.75]">
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

