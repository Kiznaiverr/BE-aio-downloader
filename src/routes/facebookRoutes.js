import express from 'express';
import scrapeFacebook from '../controller/facebookController.js';
import { withLogging } from '../middleware/logger.js';

const router = express.Router();

router.post('/download', withLogging(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, code: 400, data: null, message: 'Facebook URL is required' });
  }

  const result = await scrapeFacebook(url);
  res.json({ success: true, code: 200, data: result });
}));

export default router;