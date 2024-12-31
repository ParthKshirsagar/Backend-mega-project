import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWT);;

router.route("/c/:channelId").post(toggleSubscription);
router.route("/get-subscribers").get(getUserChannelSubscribers);
router.route("/get-subscribed-channels").get(getSubscribedChannels);

export default router;