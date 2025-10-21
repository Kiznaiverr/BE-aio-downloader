import express from 'express';
import downloadSpotify from '../controller/spotifyController.js';
import { withLogging } from '../middleware/logger.js';

const router = express.Router();

router.post('/download', withLogging(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, code: 400, data: null, message: 'Spotify URL is required' });
  }

  const result = await downloadSpotify(url);
  res.json({ success: result.status, code: result.code, data: result.data, message: result.message });
}));

export default router;