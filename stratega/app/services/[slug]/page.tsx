import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'
import Link from 'next/link'

async function getService(slug: string) {
  return await prisma.service.findUnique({
    where: { slug, isActive: true }
  })
}

export const dynamic = 'force-dynamic'

export default async function ServicePage({ params }: { params: { slug: string } }) {
  const service = await getService(params.slug)

  if (!service) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        {' / '}
        <Link href="/services" className="hover:text-primary">Services</Link>
        {' / '}
        <span className="text-foreground">{service.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Service Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{service.name}</h1>
          
          {service.description && (
            <p className="text-muted-foreground mb-6 text-lg">{service.description}</p>
          )}

          {service.duration && (
            <p className="mb-2">
              <span className="font-semibold">Duration:</span> {service.duration}
            </p>
          )}

          {service.geography && (
            <p className="mb-2">
              <span className="font-semibold">Geography:</span> {service.geography}
            </p>
          )}

          {service.category && (
            <p className="mb-6">
              <span className="font-semibold">Category:</span> {service.category}
            </p>
          )}

          {/* Request Consultation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Order Consultation / Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm serviceId={service.id} />
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="space-y-6">
          {service.fullDescription && (
            <Card>
              <CardHeader>
                <CardTitle>Service Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: service.fullDescription }} />
              </CardContent>
            </Card>
          )}

          {service.conditions && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: service.conditions }} />
              </CardContent>
            </Card>
          )}

          {service.faq && (
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: service.faq }} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

