# BE AIO Downloader

Proyek backend untuk mendownload konten dari berbagai platform sosial media seperti YouTube, TikTok, Instagram, Facebook, dan Twitter.

## Endpoint yang Tersedia

### YouTube
- **POST** `/api/youtube/download`
  - Body: `{ "url": "https://www.youtube.com/watch?v=...", "format": "mp4" }` (format opsional)
  - Deskripsi: Download video YouTube.

- **GET/POST** `/api/youtube/search`
  - Query (GET): `?q=search_query&limit=10`
  - Body (POST): `{ "query": "search_query", "limit": 10 }`
  - Deskripsi: Cari video di YouTube.

### TikTok
- **POST** `/api/tiktok/download`
  - Body: `{ "url": "https://www.tiktok.com/..." }`
  - Deskripsi: Download video TikTok.

### Instagram
- **POST** `/api/instagram/download`
  - Body: `{ "url": "https://www.instagram.com/..." }`
  - Deskripsi: Download konten Instagram (foto/video).

### Facebook
- **POST** `/api/facebook/download`
  - Body: `{ "url": "https://www.facebook.com/..." }`
  - Deskripsi: Download konten Facebook (video/post).

### Twitter
- **POST** `/api/twitter/download`
  - Body: `{ "url": "https://twitter.com/.../status/..." }`
  - Deskripsi: Download konten Twitter (tweet/video).


## Contoh Penggunaan

### Download YouTube Video
```bash
curl -X POST http://localhost:3000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Cari di YouTube
```bash
curl "http://localhost:3000/api/youtube/search?q=siapakah+myistri?&limit=5"
```

### Download TikTok
```bash
curl -X POST http://localhost:3000/api/tiktok/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@user/video/123456789"}'
```

Semua endpoint mengembalikan response dalam format JSON dengan struktur:
```json
{
  "success": true,
  "code": 200,
  "data": {...},
  "message": "..."
}
```