// import express, { Router } from "express";
// import { authenticate, authorize } from "../middleware/authMiddleware";
// import { createEvent, deleteEvent, updateEvent } from "../controllers/eventController";
// import { UserRole } from "@prisma/client";

// const router = Router();

// router.post("/events",
//     //  authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.ADMIN]), 
//      createEvent);
// router.put("/events/:eventId", updateEvent);
// router.delete("/events/:eventId", deleteEvent);

// export default router;




//Nilesh Don ka code hai re chotu
import express, { Router } from "express";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { createEvent, deleteEvent, updateEvent, getEvents } from "../controllers/eventController";
import { UserRole } from "@prisma/client";

const router = Router();

// POST /api/event/events
router.post(
  "/events",
  authenticate,
  authorize([UserRole.SUPER_ADMIN]),
  createEvent
);

// GET /api/event/events
router.get("/events", 
  authenticate,
  getEvents
);

// PUT /api/event/events/:eventId
router.put("/events/:eventId",
  authenticate,
  authorize([UserRole.SUPER_ADMIN]),
  updateEvent
);

// DELETE /api/event/events/:eventId
router.delete("/events/:eventId",
  authenticate,
  authorize([UserRole.SUPER_ADMIN]),
  deleteEvent
);

export default router;
