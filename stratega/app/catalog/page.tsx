import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { parseJsonArray } from '@/lib/json-utils'

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: true,
      _count: {
        select: { products: { where: { isActive: true } } }
      }
    },
    orderBy: { order: 'asc' }
  })
  return categories
}

async function getProducts(limit = 12) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      attributes: true
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  })
  return products
}

type CategoryType = Awaited<ReturnType<typeof getCategories>>[0]
type ProductType = Awaited<ReturnType<typeof getProducts>>[0]

export const dynamic = 'force-dynamic'

export default async function CatalogPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts()
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Products Catalog</h1>
        <div className="prose max-w-none mb-6">
          <p className="text-lg mb-4">
            We operate as a trading agent and sourcing partner.
            Our product catalog is a structured showcase of goods supplied by verified manufacturers and distributors across Europe.
          </p>
          
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">What we offer:</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Industrial equipment and components</li>
              <li>Construction materials</li>
              <li>Consumer and commercial goods</li>
              <li>Custom and made-to-order products</li>
              <li>Bulk and wholesale supplies</li>
            </ul>
          </div>

          <p className="mb-6">
            All products are available on request. We do not hold stock — we source, negotiate, and deliver based on your requirements.
          </p>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">How it works:</h2>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Choose a product or category</li>
              <li>Send a price request (RFQ)</li>
              <li>We source offers from suppliers</li>
              <li>You receive a commercial proposal</li>
            </ol>
          </div>

          <p className="mb-6 font-semibold">
            Fast response. Transparent terms. No hidden margins.
          </p>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: CategoryType) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Products: {category._count.products}
                  </p>
                  <Button asChild>
                    <Link href={`/catalog/category/${category.slug}`}>
                      View Products
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Popular Products</h2>
        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: ProductType) => {
              const images = parseJsonArray<string>(product.images)
              return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                {images.length > 0 && (
                  <div className="relative h-48 w-full bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {product.price ? (
                    <p className="text-xl font-bold mb-4">
                      {product.price} {product.currency}
                    </p>
                  ) : (
                    <p className="text-lg font-semibold text-muted-foreground mb-4">
                      Price on request
                    </p>
                  )}
                  <Button asChild className="w-full">
                    <Link href={`/catalog/product/${product.slug}`}>
                      Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No products added yet</p>
        )}
      </section>
    </div>
  )
}

