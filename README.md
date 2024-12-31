## Backend-project 
This is a backend project for a social media platform that integrates video sharing and tweeting functionalities. The project is built using Node.js, Express, and MongoDB.

### Table of Contents
- Installation
- Usage
- API Endpoints
- Environment Variables
- Project Structure

### Installation

1. Clone the repository:
```sh
git clone https://github.com/your-username/backend-project.git
cd backend-project
```

2. Install dependencies
```sh
npm install
```

3. Create a .env file in the root directory and add the necessary environment variables (see Environment Variables).

4. Start the development server:
```sh
npm run start 
```

### Usage
The backend server will be running on http://localhost:8000 (or the port specified in your .env file). You can use tools like Postman to interact with the API endpoints.

## API Endpoints

### User routes **/api/v1/user**
- **POST /register** - Register a new user
- **POST /login** - Login a user
- **POST /logout** - Logout a user
- **POST /refresh-token** - Refresh access token
- **POST /change-password** - Change user password
- **GET /current-user** - Get current user details
- **PATCH /update-account** - Update user account details
- **PATCH /update-user-images** - Update user avatar and cover image
- **GET /channel/:username** - Get user channel profile
- **GET /watch-history** - Get user watch history

### Video Routes **/api/v1/video**
- **POST /publish-video** - Publish a new video
- **DELETE /delete/:videoId** - Delete a video
- **PATCH /toggle-publish-status/:videoId** - Toggle video publish status
- **PATCH /update/:videoId** - Update video details
- **GET /get/:videoId** - Get video by ID
- **GET /get-all-videos** - Get all videos

### Tweet Routes **/api/v1/tweets**
- **POST /create** - Create a new tweet
- **PATCH /update/:tweetId** - Update a tweet
- **GET /user/:userId** - Get tweets by user
- **DELETE /delete/:tweetId** - Delete a tweet

### Comment Routes **/api/v1/comment**
- **POST /create** - Add a comment
- **PATCH /update/:commentId** - Update a comment
- **GET /get/:videoId** - Get comments for a video
- **DELETE /delete/:commentId** - Delete a comment

### Like Routes **/api/v1/like**
- **POST /toggle/v/:videoId** - Toggle like for a video
- **POST /toggle/c/:commentId** - Toggle like for a comment
- **POST /toggle/t/:tweetId** - Toggle like for a tweet
- **GET /videos** - Get liked videos

### Subscription Routes **/api/v1/subscription**
- **POST /c/:channelId** - Toggle subscription to a channel
- **GET /get-subscribers** - Get channel subscribers
- **GET /get-subscribed-channels** - Get subscribed channels

### Playlist Routes **/api/v1/playlist**
- **POST /create** - Create a new playlist
- **PATCH /add/:videoId/:playlistId** - Add video to playlist
- **PATCH /remove/:videoId/:playlistId** - Remove video from playlist
- **PATCH /update/:playlistId** - Update playlist details
- **GET /get-user-playlists/:userId** - Get user playlists
- **GET /get/:playlistId** - Get playlist by ID
- **DELETE /delete/:playlistId** - Delete a playlist

### Dashboard Routes **/api/v1/dashboard**
- **GET /stats** - Get channel stats
- **GET /videos** - Get channel videos

### Healthcheck Route **/api/v1/heathcheck**
- **GET /** - Healthcheck endpoint

## Environment variables
Create a .env file in the root directory and add the following environment variables:

```
PORT=8000
MONGODB_URI=your_mongodb_uri
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CORS_ORIGIN=your_cors_origin
```

## Project Structure
```
.DS_Store
.env
.gitignore
.prettierignore
.prettierrc
jsconfig.json
package.json
public/
    .DS_Store
    temp/
        .gitkeep
src/
    app.js
    constants.js
    controllers/
        comment.controller.js
        dashboard.controller.js
        healthcheck.controller.js
        like.controller.js
        playlist.controller.js
        subscription.controller.js
        tweet.controller.js
        user.controller.js
        video.controller.js
    db/
        connection.js
    index.js
    middlewares/
        auth.middleware.js
        multer.middleware.js
    models/
        comment.model.js
        like.model.js
        playlist.model.js
        subscription.model.js
        tweet.model.js
        user.model.js
        video.model.js
    routes/
        comment.routes.js
        dashboard.routes.js
        healthcheck.routes.js
        like.routes.js
        playlist.routes.js
        subscription.routes.js
        tweet.routes.js
        user.routes.js
        video.routes.js
    utils/
        ApiError.js
        ApiResponse.js
        asyncHandler.js
        cloudinary.js
```