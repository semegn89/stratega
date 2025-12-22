import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

type ProductWithCategory = Awaited<ReturnType<typeof getProducts>>[0]

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Products</h1>
          <p className="text-muted-foreground">
            Manage products
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/products/new">Add Product</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Back</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products List</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: ProductWithCategory) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Link href={`/catalog/product/${product.slug}`} className="text-blue-600 hover:underline">
                          {product.name}
                        </Link>
                      </td>
                      <td className="p-2">{product.category.name}</td>
                      <td className="p-2">
                        {product.price ? `${product.price} ${product.currency}` : 'On request'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-white text-xs ${product.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/products/${product.id}`}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No products added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

