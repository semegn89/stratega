export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. General Provisions</h2>
          <p>
            This Privacy Policy defines the procedure for processing and protection 
            of personal data of users of the STRATEGA-LAM S.R.L. website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Collection of Personal Data</h2>
          <p>
            We collect the following personal data:
          </p>
          <ul>
            <li>Name and contact information (email, phone)</li>
            <li>Company information</li>
            <li>Data provided in request forms</li>
            <li>Technical data (IP address, cookies)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Use of Data</h2>
          <p>
            Personal data is used for:
          </p>
          <ul>
            <li>Processing requests and inquiries</li>
            <li>Contacting clients</li>
            <li>Improving service quality</li>
            <li>Analytics and statistics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Protection</h2>
          <p>
            We apply modern methods of protecting personal data from unauthorized 
            access, modification, disclosure or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Contacts</h2>
          <p>
            For questions regarding personal data processing, please contact:
          </p>
          <p>
            STRATEGA-LAM S.R.L.<br />
            Jud. Vaslui, Municipiul Vaslui<br />
            Strada Radu Negru, Bl. 274, Scara C, Ap. B14
          </p>
        </section>
      </div>
    </div>
  )
}

