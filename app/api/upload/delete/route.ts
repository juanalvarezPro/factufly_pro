import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { deleteFromR2, extractKeyFromUrl, batchDeleteFromR2 } from "@/lib/r2";
import { organizationService } from "@/lib/services/organization.service";

// Validation schema for delete request
const deleteSchema = z.object({
  organizationId: z.string().cuid(),
  urls: z.array(z.string().url()).min(1, "At least one URL is required").max(50, "Too many URLs"),
});

export async function DELETE(request: NextRequest) {
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
    const validatedData = deleteSchema.parse(body);

    // Verify user has access to the organization
    try {
      await organizationService.getById(validatedData.organizationId);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Access to organization denied" } },
        { status: 403 }
      );
    }

    // Get organization details
    const organization = await organizationService.getById(validatedData.organizationId);

    // Extract keys from URLs and validate they belong to this organization
    const keys: string[] = [];
    const invalidUrls: string[] = [];

    for (const url of validatedData.urls) {
      const key = extractKeyFromUrl(url);
      
      if (!key) {
        invalidUrls.push(url);
        continue;
      }

      // Verify the key belongs to this organization (starts with org slug)
      if (!key.startsWith(`${organization.slug}/`)) {
        invalidUrls.push(url);
        continue;
      }

      keys.push(key);
    }

    if (invalidUrls.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid URLs for this organization: ${invalidUrls.join(", ")}`,
            invalidUrls,
          },
        },
        { status: 400 }
      );
    }

    // Delete files from R2
    let result;
    if (keys.length === 1) {
      // Single delete
      try {
        await deleteFromR2(keys[0]);
        result = { success: keys, failed: [] };
      } catch (error) {
        console.error("Single delete error:", error);
        result = { success: [], failed: keys };
      }
    } else {
      // Batch delete
      result = await batchDeleteFromR2(keys);
    }

    // Return results
    return NextResponse.json({
      success: true,
      data: {
        deleted: result.success.length,
        failed: result.failed.length,
        successfulUrls: result.success.map(key => validatedData.urls.find(url => extractKeyFromUrl(url) === key)),
        failedUrls: result.failed.map(key => validatedData.urls.find(url => extractKeyFromUrl(url) === key)),
        details: result,
      },
      message: result.failed.length === 0 
        ? "All files deleted successfully"
        : `${result.success.length} files deleted, ${result.failed.length} failed`,
    });

  } catch (error: any) {
    console.error("Delete error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid delete request",
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
          code: error.code || "DELETE_ERROR",
          message: error.message || "Failed to delete files",
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
      "Access-Control-Allow-Methods": "DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
