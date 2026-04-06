export default function PrivacyPolicy() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: April 6, 2026</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
        <p>
          ZUPLERNO collects the following information when you register: your name, email address,
          class, and subject preferences. We also collect usage data such as lesson plans generated,
          questions asked, and study sessions completed.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide personalised AI tutoring and lesson plans</li>
          <li>To track your learning progress</li>
          <li>To improve our services</li>
          <li>We do not sell your data to third parties</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Data Storage</h2>
        <p>
          Your data is stored securely using Vercel Postgres. We use industry-standard encryption
          and security practices to protect your information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Children&apos;s Privacy</h2>
        <p>
          ZUPLERNO is designed for school students. We do not knowingly collect personal information
          from children under 13 without parental consent. Parents may contact us to request
          deletion of their child&apos;s data.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Cookies</h2>
        <p>
          We use session cookies solely to keep you logged in. We do not use tracking or
          advertising cookies.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:{" "}
          <a href="mailto:support@zuplerno.com" className="text-teal-600 underline">
            support@zuplerno.com
          </a>
        </p>
      </section>
    </main>
  );
}
