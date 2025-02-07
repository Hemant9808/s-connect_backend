import {Router} from 'express'
import { authenticate } from '../middleware/authMiddleware'
import { addGroupMember, createGroupPost, makeGroupAdmin } from '../controllers/groupController';


const router = Router()

router.post("/addMember",authenticate,addGroupMember);
router.post("/addAdmin",authenticate,makeGroupAdmin)
router.post("/post",authenticate,createGroupPost)


export default router;