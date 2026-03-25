import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VanuWay",
  description: "VanuWay privacy policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-3xl font-bold text-deep-blue mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-10">Last updated: February 2026</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed">
            We collect the following types of information:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
            <li>Account Information: name, email address, phone number, and location when you register</li>
            <li>Usage Data: service usage, bookings, orders, and activity on the platform</li>
            <li>Payment Information: processed securely by our payment partners; we do not store full card details</li>
            <li>Location Data: used to connect you with nearby services, drivers, and businesses</li>
            <li>Device Information: browser type, operating system, and IP address for analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-1">
            <li>Provide and personalize our services</li>
            <li>Process bookings, orders, and payments</li>
            <li>Connect you with drivers, businesses, and service providers</li>
            <li>Improve our platform and user experience</li>
            <li>Send important account and service notifications</li>
            <li>Send marketing communications (only with your consent)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">3. Data Storage & Security</h2>
          <p className="text-gray-600 leading-relaxed">
            Your data is stored securely using industry-standard encryption at rest and in transit. We implement robust security measures to protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">4. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed">
            We use trusted third-party services for hosting, payments, and analytics. Each service has its own privacy policy. We only share the minimum data necessary for each service to function.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">5. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            You have the right to access, correct, or delete your personal data. You can update your information in your account settings or contact us at hello@vanuway.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-blue mb-3">6. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at hello@vanuway.com.
          </p>
        </section>
      </div>
    </div>
  );
}
