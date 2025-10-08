import express from 'express';
import downloadYoutube from '../controller/youtubeController.js';
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

export default router;