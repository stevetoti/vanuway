import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — VanuWay",
  description: "VanuWay terms of service. Read our terms and conditions for using the platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-3xl font-bold text-deep-blue mb-2">Terms of Service</h1>
      <p className="text-gray-500 text-sm mb-10">Last updated: February 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using VanuWay (&quot;the Platform&quot;), operated by Pacific Wave Digital Ltd, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">2. Account Registration</h2>
          <p className="text-gray-600 leading-relaxed">
            You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">3. Use of Services</h2>
          <p className="text-gray-600 leading-relaxed">
            The Platform provides various services including ride-hailing, food delivery, hotel bookings, tours, marketplace, real estate, healthcare, and job listings. You agree to use these services in accordance with applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">4. Payments</h2>
          <p className="text-gray-600 leading-relaxed">
            Payments for services are processed securely through our payment partners. Pricing is displayed before you confirm a booking or order. Refund policies vary by service type.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">5. Partner Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            Businesses, drivers, and service providers who partner with VanuWay agree to maintain quality standards and comply with all applicable regulations. VanuWay reserves the right to remove partners who do not meet these standards.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">6. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            All Platform content, design, logos, and branding are the intellectual property of Pacific Wave Digital Ltd. You may not copy, redistribute, or reverse-engineer any part of the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">7. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            The Platform is provided &quot;as is&quot; without warranties of any kind. VanuWay acts as a platform connecting users with service providers and is not directly liable for the quality of third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">8. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update these terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">9. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions about these Terms, please contact us at hello@vanuway.com.
          </p>
        </section>
      </div>
    </div>
  );
}
