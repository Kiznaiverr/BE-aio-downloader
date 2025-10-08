import express from 'express';
import scrapeFacebook from '../controller/facebookController.js';
import { withLogging } from '../middleware/logger.js';

const router = express.Router();

router.post('/download', withLogging(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Facebook URL is required' });
  }

  const result = await scrapeFacebook(url);
  res.json(result);
}));

export default router;