import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  title: "VanuWay — Everything You Need, All in One App",
  description:
    "Vanuatu's all-in-one super app. Ride-hailing, food delivery, hotels, tours, marketplace, real estate, health services, jobs, and more.",
  keywords:
    "Vanuatu, super app, ride hailing, food delivery, hotels, tours, marketplace, VanuWay",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "VanuWay — Everything You Need, All in One App",
    description:
      "Vanuatu's all-in-one super app for transport, food, travel, community, health, and more.",
    type: "website",
    url: "https://vanuway.com",
    images: [
      {
        url: "https://vanuway.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "VanuWay - Everything You Need, All in One App",
      },
    ],
    siteName: "VanuWay",
  },
  twitter: {
    card: "summary_large_image",
    title: "VanuWay — Everything You Need, All in One App",
    description: "Vanuatu's all-in-one super app for transport, food, travel, community, health, and more.",
    images: ["https://vanuway.com/og-image.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased text-gray-900 bg-white">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
