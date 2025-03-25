import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { addGroupMember, createGroupPost, getGroupMembers, makeGroupAdmin, getAllGroups, removeGroupAdmin, createGroup, updateGroup, getPosts, getPostById, getGroupById, deleteGroup, editGroupPost, deleteGroupPost, selfAddMember, getMyGroups, getAllPosts,getGroupPosts, fetchJoinedGroups } from "../controllers/groupController";

const router = Router();

router.post("/addMember", authenticate, addGroupMember);
router.post("/addAdmin", authenticate, makeGroupAdmin);
router.post("/post",authenticate, createGroupPost);
router.get("/getMembers/:groupId", getGroupMembers);
router.get("/groups", getAllGroups);
router.post("/removeAdmin", authenticate, removeGroupAdmin);
router.post("/create", createGroup); // New group creation endpoint
router.put("/update", authenticate, updateGroup);
router.post("/getPosts", getPosts);
router.post("/getPostById", getPostById);
router.get("/:groupId", getGroupById);
router.delete('/:groupId', authenticate, deleteGroup);
router.post('/selfAddMember',authenticate, selfAddMember);


router.put("/groups/posts/:postId", editGroupPost);

router.delete("/groups/posts/:postId", deleteGroupPost);

// Get user's joined groups
router.get('/me', authenticate, getMyGroups);

// Get all posts for home feed
router.post('/posts/all', getAllPosts);

// New endpoint to fetch groups the user has joined
router.get("/fetchjoinedgroups", authenticate, fetchJoinedGroups);

router.get("/:groupId/posts", authenticate, getGroupPosts); // Get posts for a specific group

export default router;
