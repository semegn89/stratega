import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'
import Link from 'next/link'

async function getProduct(slug: string) {
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
  await prisma.product.update({
    where: { id: product.id },
    data: { views: { increment: 1 } }
  })

  return product
}

async function getSimilarProducts(categoryId: string, excludeId: string, limit = 4) {
  return await prisma.product.findMany({
    where: {
      categoryId,
      isActive: true,
      id: { not: excludeId }
    },
    take: limit,
    orderBy: { views: 'desc' }
  })
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  const similarProducts = await getSimilarProducts(product.categoryId, product.id)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Главная</Link>
        {' / '}
        <Link href="/catalog" className="hover:text-primary">Каталог</Link>
        {product.category.parent && (
          <>
            {' / '}
            <Link href={`/catalog/category/${product.category.parent.slug}`} className="hover:text-primary">
              {product.category.parent.name}
            </Link>
          </>
        )}
        {' / '}
        <Link href={`/catalog/category/${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        {' / '}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          {product.images && product.images.length > 0 ? (
            <div className="relative h-96 w-full bg-gray-100 rounded-lg overflow-hidden mb-4">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-96 w-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Нет изображения</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          {product.description && (
            <p className="text-muted-foreground mb-6">{product.description}</p>
          )}

          {product.price ? (
            <p className="text-3xl font-bold mb-6">
              {product.price} {product.currency}
            </p>
          ) : (
            <p className="text-2xl font-semibold text-muted-foreground mb-6">
              Цена по запросу
            </p>
          )}

          {product.brand && (
            <p className="mb-2">
              <span className="font-semibold">Производитель:</span> {product.brand}
            </p>
          )}

          {product.country && (
            <p className="mb-2">
              <span className="font-semibold">Страна:</span> {product.country}
            </p>
          )}

          {product.sku && (
            <p className="mb-6">
              <span className="font-semibold">Артикул:</span> {product.sku}
            </p>
          )}

          {/* Request Quote Form */}
          <Card>
            <CardHeader>
              <CardTitle>Запросить цену / КП</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm productId={product.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Description */}
      {product.fullDescription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: product.fullDescription }} />
          </CardContent>
        </Card>
      )}

      {/* Attributes */}
      {product.attributes && product.attributes.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Характеристики</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <tbody>
                {product.attributes.map((attr) => (
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
          <h2 className="text-2xl font-semibold mb-6">Похожие товары</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((similar) => (
              <Card key={similar.id} className="hover:shadow-lg transition-shadow">
                {similar.images && similar.images.length > 0 && (
                  <div className="relative h-48 w-full bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={similar.images[0]}
                      alt={similar.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{similar.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/catalog/product/${similar.slug}`}>
                      Подробнее
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

