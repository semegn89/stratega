import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GuaranteesPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-8 text-foreground">Guarantees & Returns</h1>

        <div className="space-y-8 text-base md:text-lg text-muted-foreground leading-relaxed mb-12">
          <p>
            We guarantee the quality of products and services provided by our partner suppliers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Quality Guarantees</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base text-muted-foreground leading-relaxed">
                <li>• Working only with verified suppliers</li>
                <li>• All products meet stated specifications</li>
                <li>• Providing necessary documentation</li>
                <li>• Meeting delivery deadlines</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base text-muted-foreground leading-relaxed">
                <li>• Return conditions are agreed individually</li>
                <li>• Returns possible if product doesn&apos;t match description</li>
                <li>• All issues are resolved in working order</li>
                <li>• Details in the supply contract</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

