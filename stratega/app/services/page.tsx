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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Services</h1>
        <div className="prose max-w-none mb-8">
          <p className="text-lg mb-4">
            STRATEGA-LAM S.R.L. provides end-to-end support for trade and supply operations.
          </p>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">Core services:</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Product sourcing and supplier search</li>
              <li>Price negotiation and offer comparison</li>
              <li>Commercial proposal preparation</li>
              <li>Logistics coordination across Europe</li>
              <li>Customs and documentation support</li>
              <li>Trade consulting and market analysis</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">For whom:</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Businesses looking for reliable suppliers</li>
              <li>Companies entering new markets</li>
              <li>Clients requiring complex or non-standard sourcing</li>
            </ul>
          </div>

          <p className="mb-6">
            We act in your interest and focus on efficiency, deadlines, and risk reduction.
          </p>
        </div>
      </div>

      {services.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: ServiceType) => {
            if (!service) return null
            return (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{service.name || 'Unnamed Service'}</CardTitle>
                  {service.description && (
                    <CardDescription className="line-clamp-3">
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
                    <p className="text-sm text-muted-foreground mb-4">
                      Geography: {service.geography}
                    </p>
                  )}
                  <Button asChild className="w-full">
                    <Link href={`/services/${service.slug}`}>
                      Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">No services added yet</p>
      )}
    </div>
  )
}

