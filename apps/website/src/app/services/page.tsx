import Link from "next/link";
import { serviceCategories } from "@/data/services";

export const metadata = {
  title: "Services — VanuWay",
  description:
    "Explore all 16 VanuWay services: ride-hailing, food delivery, hotels, tours, marketplace, real estate, health, jobs, and more.",
};

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-deep-blue to-deep-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
            All Services
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            16 Services, One Platform
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Everything from ride-hailing to healthcare — organized into 6 categories
            to serve every need in Vanuatu.
          </p>

          {/* Quick Category Nav */}
          <div className="flex flex-wrap gap-3 justify-center">
            {serviceCategories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/20 transition-colors border border-white/10"
              >
                <span>{cat.emoji}</span>
                {cat.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      {serviceCategories.map((category, idx) => (
        <section
          key={category.id}
          id={category.id}
          className={`section-padding ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
        >
          <div className="container-max">
            <div className="flex items-center gap-4 mb-10">
              <div className={`text-4xl p-3 rounded-2xl ${category.iconBg}`}>
                {category.emoji}
              </div>
              <div>
                <h2 className={`text-2xl sm:text-3xl font-bold ${category.color}`}>
                  {category.title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {category.services.length} service{category.services.length > 1 ? "s" : ""} available
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.services.map((service) => (
                <div
                  key={service.id}
                  className={`relative rounded-2xl p-6 bg-white border ${category.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
                >
                  {service.badge && (
                    <span
                      className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        service.badge.includes("Popular")
                          ? "bg-vibrant-orange/10 text-vibrant-orange"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {service.badge}
                    </span>
                  )}

                  <div className={`inline-flex items-center justify-center w-14 h-14 text-3xl rounded-xl ${category.iconBg} mb-4`}>
                    {service.icon}
                  </div>

                  <h3 className="text-lg font-bold text-deep-blue mb-2 group-hover:text-vibrant-orange transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-gray-600 text-sm leading-relaxed mb-5">
                    {service.description}
                  </p>

                  <a
                    href={service.appLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-vibrant-orange hover:text-vibrant-orange-700 transition-colors"
                  >
                    Open in App
                    <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-vibrant-orange to-vibrant-orange-600">
        <div className="container-max text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            All these services in one app
          </h2>
          <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">
            No need for multiple apps. VanuWay brings everything together for Vanuatu.
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
