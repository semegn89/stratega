import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-foreground">Contacts</h1>
        <p className="text-lg md:text-xl text-foreground leading-relaxed">
          Ready to start cooperation or request a price?
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
        <div className="space-y-8">
          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Office address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Jud. Vaslui, Municipiul Vaslui<br />
                Strada Radu Negru, Bl. 274, Scara C, Ap. B14
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">How to contact us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 list-disc list-inside text-muted-foreground ml-2">
                <li>Use the request form on the website</li>
                <li>Send a price request or consultation inquiry</li>
              </ul>
              <p className="font-medium text-foreground pt-2">
                We respond within one business day.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Send Request</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-base text-foreground leading-relaxed">
                <p className="font-medium text-foreground">STRATEGA-LAM S.R.L.</p>
                <p className="text-foreground"><span className="font-medium">CUI:</span> 52815066</p>
                <p className="text-foreground"><span className="font-medium">EUID:</span> ROONRC.J2025083844000</p>
                <p className="font-medium text-foreground">Registered in Romania</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

