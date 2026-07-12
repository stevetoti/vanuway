const SUPABASE_URL = "https://rndegttgwtpkbjtvjgnc.supabase.co";

// Public anon key — safe to embed client-side; RLS restricts reads to published rows.
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZGVndHRnd3Rwa2JqdHZqZ25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzIxMjAsImV4cCI6MjA4NDAwODEyMH0.0j4_x-CmkDlIAUC07N9zMs3i7iTN5468_liR7B4Mx2Y";

const SITE_ID = "vanuway";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  image_url: string | null;
  image_alt: string | null;
  keywords: string[] | null;
  read_time: string | null;
  published: boolean;
  published_at: string | null;
  site_id: string;
  focus_keyword: string | null;
}

const LIST_COLUMNS =
  "id,title,slug,excerpt,category,image_url,image_alt,read_time,published,published_at,site_id";

async function fetchFromSupabase<T>(query: string): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await fetchFromSupabase<BlogPost[]>(
    `select=${LIST_COLUMNS}&site_id=eq.${SITE_ID}&published=eq.true&order=published_at.desc`
  );
  return posts ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await fetchFromSupabase<BlogPost[]>(
    `select=*&site_id=eq.${SITE_ID}&published=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`
  );
  return posts && posts.length > 0 ? posts[0] : null;
}

export function formatPostDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
