import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">About Us</h1>

      <div className="prose max-w-none mb-8">
        <p className="text-lg mb-4">
          STRATEGA-LAM S.R.L. is a professional trading agent specializing in 
          providing quality products and services for business.
        </p>
        <p className="mb-4">
          We work as an offer aggregator, helping our clients find 
          optimal solutions and get profitable commercial proposals from verified suppliers.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Our Advantages</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>✓ Wide range of products and services</li>
              <li>✓ Fast request processing (SLA 24 hours)</li>
              <li>✓ Operating across Europe</li>
              <li>✓ Transparent cooperation terms</li>
              <li>✓ Professional support</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> STRATEGA-LAM S.R.L.</p>
              <p><strong>CUI:</strong> 52815066</p>
              <p><strong>EUID:</strong> ROONRC.J2025083844000</p>
              <p><strong>NACE:</strong> 4690 (Comerț cu ridicata nespecializat)</p>
              <p><strong>Address:</strong> Jud. Vaslui, Municipiul Vaslui, Strada Radu Negru, Bl. 274, Scara C, Ap. B14</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

