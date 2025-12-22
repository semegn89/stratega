import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function HowWeWorkPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-foreground">How We Work</h1>
        <p className="text-lg md:text-xl text-foreground leading-relaxed mb-12">
          Our operating model is structured to ensure transparency, compliance, and risk control at every stage of the transaction.
        </p>

        <div className="space-y-8 mb-16">
          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Transaction Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Client Inquiry and Requirement Clarification</h3>
                    <p className="text-foreground leading-relaxed">
                      We receive and analyze your request, clarify technical specifications, quantities, delivery requirements, and commercial terms.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Supplier Identification and Initial Verification</h3>
                    <p className="text-foreground leading-relaxed">
                      We identify potential suppliers from our network, perform initial verification (KYC), and assess their capability to meet your requirements.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Commercial Offer and Confirmation of Terms</h3>
                    <p className="text-foreground leading-relaxed">
                      We prepare and present a commercial proposal with pricing, delivery terms, payment conditions, and timeline.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Contractual Alignment and Payment Coordination</h3>
                    <p className="text-foreground leading-relaxed">
                      We facilitate contract negotiation, coordinate payment terms (prepayment, escrow, or letter of credit), and ensure all parties are aligned.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">Delivery, Documentation, and Transaction Closure</h3>
                    <p className="text-foreground leading-relaxed">
                      We coordinate logistics, ensure proper documentation (invoices, certificates, customs), and support the transaction until completion.
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Our Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">
                    We act strictly as a commercial intermediary and do not manufacture goods unless explicitly agreed in writing.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">
                    All commercial terms, responsibilities, and liabilities are defined on a case-by-case basis through contractual documentation.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">
                    We maintain transparency throughout the process and provide regular updates on transaction status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

