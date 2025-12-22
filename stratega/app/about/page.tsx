import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">About STRATEGA-LAM S.R.L.</h1>

      <div className="prose max-w-none mb-8">
        <p className="text-lg mb-4">
          STRATEGA-LAM S.R.L. is a European trading agent operating in B2B supply and commercial mediation.
        </p>
        <p className="mb-6">
          We connect buyers with verified suppliers and manage the commercial process from request to final offer.
        </p>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Why work with us:</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Verified supplier network</li>
            <li>Clear and transparent workflow</li>
            <li>Fast request processing (up to 24h)</li>
            <li>Cross-border trade expertise</li>
            <li>No warehouse bias — only best-fit solutions</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Company details:</h2>
          <div className="space-y-2">
            <p><strong>STRATEGA-LAM S.R.L.</strong></p>
            <p><strong>CUI:</strong> 52815066</p>
            <p><strong>EUID:</strong> ROONRC.J2025083844000</p>
            <p><strong>Registered in Romania</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}

