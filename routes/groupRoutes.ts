import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { addGroupMember, createGroupPost, getGroupMembers, makeGroupAdmin, getAllGroups, removeGroupAdmin } from "../controllers/groupController";

const router = Router();

router.post("/addMember", authenticate, addGroupMember);
router.post("/addAdmin", authenticate, makeGroupAdmin);
router.post("/post", authenticate, createGroupPost);
router.get("/getMembers/:groupId", getGroupMembers);
router.get("/groups", getAllGroups);
router.post("/removeAdmin", authenticate, removeGroupAdmin);

export default router;