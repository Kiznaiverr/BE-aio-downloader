# BE AIO Downloader

Backend service for downloading media from social media platforms.

## Description

This is a backend API service that allows downloading videos and audio from TikTok, YouTube, Instagram, and Facebook.

## Features

- Download videos from TikTok
- Download videos/audio from YouTube
- Download media from Instagram
- Download videos/audio from Facebook
- RESTful API endpoints
- Rate limiting and security middleware

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your configuration (if needed)
4. Start the server:
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```

## API Endpoints

### Root
- `GET /` - Welcome message with ASCII art

### Health Check
- `GET /health` - Server health status

### Download Endpoints
- `POST /api/tiktok/download` - Download TikTok video
- `POST /api/youtube/download` - Download YouTube video/audio
- `POST /api/instagram/download` - Download Instagram media
- `POST /api/facebook/download` - Download Facebook video/audio

## Usage

Send a POST request to the desired endpoint with JSON body containing the URL:

```json
{
  "url": "https://example.com/video-url"
}
```

Example response:
```json
{
  "author": "kiznavierr",
  "success": true,
  "code": 200,
  "data": {
    "id": "video_id",
    "title": "Video Title",
    "thumbnail": "thumbnail_url",
    "videos": [
      {
        "quality": "720p(HD)",
        "url": "download_url"
      }
    ],
    "audio": {
      "url": "audio_download_url"
    }
  }
}
```

## Technologies Used

- Node.js
- Express.js
- Axios
- Cheerio
- WebSocket (for YouTube downloads)

## Author

kiznavierr

## License

ISC