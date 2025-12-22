import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-8 text-foreground">Delivery & Payment</h1>

        <div className="space-y-8 text-base md:text-lg text-muted-foreground leading-relaxed mb-12">
          <p>
            Delivery and payment terms are agreed individually with each client 
            after receiving the request and clarifying details.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base text-muted-foreground leading-relaxed">
                <li>• Delivery across Europe</li>
                <li>• Terms and cost are agreed individually</li>
                <li>• Various Incoterms options available</li>
                <li>• Cargo tracking when needed</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base text-muted-foreground leading-relaxed">
                <li>• Payment terms are specified in the commercial proposal</li>
                <li>• Various payment forms available</li>
                <li>• Working with legal entities and individuals</li>
                <li>• All terms are fixed in the contract</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

