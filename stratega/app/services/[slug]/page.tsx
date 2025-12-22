import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'
import Link from 'next/link'

async function getService(slug: string) {
  try {
    return await prisma.service.findUnique({
      where: { slug, isActive: true }
    })
  } catch (error) {
    console.error('Error fetching service:', error)
    return null
  }
}

export const dynamic = 'force-dynamic'

export default async function ServicePage({ params }: { params: { slug: string } }) {
  const service = await getService(params.slug)

  if (!service) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Breadcrumbs */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        {' / '}
        <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
        {' / '}
        <span className="text-foreground">{service.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 md:gap-16 mb-16">
        {/* Service Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4 text-foreground">{service.name}</h1>
            
            {service.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{service.description}</p>
            )}
          </div>

          <div className="space-y-2 text-base text-muted-foreground">
            {service.duration && (
              <p>
                <span className="font-medium text-foreground">Duration:</span> {service.duration}
              </p>
            )}

            {service.geography && (
              <p>
                <span className="font-medium text-foreground">Geography:</span> {service.geography}
              </p>
            )}

            {service.category && (
              <p>
                <span className="font-medium text-foreground">Category:</span> {service.category}
              </p>
            )}
          </div>

          {/* Request Consultation Form */}
          <Card className="border-0 bg-card mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Request Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm serviceId={service.id} />
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="space-y-8">
          {service.fullDescription && (
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Service Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none prose-headings:font-medium prose-p:text-muted-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: service.fullDescription }} />
              </CardContent>
            </Card>
          )}

          {service.conditions && (
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none prose-headings:font-medium prose-p:text-muted-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: service.conditions }} />
              </CardContent>
            </Card>
          )}

          {service.faq && (
            <Card className="border-0 bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none prose-headings:font-medium prose-p:text-muted-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: service.faq }} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

