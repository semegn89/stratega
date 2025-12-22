import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Briefcase, FileText, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Trading Agent — Your Reliable Partner
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Showcase of products and services. Fast price requests and commercial proposals from verified suppliers.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" variant="secondary">
                <Link href="/catalog">Product Catalog</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/services">Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Package className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Wide Range</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Thousands of products from verified suppliers with quality guarantee
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Briefcase className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Professional Services</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Consultations, logistics, customs clearance and much more
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Fast Response</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Request processing within 24 hours. Transparent working conditions
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Reliability</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Operating across Europe. We meet deadlines and guarantee quality
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Cooperation?</h2>
            <p className="text-xl mb-6 text-blue-100">
              Send a price request or order a consultation right now
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/catalog">View Catalog</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

