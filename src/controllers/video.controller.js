import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, deleteVideoFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";


const verifyOwnerStatus = (userId, videoOwner) => {
    const isLoggedInUserTheOwner = videoOwner.equals(userId) ? true : false;
    if(!isLoggedInUserTheOwner){
        throw new ApiError(
            401,
            "Unauthorized request"
        )
    }
}

const publishVideo = asyncHandler(async(req, res) => {
    const { title, description, isPublished=1 } = req.body;

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoFileLocalPath || !thumbnailLocalPath || !title || !description){
        throw new ApiError(
            400,
            "All fields are required"
        )
    }

    const videoFile = await uploadToCloudinary(videoFileLocalPath);
    const thumbnail = await uploadToCloudinary(thumbnailLocalPath);

    if(!thumbnail || !videoFile){
        throw new ApiError(
            500,
            "Error while uploading video file or thumbnail to cloudinary"
        )
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        duration: videoFile.duration,
        title: title?.trim(),
        description: description,
        isPublished: Boolean(Number(isPublished))
    });

    if(!video){
        throw new ApiError(
            500,
            "Error while creating video document"
        )
    }

    return res.
    status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video published successfully"
        )
    )
    
});

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(
            404,
            "Video not found"
        )
    }
    
    verifyOwnerStatus(req.user?._id, video.owner);

    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if(!deletedVideo){
        throw new ApiError(
            500,
            "Error while deleting the video"
        );
    }

    await deleteFromCloudinary([video.thumbnail]);
    await deleteVideoFromCloudinary(video.videoFile);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Video deleted successfully"
        )
    );
});

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(
            404,
            "Video not found"
        );
    }

    verifyOwnerStatus(req.user?._id, video.owner);

    video.isPublished = !video.isPublished;
    await video.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            video.isPublished ? "Video published successfully" : "Video unpublished successfully"
        )
    )
});

const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    let newThumbnailLocalPath;

    if(req.file?.path){
        newThumbnailLocalPath = req.file.path;
    }

    if(!title && !description && !newThumbnailLocalPath){
        throw new ApiError(
            400,
            "Atlest one field needs to be given to be updated"
        )
    }

    const video = await Video.findById(videoId);
    verifyOwnerStatus(req.user?.id, video.owner);

    video.title = title ? title : video.title;
    video.description = description ? description : video.description;
    
    if(newThumbnailLocalPath){
        const newThumbnail = await uploadToCloudinary(newThumbnailLocalPath);
        if(!newThumbnail){
            throw new ApiError(
                500,
                "Error while uploading new thumbnail to cloudinary"
            )
        }

        await deleteFromCloudinary([video.thumbnail]);
        video.thumbnail = newThumbnail.url;
    }

    await video.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video details updated successfully"
        )
    );
});

const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            fullName: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                owner: 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                likesCount: 1
            }
        }
    ]);
    if(!video){
        throw new ApiError(
            404,
            "Video not found"
        );
    }

    // adding views to the video
    const currentUser = await User.findById(req.user?._id);
    if(!currentUser.watchHistory.includes(new mongoose.Types.ObjectId(videoId))){
        await Video.findByIdAndUpdate(new mongoose.Types.ObjectId(videoId), {
            $inc: {
                views: 1
            }
        })
        currentUser.watchHistory.splice(0, 0, new mongoose.Types.ObjectId(videoId));
        await currentUser.save();
    } else {
        currentUser.watchHistory.splice(currentUser.watchHistory.indexOf(new mongoose.Types.ObjectId(videoId)), 1);
        currentUser.watchHistory.splice(0, 0, new mongoose.Types.ObjectId(videoId));
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    );
});

const getVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 1, query="" } = req.query;

    let videos;
    if(query.trim() !== ""){     
        videos = await Video.aggregate([
            {
                $search: {
                    index: "default",
                    text: {
                        query: query || "",
                        path: ["title", "description"]
                    },
                    scoreDetails: true,
                }
            },
            {
                $addFields: {
                    score: {
                        $meta: "searchScore"
                    }
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
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    title: 1,
                    thumbnail: 1,
                    views: 1,
                    owner: 1,
                    createdAt: 1,
                    score: 1
                }
            },
        ]).sort({ "score": -1 }).skip((Number(page)-1)*Number(limit)).limit(Number(limit));
    } else {
        videos = await Video.find().skip((Number(page)-1)*Number(limit)).limit(Number(limit));
    }

    if(!videos){
        throw new ApiError(
            500,
            "Error while fetching videos"
        );
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched successfully"
        )
    );
});

export {
    publishVideo,
    deleteVideo,
    togglePublishStatus,
    updateVideo,
    getVideoById,
    getVideos
}