'use client';
/**
 * Convert R2 key to public URL
 * Works on the client-side using NEXT_PUBLIC_ environment variables
 */
export function getPublicUrl(key: string): string {
  // If it's already a full URL, return as is
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  
  // Only work with NEXT_PUBLIC_R2_PUBLIC_URL
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (r2PublicUrl) {
    return `${r2PublicUrl}/${key}`;
  }
  
  // If no R2_PUBLIC_URL is configured, return the key as is
  return key;
}

/**
 * Extract R2 key from a full URL
 * Useful when you need to get the key back from a URL
 */
export function extractR2Key(url: string): string {
  // If it's not a URL, return as is
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }
  
  // Only work with NEXT_PUBLIC_R2_PUBLIC_URL
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (r2PublicUrl && url.startsWith(r2PublicUrl)) {
    return url.replace(`${r2PublicUrl}/`, '');
  }
  
  // If not using R2_PUBLIC_URL, return the original string
  return url;
}

/**
 * Check if a string is an R2 key (not a full URL)
 */
export function isR2Key(keyOrUrl: string): boolean {
  return !keyOrUrl.startsWith('http://') && !keyOrUrl.startsWith('https://');
}

/**
 * Get file extension from R2 key or URL
 */
export function getFileExtension(keyOrUrl: string): string {
  const key = isR2Key(keyOrUrl) ? keyOrUrl : extractR2Key(keyOrUrl);
  const lastDot = key.lastIndexOf('.');
  return lastDot !== -1 ? key.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * Get filename from R2 key or URL
 */
export function getFilename(keyOrUrl: string): string {
  const key = isR2Key(keyOrUrl) ? keyOrUrl : extractR2Key(keyOrUrl);
  const lastSlash = key.lastIndexOf('/');
  return lastSlash !== -1 ? key.substring(lastSlash + 1) : key;
}
