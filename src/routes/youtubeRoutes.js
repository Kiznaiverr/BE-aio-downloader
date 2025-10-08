import express from 'express';
import downloadYoutube from '../controller/youtubeController.js';
import youtubeSearch from '../controller/youtubeSearchController.js';
import { withLogging } from '../middleware/logger.js';

const router = express.Router();

router.post('/download', withLogging(async (req, res) => {
  const { url, format } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  const result = await downloadYoutube(url, format);
  res.json(result);
}));

router.all('/search', withLogging(async (req, res) => {
  const query = req.method === 'GET' ? req.query.q : req.body.query;
  const limit = req.method === 'GET' ? parseInt(req.query.limit) || 10 : req.body.limit || 10;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const result = await youtubeSearch(query, limit);
  res.json({ success: true, code: 200, data: result });
}));

export default router;