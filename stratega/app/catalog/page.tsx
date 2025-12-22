import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

async function getCategories() {
  return await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: true,
      _count: {
        select: { products: { where: { isActive: true } } }
      }
    },
    orderBy: { order: 'asc' }
  })
}

async function getProducts(limit = 12) {
  return await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      attributes: true
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  })
}

export default async function CatalogPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts()
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Каталог товаров</h1>
        <p className="text-muted-foreground">
          Выберите категорию или просмотрите популярные товары
        </p>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Категории</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Товаров: {category._count.products}
                  </p>
                  <Button asChild>
                    <Link href={`/catalog/category/${category.slug}`}>
                      Смотреть товары
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
        <h2 className="text-2xl font-semibold mb-6">Популярные товары</h2>
        {products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                {product.images && product.images.length > 0 && (
                  <div className="relative h-48 w-full bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={product.images[0]}
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
                      Цена по запросу
                    </p>
                  )}
                  <Button asChild className="w-full">
                    <Link href={`/catalog/product/${product.slug}`}>
                      Подробнее
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Товары пока не добавлены</p>
        )}
      </section>
    </div>
  )
}

