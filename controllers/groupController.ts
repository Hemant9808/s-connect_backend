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
    
    const { groupId, title, description, secondaryDesc,secondaryImg, content,mediaUrl } = req.body;
    console.log("req.body",req.body);
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
        data: { title, description:description, mainImg:mediaUrl, secondaryDesc:secondaryDesc,secondaryImg:secondaryImg, groupId, authorId,content },
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
     const  { name, description, category, creatorId, members = [], admins = [], tags,imageUrl,year,section,branch } = req.body;
     console.log("req.body",req.body);
    const group = await prisma.group.create({
      data: {
        name,
        description,
        category,      
        tags , 
        imageUrl ,  
        createdBy: { connect: { id: creatorId } },
        year,
        section,
        branch,
      },
    });
    console.log("group",group);

    const allMemberIds = Array.from(new Set([creatorId, ...members, ...admins]));

    for (const userId of allMemberIds) {
      await prisma.userGroupMembership.create({
        data: {
          groupId: group.id,
          userId,
        },
      });
    }

    const groupAdminIds = admins.length > 0 ? Array.from(new Set([...admins, creatorId])) : [creatorId];

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



export const updateGroup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { groupId, name, description, category, isPublic } = req.body;
    const requesterId = req.user!.id;

    console.log('Update payload:', { name, description, category, isPublic });

    if (!groupId) throw new ApiError("Group ID is required", 400);
    if (category && !Object.values(GroupCategory).includes(category)) {
      throw new ApiError("Invalid group category", 400);
    }

    const updatedGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          createdById: true,
          admins: { select: { userId: true } },
        },
      });

      if (!group) throw new ApiError("Group not found", 404);

      const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
      const isGroupAdmin = group.admins.some(a => a.userId === requesterId);
      const isGroupCreator = group.createdById === requesterId;

      if (!isSuperAdmin && !isGroupAdmin && !isGroupCreator) {
        throw new ApiError("Unauthorized to update group", 403);
      }

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
const checkAddMemberCondtions = (user,group) => { 
  if (!group) throw new ApiError("Group not found", 404);
  if (!user) throw new ApiError("User not found", 404);
  if(user.role === UserRole.SUPER_ADMIN) return true;
  if (group.isPublic) return true;
  if (group?.createdById === user.id) return true;
  if (Array.isArray(group?.admins) && group?.admins?.some((a) => a.userId === user.id)) return true;
  // if (group?.members && group?.members?.some((m:any) => m.userId === user.id)) return true;
  if (Array.isArray(group?.members) && group.members.some((m: any) => m.userId === user.id)) {
   
    return true;
}

console.log(group.year,user.year,group.branch,user.branch,group.section,user.section)


  if(group.year == user.year && group.branch == user.branch &&
    (group.section === null || group.section === undefined ||user.section === null || group.section === user.section)
    ){
      console.log(group.year,user.year,group.branch,user.branch,group.section,user.section)
      console.log("rejectng from here")
    return true;
  }
  return false;
 
  
}

export const  selfAddMember =async(req,res)=>{
   const user = req.user; 
   const {groupId} = req.body;

   const group = await prisma.group.findUnique({
    where:{
      id:groupId
    }
   })

   console.log("group",group);

   const iseligible = checkAddMemberCondtions(user,group);
   if(!iseligible){
   return res.status(403).json({message:"You are not eligible to join this group"});
  
  }
  const response=await prisma.userGroupMembership.create({
    data:{
      userId:user.id,
      groupId:groupId
    }
 })


 return res.status(200).json({response,message:"Successfully added to the group",status:true});




  }




  export const editGroupPost = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { postId } = req.params; // Post ID from URL params
      console.log("req.body",req.params,req.body);
      const { title, description, secondaryDesc, secondaryImg, content, mediaUrl } = req.body; // Fields to update
      // const authorId = req.user!.id; // Authenticated user ID
  
      const result = await prisma.$transaction(async (tx) => {
        // Fetch the post and author details
        const [post] = await Promise.all([
          tx.post.findUnique({ where: { id: postId } }),
          // tx.user.findUnique({ where: { id: authorId } }),
        ]);
        console.log("post ...",post);

        if (!post) throw new ApiError("Post not found", 404);
        // if (!author) throw new ApiError("User not found", 404);
  
        // Check if the user is the author or a super admin
        // const isAuthor = post.authorId === authorId;
        // const isSuperAdmin = author.role === UserRole.SUPER_ADMIN;
  
        // if (!isAuthor && !isSuperAdmin) {
        //   throw new ApiError("Not authorized to edit this post", 403);
        // }
  
        // Update the post
        return tx.post.update({
          where: { id: postId },
          data: {
            title,
            description,
            secondaryDesc,
            secondaryImg,
            content,
            mainImg: mediaUrl,
          },
        });
      });
  
      // Send success response
      console.log("result",result);

      res.status(200).json(result);
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




  export const deleteGroupPost = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { postId } = req.params; // Post ID from URL params
      // const authorId = req.user!.id; // Authenticated user ID
  
      const result = await prisma.$transaction(async (tx) => {
        // Fetch the post and author details
        const [post] = await Promise.all([
          tx.post.findUnique({ where: { id: postId } }),
          // tx.user.findUnique({ where: { id: authorId } }),
        ]);
  
        if (!post) throw new ApiError("Post not found", 404);
        // if (!author) throw new ApiError("User not found", 404);
  
        // Check if the user is the author or a super admin
        // const isAuthor = post.authorId === authorId;
        // const isSuperAdmin = author.role === UserRole.SUPER_ADMIN;
  
        // if (!isAuthor && !isSuperAdmin) {
        //   throw new ApiError("Not authorized to delete this post", 403);
        // }
  
        // Delete the post
        return tx.post.delete({
          where: { id: postId },
        });
      });
  
      // Send success response
      res.status(200).json({ message: "Post deleted successfully" });
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












// Get groups user has joined
export const getMyGroups = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const memberships = await prisma.userGroupMembership.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            createdBy: true,
            admins: true,
            members: true,
          }
        }
      },
      orderBy: { group: { createdAt: 'desc' } }
    });

    const groups = memberships.map(membership => membership.group);
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all posts for home feed
export const getAllPosts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
