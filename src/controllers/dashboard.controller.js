import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
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
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
            }
        },
        {
            $project: {
                isPublished: 1,
                title: 1,
                likesCount: { $size: "$likes" },
                createdAt: 1,
                thumbnail: 1,
                views: 1,
                commentsCount: { $size: "$comments" }
            }
        }
    ]);
    if(!videos) {
        throw new ApiError(500, "Error while fetching videos");
    }
    const totalViews = videos.reduce((acc, video) => acc + video.views, 0);
    const totalLikes = videos.reduce((acc, video) => acc + video.likesCount, 0);
    const totalComments = videos.reduce((acc, video) => acc + video.commentsCount, 0);
    const subscribersCount = await User.countDocuments({ channel: new mongoose.Types.ObjectId(req.user._id) });
    if(subscribersCount === undefined) {
        throw new ApiError(500, "Error while fetching subscribers count");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                videos,
                totalViews,
                totalLikes,
                totalComments,
                subscribersCount
            },
            "Channel stats fetched successfully"
        )
    )
});

const getChannelVidoes = asyncHandler(async (req, res) => {
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
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
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "comment",
                            as: "likes"
                        }
                    },
                    {
                        $project: {
                            content: 1,
                            owner: { $first: "$owner" },
                            createdAt: 1,
                            likesCount: { $size: "$likes" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                isPublished: 1,
                title: 1,
                likesCount: 1,
                createdAt: 1,
                thumbnail: 1,
                views: 1,
                comments: 1
            }
        }
    ]);

    if(!videos) {
        throw new ApiError(500, "Error while fetching videos");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    )
});

export {
    getChannelStats,
    getChannelVidoes
}