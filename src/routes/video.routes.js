import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getVideoById, getVideos, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/publish-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo
);


router.route("/delete/:videoId").delete(deleteVideo);
router.route("/toggle-publish-status/:videoId").patch(togglePublishStatus);
router.route("/update/:videoId").patch(
    upload.single("thumbnail"),
    updateVideo
);
router.route("/get/:videoId").get(getVideoById);
router.route("/get-all-videos").get(getVideos);

export default router;