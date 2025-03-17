import express, { Router } from "express";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { createEvent, deleteEvent, updateEvent, getEvents } from "../controllers/eventController";
import { UserRole } from "@prisma/client";

const router = Router();

router.post("/events",
    //  authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), 
     createEvent);
router.put("/events/:eventId", updateEvent);
router.delete("/events/:eventId", deleteEvent);
router.get("/events", authenticate, getEvents);         //Added by Nilesh Don

export default router;
