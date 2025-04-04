
import { Request, Response } from "express";
import {  UserRole } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import ApiError from "../utils/error";

const prisma = new PrismaClient();

// export const createEvent = async (
//   req: any,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { title, description, dateTime, mediaUrl, targetType, targetValue } = req.body;
//     const authorId = req.user!.id;

//     // Validate target type-value combination
//     if (targetType !== "EVERYONE" && !targetValue) {
//       throw new ApiError("Target value is required for this target type", 400);
//     }

//     const event = await prisma.event.create({
//       data: {
//         title,
//         description,
//         dateTime: new Date(dateTime),
//         mediaUrl,
//         targetType,
//         targetValue,
//         authorId
//       },
//     });

//     res.status(201).json(event);
//   } catch (error) {
//     console.error(error);
//     if (error instanceof ApiError) {
//       res.status(error.statusCode).json({ message: error.message });
//     } else {
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// };

export const updateEvent = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { title, description, dateTime, mediaUrl, targetType, targetValue } = req.body;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new ApiError("Event not found", 404);

    // Authorization: Only author or SUPER_ADMIN can update
    if (event.authorId !== userId && req.user!.role !== UserRole.SUPER_ADMIN) {
      throw new ApiError("Unauthorized to update this event", 403);
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        dateTime: dateTime ? new Date(dateTime) : undefined,
        mediaUrl,
        targetType,
        targetValue
      },
    });

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};

export const deleteEvent = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new ApiError("Event not found", 404);

    // Authorization: Only author or SUPER_ADMIN can delete
    if (event.authorId !== userId && req.user!.role !== UserRole.SUPER_ADMIN) {
      throw new ApiError("Unauthorized to delete this event", 403);
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
};









// Nilesh Don ka code
export const getEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get all events, not just current user's
    const events = await prisma.event.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dateTime: 'asc' },
    });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



export const createEvent = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const { title, description, dateTime, mediaUrl, targetType, targetValue } = req.body;
    const authorId = req.user.id; // Ensure authentication middleware is enabled

    // Validation
    if (!title || !description || !dateTime) {
      throw new ApiError("Missing required fields", 400);
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        dateTime: new Date(dateTime),
        mediaUrl: mediaUrl || null,
        targetType,
        targetValue,
        authorId
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create Event Error:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
