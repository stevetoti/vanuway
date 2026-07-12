import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostBySlug, formatPostDate } from "@/lib/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return { title: "Article Not Found — VanuWay" };
  }

  const canonical = `https://vanuway.com/blog/${post.slug}`;
  const description = post.excerpt ?? "Read this article on the VanuWay blog.";
  const ogImage = post.image_url ?? "https://vanuway.com/og-image.png";

  return {
    title: `${post.title} — VanuWay Blog`,
    description,
    keywords: post.keywords ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: canonical,
      siteName: "VanuWay",
      publishedTime: post.published_at ?? undefined,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.image_alt ?? post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-deep-blue via-deep-blue-700 to-deep-blue-800 pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-vibrant-orange/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-blue-200 hover:text-white transition-colors mb-6"
          >
            <svg
              className="mr-1 w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Blog
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
            {post.category && (
              <span className="font-semibold text-vibrant-orange uppercase tracking-wider text-xs">
                {post.category}
              </span>
            )}
            {post.published_at && (
              <span className="text-blue-200">
                {formatPostDate(post.published_at)}
              </span>
            )}
            {post.read_time && (
              <span className="text-blue-300">· {post.read_time}</span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-blue-100 leading-relaxed">{post.excerpt}</p>
          )}
        </div>
      </section>

      {/* Hero image */}
      {post.image_url && (
        <section className="bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-0 pt-10">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image_url}
                alt={post.image_alt ?? post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Article body */}
      <article className="bg-gray-50 pb-16 sm:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h2 className="text-3xl font-bold text-deep-blue mt-10 mb-4 first:mt-0">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-deep-blue mt-10 mb-4 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold text-deep-blue mt-8 mb-3">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg font-semibold text-deep-blue mt-6 mb-2">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-5">{children}</p>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-vibrant-orange font-medium hover:underline"
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-5 space-y-2 text-gray-700">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-5 space-y-2 text-gray-700">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-vibrant-orange bg-vibrant-orange-50 rounded-r-xl px-5 py-3 my-6 text-gray-700 italic">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) =>
                  className ? (
                    <code className={`${className} text-sm`}>{children}</code>
                  ) : (
                    <code className="bg-deep-blue-50 text-deep-blue rounded px-1.5 py-0.5 text-sm font-mono">
                      {children}
                    </code>
                  ),
                pre: ({ children }) => (
                  <pre className="bg-deep-blue-900 text-blue-100 rounded-xl p-5 overflow-x-auto mb-6 text-sm">
                    {children}
                  </pre>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-6">
                    <table className="min-w-full border border-gray-200 rounded-xl text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-deep-blue-50 text-deep-blue font-semibold text-left px-4 py-2.5 border-b border-gray-200">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2.5 border-b border-gray-100 text-gray-700">
                    {children}
                  </td>
                ),
                hr: () => <hr className="my-8 border-gray-200" />,
                img: ({ src, alt }) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={typeof src === "string" ? src : undefined}
                    alt={alt ?? ""}
                    className="rounded-xl w-full h-auto my-6"
                    loading="lazy"
                  />
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
              }}
            >
              {post.content ?? ""}
            </ReactMarkdown>
          </div>

          {/* CTA */}
          <div className="mt-10 bg-gradient-to-r from-vibrant-orange to-vibrant-orange-600 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Ready to experience VanuWay?
            </h2>
            <p className="text-white/90 mb-6">
              Rides, food, hotels, tours, and more — all in one app.
            </p>
            <a
              href="https://app.vanuway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-vibrant-orange font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Open VanuWay App
            </a>
          </div>
        </div>
      </article>
    </>
  );
}
