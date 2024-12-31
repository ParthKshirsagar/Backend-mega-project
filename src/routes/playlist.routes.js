import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/create").post(createPlaylist);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route('/update/:playlistId').patch(updatePlaylist);
router.route("/get-user-playlists/:userId").get(getUserPlaylists);
router.route("/delete/:playlistId").delete(deletePlaylist);
router.route("/get/:playlistId").get(getPlaylistById);

export default router;