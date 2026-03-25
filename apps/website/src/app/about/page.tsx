import Link from "next/link";

export const metadata = {
  title: "About — VanuWay",
  description:
    "VanuWay is on a mission to digitize Vanuatu's economy. Learn about our story, team, and vision for a connected Pacific.",
};

const values = [
  {
    icon: "🌴",
    title: "Built for Vanuatu",
    description:
      "Every feature is designed with ni-Vanuatu in mind. We understand the unique challenges and opportunities of island life.",
  },
  {
    icon: "🤝",
    title: "Community First",
    description:
      "We empower local businesses, drivers, and service providers. When they grow, Vanuatu grows.",
  },
  {
    icon: "🔒",
    title: "Trust & Safety",
    description:
      "From verified drivers to secure payments, we prioritize the safety and trust of every user.",
  },
  {
    icon: "🌏",
    title: "Pacific Innovation",
    description:
      "We're proving that world-class technology can be built in the Pacific, for the Pacific.",
  },
];

const milestones = [
  {
    year: "2024",
    title: "VanuWay Launches",
    description: "Started with ride-hailing and food delivery in Port Vila.",
  },
  {
    year: "2024",
    title: "Expanded Services",
    description: "Added hotels, tours, marketplace, and package delivery.",
  },
  {
    year: "2025",
    title: "16 Services Live",
    description: "Launched VanuHealth, VanuJobs, Learn Bislama, and more. Full super app vision realized.",
  },
  {
    year: "2025",
    title: "Island Expansion",
    description: "Expanding services to Espiritu Santo, Tanna, and outer islands.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-deep-blue to-deep-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
            About Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Digitizing Vanuatu&apos;s Economy
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            VanuWay is Vanuatu&apos;s first super app — a single platform connecting
            people, businesses, and services across every island.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
                Our Mission
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-deep-blue mb-6">
                One app to connect all of Vanuatu
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In Vanuatu, getting a ride, ordering food, booking a hotel, or finding
                a plumber often means making phone calls, sending messages, or asking
                around. There&apos;s no single place to do it all.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong className="text-deep-blue">VanuWay changes that.</strong> We&apos;re building the digital
                infrastructure that Vanuatu needs — a platform where you can book a ride
                to the airport, order lunch for the office, reserve a beachfront bungalow,
                find a job, or learn Bislama, all from your phone.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We believe technology should serve communities, not the other way around.
                Every feature we build starts with a real need from real people in Vanuatu.
              </p>
            </div>

            {/* Stats card */}
            <div className="bg-gradient-to-br from-deep-blue to-deep-blue-700 rounded-3xl p-8 text-white">
              <h3 className="text-xl font-bold mb-8">VanuWay by the numbers</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-vibrant-orange">16</div>
                  <div className="text-sm text-blue-200 mt-1">Services</div>
                </div>
                <div className="bg-white/10 rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-vibrant-orange">6</div>
                  <div className="text-sm text-blue-200 mt-1">Categories</div>
                </div>
                <div className="bg-white/10 rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-vibrant-orange">80+</div>
                  <div className="text-sm text-blue-200 mt-1">Islands Served</div>
                </div>
                <div className="bg-white/10 rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-vibrant-orange">24/7</div>
                  <div className="text-sm text-blue-200 mt-1">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="text-center mb-14">
            <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
              Our Values
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-deep-blue mb-4">
              What drives us
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-2xl p-6 border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-lg font-bold text-deep-blue mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="text-center mb-14">
            <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
              Our Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-deep-blue mb-4">
              From idea to super app
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-vibrant-orange flex items-center justify-center text-white font-bold text-sm">
                    {m.year.slice(2)}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <div className="text-xs font-bold text-vibrant-orange uppercase tracking-wider mb-1">
                    {m.year}
                  </div>
                  <h3 className="text-lg font-bold text-deep-blue mb-1">{m.title}</h3>
                  <p className="text-gray-600 text-sm">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-vibrant-orange to-vibrant-orange-600">
        <div className="container-max text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Be part of the VanuWay story
          </h2>
          <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">
            Whether you&apos;re a user, a business partner, or a developer — there&apos;s
            a place for you in Vanuatu&apos;s digital future.
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
