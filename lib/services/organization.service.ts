import "server-only";

import { ValidationError } from "./base.service";

import { OrganizationRole, UserStatus } from "@prisma/client";
import { BaseService, ConflictError, ForbiddenError, NotFoundError } from "./base.service";
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationMemberInput,
  UpdateOrganizationMemberInput,
  OrganizationInvitationInput,
} from "@/lib/validations/organization";
import type {
  OrganizationWithRelations,
  OrganizationMemberWithUser,
  PaginatedResult,
} from "@/types/database";

export class OrganizationService extends BaseService {
  /**
   * Create a new organization
   */
  async create(data: CreateOrganizationInput): Promise<OrganizationWithRelations> {
    const user = await this.getCurrentUser();
    if (!user?.id) {
      throw new ValidationError("User ID is required");
    }

    try {
      return await this.withTransaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: data.name,
            slug: data.slug,
            domain: data.domain,
            logo: data.logo,
            settings: data.settings,
            owner: {
              connect: { id: user.id }
            },
          },
          include: {
            owner: true,
            _count: {
              select: {
                members: true,
                products: true,
                productCombos: true,
              },
            },
          },
        });

        // Add owner as organization member
        await tx.organizationMember.create({
          data: {
            userId: user.id!,
            organizationId: organization.id,
            role: OrganizationRole.OWNER,
            status: UserStatus.approved,
            joinedAt: new Date(),
          },
        });

        return organization;
      });
    } catch (error) {
      this.handlePrismaError(error, "Organization");
    }
  }

  /**
   * Get organization by ID
   */
  async getById(organizationId: string): Promise<OrganizationWithRelations> {
    await this.verifyOrganizationAccess(organizationId);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: true,
        _count: {
          select: {
            members: true,
            products: true,
            productCombos: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    return organization;
  }

  /**
   * Get organization by slug
   */
  async getBySlug(slug: string): Promise<OrganizationWithRelations> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        owner: true,
        _count: {
          select: {
            members: true,
            products: true,
            productCombos: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    return organization;
  }

  /**
   * Update organization
   */
  async update(
    organizationId: string,
    data: UpdateOrganizationInput
  ): Promise<OrganizationWithRelations> {
    const membership = await this.verifyOrganizationAccess(organizationId);

    // Only owners and admins can update organization details
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenError("Insufficient permissions to update organization");
    }

    try {
      return await this.prisma.organization.update({
        where: { id: organizationId },
        data,
        include: {
          owner: true,
          _count: {
            select: {
              members: true,
              products: true,
              productCombos: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Organization");
    }
  }

  /**
   * Delete organization (only owner)
   */
  async delete(organizationId: string): Promise<void> {
    const membership = await this.verifyOrganizationAccess(organizationId);

    if (membership.role !== OrganizationRole.OWNER) {
      throw new ForbiddenError("Only organization owner can delete organization");
    }

    try {
      await this.prisma.organization.delete({
        where: { id: organizationId },
      });
    } catch (error) {
      this.handlePrismaError(error, "Organization");
    }
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId?: string): Promise<OrganizationWithRelations[]> {
    const currentUser = await this.getCurrentUser();
    const targetUserId = userId || currentUser.id;

    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        userId: targetUserId,
        status: UserStatus.approved,
      },
      include: {
        organization: {
          include: {
            owner: true,
            _count: {
              select: {
                members: true,
                products: true,
                productCombos: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    return memberships.map((membership) => membership.organization);
  }

  /**
   * Get organization members
   */
  async getMembers(
    organizationId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult<OrganizationMemberWithUser>> {
    await this.verifyOrganizationAccess(organizationId);

    const { skip, take } = this.buildPagination(page, limit);

    const [members, total] = await Promise.all([
      this.prisma.organizationMember.findMany({
        where: { organizationId },
        include: {
          user: true,
          organization: true,
        },
        orderBy: [
          { role: "asc" },
          { joinedAt: "desc" },
        ],
        skip,
        take,
      }),
      this.prisma.organizationMember.count({
        where: { organizationId },
      }),
    ]);

    return this.createPaginatedResult(members, total, page, limit);
  }

  /**
   * Add member to organization
   */
  async addMember(
    organizationId: string,
    data: OrganizationMemberInput
  ): Promise<OrganizationMemberWithUser> {
    const membership = await this.verifyOrganizationAccess(organizationId);

    // Only owners and admins can add members
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenError("Insufficient permissions to add members");
    }

    // Check if user is already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: data.userId,
          organizationId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError("User is already a member of this organization");
    }

    try {
      return await this.prisma.organizationMember.create({
        data: {
          ...data,
          organizationId,
          invitedBy: membership.userId,
        },
        include: {
          user: true,
          organization: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Organization member");
    }
  }

  /**
   * Update member role/status
   */
  async updateMember(
    organizationId: string,
    memberId: string,
    data: UpdateOrganizationMemberInput
  ): Promise<OrganizationMemberWithUser> {
    const membership = await this.verifyOrganizationAccess(organizationId);

    // Only owners and admins can update members
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenError("Insufficient permissions to update members");
    }

    const member = await this.prisma.organizationMember.findUnique({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundError("Organization member");
    }

    // Only owners can change other owners or promote to owner
    if (
      member.role === OrganizationRole.OWNER ||
      data.role === OrganizationRole.OWNER
    ) {
      if (membership.role !== OrganizationRole.OWNER) {
        throw new ForbiddenError("Only organization owner can manage owner role");
      }
    }

    try {
      return await this.prisma.organizationMember.update({
        where: { id: memberId },
        data,
        include: {
          user: true,
          organization: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Organization member");
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, memberId: string): Promise<void> {
    const membership = await this.verifyOrganizationAccess(organizationId);

    // Only owners and admins can remove members
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenError("Insufficient permissions to remove members");
    }

    const member = await this.prisma.organizationMember.findUnique({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundError("Organization member");
    }

    // Only owners can remove other owners
    if (member.role === OrganizationRole.OWNER && membership.role !== OrganizationRole.OWNER) {
      throw new ForbiddenError("Only organization owner can remove other owners");
    }

    // Cannot remove the last owner
    if (member.role === OrganizationRole.OWNER) {
      const ownerCount = await this.prisma.organizationMember.count({
        where: {
          organizationId,
          role: OrganizationRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new ConflictError("Cannot remove the last owner from organization");
      }
    }

    try {
      await this.prisma.organizationMember.delete({
        where: { id: memberId },
      });
    } catch (error) {
      this.handlePrismaError(error, "Organization member");
    }
  }

  /**
   * Create organization invitation
   */
  async createInvitation(
    organizationId: string,
    data: OrganizationInvitationInput
  ): Promise<any> {
    const membership = await this.verifyOrganizationAccess(organizationId);

    // Only owners and admins can invite
    if (membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN) {
      throw new ForbiddenError("Insufficient permissions to invite members");
    }

    // Check if user is already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const existingMember = await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId,
          },
        },
      });

      if (existingMember) {
        throw new ConflictError("User is already a member of this organization");
      }
    }

    // Check for existing invitation
    const existingInvitation = await this.prisma.organizationInvitation.findFirst({
      where: {
        email: data.email,
        organizationId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      throw new ConflictError("Active invitation already exists for this email");
    }

    try {
      return await this.prisma.organizationInvitation.create({
        data: {
          ...data,
          organizationId,
          invitedBy: membership.userId,
          token: this.generateInvitationToken(),
        },
        include: {
          organization: true,
          inviter: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, "Organization invitation");
    }
  }

  /**
   * Accept organization invitation
   */
  async acceptInvitation(token: string): Promise<OrganizationMemberWithUser> {
    const user = await this.getCurrentUser();
    if (!user?.id || !user?.email) {
      throw new ValidationError("User ID and email are required");
    }

    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      throw new NotFoundError("Invitation");
    }

    if (invitation.acceptedAt) {
      throw new ConflictError("Invitation has already been accepted");
    }

    if (invitation.expiresAt < new Date()) {
      throw new ConflictError("Invitation has expired");
    }

    if (invitation.email !== user.email) {
      throw new ForbiddenError("Invitation email does not match authenticated user");
    }

    try {
      return await this.withTransaction(async (tx) => {
        // Mark invitation as accepted
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        });

        // Create organization member
        const member = await tx.organizationMember.create({
          data: {
            userId: user.id!,
            organizationId: invitation.organizationId,
            role: invitation.role,
            status: UserStatus.approved,
            invitedBy: invitation.invitedBy,
            joinedAt: new Date(),
          },
          include: {
            user: true,
            organization: true,
          },
        });

        return member;
      });
    } catch (error) {
      this.handlePrismaError(error, "Accept invitation");
    }
  }

  /**
   * Generate invitation token
   */
  private generateInvitationToken(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

export const organizationService = new OrganizationService();
