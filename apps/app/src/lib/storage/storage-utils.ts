import { supabase } from '@/integrations/supabase/client';

/**
 * Extracts the file path from a stored URL or returns the path directly
 */
export function extractFilePath(fileUrl: string): string {
  // If it's already a path (not a full URL), return as-is
  if (!fileUrl.includes('://')) {
    return fileUrl;
  }
  
  // Extract path from various URL formats
  const patterns = [
    /\/storage\/v1\/object\/public\/documents\/(.+)$/,
    /\/storage\/v1\/object\/sign\/documents\/(.+)\?/,
    /\/documents\/(.+)$/,
  ];
  
  for (const pattern of patterns) {
    const match = fileUrl.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // If no pattern matches, return the original (might already be a path)
  return fileUrl;
}

/**
 * Generate a signed URL for a document in the private 'documents' bucket
 * @param fileUrl - The file URL or path stored in the database
 * @param expiresInSeconds - How long the signed URL should be valid (default: 1 hour)
 */
export async function getSignedDocumentUrl(
  fileUrl: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const filePath = extractFilePath(fileUrl);
  
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Open a document in a new tab using a signed URL
 */
export async function openDocument(fileUrl: string): Promise<boolean> {
  const signedUrl = await getSignedDocumentUrl(fileUrl);
  
  if (signedUrl) {
    window.open(signedUrl, '_blank');
    return true;
  }
  
  return false;
}
