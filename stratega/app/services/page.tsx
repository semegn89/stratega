import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

async function getServices() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  })
  return services
}

type ServiceType = Awaited<ReturnType<typeof getServices>>[0]

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const services = await getServices()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Services</h1>
        <p className="text-muted-foreground">
          Professional services for your business
        </p>
      </div>

      {services.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: ServiceType) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
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
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No services added yet</p>
      )}
    </div>
  )
}

