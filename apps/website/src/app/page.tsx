import Link from "next/link";
import Image from "next/image";
import { serviceCategories } from "@/data/services";

const stats = [
  { value: "16+", label: "Services" },
  { value: "6", label: "Categories" },
  { value: "80+", label: "Islands" },
  { value: "1", label: "App" },
];

const testimonials = [
  {
    quote:
      "VanuWay changed how I get around Port Vila. I book rides, order food, and even found my apartment through the app!",
    name: "Marie T.",
    role: "Port Vila resident",
  },
  {
    quote:
      "As a hotel owner, listing on VanuWay brought me international guests I never would have reached before.",
    name: "John N.",
    role: "Hotel Owner, Tanna",
  },
  {
    quote:
      "The Learn Bislama feature is amazing! I'm a tourist and it helped me connect with locals on a deeper level.",
    name: "Sarah K.",
    role: "Tourist from Australia",
  },
];

const steps = [
  {
    step: "01",
    icon: "📱",
    title: "Open VanuWay",
    description: "Visit app.vanuway.com or download the app. Create your free account in seconds.",
  },
  {
    step: "02",
    icon: "🔍",
    title: "Choose a Service",
    description: "Browse 16+ services across transport, food, travel, community, and more.",
  },
  {
    step: "03",
    icon: "✅",
    title: "Book & Enjoy",
    description: "Book a ride, order food, find a hotel, or explore tours. Everything in one place.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-deep-blue via-deep-blue-700 to-deep-blue-800 pt-20">
        {/* Decorative background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-vibrant-orange/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-400/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Now live in Vanuatu
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Everything you need,{" "}
                <span className="text-vibrant-orange">all in one app</span>
              </h1>

              <p className="text-lg sm:text-xl text-blue-100 max-w-xl mb-8 leading-relaxed">
                Ride-hailing, food delivery, hotels, tours, marketplace, real estate,
                healthcare, jobs — VanuWay connects all of Vanuatu in a single platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://app.vanuway.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-base py-3.5 px-8"
                >
                  Open VanuWay App
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <Link href="/services" className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 text-base">
                  Explore Services
                </Link>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-blue-200 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Service Grid Preview */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {serviceCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all duration-300 group"
                  >
                    <div className="text-3xl mb-3">{cat.emoji}</div>
                    <h3 className="text-white font-semibold text-sm mb-1">{cat.title}</h3>
                    <p className="text-blue-200 text-xs">
                      {cat.services.length} service{cat.services.length > 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services" className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="text-center mb-14">
            <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
              Our Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-deep-blue mb-4">
              16 Services Across 6 Categories
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              From getting around town to finding a home — VanuWay brings together everything
              Vanuatu needs in one powerful platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceCategories.map((category) => (
              <Link
                key={category.id}
                href={`/services#${category.id}`}
                className={`group relative rounded-2xl p-6 ${category.bgColor} border ${category.borderColor} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-4xl p-3 rounded-xl ${category.iconBg}`}>
                    {category.emoji}
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white/80 rounded-full px-2.5 py-1">
                    {category.services.length} service{category.services.length > 1 ? "s" : ""}
                  </span>
                </div>

                <h3 className={`text-xl font-bold ${category.color} mb-3`}>
                  {category.title}
                </h3>

                <ul className="space-y-1.5">
                  {category.services.map((service) => (
                    <li key={service.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{service.icon}</span>
                      <span>{service.title}</span>
                      {service.badge && (
                        <span className="text-xs font-medium text-vibrant-orange">
                          {service.badge}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center text-sm font-medium text-deep-blue group-hover:text-vibrant-orange transition-colors">
                  View details
                  <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="text-center mb-14">
            <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-deep-blue mb-4">
              Get started in 3 easy steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 text-3xl bg-deep-blue/5 rounded-2xl mb-5">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-vibrant-orange uppercase tracking-wider mb-2">
                  Step {step.step}
                </div>
                <h3 className="text-xl font-bold text-deep-blue mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-deep-blue">
        <div className="container-max">
          <div className="text-center mb-14">
            <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Loved by Vanuatu
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="flex gap-1 text-vibrant-orange mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-blue-100 mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-blue-300">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="section-padding bg-gradient-to-r from-vibrant-orange to-vibrant-orange-600">
        <div className="container-max text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to experience VanuWay?
          </h2>
          <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">
            Join thousands of ni-Vanuatu using the app for rides, food, hotels,
            tours, and everything in between.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.vanuway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-vibrant-orange font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg text-base"
            >
              Open VanuWay App
            </a>
            <Link
              href="/business"
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
