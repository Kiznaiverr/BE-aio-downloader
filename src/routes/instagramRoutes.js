import express from 'express';
import scrapeInstagram from '../controller/instagramController.js';
import { withLogging } from '../middleware/logger.js';

const router = express.Router();

router.post('/download', withLogging(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Instagram URL is required' });
  }

  const result = await scrapeInstagram(url);
  res.json(result);
}));

export default router;