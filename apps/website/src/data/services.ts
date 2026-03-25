export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  appLink: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  services: Service[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: "transport",
    title: "Transport & Delivery",
    emoji: "🚗",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconBg: "bg-blue-100",
    services: [
      {
        id: "ride-hailing",
        icon: "🚕",
        title: "Ride-Hailing",
        description:
          "Book a ride anywhere in Vanuatu. Safe, reliable, and affordable transport at your fingertips.",
        badge: "⭐ Popular",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "package-delivery",
        icon: "📦",
        title: "Package Delivery",
        description:
          "Send packages with VanuRide couriers. Fast, tracked delivery across Vanuatu.",
        appLink: "https://app.vanuway.com",
      },
    ],
  },
  {
    id: "food",
    title: "Food & Shopping",
    emoji: "🍽️",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconBg: "bg-orange-100",
    services: [
      {
        id: "food-delivery",
        icon: "🍔",
        title: "Food Delivery",
        description:
          "Order from local restaurants and get meals delivered hot to your door.",
        badge: "⭐ Popular",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "shop-delivery",
        icon: "🛒",
        title: "Shop Delivery",
        description:
          "Order groceries, essentials, and everyday items from local shops delivered to you.",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "marketplace",
        icon: "🏪",
        title: "Marketplace",
        description:
          "Buy and sell locally. From fresh produce to electronics — support local sellers.",
        appLink: "https://app.vanuway.com",
      },
    ],
  },
  {
    id: "travel",
    title: "Travel & Stay",
    emoji: "✈️",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    iconBg: "bg-teal-100",
    services: [
      {
        id: "hotels",
        icon: "🏨",
        title: "Hotels & Accommodation",
        description:
          "Find and book accommodations across Vanuatu. From beachfront resorts to cozy guesthouses.",
        badge: "⭐ Popular",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "tours",
        icon: "🗺️",
        title: "Tours & Attractions",
        description:
          "Explore Vanuatu with guided tours. Discover volcanoes, blue holes, cultural sites, and more.",
        badge: "⭐ Popular",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "ferry-flights",
        icon: "⛴️",
        title: "Ferry & Flights",
        description:
          "Book inter-island travel. Ferries between islands and domestic flights made easy.",
        appLink: "https://app.vanuway.com",
      },
    ],
  },
  {
    id: "community",
    title: "Community & Learning",
    emoji: "🤝",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconBg: "bg-purple-100",
    services: [
      {
        id: "learn-bislama",
        icon: "📚",
        title: "Learn Bislama",
        description:
          "Interactive language learning platform. Master Vanuatu's national language with fun lessons.",
        badge: "🆕 New",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "emergency-alerts",
        icon: "🚨",
        title: "Emergency Alerts",
        description:
          "Real-time safety and emergency notifications. Stay informed about cyclones, earthquakes, and alerts.",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "community-events",
        icon: "🎉",
        title: "Community Events",
        description:
          "Discover local events and activities. Festivals, sports, markets, and cultural celebrations.",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "service-providers",
        icon: "🔧",
        title: "Service Providers",
        description:
          "Connect with local service professionals. Plumbers, electricians, mechanics, and more.",
        appLink: "https://app.vanuway.com",
      },
    ],
  },
  {
    id: "property",
    title: "Property",
    emoji: "🏠",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconBg: "bg-amber-100",
    services: [
      {
        id: "real-estate",
        icon: "🏡",
        title: "Real Estate",
        description:
          "Find properties for rent or sale across Vanuatu. Homes, land, commercial spaces, and more.",
        appLink: "https://app.vanuway.com",
      },
    ],
  },
  {
    id: "health-career",
    title: "Health & Career",
    emoji: "💼",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    iconBg: "bg-rose-100",
    services: [
      {
        id: "vanuhealth",
        icon: "🏥",
        title: "VanuHealth",
        description:
          "Pharmacy, hospitals & lab tests. Access healthcare services and find medical providers.",
        badge: "🆕 New",
        appLink: "https://app.vanuway.com",
      },
      {
        id: "vanujobs",
        icon: "💼",
        title: "VanuJobs",
        description:
          "Jobs, freelancing & career opportunities. Find work or hire talent across Vanuatu.",
        badge: "🆕 New",
        appLink: "https://app.vanuway.com",
      },
    ],
  },
];

export const allServices = serviceCategories.flatMap((cat) => cat.services);
export const totalServiceCount = allServices.length;
