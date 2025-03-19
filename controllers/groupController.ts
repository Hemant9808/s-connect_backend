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
        // where: {userId },
        where: { 
          userId, 
          groupId 
        },
      });
 console.log("existingMember");
 
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
    
    const { groupId, title, description, secondaryDesc,secondaryImg, content,mediaUrl,authorId ="67b49a81293a1b1ab92883ff" } = req.body;
    console.log("req.body",req.body);
    // const authorId = req.user!.id;


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
        data: { title, description:description, mainImg:mediaUrl, secondaryDesc:secondaryDesc,secondaryImg:secondaryImg, groupId, authorId:"67b49a81293a1b1ab92883ff",content },
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


export const getPosts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  
  try {
    
    const { groupId  } = req.body;
    console.log("req.body",req.body);
    // const authorId = req.user!.id;
    

    const result = await prisma.$transaction(async (tx) => {
      // Fetch group and author details
      const [posts] = await Promise.all([
        tx.post.findMany({ where: { groupId: groupId },
          include: {
            author: {
              select: {
                id: true,
                name: true, // Add other author fields you want to retrieve
                email: true,
              },
            },
          },
         }),
        // tx.user.findUnique({ where: { id: authorId } }),
      ]);

      
      return posts;
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
              posts: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true, 
                      email: true,
                    },
                  },
                },
              },       
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







// Create Group functionality


export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Destructure fields from the request body.
    // Expecting:
    // name, description, category, creatorId are required.
    // members, admins, tags are optional arrays.
    const  { name, description, category, creatorId, members = [], admins = [], tags,imageUrl } = req.body;
    // Create the group record.
    const group = await prisma.group.create({
      data: {
        name,
        description,
        category,      
        tags , 
        imageUrl ,  
        createdBy: { connect: { id: creatorId } },
      },
    });

    // Combine creator with any additional members or admins (to ensure they all become members)
    const allMemberIds = Array.from(new Set([creatorId, ...members, ...admins]));

    // Create membership records for each unique user.
    for (const userId of allMemberIds) {
      await prisma.userGroupMembership.create({
        data: {
          groupId: group.id,
          userId,
        },
      });
    }

    // If no admins are provided, default to creator.
    const groupAdminIds = admins.length > 0 ? Array.from(new Set([...admins, creatorId])) : [creatorId];

    // Create admin records for each admin user.
    for (const userId of groupAdminIds) {
      await prisma.groupAdmin.create({
        data: {
          groupId: group.id,
          userId,
        },
      });
    }

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Server error" });
  }
};



//Update Group
export const updateGroup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { groupId, name, description, category, isPublic } = req.body;
    const requesterId = req.user!.id;

    // Debug log to see incoming values
    console.log('Update payload:', { name, description, category, isPublic });

    // Validate input first before starting transaction
    if (!groupId) throw new ApiError("Group ID is required", 400);
    if (category && !Object.values(GroupCategory).includes(category)) {
      throw new ApiError("Invalid group category", 400);
    }

    const updatedGroup = await prisma.$transaction(async (tx) => {
      // Optimized query - only fetch necessary fields
      const group = await tx.group.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          createdById: true,
          admins: { select: { userId: true } },
        },
      });

      if (!group) throw new ApiError("Group not found", 404);

      // Authorization check using cached user info from auth middleware
      const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
      const isGroupAdmin = group.admins.some(a => a.userId === requesterId);
      const isGroupCreator = group.createdById === requesterId;

      if (!isSuperAdmin && !isGroupAdmin && !isGroupCreator) {
        throw new ApiError("Unauthorized to update group", 403);
      }

      // Build update payload
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (category) updateData.category = category;
      if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;

      if (Object.keys(updateData).length === 0) {
        throw new ApiError("No valid fields to update", 400);
      }

      return tx.group.update({
        where: { id: groupId },
        data: updateData,
        select: { 
          id: true,
          name: true,
          description: true,
          category: true,
          isPublic: true,
          updatedAt: true
        }
      });
    }, {
      maxWait: 10000,
      timeout: 10000
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error('Update Group Error:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};


export const getPostById = async (req: any, res: any) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ success: false, message: "postId is required" });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true, // Include relevant author fields
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true, // Include relevant group fields
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("Error fetching post:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};








// Nilesh Tyagi Ji codes again
export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        createdBy: true,
        admins: {
          include: {
            user: true
          }
        },
        members: true,
        posts: true
      }
    });

    if (!group) throw new ApiError("Group not found", 404);

    res.status(200).json({
      success: true,
      data: {
        ...group,
        totalMembers: group.members.length,
        totalPosts: group.posts.length
      }
    });
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};








export const deleteGroup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      // Verify group exists
      const group = await tx.group.findUnique({
        where: { id: groupId },
        include: { createdBy: true, admins: true },
      });

      if (!group) throw new ApiError("Group not found", 404);

      // Authorization check
      const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
      const isGroupCreator = group.createdById === userId;
      
      if (!isSuperAdmin && !isGroupCreator) {
        throw new ApiError("Unauthorized to delete this group", 403);
      }

      // Delete related records first
      await Promise.all([
        tx.userGroupMembership.deleteMany({ where: { groupId } }),
        tx.groupAdmin.deleteMany({ where: { groupId } }),
        tx.post.deleteMany({ where: { groupId } }),
      ]);

      // Finally delete the group
      return tx.group.delete({
        where: { id: groupId },
      });
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Delete Group Error:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};
