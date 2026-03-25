import Link from "next/link";

export const metadata = {
  title: "Partner With VanuWay — For Business",
  description:
    "Become a driver, list your hotel, register your restaurant, or advertise on VanuWay. Grow your business with Vanuatu's leading super app.",
};

const partnerTypes = [
  {
    icon: "🚗",
    title: "Become a Driver",
    description:
      "Join VanuWay's ride-hailing and delivery network. Set your own hours, earn on your schedule, and serve your community.",
    benefits: [
      "Flexible hours — drive when you want",
      "Earn from rides AND package deliveries",
      "Weekly payouts directly to your account",
      "Free driver training and support",
    ],
    cta: "Apply as Driver",
    color: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100",
  },
  {
    icon: "🍽️",
    title: "Register Your Restaurant",
    description:
      "Get your food in front of thousands of hungry customers. VanuWay handles delivery so you can focus on cooking.",
    benefits: [
      "Reach more customers island-wide",
      "We handle all delivery logistics",
      "Real-time order management dashboard",
      "Marketing support and promotions",
    ],
    cta: "List Your Restaurant",
    color: "bg-orange-50 border-orange-200",
    iconBg: "bg-orange-100",
  },
  {
    icon: "🏨",
    title: "List Your Hotel",
    description:
      "Showcase your accommodation to domestic and international travellers. From luxury resorts to backpacker bungalows.",
    benefits: [
      "Reach international & domestic guests",
      "Manage bookings in real-time",
      "Professional listing with photos",
      "No upfront listing fees",
    ],
    cta: "List Your Property",
    color: "bg-teal-50 border-teal-200",
    iconBg: "bg-teal-100",
  },
  {
    icon: "🗺️",
    title: "List Your Tour",
    description:
      "Share Vanuatu's beauty with the world. Register your tour company and let visitors book directly through VanuWay.",
    benefits: [
      "Reach tourists before they arrive",
      "Online booking & payment system",
      "Customer reviews build your reputation",
      "Featured in our tours marketplace",
    ],
    cta: "Register Your Tour",
    color: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100",
  },
  {
    icon: "🛒",
    title: "Open a Shop",
    description:
      "Sell your products online through the VanuWay Marketplace. Groceries, electronics, handicrafts — anything.",
    benefits: [
      "Online storefront in minutes",
      "Delivery handled by VanuWay",
      "Inventory management tools",
      "Accept digital payments",
    ],
    cta: "Open Your Shop",
    color: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-100",
  },
  {
    icon: "🔧",
    title: "Offer Your Services",
    description:
      "Plumber? Electrician? Mechanic? Join VanuWay's Service Provider network and get found by customers who need you.",
    benefits: [
      "Get discovered by local customers",
      "Build your professional profile",
      "Receive bookings and inquiries",
      "Grow your reputation with reviews",
    ],
    cta: "Join as Provider",
    color: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100",
  },
];

const whyPartner = [
  {
    icon: "📈",
    title: "Grow Your Revenue",
    description: "Tap into VanuWay's growing user base and reach customers across all islands.",
  },
  {
    icon: "💳",
    title: "Easy Payments",
    description: "Receive payments digitally with transparent, on-time settlements.",
  },
  {
    icon: "📊",
    title: "Business Dashboard",
    description: "Track orders, bookings, reviews, and earnings in real time.",
  },
  {
    icon: "🤝",
    title: "Dedicated Support",
    description: "Our partner success team helps you grow and resolve any issues quickly.",
  },
];

export default function BusinessPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-deep-blue to-deep-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
            For Business
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Partner With VanuWay
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Whether you drive a taxi, run a hotel, cook amazing food, or offer professional
            services — VanuWay gives you the platform to reach more customers and grow your business.
          </p>
          <Link href="/contact" className="btn-primary text-base py-3.5 px-8">
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Why Partner */}
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-deep-blue mb-4">
              Why partner with VanuWay?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              We&apos;re building the digital infrastructure for Vanuatu&apos;s economy. Join us and grow together.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyPartner.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-deep-blue mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="text-center mb-14">
            <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
              Partnership Options
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-deep-blue mb-4">
              Choose how you want to partner
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {partnerTypes.map((partner) => (
              <div
                key={partner.title}
                className={`rounded-2xl p-6 border ${partner.color} hover:shadow-lg transition-all duration-300`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 text-3xl rounded-xl ${partner.iconBg} mb-4`}>
                  {partner.icon}
                </div>

                <h3 className="text-xl font-bold text-deep-blue mb-2">
                  {partner.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {partner.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {partner.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className="inline-flex items-center text-sm font-semibold text-vibrant-orange hover:text-vibrant-orange-700 transition-colors"
                >
                  {partner.cta}
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-deep-blue to-deep-blue-700">
        <div className="container-max text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to grow with VanuWay?
          </h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
            Contact our partnership team today. We&apos;ll help you get set up
            and start reaching customers in no time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="btn-primary text-base py-3.5 px-8"
            >
              Contact Partnership Team
            </Link>
            <a
              href="https://app.vanuway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              Open VanuWay App
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
