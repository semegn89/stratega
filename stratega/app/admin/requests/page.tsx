import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

async function getRequests() {
  try {
    const requests = await prisma.request.findMany({
      include: {
        product: {
          select: { name: true, slug: true }
        },
        service: {
          select: { name: true, slug: true }
        },
        manager: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return requests
  } catch (error) {
    console.error('Error fetching requests:', error)
    return []
  }
}

type RequestWithRelations = Awaited<ReturnType<typeof getRequests>>[0]

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  'NEW': 'New',
  'IN_PROGRESS': 'In Progress',
  'CLARIFICATION': 'Clarification',
  'QUOTE_SENT': 'Quote Sent',
  'CLOSED_SUCCESS': 'Closed (Success)',
  'CLOSED_FAILED': 'Closed (Failed)',
}

const statusColors: Record<string, string> = {
  'NEW': 'bg-blue-500',
  'IN_PROGRESS': 'bg-yellow-500',
  'CLARIFICATION': 'bg-orange-500',
  'QUOTE_SENT': 'bg-green-500',
  'CLOSED_SUCCESS': 'bg-green-700',
  'CLOSED_FAILED': 'bg-red-500',
}

export default async function RequestsPage() {
  const requests = await getRequests()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Requests</h1>
          <p className="text-muted-foreground">
            Manage requests and price inquiries
          </p>
        </div>
        <Button asChild>
          <Link href="/admin">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests List</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Client</th>
                    <th className="text-left p-2">Contacts</th>
                    <th className="text-left p-2">Product/Service</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request: RequestWithRelations) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm">{request.id.slice(0, 8)}...</td>
                      <td className="p-2">
                        {request.type === 'PRODUCT_RFQ' ? 'Price Request' : 'Consultation'}
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{request.name}</div>
                          {request.company && (
                            <div className="text-sm text-muted-foreground">{request.company}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div>{request.email}</div>
                          <div>{request.phone}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        {request.product ? (
                          <Link href={`/catalog/product/${request.product.slug}`} className="text-blue-600 hover:underline">
                            {request.product.name}
                          </Link>
                        ) : request.service ? (
                          <Link href={`/services/${request.service.slug}`} className="text-blue-600 hover:underline">
                            {request.service.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-white text-xs ${statusColors[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString('en-US')}
                      </td>
                      <td className="p-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/requests/${request.id}`}>Open</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No requests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

