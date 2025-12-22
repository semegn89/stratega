import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Prisma } from '@prisma/client'

type RequestWithRelations = Prisma.RequestGetPayload<{
  include: {
    product: {
      select: { name: true, slug: true }
    }
    service: {
      select: { name: true, slug: true }
    }
    manager: {
      select: { name: true, email: true }
    }
  }
}>

async function getRequests(): Promise<RequestWithRelations[]> {
  return await prisma.request.findMany({
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
}

const statusLabels: Record<string, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  CLARIFICATION: 'Уточнение',
  QUOTE_SENT: 'КП отправлено',
  CLOSED_SUCCESS: 'Закрыта (успех)',
  CLOSED_FAILED: 'Закрыта (неуспех)',
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  CLARIFICATION: 'bg-orange-500',
  QUOTE_SENT: 'bg-green-500',
  CLOSED_SUCCESS: 'bg-green-700',
  CLOSED_FAILED: 'bg-red-500',
}

export default async function RequestsPage() {
  const requests = await getRequests()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Заявки</h1>
          <p className="text-muted-foreground">
            Управление заявками и запросами цен
          </p>
        </div>
        <Button asChild>
          <Link href="/admin">Назад</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список заявок</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Тип</th>
                    <th className="text-left p-2">Клиент</th>
                    <th className="text-left p-2">Контакты</th>
                    <th className="text-left p-2">Товар/Услуга</th>
                    <th className="text-left p-2">Статус</th>
                    <th className="text-left p-2">Дата</th>
                    <th className="text-left p-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm">{request.id.slice(0, 8)}...</td>
                      <td className="p-2">
                        {request.type === 'PRODUCT_RFQ' ? 'Запрос цены' : 'Консультация'}
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
                        {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="p-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/requests/${request.id}`}>Открыть</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Заявок пока нет</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

