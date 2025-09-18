import "server-only";

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

import { env } from "@/env.mjs";

/**
 * Sanitize filename for use in HTTP headers/metadata
 * Removes or replaces characters that are not allowed in HTTP headers
 */
export function sanitizeFilenameForMetadata(filename: string): string {
  return filename
    // Remove or replace characters that are not allowed in HTTP headers
    .replace(/[\r\n\t]/g, ' ') // Replace control characters with spaces
    .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
    .replace(/["\\]/g, '') // Remove quotes and backslashes
    .trim() // Remove leading/trailing whitespace
    .substring(0, 255); // Limit length to prevent header size issues
}

/**
 * Create standardized upload metadata
 */
export function createUploadMetadata(
  options: R2UploadOptions,
  additionalMetadata: Record<string, string> = {}
): Record<string, string> {
  const { metadata = {}, entityId } = options;
  
  return {
    ...metadata,
    'uploaded-by': 'factufly-pro',
    'upload-timestamp': new Date().toISOString(),
    'organization': options.organizationSlug,
    'entity-type': options.entityType,
    ...(entityId && { 'entity-id': entityId }),
    // Sanitize original filename for metadata
    ...(metadata['original-name'] && { 'original-name': sanitizeFilenameForMetadata(metadata['original-name']) }),
    ...additionalMetadata,
  };
}

// Cloudflare R2 Client Configuration
const r2Client = new S3Client({
  region: "auto", // Cloudflare R2 uses 'auto' region
  endpoint: env.R2_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2 compatibility
});

export interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
  size: number;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

export interface R2UploadOptions {
  organizationSlug: string;
  entityType: "product" | "combo" | "packaging" | "organization" | "user";
  entityId?: string;
  fileName: string;
  contentType: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
  maxSizeBytes?: number;
  customFileName?: string;
  useOriginalName?: boolean;
}

/**
 * Generate a structured key for R2 storage with organization isolation
 */
export function generateR2Key(options: R2UploadOptions): string {
  const {
    organizationSlug,
    entityType,
    entityId,
    fileName,
    customFileName,
    useOriginalName,
  } = options;

  // Determine which filename to use
  let targetFileName = fileName;
  if (customFileName && !useOriginalName) {
    // Use custom filename (like category name) but keep original extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    targetFileName = `${customFileName}.${fileExtension}`;
  } else if (useOriginalName) {
    // Use original filename as-is
    targetFileName = fileName;
  }

  // Clean filename and generate UUID
  const fileExtension = targetFileName.split('.').pop()?.toLowerCase() || '';
  const cleanFileName = targetFileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/\.{2,}/g, '.')  // Replace multiple dots with single dot
    .replace(/^_|_$/g, '')
    .replace(/^\.|\.$/g, ''); // Remove dots from start and end
  
  const uuid = uuidv4();
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Structure: {org}/{type}/{date}/{uuid}-{filename}
  // Example: acme-corp/products/2024-01-15/abc123-pizza-margherita.jpg
  const baseKey = `${organizationSlug}/${entityType}/${timestamp}/${uuid}-${cleanFileName}`;
  
  // Add entity ID if provided for specific entity attachments
  if (entityId) {
    return `${organizationSlug}/${entityType}/${entityId}/${timestamp}/${uuid}-${cleanFileName}`;
  }
  
  return baseKey;
}

/**
 * Generate public URL for an R2 object (server-side)
 * For unified server/client usage, use the function from lib/utils/r2-client.ts
 */
export function getPublicUrl(key: string): string {
  // Only work with R2_PUBLIC_URL
  if (env.R2_PUBLIC_URL) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  }
  
  // If no R2_PUBLIC_URL is configured, return the key as is
  return key;
}

/**
 * Validate file upload constraints
 */
export function validateUpload(
  file: Buffer | Uint8Array,
  options: R2UploadOptions
): { valid: boolean; error?: string } {
  const { contentType, maxSizeBytes = 10 * 1024 * 1024 } = options; // Default 10MB

  // Check file size
  if (file.length > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${Math.round(file.length / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`,
    };
  }

  // Validate content type for images
  const allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];

  if (!allowedImageTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Content type "${contentType}" is not allowed. Allowed types: ${allowedImageTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Upload a file directly to R2
 */
export async function uploadToR2(
  file: Buffer | Uint8Array,
  options: R2UploadOptions
): Promise<UploadResult> {
  // Validate upload
  const validation = validateUpload(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Sanitize customFileName if provided
  const sanitizedOptions = {
    ...options,
    customFileName: options.customFileName ? sanitizeFilenameForMetadata(options.customFileName) : options.customFileName,
  };
  
  const key = generateR2Key(sanitizedOptions);
  const { contentType, isPublic = true } = options;

  // Create standardized upload metadata
  const uploadMetadata = createUploadMetadata(sanitizedOptions);

  try {
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: uploadMetadata,
      CacheControl: 'public, max-age=31536000', // 1 year cache

    });

    await r2Client.send(command);

    const publicUrl = getPublicUrl(key);

    return {
      key,
      url: publicUrl, // For backward compatibility
      publicUrl,
      size: file.length,
      contentType,
      metadata: uploadMetadata,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate presigned URL for direct browser upload
 */
export async function generatePresignedUploadUrl(
  options: R2UploadOptions,
  expiresIn: number = 3600 // 1 hour
): Promise<PresignedUploadUrl> {
  // Sanitize customFileName if provided
  const sanitizedOptions = {
    ...options,
    customFileName: options.customFileName ? sanitizeFilenameForMetadata(options.customFileName) : options.customFileName,
  };
  
  const key = generateR2Key(sanitizedOptions);
  const { contentType } = options;

  // Create standardized upload metadata
  const uploadMetadata = createUploadMetadata(sanitizedOptions);

  try {
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
      Metadata: uploadMetadata,
      CacheControl: 'public, max-age=31536000',
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
    const publicUrl = getPublicUrl(key);

    return {
      uploadUrl,
      key,
      publicUrl,
      expiresIn,
    };
  } catch (error) {
    console.error('R2 presigned URL error:', error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error(`Failed to delete from R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate presigned URL for downloading/viewing a file
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (error) {
    console.error('R2 download URL error:', error);
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract key from R2 URL (server-side)
 * For unified server/client usage, use extractR2Key from lib/utils/r2-client.ts
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    // Only work with R2_PUBLIC_URL
    if (env.R2_PUBLIC_URL && url.startsWith(env.R2_PUBLIC_URL)) {
      return url.replace(`${env.R2_PUBLIC_URL}/`, '');
    }
    
    // If not using R2_PUBLIC_URL, return null
    return null;
  } catch {
    return null;
  }
}

/**
 * Batch delete multiple files
 */
export async function batchDeleteFromR2(keys: string[]): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  // Process in batches of 10 to avoid overwhelming R2
  for (let i = 0; i < keys.length; i += 10) {
    const batch = keys.slice(i, i + 10);
    
    await Promise.allSettled(
      batch.map(async (key) => {
        try {
          await deleteFromR2(key);
          success.push(key);
        } catch (error) {
          console.error(`Failed to delete ${key}:`, error);
          failed.push(key);
        }
      })
    );
  }

  return { success, failed };
}

/**
 * Get file info from R2 (metadata, size, etc.)
 */
export async function getFileInfo(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    });

    const response = await r2Client.send(command);
    
    return {
      key,
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified,
      metadata: response.Metadata || {},
      etag: response.ETag,
    };
  } catch (error) {
    console.error('R2 file info error:', error);
    throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
