import { lazy, ComponentType } from 'react';

/**
 * Wraps React.lazy() with automatic retry on chunk load failures.
 * After a deploy, old chunk filenames no longer exist on the server.
 * This detects the failure and does a hard reload to get fresh chunks.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const hasRefreshed = sessionStorage.getItem('chunk_retry');

    try {
      const component = await importFn();
      // Success — clear the retry flag
      sessionStorage.removeItem('chunk_retry');
      return component;
    } catch (error: unknown) {
      const isChunkError =
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Loading CSS chunk') ||
        error?.message?.includes('Importing a module script failed');

      if (isChunkError && !hasRefreshed) {
        // First failure — set flag and reload to get fresh chunks
        sessionStorage.setItem('chunk_retry', '1');
        window.location.reload();
        // Return a placeholder while reloading
        return { default: (() => null) as unknown as T };
      }

      // Either not a chunk error, or we already retried — throw to error boundary
      throw error;
    }
  });
}
