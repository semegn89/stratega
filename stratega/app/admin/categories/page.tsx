import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Prisma } from '@prisma/client'

type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: {
    parent: true
    _count: {
      select: { products: true, children: true }
    }
  }
}>

async function getCategories(): Promise<CategoryWithRelations[]> {
  return await prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: { products: true, children: true }
      }
    },
    orderBy: { order: 'asc' }
  })
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Категории</h1>
          <p className="text-muted-foreground">
            Управление категориями товаров
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/categories/new">Добавить категорию</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список категорий</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Название</th>
                    <th className="text-left p-2">Родительская</th>
                    <th className="text-left p-2">Товаров</th>
                    <th className="text-left p-2">Подкатегорий</th>
                    <th className="text-left p-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Link href={`/catalog/category/${category.slug}`} className="text-blue-600 hover:underline">
                          {category.name}
                        </Link>
                      </td>
                      <td className="p-2">{category.parent?.name || '-'}</td>
                      <td className="p-2">{category._count.products}</td>
                      <td className="p-2">{category._count.children}</td>
                      <td className="p-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/categories/${category.id}`}>Редактировать</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Категории пока не добавлены</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

