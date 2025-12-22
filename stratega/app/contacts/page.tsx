import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Contacts</h1>

      <div className="prose max-w-none mb-8">
        <p className="text-lg mb-6">
          Ready to start cooperation or request a price?
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Office address:</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Jud. Vaslui, Municipiul Vaslui<br />
                Strada Radu Negru, Bl. 274, Scara C, Ap. B14
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>How to contact us:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc list-inside">
                <li>Use the request form on the website</li>
                <li>Send a price request or consultation inquiry</li>
              </ul>
              <p className="mt-4 font-semibold">
                We respond within one business day.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Request</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>STRATEGA-LAM S.R.L.</strong></p>
                <p><strong>CUI:</strong> 52815066</p>
                <p><strong>EUID:</strong> ROONRC.J2025083844000</p>
                <p><strong>Registered in Romania</strong></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

