export default function DeleteAccount() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Delete Your Account</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: April 16, 2026</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">How to Request Account Deletion</h2>
        <p className="mb-4">
          You can request deletion of your ZUPLERNO account and all associated data by emailing us
          at the address below. We will process your request within 7 business days.
        </p>
        <a
          href="mailto:support@zuplerno.com?subject=Delete%20My%20Account"
          className="inline-block bg-red-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-red-700 transition"
        >
          Email us to delete your account
        </a>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">What data is deleted</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your name, email address, and mobile number</li>
          <li>Your class and subject preferences</li>
          <li>Your learning progress and study session history</li>
          <li>Any lesson plans, question papers, or chat history associated with your account</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">What data is retained</h2>
        <p>
          We may retain anonymised, non-identifiable usage statistics for service improvement
          purposes. No personally identifiable information is kept after account deletion.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p>
          For any questions, contact us at{" "}
          <a href="mailto:support@zuplerno.com" className="text-teal-600 underline">
            support@zuplerno.com
          </a>
        </p>
      </section>
    </main>
  );
}
