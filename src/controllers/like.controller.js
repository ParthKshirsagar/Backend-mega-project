import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    let like;
    like = await Like.findOne(
        {
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: new mongoose.Types.ObjectId(req.user._id),
        }
    );

    if(!like){
        const video = await Video.findById(videoId);
        if(!video){
            throw new ApiError(400, "Video does not exist");
        }

        like = await Like.create({
            likedBy: req.user._id,
            video: videoId,
        })
        if(!like){
            throw new ApiError(500, "Failed to like the video");
        }
        return res.status(200).json(
            new ApiResponse(
                200,
                like,
                "Video liked successfully"
            )
        )
    } else {
        await Like.findByIdAndDelete(like._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Video unliked successfully"
            )
        )
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    let like;
    like = await Like.findOne(
        {
            comment: new mongoose.Types.ObjectId(commentId),
            likedBy: new mongoose.Types.ObjectId(req.user._id),
        }
    );

    if(!like){
        const comment = await Comment.findById(commentId);
        if(!comment){
            throw new ApiError(400, "Comment does not exist");
        }

        like = await Like.create({
            likedBy: req.user._id,
            comment: commentId,
        })
        if(!like){
            throw new ApiError(500, "Failed to like the comment");
        }
        return res.status(200).json(
            new ApiResponse(
                200,
                like,
                "Comment liked successfully"
            )
        )
    } else {
        await Like.findByIdAndDelete(like._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Comment unliked successfully"
            )
        )
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    let like;
    like = await Like.findOne(
        {
            tweet: new mongoose.Types.ObjectId(tweetId),
            likedBy: new mongoose.Types.ObjectId(req.user._id),
        }
    );

    if(!like){
        const tweet = await Tweet.findById(tweetId);
        if(!tweet){
            throw new ApiError(400, "Tweet does not exist");
        }

        like = await Like.create({
            likedBy: req.user._id,
            tweet: tweetId,
        })
        if(!like){
            throw new ApiError(500, "Failed to like the tweet");
        }
        return res.status(200).json(
            new ApiResponse(
                200,
                like,
                "Tweet liked successfully"
            )
        )
    } else {
        await Like.findByIdAndDelete(like._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Tweet unliked successfully"
            )
        )
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $project: {
                _id: "$video._id",
                title: "$video.title",
                description: "$video.description",
                thumbnail: "$video.thumbnail",
                createdAt: "$video.createdAt",
            }
        }
    ]);

    if(!likedVideos){
        throw new ApiError(404, "No liked videos found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    )
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}