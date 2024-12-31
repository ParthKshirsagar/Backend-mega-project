import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
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

const createTweet = asyncHandler(async(req, res) => {
    const { content } = req.body;

    console.log(content);
    if(!content){
        throw new ApiError(
            400,
            "Content is required"
        )
    }

    const tweet = await Tweet.create({
        owner: req.user._id,
        content
    });
    if(!tweet){
        throw new ApiError(
            500,
            "Error while creating tweet in database"
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet created successfully"
        )
    );
});

const updateTweet = asyncHandler(async(req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if(!content){
        throw new ApiError(
            400,
            "Content is required"
        )
    }

    const tweet = await Tweet.findOne(
        {
            _id: tweetId
        }
    )
    if(!tweet){
        throw new ApiError(
            500,
            "Tweet does not exist"
        )
    }

    verifyOwnerStatus(req.user._id, tweet.owner);

    tweet.content = content;
    const updatedTweet = await tweet.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    );
});

const getUserTweets = asyncHandler(async(req, res) => {
    const { userId } = req.params;
    
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
                foreignField: "tweet",
                as: "likes"
            },
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
                createdAt: 1,
                owner: 1
            }
        }
    ]);

    if(!tweets){
        throw new ApiError(
            500,
            "Error while fetching tweets from database"
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "Tweets fetched successfully"
        )
    );
});

const deleteTweet = asyncHandler(async(req, res) => {
    const { tweetId } = req.params;

    const tweet = await Tweet.findOne(
        {
            _id: tweetId
        }
    )
    if(!tweet){
        throw new ApiError(
            500,
            "Tweet does not exist"
        )
    }

    verifyOwnerStatus(req.user._id, tweet.owner);

    const deletedTweet = await Tweet.deleteOne(
        {
            _id: tweetId
        }
    );
    if(!deletedTweet){
        throw new ApiError(
            500,
            "Error while deleting tweet from database"
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Tweet deleted successfully"
        )
    );
});


export { 
    createTweet,
    updateTweet,
    getUserTweets,
    deleteTweet
}