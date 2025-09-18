import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthorization } from "@/lib/middleware/auth";

export const GET = withAuthorization({
  requiredPermission: { action: "READ", resource: "organization" },
  organizationIdPath: "organizationId",
})(async function (
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const organizationId = params.organizationId;

    const summaryCards = await prisma.summaryCard.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: summaryCards,
    });
  } catch (error) {
    console.error("Error fetching summary cards:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
