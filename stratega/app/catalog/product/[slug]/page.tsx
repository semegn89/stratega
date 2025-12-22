import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'
import Link from 'next/link'
import { parseJsonArray } from '@/lib/json-utils'

async function getProduct(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        attributes: true
      }
    })

    if (!product) return null

    // Increment views
    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { views: { increment: 1 } }
      })
    } catch (error) {
      console.error('Error incrementing views:', error)
      // Continue even if view increment fails
    }

    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

async function getSimilarProducts(categoryId: string, excludeId: string, limit = 4) {
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        isActive: true,
        id: { not: excludeId }
      },
      take: limit,
      orderBy: { views: 'desc' }
    })
    return products
  } catch (error) {
    console.error('Error fetching similar products:', error)
    return []
  }
}

type ProductWithRelations = NonNullable<Awaited<ReturnType<typeof getProduct>>>
type ProductAttribute = ProductWithRelations['attributes'][0]
type SimilarProduct = Awaited<ReturnType<typeof getSimilarProducts>>[0]

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  const similarProducts = await getSimilarProducts(product.categoryId, product.id)

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Breadcrumbs */}
      <nav className="mb-8 text-sm text-foreground/80">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        {' / '}
        <Link href="/catalog" className="hover:text-primary transition-colors">Catalog</Link>
        {product.category.parent && (
          <>
            {' / '}
            <Link href={`/catalog/category/${product.category.parent.slug}`} className="hover:text-primary transition-colors">
              {product.category.parent.name}
            </Link>
          </>
        )}
        {' / '}
        <Link href={`/catalog/category/${product.category.slug}`} className="hover:text-primary transition-colors">
          {product.category.name}
        </Link>
        {' / '}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 md:gap-16 mb-16">
        {/* Images */}
        <div>
          {(() => {
            const images = parseJsonArray<string>(product.images)
            return images.length > 0 ? (
              <div className="relative h-[500px] w-full bg-muted/30 rounded-lg overflow-hidden">
                <Image
                  src={images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative h-[500px] w-full bg-muted/30 rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop"
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )
          })()}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4 text-foreground">{product.name}</h1>
            
            {product.description && (
              <p className="text-lg text-foreground leading-relaxed">{product.description}</p>
            )}
          </div>

          {product.price ? (
            <p className="text-2xl md:text-3xl font-medium text-foreground">
              {product.price} {product.currency}
            </p>
          ) : (
            <p className="text-xl text-foreground">
              Price on request
            </p>
          )}

          <div className="space-y-2 text-base text-foreground">
            {product.brand && (
              <p>
                <span className="font-medium text-foreground">Manufacturer:</span> {product.brand}
              </p>
            )}

            {product.country && (
              <p>
                <span className="font-medium text-foreground">Country:</span> {product.country}
              </p>
            )}

            {product.sku && (
              <p>
                <span className="font-medium text-foreground">SKU:</span> {product.sku}
              </p>
            )}
          </div>

          {/* Request Quote Form */}
          <Card className="border-0 bg-card mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Request Price / Quote</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm productId={product.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Description */}
      {product.fullDescription && (
        <Card className="mb-12 border-0 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none prose-headings:font-medium prose-p:text-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: product.fullDescription }} />
          </CardContent>
        </Card>
      )}

      {/* Attributes */}
      {product.attributes && product.attributes.length > 0 && (
        <Card className="mb-12 border-0 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody>
                {product.attributes.map((attr: ProductAttribute) => (
                  <tr key={attr.id} className="border-b">
                    <td className="py-2 font-semibold">{attr.name}</td>
                    <td className="py-2">{attr.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section>
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-12 text-foreground">Similar Products</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {similarProducts.map((similar: SimilarProduct) => {
              const similarImages = parseJsonArray<string>(similar.images)
              return (
              <Card key={similar.id} className="border-0 bg-card hover:border-border transition-all overflow-hidden">
                {similarImages.length > 0 ? (
                  <div className="relative h-48 w-full bg-muted/30 overflow-hidden">
                    <Image
                      src={similarImages[0]}
                      alt={similar.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative h-48 w-full bg-muted/30 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"
                      alt={similar.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{similar.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/catalog/product/${similar.slug}`}>
                      Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

