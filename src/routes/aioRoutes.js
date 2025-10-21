import express from 'express';
import downloadYoutube from '../controller/youtubeController.js';
import tiktokDownload from '../controller/tiktokController.js';
import scrapeInstagram from '../controller/instagramController.js';
import scrapeFacebook from '../controller/facebookController.js';
import scrapeTwitter from '../controller/twitterController.js';
import downloadSpotify from '../controller/spotifyController.js';
import { withLogging } from '../middleware/logger.js';

const router = express.Router();

function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else if (url.includes('tiktok.com')) {
    return 'tiktok';
  } else if (url.includes('instagram.com')) {
    return 'instagram';
  } else if (url.includes('facebook.com')) {
    return 'facebook';
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    return 'twitter';
  } else if (url.includes('open.spotify.com')) {
    return 'spotify';
  }
  return null;
}

router.all('/download', withLogging(async (req, res) => {
  const url = req.method === 'GET' ? req.query.url : req.body.url;
  const format = req.method === 'GET' ? req.query.format : req.body.format;

  if (!url) {
    return res.status(400).json({ success: false, code: 400, data: null, message: 'URL is required' });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return res.status(400).json({ success: false, code: 400, data: null, message: 'Unsupported URL platform' });
  }

  let result;
  try {
    switch (platform) {
      case 'youtube':
        result = await downloadYoutube(url, format || '720p');
        break;
      case 'tiktok':
        result = await tiktokDownload(url);
        break;
      case 'instagram':
        result = await scrapeInstagram(url);
        break;
      case 'facebook':
        result = await scrapeFacebook(url);
        break;
      case 'twitter':
        result = await scrapeTwitter(url);
        break;
      case 'spotify':
        result = await downloadSpotify(url);
        break;
    }

    res.json({ success: result.status, code: result.code, data: result.data, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, code: 500, data: null, message: 'Internal server error', error: error.message });
  }
}));

export default router;