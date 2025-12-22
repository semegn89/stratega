import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { parseJsonArray } from '@/lib/json-utils'

async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: true,
      products: {
        where: { isActive: true },
        include: {
          attributes: true
        }
      }
    }
  })
  return category
}

type CategoryWithRelations = NonNullable<Awaited<ReturnType<typeof getCategory>>>
type CategoryChild = CategoryWithRelations['children'][0]
type CategoryProduct = CategoryWithRelations['products'][0]

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Главная</Link>
        {' / '}
        <Link href="/catalog" className="hover:text-primary">Каталог</Link>
        {category.parent && (
          <>
            {' / '}
            <Link href={`/catalog/category/${category.parent.slug}`} className="hover:text-primary">
              {category.parent.name}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground text-lg">{category.description}</p>
        )}
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Подкатегории</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.children.map((subcategory: CategoryChild) => (
              <Card key={subcategory.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{subcategory.name}</CardTitle>
                  {subcategory.description && (
                    <CardDescription>{subcategory.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href={`/catalog/category/${subcategory.slug}`}>
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
        <h2 className="text-2xl font-semibold mb-6">Товары</h2>
        {category.products && category.products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {category.products.map((product: CategoryProduct) => {
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
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">В этой категории пока нет товаров</p>
        )}
      </section>
    </div>
  )
}

