import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        name: {
            type: String,
            required: true
        },
        description: String,
        visibility: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);