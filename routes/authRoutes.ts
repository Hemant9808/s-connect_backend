import { Router } from "express";
import { register, login, getProfile, adminAccess, verifyOtp } from "../controllers/authController";
import { authenticate, authorize } from "../middleware/authMiddleware";


const router = Router();

// Authentication routes
router.post("/register", register);
router.post("/verifyOtp", verifyOtp);

router.post("/login", login);
router.get("/profile",authenticate, getProfile);
router.get("/admin", authenticate, authorize(["ADMIN", "SUPER_ADMIN"]), adminAccess);

export default router;
