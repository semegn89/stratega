import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequestQuoteForm } from '@/components/forms/RequestQuoteForm'

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Contacts</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-muted-foreground">
                    Jud. Vaslui, Municipiul Vaslui<br />
                    Strada Radu Negru, Bl. 274, Scara C, Ap. B14
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Company Details</h3>
                  <p className="text-muted-foreground">
                    CUI: 52815066<br />
                    EUID: ROONRC.J2025083844000
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Form</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestQuoteForm />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>How to Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                To get a commercial proposal or consultation, fill out the contact 
                form, and our manager will contact you within 24 hours.
              </p>
              <p className="mb-4">
                You can also send a price request directly from the product or service card.
              </p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Working Hours:</strong> Mon-Fri, 9:00 - 18:00 (EET)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

