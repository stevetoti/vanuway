import { supabase } from '@/integrations/supabase/client';

/**
 * Upserts a vendor_import_sources row when an AI import gives us the website URL.
 * Returns the source_id so the caller can stamp it onto the inserted rows.
 *
 * Pass the URL from BulkImportWizard's `context.sourceUrl`. CSV imports won't have one.
 */
export async function registerImportSource(
  userId: string,
  vendorKind:
    | 'marketplace' | 'restaurant' | 'hotel' | 'tour' | 'shop'
    | 'property' | 'event' | 'ferry' | 'car_rental' | 'spa',
  sourceUrl: string | undefined,
): Promise<string | null> {
  if (!sourceUrl) return null;
  const { data } = await (supabase as unknown)
    .from('vendor_import_sources')
    .upsert({
      user_id: userId,
      vendor_kind: vendorKind,
      source_url: sourceUrl,
      is_active: true,
      sync_frequency: 'weekly',
    }, { onConflict: 'user_id,vendor_kind' })
    .select('id')
    .single();
  return data?.id || null;
}

export function makeExternalIdFromItem(item: unknown): string | null {
  if (item.handle) return String(item.handle);
  if (item.slug) return String(item.slug);
  if (item.id) return String(item.id);
  if (item.sku) return String(item.sku);
  const name = String(item.name || item.title || '').toLowerCase().trim();
  if (!name) return null;
  return name.replace(/[^a-z0-9]+/g, '-').slice(0, 80);
}
