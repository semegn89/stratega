import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

async function getServices() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    return services
  } catch (error) {
    console.error('Error fetching services:', error)
    return []
  }
}

type ServiceType = Awaited<ReturnType<typeof getServices>>[0]

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  let services: Awaited<ReturnType<typeof getServices>> = []
  
  try {
    services = await getServices()
  } catch (error) {
    console.error('Error in ServicesPage:', error)
    services = []
  }

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mb-16 md:mb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-foreground">Our Services</h1>
        <div className="space-y-6 text-base md:text-lg text-foreground leading-relaxed">
          <p className="text-foreground/90">
            STRATEGA-LAM S.R.L. provides end-to-end support for trade and supply operations.
          </p>

          <div>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">Core services:</h2>
            <ul className="space-y-2 list-disc list-inside ml-2 text-foreground/80">
              <li>Product sourcing and supplier search</li>
              <li>Price negotiation and offer comparison</li>
              <li>Commercial proposal preparation</li>
              <li>Logistics coordination across Europe</li>
              <li>Customs and documentation support</li>
              <li>Trade consulting and market analysis</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">For whom:</h2>
            <ul className="space-y-2 list-disc list-inside ml-2 text-foreground/80">
              <li>Businesses looking for reliable suppliers</li>
              <li>Companies entering new markets</li>
              <li>Clients requiring complex or non-standard sourcing</li>
            </ul>
          </div>

          <p className="text-foreground/90">
            We act in your interest and focus on efficiency, deadlines, and risk reduction.
          </p>
        </div>
      </div>

      {services.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service: ServiceType) => {
            if (!service) return null
            return (
              <Card key={service.id} className="border-0 bg-card hover:border-border transition-all">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{service.name || 'Unnamed Service'}</CardTitle>
                  {service.description && (
                    <CardDescription className="line-clamp-3 text-base">
                      {service.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {service.duration && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Duration: {service.duration}
                    </p>
                  )}
                  {service.geography && (
                    <p className="text-sm text-muted-foreground mb-6">
                      Geography: {service.geography}
                    </p>
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/services/${service.slug}`}>
                      Request Consultation
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-lg">No services added yet</p>
      )}
    </div>
  )
}

