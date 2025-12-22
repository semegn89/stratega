import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getServices() {
  const services = await prisma.service.findMany({
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Services</h1>
          <p className="text-muted-foreground">
            Manage services
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/services/new">Add Service</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Back</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services List</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service: ServiceType) => (
                    <tr key={service.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Link href={`/services/${service.slug}`} className="text-blue-600 hover:underline">
                          {service.name}
                        </Link>
                      </td>
                      <td className="p-2">{service.category || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-white text-xs ${service.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/services/${service.id}`}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No services added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

