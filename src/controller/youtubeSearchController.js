import yts from 'yt-search';

async function youtubeSearch(query, limit = 10) {
  if (!query) {
    throw new Error('Query is required');
  }

  try {
    const r = await yts(query);
    const videos = (r && r.videos) ? r.videos.slice(0, limit).map(v => ({
      id: v.videoId,
      title: v.title,
      description: v.description,
      url: v.url,
      duration: v.timestamp,
      seconds: v.seconds,
      author: v.author && {
        name: v.author.name,
        url: v.author.url
      },
      views: v.views,
      uploaded: v.ago,
      thumbnail: v.image
    })) : [];

    return {
      query,
      limit,
      results: videos
    };
  } catch (err) {
    console.error('YouTube search error:', err.message);
    throw err;
  }
}

export default youtubeSearch;