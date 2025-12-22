import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        _count: {
          select: { products: true, children: true }
        }
      },
      orderBy: { order: 'asc' }
    })
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

type CategoryWithRelations = Awaited<ReturnType<typeof getCategories>>[0]

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/categories/new">Add Category</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Back</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories List</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Parent</th>
                    <th className="text-left p-2">Products</th>
                    <th className="text-left p-2">Subcategories</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category: CategoryWithRelations) => (
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
                          <Link href={`/admin/categories/${category.id}`}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No categories added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

