import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
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

const addComment = asyncHandler(async(req, res) => {
    const { content, videoId } = req.body;

    if (!content || !videoId) {
        throw new ApiError(400, "Content and videoId is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    });
    if(!comment) {
        throw new ApiError(500, "Error while creating comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment created successfully"
        )
    )
});

const deleteComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment does not exist");
    }

    verifyOwnerStatus(req.user._id, comment.owner);

    await Comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Comment deleted successfully"
        )
    );
});

const updateComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if(!content){
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment does not exist");
    }

    verifyOwnerStatus(req.user._id, comment.owner);

    comment.content = content;
    await comment.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    );
});

const getVideoComments = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
                            username: 1,
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
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                content: 1,
                likesCount: 1,
                owner: 1,
                createdAt: 1
            }
        }
    ]).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    );
});

export {
    addComment,
    deleteComment,
    updateComment,
    getVideoComments
}