import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function CompliancePage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-foreground">Compliance & Legal</h1>
        <p className="text-lg md:text-xl text-foreground leading-relaxed mb-12">
          Stratega-Lam S.R.L. is committed to conducting business in accordance with applicable European laws, ethical standards, and compliance requirements.
        </p>

        <div className="space-y-8">
          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Compliance & Ethics Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Stratega-Lam S.R.L. is committed to conducting business in accordance with applicable European laws, ethical standards, and compliance requirements.
              </p>
              <div>
                <h3 className="font-semibold text-foreground mb-3">We apply internal procedures aimed at:</h3>
                <ul className="space-y-2 list-disc list-inside ml-2 text-foreground">
                  <li>Preventing fraud and misrepresentation</li>
                  <li>Ensuring transparency of counterparties</li>
                  <li>Supporting lawful and documented transactions</li>
                </ul>
              </div>
              <p className="text-foreground leading-relaxed">
                We are open to partner verification, compliance reviews, and reasonable due diligence requests.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Anti-Fraud & Anti-Corruption Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Stratega-Lam S.R.L. maintains a zero-tolerance approach to fraud, corruption, bribery, and unethical business practices.
              </p>
              <div>
                <h3 className="font-semibold text-foreground mb-3">The company does not engage in:</h3>
                <ul className="space-y-2 list-disc list-inside ml-2 text-foreground">
                  <li>Misrepresentation of goods or suppliers</li>
                  <li>Undisclosed commissions or kickbacks</li>
                  <li>Illegal facilitation payments</li>
                </ul>
              </div>
              <p className="text-foreground leading-relaxed">
                Any suspected violation can be reported to:{' '}
                <a href="mailto:compliance@strategalam.com" className="text-primary hover:underline">
                  compliance@strategalam.com
                </a>
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Stratega-Lam S.R.L. processes personal data in accordance with the General Data Protection Regulation (GDPR).
              </p>
              <p className="text-foreground leading-relaxed">
                Personal data is collected solely for business communication and contractual purposes and is not shared with third parties without a legal basis.
              </p>
              <p className="text-foreground leading-relaxed">
                Data subjects may request access, correction, or deletion of their data by contacting:{' '}
                <a href="mailto:privacy@strategalam.com" className="text-primary hover:underline">
                  privacy@strategalam.com
                </a>
              </p>
              <p className="text-sm text-foreground/80 mt-4">
                For the full Privacy Policy, please see our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy page
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Stratega-Lam S.R.L. acts as an intermediary unless otherwise specified in a written agreement.
              </p>
              <p className="text-foreground leading-relaxed">
                All commercial terms, responsibilities, and liabilities are defined on a case-by-case basis through contractual documentation.
              </p>
              <p className="text-foreground leading-relaxed">
                The company does not assume ownership of goods unless explicitly stated.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Compliance Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed mb-4">
                For compliance inquiries, due diligence requests, or reporting concerns:
              </p>
              <p className="text-foreground">
                <strong>Email:</strong>{' '}
                <a href="mailto:compliance@strategalam.com" className="text-primary hover:underline">
                  compliance@strategalam.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

