import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { parseJsonArray } from '@/lib/json-utils'

async function getCategories() {
  try {
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
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

async function getProducts(limit = 12) {
  try {
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
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

type CategoryType = Awaited<ReturnType<typeof getCategories>>[0]
type ProductType = Awaited<ReturnType<typeof getProducts>>[0]

export const dynamic = 'force-dynamic'

export default async function CatalogPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let products: Awaited<ReturnType<typeof getProducts>> = []
  
  try {
    [categories, products] = await Promise.all([
      getCategories(),
      getProducts()
    ])
  } catch (error) {
    console.error('Error in CatalogPage:', error)
    categories = []
    products = []
  }

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mb-16 md:mb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-foreground">Products Catalog</h1>
        <div className="space-y-6 text-base md:text-lg text-foreground leading-relaxed">
          <p className="text-foreground">
            We operate as a trading agent and sourcing partner.
            Our product catalog is a structured showcase of goods supplied by verified manufacturers and distributors across Europe.
          </p>
          
          <div>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">What we offer:</h2>
            <ul className="space-y-2 list-disc list-inside ml-2 text-foreground">
              <li>Industrial equipment and components</li>
              <li>Construction materials</li>
              <li>Consumer and commercial goods</li>
              <li>Custom and made-to-order products</li>
              <li>Bulk and wholesale supplies</li>
            </ul>
          </div>

          <p className="text-foreground">
            All products are available on request. We do not hold stock — we source, negotiate, and deliver based on your requirements.
          </p>

          <div>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">How it works:</h2>
            <ol className="space-y-2 list-decimal list-inside ml-2 text-foreground">
              <li>Choose a product or category</li>
              <li>Send a price request (RFQ)</li>
              <li>We source offers from suppliers</li>
              <li>You receive a commercial proposal</li>
            </ol>
          </div>

          <p className="font-medium text-foreground">
            Fast response. Transparent terms. No hidden margins.
          </p>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-20 md:mb-24">
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-12 text-foreground">Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {categories.map((category: CategoryType) => {
              if (!category) return null
              return (
                <Card key={category.id} className="border-0 bg-card hover:border-border transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name || 'Unnamed Category'}</CardTitle>
                    {category.description && (
                      <CardDescription className="text-base">{category.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-6">
                      Products: {category._count?.products || 0}
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/catalog/category/${category.slug}`}>
                        View Products
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Products */}
      <section>
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-12 text-foreground">Popular Products</h2>
        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.map((product: ProductType) => {
              if (!product) return null
              const images = parseJsonArray<string>(product.images || null)
              return (
              <Card key={product.id} className="border-0 bg-card hover:border-border transition-all overflow-hidden">
                {images.length > 0 ? (
                  <div className="relative h-56 w-full bg-muted/30 overflow-hidden">
                    <Image
                      src={images[0]}
                      alt={product.name || 'Product'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative h-56 w-full bg-muted/30 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"
                      alt={product.name || 'Product'}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{product.name || 'Unnamed Product'}</CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-2 text-base">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {product.price ? (
                    <p className="text-lg font-medium mb-6 text-foreground">
                      {product.price} {product.currency || 'EUR'}
                    </p>
                  ) : (
                    <p className="text-base text-muted-foreground mb-6">
                      Price on request
                    </p>
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/catalog/product/${product.slug}`}>
                      Request Price
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

