import axios from 'axios';
import { load } from 'cheerio';

class TwitterScraper {
  constructor() {
    this.base = 'https://www.xsaver.io';
    this.headers = {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'id,en;q=0.9,ja;q=0.8,ms;q=0.7',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'dnt': '1',
      'referer': 'https://www.xsaver.io/'
    };
  }

  isValidTwitterUrl(url) {
    const regex = /^https?:\/\/(www\.)?(x|twitter)\.com\/.+/i;
    return regex.test(url);
  }

  async scrape(url) {
    if (!url) throw new Error('URL is required');
    if (!this.isValidTwitterUrl(url)) throw new Error('Invalid Twitter/X URL');

    try {
      const endpoint = `${this.base}/download.php?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(endpoint, { headers: this.headers, timeout: 15000 });
      const $ = load(data);

      const card = $('.video-card').first();
      if (!card || card.length === 0) {
        throw new Error('No media card found in response');
      }

      const thumbnail = card.find('.video-thumbnail img').attr('src') || null;
      const title = card.find('.video-title').text().trim() || null;

      const videoDownloads = [];
      const imageDownloads = [];
      const otherDownloads = [];

      card.find('.media-section a').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        if (!href) return;

        const abs = href.startsWith('http') ? href : `${this.base}/${href.replace(/^\/+/, '')}`;

        const lower = abs.toLowerCase();
        if (lower.includes('.mp4') || lower.includes('video')) {
          videoDownloads.push(abs);
        } else if (lower.match(/\.(jpg|jpeg|png|webp)$/)) {
          imageDownloads.push(abs);
        } else {
          otherDownloads.push(abs);
        }
      });

      const qualityBadge = card.find('.quality-badge').text().trim() || null;

      return {
        status: true,
        code: 200,
        data: {
          id: url.split('/').pop(),
          url,
          title,
          thumbnail,
          quality: qualityBadge,
          downloads: {
            video: videoDownloads,
            image: imageDownloads,
            others: otherDownloads
          }
        }
      };

    } catch (err) {
      console.error('Twitter scrape error:', err.message);
      return {
        status: false,
        code: 500,
        message: 'Failed to download from Twitter',
        error: err.message
      };
    }
  }
}

async function scrapeTwitter(twitterUrl) {
  const scraper = new TwitterScraper();
  return await scraper.scrape(twitterUrl);
}

export default scrapeTwitter;