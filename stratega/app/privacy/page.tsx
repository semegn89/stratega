export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-12 text-foreground">Privacy Policy</h1>

        <div className="space-y-12 text-base md:text-lg text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">1. General Provisions</h2>
            <p>
              This Privacy Policy defines the procedure for processing and protection 
              of personal data of users of the STRATEGA-LAM S.R.L. website.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">2. Collection of Personal Data</h2>
            <p className="mb-4">
              We collect the following personal data:
            </p>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>Name and contact information (email, phone)</li>
              <li>Company information</li>
              <li>Data provided in request forms</li>
              <li>Technical data (IP address, cookies)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">3. Use of Data</h2>
            <p className="mb-4">
              Personal data is used for:
            </p>
            <ul className="space-y-2 list-disc list-inside ml-2">
              <li>Processing requests and inquiries</li>
              <li>Contacting clients</li>
              <li>Improving service quality</li>
              <li>Analytics and statistics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">4. Data Protection</h2>
            <p>
              We apply modern methods of protecting personal data from unauthorized 
              access, modification, disclosure or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-medium mb-4 text-foreground">5. Contacts</h2>
            <p className="mb-4">
              For questions regarding personal data processing, please contact:
            </p>
            <p className="text-foreground">
              STRATEGA-LAM S.R.L.<br />
              Jud. Vaslui, Municipiul Vaslui<br />
              Strada Radu Negru, Bl. 274, Scara C, Ap. B14
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

