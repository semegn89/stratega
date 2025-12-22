import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { parseJsonArray } from '@/lib/json-utils'

async function getCategory(slug: string) {
  try {
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
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
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
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Breadcrumbs */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        {' / '}
        <Link href="/catalog" className="hover:text-primary transition-colors">Catalog</Link>
        {category.parent && (
          <>
            {' / '}
            <Link href={`/catalog/category/${category.parent.slug}`} className="hover:text-primary transition-colors">
              {category.parent.name}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4 text-foreground">{category.name}</h1>
        {category.description && (
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{category.description}</p>
        )}
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <section className="mb-16 md:mb-20">
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-12 text-foreground">Subcategories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {category.children.map((subcategory: CategoryChild) => (
              <Card key={subcategory.id} className="border-0 bg-card hover:border-border transition-all">
                <CardHeader>
                  <CardTitle className="text-lg">{subcategory.name}</CardTitle>
                  {subcategory.description && (
                    <CardDescription className="text-base">{subcategory.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/catalog/category/${subcategory.slug}`}>
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
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-12 text-foreground">Products</h2>
        {category.products && category.products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {category.products.map((product: CategoryProduct) => {
              const images = parseJsonArray<string>(product.images)
              return (
              <Card key={product.id} className="border-0 bg-card hover:border-border transition-all overflow-hidden">
                {images.length > 0 && (
                  <div className="relative h-56 w-full bg-muted/30 overflow-hidden">
                    <Image
                      src={images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{product.name}</CardTitle>
                  {product.description && (
                    <CardDescription className="line-clamp-2 text-base">
                      {product.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {product.price ? (
                    <p className="text-lg font-medium mb-6 text-foreground">
                      {product.price} {product.currency}
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
          <p className="text-muted-foreground">No products in this category yet</p>
        )}
      </section>
    </div>
  )
}

