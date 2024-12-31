import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    let subscription;
    subscription = await Subscription.findOne(
        {
            channel: new mongoose.Types.ObjectId(channelId),
            subscriber: new mongoose.Types.ObjectId(req.user._id),
        }
    );
    if(!subscription){
        const channel = await User.findById(channelId);
        if(!channel){
            throw new ApiError(400, "Channel does not exist");
        }

        if(channelId == req.user._id){
            throw new ApiError(400, "You cannot subscribe to yourself");
        }

        subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        });
        if(!subscription){
            throw new ApiError(500, "Failed to subscribe to the channel");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                subscription,
                "Channel subscribed successfully"
            )
        )
    } else {
        await Subscription.findByIdAndDelete(subscription._id);
        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Channel unsubscribed successfully"
            )
        )
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50} = req.query;

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
            }
        },
        {
            $addFields: {
                subscriber: {
                    username: { $first: "$subscribers.username" },
                    fullName: { $first: "$subscribers.fullName" },
                    avatar: { $first: "$subscribers.avatar" },
                    _id: { $first: "$subscribers._id" },
                }
            }
        },
        {
            $project: {
                subscriber: 1,
                _id: 0
            }
        }
    ]).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    if(!subscribers){
        throw new ApiError(500, "Error fetching subscribers");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user._id),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels",
            }
        },
        {
            $addFields: {
                channel: {
                    fullName: { $first: "$channels.fullName" },
                    avatar: { $first: "$channels.avatar" },
                    _id: { $first: "$channels._id" },
                }
            }
        },
        {
            $project: {
                channel: 1,
                _id: 0
            }
        }
    ]);

    if(!subscribedChannels){
        throw new ApiError(500, "Error fetching subscribed channels");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribedChannels,
            "Subscribed channels fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}