import express from 'express';
import scrapeTwitter from '../controller/twitterController.js';
import { withLogging } from '../middleware/logger.js';

const router = express.Router();

router.post('/download', withLogging(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, code: 400, data: null, message: 'Twitter URL is required' });
  }

  const result = await scrapeTwitter(url);
  res.json({ success: true, code: 200, data: result });
}));

export default router;
