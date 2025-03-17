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

// Unified routes with proper syntax
router.route("/events")
  .post(authenticate, authorize([UserRole.SUPER_ADMIN]), createEvent)
  .get(authenticate, getEvents);

router.route("/events/:eventId")
  .put(authenticate, authorize([UserRole.SUPER_ADMIN]), updateEvent)
  .delete(authenticate, authorize([UserRole.SUPER_ADMIN]), deleteEvent);

export default router;
