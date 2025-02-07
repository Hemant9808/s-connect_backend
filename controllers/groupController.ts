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

// export const addGroupMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//   try {
//     const { groupId, userId } = req.body;
//     const requesterId = req.user!.id;

//     const result = await prisma.$transaction(async (tx) => {
//       // Fetch group, requester, and user details
//       const [group, requester, user] = await Promise.all([
//         tx.group.findUnique({
//           where: { id: groupId },
//           include: { admins: true, createdBy: true }
//         }),
//         tx.user.findUnique({ where: { id: requesterId } }),
//         tx.user.findUnique({ where: { id: userId } })
//       ]);

//       if (!group || !user) {
//         throw new Error("NOT_FOUND"); // Throw error to handle outside transaction
//       }

//       // Authorization check
//       const isSuperAdmin = requester!.role === UserRole.SUPER_ADMIN;
//       const isGroupAdmin = group.admins.some(a => a.userId === requesterId);
//       const isGroupCreator = group.createdById === requesterId;

//       if (!isSuperAdmin && !isGroupAdmin && !isGroupCreator) {
//         throw new Error("UNAUTHORIZED");
//       }

//       // Check if user is already a member
//       const existingMember = await tx.userGroupMembership.findFirst({
//         where: { groupId, userId } // ✅ Correct for MongoDB (No composite unique constraint)
//       });

//       if (existingMember) {
//         throw new Error("ALREADY_MEMBER");
//       }

//       // Create membership
//       return tx.userGroupMembership.create({
//         data: { groupId, userId }
//       });
//     });

//     // Send successful response **after** transaction
//     res.status(201).json(result);
//   } catch (error) {
//     console.error(error);
//     // Handle errors properly based on type
//     if (error.message === "NOT_FOUND") {
//       res.status(404).json({ message: "Group or user not found" });
//     } else if (error.message === "UNAUTHORIZED") {
//       res.status(403).json({ message: "Unauthorized" });
//     } else if (error.message === "ALREADY_MEMBER") {
//       res.status(409).json({ message: "User already in group" });
//     } else {
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// };

// Add Member to Group
// export const addGroupMember = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const { groupId, userId } = req.body;
//     const requesterId = req.user!.id;

//     return await prisma.$transaction(async (tx) => {
//       // Get requester and group with admin info
//       const [group, requester, user] = await Promise.all([
//         tx.group.findUnique({
//           where: { id: groupId },
//           include: { admins: true, createdBy: true }
//         }),
//         tx.user.findUnique({ where: { id: requesterId } }),
//         tx.user.findUnique({ where: { id: userId } })
//       ]);

//       if (!group || !user) {
//         return res.status(404).json({ message: 'Group or user not found' });
//       }

//       // Authorization check
//       const isSuperAdmin = requester!.role === UserRole.SUPER_ADMIN;
//       const isGroupAdmin = group.admins.some(a => a.userId === requesterId);
//       const isGroupCreator = group.createdById === requesterId;

//       if (!isSuperAdmin && !isGroupAdmin && !isGroupCreator) {
//         return res.status(403).json({ message: 'Unauthorized' });
//       }

//       // Check existing membership
//     //   const existingMember = await tx.userGroupMembership.findUnique({
//     //     where: { groupId_userId: { groupId, userId } }
//     //   });
//       const existingMember = await tx.userGroupMembership.findFirst({
//         where: { groupId, userId } // ✅ Correct approach if composite key exists
//       });

//       if (existingMember) {
//         return res.status(409).json({ message: 'User already in group' });
//       }

//       // Create membership
//       const membership = await tx.userGroupMembership.create({
//         data: { groupId, userId }
//       });

//        res.status(201).json(membership);
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// Make User Group Admin

// export const makeGroupAdmin = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const { groupId, userId } = req.body;
//     const requesterId = req.user!.id;

//     return await prisma.$transaction(async (tx) => {
//       const [group, requester, user] = await Promise.all([
//         tx.group.findUnique({
//           where: { id: groupId },
//           include: { admins: true, createdBy: true }
//         }),
//         tx.user.findUnique({ where: { id: requesterId } }),
//         tx.user.findUnique({ where: { id: userId } })
//       ]);

//       if (!group || !user) {
//         return res.status(404).json({ message: 'Group or user not found' });
//       }

//       // Authorization check
//       const isSuperAdmin = requester!.role === UserRole.SUPER_ADMIN;
//       const isGroupAdmin = group.admins.some(a => a.userId === requesterId);
//       const isGroupCreator = group.createdById === requesterId;

//       if (!isSuperAdmin && !isGroupAdmin && !isGroupCreator) {
//         return res.status(403).json({ message: 'Unauthorized' });
//       }

//       // Check if user is group member
//       const isMember = await tx.userGroupMembership.findFirst({
//         where: { groupId, userId }
//       });

//       if (!isMember) {
//         return res.status(400).json({ message: 'User not a group member' });
//       }

//       // Check existing admin
//       const existingAdmin = await tx.groupAdmin.findFirst({
//         where: {  groupId, userId }
//       });

//       if (existingAdmin) {
//         return res.status(409).json({ message: 'User already admin' });
//       }

//       const newAdmin = await tx.groupAdmin.create({
//         data: { groupId, userId }
//       });

//       return res.status(201).json(newAdmin);
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

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

// export const createGroupPost = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const { groupId, title, content } = req.body;
//     const authorId = req.user!.id;

//     return await prisma.$transaction(async (tx) => {
//       const [group, author] = await Promise.all([
//         tx.group.findUnique({ where: { id: groupId } }),
//         tx.user.findUnique({ where: { id: authorId } })
//       ]);

//       if (!group || !author) {
//         return res.status(404).json({ message: 'Group or user not found' });
//       }

//       // Check membership or public access
//       const isMember = await tx.userGroupMembership.findFirst({
//         where: { groupId, userId: authorId }
//       });

//       const isSuperAdmin = author.role === UserRole.SUPER_ADMIN;
//       const isPublicGroup = group.isPublic;

//       if (!isMember && !isSuperAdmin && !isPublicGroup) {
//         return res.status(403).json({ message: 'Not authorized to post in this group' });
//       }

//       const post = await tx.post.create({
//         data: {
//           title,
//           content,
//           groupId,
//           authorId
//         }
//       });

//       return res.status(201).json(post);
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };
