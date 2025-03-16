import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { addGroupMember, createGroupPost, getGroupMembers, makeGroupAdmin, getAllGroups, removeGroupAdmin, createGroup, updateGroup, getPosts } from "../controllers/groupController";

const router = Router();

router.post("/addMember", authenticate, addGroupMember);
router.post("/addAdmin", authenticate, makeGroupAdmin);
router.post("/post", createGroupPost);
router.get("/getMembers/:groupId", getGroupMembers);
router.get("/groups", getAllGroups);
router.post("/removeAdmin", authenticate, removeGroupAdmin);
router.post("/create", createGroup); // New group creation endpoint
router.put("/update", authenticate, updateGroup);
router.post("/getPosts", getPosts);

export default router;
