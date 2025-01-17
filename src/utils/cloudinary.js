import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadToCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) console.log("File path not found!!");
        // upload to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // after successful upload
        fs.unlinkSync(localFilePath);
        console.log("File uploaded to cloudinary successfully", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // removes the locally saved temp file
        console.log("Error while uploading file to cloudinary: ", error);
        return null;
    }
}

const deleteFromCloudinary = async (urls) => {
    try {
        const publicIDs = urls.map((url) => url.split("/").slice(-1)[0].split(".")[0])
        const response = await cloudinary.api.delete_resources(publicIDs);
        console.log("Files deleted successfully: ", response.deleted);
        return response;
    } catch (error) {
        console.log("Error while deleting file from cloudinary")
    }
}

const deleteVideoFromCloudinary = async (url) => {
    try {
        const videoPublicId = url.split("/").slice(-1)[0].split(".")[0];
        const response = await cloudinary.uploader.destroy(videoPublicId, { resource_type: "video" });
        console.log("Video deleted successfully: ", response);
        return response;
    } catch (error) {
        console.log("Error while deleting video from cloudinary")
    }
}

export {
    uploadToCloudinary,
    deleteFromCloudinary,
    deleteVideoFromCloudinary
}