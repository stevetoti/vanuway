import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  services: [
    { label: "Ride-Hailing", href: "/services#transport" },
    { label: "Food Delivery", href: "/services#food" },
    { label: "Hotels & Accommodation", href: "/services#travel" },
    { label: "Tours & Attractions", href: "/services#travel" },
    { label: "Marketplace", href: "/services#food" },
    { label: "Real Estate", href: "/services#property" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "For Business", href: "/business" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/services#health-career" },
  ],
  more: [
    { label: "Learn Bislama", href: "/services#community" },
    { label: "VanuHealth", href: "/services#health-career" },
    { label: "VanuJobs", href: "/services#health-career" },
    { label: "Emergency Alerts", href: "/services#community" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-deep-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logos/vanuway-white-black-bg-1.jpg"
                alt="VanuWay"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-xl font-bold">VanuWay</span>
            </Link>
            <p className="text-blue-200 text-sm leading-relaxed max-w-sm mb-6">
              Everything you need, all in one app. Digitizing Vanuatu&apos;s
              economy with transport, food, travel, community services, and more.
            </p>
            <a
              href="https://app.vanuway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-vibrant-orange hover:bg-vibrant-orange-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download App
            </a>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-vibrant-orange">
              Services
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-vibrant-orange">
              Company
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-vibrant-orange">
              More
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.more.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-blue-300">
            © {new Date().getFullYear()} VanuWay. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-blue-300 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-blue-300 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
