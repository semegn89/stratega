import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DeliveryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Delivery & Payment</h1>

      <div className="prose max-w-none mb-8">
        <p className="text-lg mb-4">
          Delivery and payment terms are agreed individually with each client 
          after receiving the request and clarifying details.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Delivery across Europe</li>
              <li>• Terms and cost are agreed individually</li>
              <li>• Various Incoterms options available</li>
              <li>• Cargo tracking when needed</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Payment terms are specified in the commercial proposal</li>
              <li>• Various payment forms available</li>
              <li>• Working with legal entities and individuals</li>
              <li>• All terms are fixed in the contract</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

