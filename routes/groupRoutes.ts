import {Router} from 'express'
import { authenticate } from '../middleware/authMiddleware'
import { addGroupMember, createGroupPost, getGroupMembers, makeGroupAdmin } from '../controllers/groupController';


const router = Router()

router.post("/addMember",authenticate,addGroupMember);
router.post("/addAdmin",authenticate,makeGroupAdmin)
router.post("/post",authenticate,createGroupPost)
router.get("/getMembers/:groupId",getGroupMembers);


export default router;