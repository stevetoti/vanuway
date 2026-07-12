import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, formatPostDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — VanuWay",
  description:
    "News, guides, and stories from VanuWay — Vanuatu's all-in-one super app for rides, food, hotels, tours, and more.",
  alternates: {
    canonical: "https://vanuway.com/blog",
  },
  openGraph: {
    title: "Blog — VanuWay",
    description:
      "News, guides, and stories from VanuWay — Vanuatu's all-in-one super app.",
    type: "website",
    url: "https://vanuway.com/blog",
    siteName: "VanuWay",
    images: [
      {
        url: "https://vanuway.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "VanuWay Blog",
      },
    ],
  },
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-deep-blue via-deep-blue-700 to-deep-blue-800 pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-vibrant-orange/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
          <span className="inline-block text-vibrant-orange font-semibold text-sm uppercase tracking-wider mb-3">
            VanuWay Blog
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Stories from <span className="text-vibrant-orange">Vanuatu</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            News, travel guides, and tips on getting the most out of VanuWay —
            rides, food, hotels, tours, and everything in between.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="section-padding bg-gray-50">
        <div className="container-max">
          {posts.length === 0 ? (
            <div className="max-w-xl mx-auto text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 text-3xl bg-deep-blue/5 rounded-2xl mb-6">
                📝
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-deep-blue mb-3">
                Articles coming soon
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                We&apos;re working on stories about life in Vanuatu, travel
                guides, and updates from the VanuWay team. Check back soon!
              </p>
              <Link href="/services" className="btn-primary text-sm py-2.5 px-6">
                Explore Our Services
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  {post.image_url && (
                    <div className="aspect-[16/9] overflow-hidden bg-deep-blue-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image_url}
                        alt={post.image_alt ?? post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      {post.category && (
                        <span className="font-semibold text-vibrant-orange uppercase tracking-wider">
                          {post.category}
                        </span>
                      )}
                      {post.published_at && (
                        <span className="text-gray-500">
                          {formatPostDate(post.published_at)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-deep-blue mb-2 group-hover:text-vibrant-orange transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between text-sm">
                      <span className="font-medium text-deep-blue group-hover:text-vibrant-orange transition-colors inline-flex items-center">
                        Read article
                        <svg
                          className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                      {post.read_time && (
                        <span className="text-xs text-gray-500">{post.read_time}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
