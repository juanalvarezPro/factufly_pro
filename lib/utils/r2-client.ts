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
  
  // If it's an R2 key, construct the public URL using endpoint
  const r2Endpoint = process.env.NEXT_PUBLIC_R2_ENDPOINT;
  console.log("r2Endpoint", r2Endpoint);
   
  if (r2Endpoint) {
    return `${r2Endpoint}/${key}`;
  }
  
  // Fallback: construct R2 URL from bucket and account ID
  const r2Bucket = process.env.NEXT_PUBLIC_R2_BUCKET;
  const r2AccountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
  
  if (r2Bucket && r2AccountId) {
    return `https://${r2Bucket}.${r2AccountId}.r2.cloudflarestorage.com/${key}`;
  }
  
  // Last resort: return the key as is
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
  
  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname
    return urlObj.pathname.substring(1);
  } catch {
    // If URL parsing fails, return the original string
    return url;
  }
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
