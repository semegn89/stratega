import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Prisma } from '@prisma/client'

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: {
    category: true
  }
}>

async function getProducts(): Promise<ProductWithCategory[]> {
  return await prisma.product.findMany({
    include: {
      category: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Товары</h1>
          <p className="text-muted-foreground">
            Управление товарами
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/products/new">Добавить товар</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список товаров</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Название</th>
                    <th className="text-left p-2">Категория</th>
                    <th className="text-left p-2">Цена</th>
                    <th className="text-left p-2">Статус</th>
                    <th className="text-left p-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Link href={`/catalog/product/${product.slug}`} className="text-blue-600 hover:underline">
                          {product.name}
                        </Link>
                      </td>
                      <td className="p-2">{product.category.name}</td>
                      <td className="p-2">
                        {product.price ? `${product.price} ${product.currency}` : 'По запросу'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-white text-xs ${product.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
                          {product.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/products/${product.id}`}>Редактировать</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Товары пока не добавлены</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

