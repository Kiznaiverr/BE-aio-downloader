import express from 'express';
import tiktokDownload from '../controller/tiktokController.js';
import { withLogging } from '../middleware/logger.js';

const router = express.Router();

router.post('/download', withLogging(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, code: 400, data: null, message: 'TikTok URL is required' });
  }

  const result = await tiktokDownload(url);
  res.json({ success: true, code: 200, data: result });
}));

export default router;