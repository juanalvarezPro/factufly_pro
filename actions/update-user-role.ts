"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { userRoleSchema } from "@/lib/validations/auth";

export type FormData = {
  role: UserRole;
};

export async function updateUserRole(userId: string, data: FormData) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { role } = userRoleSchema.parse(data);

    // Special validation for DEV role assignment
    if (role === "DEV") {
      // Only current DEV users can assign DEV role to others
      if (session.user.role !== "DEV") {
        throw new Error("Only DEV users can assign DEV role");
      }
      
      // Prevent self-assignment of DEV role (for security)
      if (session.user.id === userId) {
        throw new Error("Cannot assign DEV role to yourself");
      }
    }

    // Only allow users to update their own role, or DEV users to update any role
    if (session.user.id !== userId && session.user.role !== "DEV") {
      throw new Error("Unauthorized to update this user's role");
    }

    // Update the user role.
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: role,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/admin");
    return { status: "success" };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { status: "error", message: error instanceof Error ? error.message : "Unknown error" };
  }
}
