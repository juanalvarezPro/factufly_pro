"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canImpersonate } from "@/lib/middleware/auth";

export type ImpersonateData = {
  targetUserId: string;
  reason?: string;
};

export async function impersonateUser(data: ImpersonateData) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { targetUserId, reason } = data;

    // Check if current user can impersonate
    const canImpersonateUser = await canImpersonate(session.user.id!, targetUserId);
    if (!canImpersonateUser) {
      throw new Error("You don't have permission to impersonate this user");
    }

    // Get target user details
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Log the impersonation action for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id!,
        action: "IMPERSONATE_USER",
        resourceType: "user",
        resourceId: targetUserId,
        details: {
          targetUser: {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
          },
          reason: reason || "No reason provided",
          timestamp: new Date().toISOString(),
        },
        ipAddress: "127.0.0.1", // TODO: Get real IP from request
        userAgent: "Dev Panel", // TODO: Get real user agent
      },
    });

    // Return success with target user info for session management
    return { 
      status: "success", 
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      }
    };
  } catch (error) {
    console.error("Error impersonating user:", error);
    return { 
      status: "error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function stopImpersonation() {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    // Log the end of impersonation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id!,
        action: "STOP_IMPERSONATION",
        resourceType: "user",
        resourceId: session.user.id!,
        details: {
          timestamp: new Date().toISOString(),
        },
        ipAddress: "127.0.0.1", // TODO: Get real IP from request
        userAgent: "Dev Panel", // TODO: Get real user agent
      },
    });

    revalidatePath("/admin/dev");
    return { status: "success" };
  } catch (error) {
    console.error("Error stopping impersonation:", error);
    return { 
      status: "error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
