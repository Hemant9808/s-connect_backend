import { Request, Response } from "express";
import { UserRole, GroupCategory } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import ApiError from "../utils/error";
// Utility middleware for authentication
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}
const prisma = new PrismaClient();

// class ApiError extends Error {
//   statusCode: number;

//   constructor(message: string, statusCode: number) {
//     super(message);
//     this.statusCode = statusCode;
//   }
// }

export const addGroupMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      // Fetch group, requester, and user details
      const [group, requester, user] = await Promise.all([
        tx.group.findUnique({
          where: { id: groupId },
          include: { admins: true, createdBy: true },
        }),
        tx.user.findUnique({ where: { id: requesterId } }),
        tx.user.findUnique({ where: { id: userId } }),
      ]);

      if (!group || !user) throw new ApiError("Group or user not found", 404);

      // Authorization check
      const isSuperAdmin = requester!.role === UserRole.SUPER_ADMIN;
      const isGroupAdmin = group.admins.some((a) => a.userId === requesterId);
      const isGroupCreator = group.createdById === requesterId;

      if (!isSuperAdmin && !isGroupAdmin && !isGroupCreator) {
        throw new ApiError("Unauthorized", 403);
      }

      // Check if user is already a member
      const existingMember = await tx.userGroupMembership.findFirst({
        where: { groupId, userId },
      });

      if (existingMember) throw new ApiError("User already in group", 409);

      // Create membership
      return tx.userGroupMembership.create({
        data: { groupId, userId },
      });
    });

    // Send success response
    res.status(201).json(result);
  } catch (error) {
    console.error(error);

    // Handle custom errors
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};


// Create Group Post

export const makeGroupAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { groupId, userId } = req.body;
    const requesterId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      // Fetch group, requester, and user details
      const [group, requester, user] = await Promise.all([
        tx.group.findUnique({
          where: { id: groupId },
          include: { admins: true, createdBy: true },
        }),
        tx.user.findUnique({ where: { id: requesterId } }),
        tx.user.findUnique({ where: { id: userId } }),
      ]);

      if (!group) throw new ApiError("Group not found", 404);
      if (!user) throw new ApiError("User not found", 404);

      // Authorization check
      const isSuperAdmin = requester!.role === UserRole.SUPER_ADMIN;
      const isGroupAdmin = group.admins.some((a) => a.userId === requesterId);
      const isGroupCreator = group.createdById === requesterId;

      if (!isSuperAdmin && !isGroupAdmin && !isGroupCreator) {
        throw new ApiError("Unauthorized to make this user an admin", 403);
      }

      // Check if user is a group member
      const isMember = await tx.userGroupMembership.findFirst({
        where: { groupId, userId },
      });

      if (!isMember) throw new ApiError("User is not a group member", 400);

      // Check if user is already an admin
      const existingAdmin = await tx.groupAdmin.findFirst({
        where: { groupId, userId },
      });

      if (existingAdmin) throw new ApiError("User is already an admin", 409);

      // Promote user to admin
      return tx.groupAdmin.create({
        data: { groupId, userId },
      });
    });

    // Send success response
    res.status(201).json(result);
  } catch (error) {
    console.error(error);

    // Handle custom errors
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

export const createGroupPost = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  
  try {
    
    const { groupId, title, description, mainImg, secondaryDesc,secondaryImg } = req.body;
    const authorId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      // Fetch group and author details
      const [group, author] = await Promise.all([
        tx.group.findUnique({ where: { id: groupId } }),
        tx.user.findUnique({ where: { id: authorId } }),
      ]);

      if (!group) throw new ApiError("Group not found", 404);
      if (!author) throw new ApiError("User not found", 404);

      // Check if the user has permission to post
      const isMember = await tx.userGroupMembership.findFirst({
        where: { groupId, userId: authorId },
      });

      const isSuperAdmin = author.role === UserRole.SUPER_ADMIN;
      const isPublicGroup = group.isPublic;

      if (!isMember && !isSuperAdmin && !isPublicGroup) {
        throw new ApiError("Not authorized to post in this group", 403);
      }

      // Create the post
      return tx.post.create({
        data: { title, description, mainImg, secondaryDesc,secondaryImg, groupId, authorId },
      });
    });

    // Send success response
    res.status(201).json(result);
  } catch (error) {
    console.error(error);

    // Handle custom errors
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};






export const getGroupMembers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;

    // Fetch the group and its members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user:{
             
            }
            // : {
            //   select: { id: true, email: true, role: true, type: true, createdAt: true },
            // },
          },
        },
      },
    });

    if (!group) {
      throw new ApiError("Group not found", 404);
    }

    // Extract member details
    const members = group.members.map((member) => member.user);

    res.status(200).json(members);
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

//fetch all groups
export const getAllGroups = async (req: Request, res: Response): Promise<void> => {
  try {
      const groups = await prisma.group.findMany({
          include: {
              createdBy: true,   // Include creator details
              admins: true,      // Include admins
              members: true,     // Include members
              posts: true,       // Include posts
          }
      });

      res.status(200).json({ success: true, data: groups });
  } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//Remove Admin
export const removeGroupAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
      const { groupId, userId } = req.body;

      // Check if the group exists
      const group = await prisma.group.findUnique({
          where: { id: groupId },
          include: { admins: true },
      });

      if (!group) {
          res.status(404).json({ success: false, message: "Group not found" });
          return;
      }

      // Check if the admin exists
      const adminRecord = await prisma.groupAdmin.findFirst({
          where: { groupId, userId: userId },
      });

      if (!adminRecord) {
          res.status(400).json({ success: false, message: "User is not an admin of this group" });
          return;
      }

      // Ensure at least one admin remains
      if (group.admins.length === 1) {
          res.status(400).json({ success: false, message: "Group must have at least one admin" });
          return;
      }

      // Remove the admin
      await prisma.groupAdmin.deleteMany({
          where: { groupId, userId: userId },
      });

      res.status(200).json({ success: true, message: "Admin removed successfully" });
  } catch (error) {
      console.error("Error removing admin:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};