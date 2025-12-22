import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { Package, Briefcase, FileText, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [productsCount, servicesCount, requestsCount, categoriesCount] = await Promise.all([
    prisma.product.count(),
    prisma.service.count(),
    prisma.request.count(),
    prisma.category.count(),
  ])

  const newRequestsCount = await prisma.request.count({
    where: { status: 'NEW' }
  })

  return {
    productsCount,
    servicesCount,
    requestsCount,
    categoriesCount,
    newRequestsCount,
  }
}

export default async function AdminPage() {
  // TODO: Add authentication check
  // const session = await getServerSession()
  // if (!session || session.user.role !== 'ADMIN') {
  //   redirect('/')
  // }

  const stats = await getStats()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Admin Panel</h1>
        <p className="text-muted-foreground">
          Content and requests management
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servicesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requestsCount}</div>
            {stats.newRequestsCount > 0 && (
              <p className="text-xs text-red-600 mt-1">
                New: {stats.newRequestsCount}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categoriesCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Products Management</CardTitle>
            <CardDescription>Add and edit products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/products">Products</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/categories">Categories</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services Management</CardTitle>
            <CardDescription>Add and edit services</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/services">Services</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>Process requests and inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/requests">Requests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

