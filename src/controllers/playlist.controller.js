import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyOwnerStatus = (userId, owner) => {
    const isLoggedInUserTheOwner = owner.equals(userId) ? true : false;
    if(!isLoggedInUserTheOwner){
        throw new ApiError(
            401,
            "Unauthorized request"
        )
    }
}

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, visibility = false } = req.body;

    if(!name){
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        owner: req.user._id,
        name,
        description: description || "",
        visibility: Boolean(visibility) || false
    });
    if(!playlist){
        throw new ApiError(500, "Failed to create playlist");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Playlist created successfully"
    ));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if(!playlistId || !videoId){
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    verifyOwnerStatus(req.user._id, playlist.owner);

    console.log(playlist.videos);

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video already added to playlist");
    }

    playlist.videos.unshift(videoId);
    await playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video added to playlist successfully"
        )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if(!playlistId || !videoId){
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    verifyOwnerStatus(req.user._id, playlist.owner);

    if(!playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video not found in playlist");
    }

    playlist.videos = playlist.videos.filter(
        (video) => !video.equals(videoId)
    );
    await playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video removed from playlist successfully"
        )
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description, visibility } = req.body;

    if(!playlistId){
        throw new ApiError(400, "Playlist ID is required");
    }
    if(!name && !description && visibility === undefined){
        throw new ApiError(400, "Name or description or visibility is required to be updated");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    verifyOwnerStatus(req.user._id, playlist.owner);

    playlist.name = name || playlist.name;
    playlist.description = description || playlist.description;
    if(visibility !== undefined){
        playlist.visibility = Boolean(visibility);
    }
    await playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist updated successfully"
        )
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if(!userId){
        throw new ApiError(400, "User ID is required");
    }

    let playlists;
    if(userId == req.user._id){
        playlists = await Playlist.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videosList",
                    pipeline: [
                        {
                            $project: {
                                thumbnail: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    thumbnail: {
                        $first: "$videosList.thumbnail"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    visibility: 1,
                    updatedAt: 1,
                    thumbnail: 1,
                }
            }
        ]);
    } else {
        playlists = await Playlist.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                    visibility: true
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videosList",
                    pipeline: [
                        {
                            $project: {
                                thumbnail: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    thumbnail: {
                        $first: "$videosList.thumbnail"
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    updatedAt: 1,
                    thumbnail: 1,
                }
            }
        ]);
    }
    if(!playlists){
        throw new ApiError(404, "No playlists found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlists,
            "User playlists retrieved successfully"
        )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if(!playlistId){
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    verifyOwnerStatus(req.user._id, playlist.owner);

    await Playlist.findByIdAndDelete(playlistId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Playlist deleted successfully"
        )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if(!playlistId){
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            owner: {
                                $first: "$owner"
                            },
                            title: 1,
                            thumbnail: 1,
                            views: 1,
                            createdAt: 1,
                            duration: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                thumbnail: {
                    $first: "$videos.thumbnail"
                },
                numberOfVideos: {
                    $size: "$videos"
                }
            }
        },
        {
            $project: {
                title: 1,
                owner: 1,
                videos: 1,
                numberOfVideos: 1,
                thumbnail: 1,
                visibility: 1
            }
        }
    ]);
    if(!playlist?.length){
        throw new ApiError(404, "Playlist not found");
    }

    if(playlist[0].visibility == false && !playlist[0].owner.equals(req.user._id)){
        throw new ApiError(401, "Unauthorized request");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist retrieved successfully"
        )
    );
});

export {
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    getUserPlaylists,
    deletePlaylist,
    getPlaylistById
}