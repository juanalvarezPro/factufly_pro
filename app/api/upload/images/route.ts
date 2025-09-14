import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { uploadToR2, R2UploadOptions, validateUpload } from "@/lib/r2";
import { organizationService } from "@/lib/services/organization.service";

// Validation schema for upload request
const uploadSchema = z.object({
  organizationId: z.string().cuid(),
  entityType: z.enum(["product", "combo", "packaging", "organization", "user"]),
  entityId: z.string().cuid().optional(),
  isPublic: z.boolean().default(true),
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No file provided" } },
        { status: 400 }
      );
    }

    // Validate other form fields
    const uploadData = uploadSchema.parse({
      organizationId: formData.get("organizationId"),
      entityType: formData.get("entityType"),
      entityId: formData.get("entityId") || undefined,
      isPublic: formData.get("isPublic") === "true",
    });

    // Verify user has access to the organization
    try {
      await organizationService.getById(uploadData.organizationId);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access to organization denied" } },
        { status: 403 }
      );
    }

    // Get organization details for slug
    const organization = await organizationService.getById(uploadData.organizationId);

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Prepare upload options
    const uploadOptions: R2UploadOptions = {
      organizationSlug: organization.slug,
      entityType: uploadData.entityType,
      entityId: uploadData.entityId,
      fileName: file.name,
      contentType: file.type,
      isPublic: uploadData.isPublic,
      maxSizeBytes: 10 * 1024 * 1024, // 10MB limit
      metadata: {
        'original-name': file.name,
        'uploaded-by-user': user.id!,
        'upload-source': 'web-app',
      },
    };

    // Validate file before upload
    const validation = validateUpload(buffer, uploadOptions);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: validation.error 
          } 
        },
        { status: 400 }
      );
    }

    // Upload to R2
    const result = await uploadToR2(buffer, uploadOptions);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        key: result.key,
        url: result.publicUrl,
        publicUrl: result.publicUrl,
        size: result.size,
        contentType: result.contentType,
        organizationSlug: organization.slug,
        entityType: uploadData.entityType,
        entityId: uploadData.entityId,
      },
      message: "File uploaded successfully",
    });

  } catch (error: any) {
    console.error("Upload error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid upload data",
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
          code: error.code || "UPLOAD_ERROR",
          message: error.message || "Failed to upload file",
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
