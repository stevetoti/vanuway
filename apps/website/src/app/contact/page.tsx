"use client";

import { useState } from "react";
import Link from "next/link";
import { submitContactForm } from "./actions";

const contactReasons = [
  "General Inquiry",
  "Partnership / Business",
  "Driver Application",
  "Restaurant Registration",
  "Hotel Listing",
  "Technical Support",
  "Bug Report",
  "Other",
];

const contactInfo = [
  {
    icon: "📧",
    title: "Email",
    detail: "hello@vanuway.com",
    link: "mailto:hello@vanuway.com",
  },
  {
    icon: "📱",
    title: "WhatsApp",
    detail: "+678 528 8141",
    link: "https://wa.me/6785288141",
  },
  {
    icon: "📍",
    title: "Location",
    detail: "Port Vila, Vanuatu",
    link: "#",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);

    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-deep-blue to-deep-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
            Contact
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Have a question, want to partner, or need support? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-deep-blue mb-6">
                Contact Information
              </h2>

              <div className="space-y-5 mb-8">
                {contactInfo.map((item) => (
                  <a
                    key={item.title}
                    href={item.link}
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-sm text-gray-500">{item.title}</div>
                      <div className="font-semibold text-deep-blue">{item.detail}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="bg-deep-blue rounded-2xl p-6 text-white">
                <h3 className="font-bold text-lg mb-2">Business Hours</h3>
                <p className="text-blue-200 text-sm mb-4">
                  Our team is available during Vanuatu business hours.
                </p>
                <div className="space-y-1 text-sm text-blue-100">
                  <p>Monday – Friday: 8:00 AM – 5:00 PM</p>
                  <p>Saturday: 9:00 AM – 12:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
                <p className="mt-4 text-xs text-blue-300">
                  Timezone: Vanuatu Time (VUT, UTC+11)
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-deep-blue mb-6">
                  Send us a message
                </h2>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-deep-blue mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="btn-primary"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none transition-colors text-sm"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none transition-colors text-sm"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none transition-colors text-sm"
                        placeholder="+678 XXXX XXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Reason for Contact *
                      </label>
                      <select
                        name="reason"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none transition-colors text-sm bg-white"
                      >
                        <option value="">Select a reason...</option>
                        {contactReasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange outline-none transition-colors text-sm resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Sending..." : "Send Message"}
                      {!submitting && (
                        <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Quick Links */}
      <section className="section-padding bg-white">
        <div className="container-max text-center">
          <h2 className="text-2xl font-bold text-deep-blue mb-8">
            Looking for something specific?
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/services" className="btn-outline text-sm">
              Browse All Services
            </Link>
            <Link href="/business" className="btn-outline text-sm">
              Become a Partner
            </Link>
            <a
              href="https://app.vanuway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Open VanuWay App
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
