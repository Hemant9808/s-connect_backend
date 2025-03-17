import express, { Router } from "express";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { createEvent, deleteEvent, updateEvent } from "../controllers/eventController";
import { UserRole } from "@prisma/client";

const router = Router();

router.post("/events",
    //  authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), 
     createEvent);
router.put("/events/:eventId", updateEvent);
router.delete("/events/:eventId", deleteEvent);

export default router;