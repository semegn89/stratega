import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GuaranteesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Guarantees & Returns</h1>

      <div className="prose max-w-none mb-8">
        <p className="text-lg mb-4">
          We guarantee the quality of products and services provided by our partner suppliers.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Quality Guarantees</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Working only with verified suppliers</li>
              <li>• All products meet stated specifications</li>
              <li>• Providing necessary documentation</li>
              <li>• Meeting delivery deadlines</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Return conditions are agreed individually</li>
              <li>• Returns possible if product doesn&apos;t match description</li>
              <li>• All issues are resolved in working order</li>
              <li>• Details in the supply contract</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

