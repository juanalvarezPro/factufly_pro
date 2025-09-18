import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { generatePresignedUploadUrl, R2UploadOptions, sanitizeFilenameForMetadata } from "@/lib/r2";
import { organizationService } from "@/lib/services/organization.service";

// Validation schema for presigned URL request
const presignedSchema = z.object({
  organizationId: z.string().cuid(),
  entityType: z.enum(["product", "combo", "packaging", "organization", "user"]),
  entityId: z.string().cuid().optional(),
  fileName: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif|svg\+xml)$/),
  fileSize: z.number().min(1).max(10 * 1024 * 1024), // Max 10MB
  isPublic: z.boolean().default(true),
  expiresIn: z.number().min(300).max(3600).default(3600), // 5 min to 1 hour
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = presignedSchema.parse(body);

    // Verify user has access to the organization
    try {
      await organizationService.getById(validatedData.organizationId);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access to organization denied" } },
        { status: 403 }
      );
    }

    // Get organization details for slug
    const organization = await organizationService.getById(validatedData.organizationId);

    // Prepare upload options
    const uploadOptions: R2UploadOptions = {
      organizationSlug: organization.slug,
      entityType: validatedData.entityType,
      entityId: validatedData.entityId,
      fileName: validatedData.fileName,
      contentType: validatedData.contentType,
      isPublic: validatedData.isPublic,
      maxSizeBytes: validatedData.fileSize,
      metadata: {
        'original-name': sanitizeFilenameForMetadata(validatedData.fileName),
        'uploaded-by-user': user.id!,
        'upload-source': 'presigned-upload',
        'file-size': validatedData.fileSize.toString(),
      },
    };

    // Generate presigned URL
    const presignedData = await generatePresignedUploadUrl(
      uploadOptions,
      validatedData.expiresIn
    );

    // Return presigned URL data
    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: presignedData.uploadUrl,
        key: presignedData.key,
        publicUrl: presignedData.publicUrl,
        expiresIn: presignedData.expiresIn,
        expiresAt: new Date(Date.now() + presignedData.expiresIn * 1000).toISOString(),
        organizationSlug: organization.slug,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        uploadInstructions: {
          method: "PUT",
          headers: {
            "Content-Type": validatedData.contentType,
          },
          maxSize: validatedData.fileSize,
        },
      },
      message: "Presigned URL generated successfully",
    });

  } catch (error: any) {
    console.error("Presigned URL generation error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            validationErrors: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || "PRESIGNED_URL_ERROR",
          message: error.message || "Failed to generate presigned URL",
        },
      },
      { status: error.statusCode || 500 }
    );
  }
}

// Handle preflight CORS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
