import axios from "axios";
import { load } from "cheerio";
import he from "he";

class InstagramScraper {
  constructor() {
    this.headers = {
      'referer': 'https://insta-save.net/id',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'accept-language': 'id,en;q=0.9,ja;q=0.8,ms;q=0.7',
      'dnt': '1',
    };
  }

  async scrapeInstagram(instagramUrl) {
    if (!instagramUrl) {
      throw new Error("URL is required");
    }

    if (!this.isValidInstagramUrl(instagramUrl)) {
      throw new Error('Invalid Instagram URL');
    }

    try {
      const encodedUrl = encodeURIComponent(instagramUrl);
      const endpoint = `https://insta-save.net/content.php?url=${encodedUrl}`;

      const response = await axios.get(endpoint, {
        headers: this.headers
      });

      const data = response.data;

      if (!data || data.status !== "ok" || !data.html) {
        throw new Error('No download links found or invalid response format');
      }

      const html = he.decode(data.html);
      const $ = load(html);

      const videoUrl = $('a.btn.bg-gradient-success.mb-0').attr('href') || null;

      const imageUrls = [];
      $('img').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src && src.includes('instagram') && !src.includes('profile')) {
          imageUrls.push(src);
        }
      });

      const thumbnail = $('video').attr('poster') || null;

      const title = $('p.text-sm').first().text().trim() || 'Instagram Media';

      const username = data.username || 'Unknown';

      return {
        status: true,
        code: 200,
        data: {
          id: instagramUrl.split('/').pop(),
          title: title,
          username: username,
          thumbnail: thumbnail,
          video: videoUrl ? { url: videoUrl } : null,
          image: imageUrls.length > 0 ? { url: imageUrls[0] } : null,
          stats: {
            likes: 0,
            comments: 0,
          }
        }
      };
    } catch (error) {
      console.error('Instagram scraping error:', error.response ? error.response.data : error.message);
      return {
        status: false,
        code: 500,
        message: 'Failed to download from Instagram',
        error: error.message
      };
    }
  }

  isValidInstagramUrl(url) {
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com)\/(p|reel|tv)\/[a-zA-Z0-9_-]+/;
    return instagramRegex.test(url);
  }
}

async function scrapeInstagram(instagramUrl) {
  const scraper = new InstagramScraper();
  return await scraper.scrapeInstagram(instagramUrl);
}

export default scrapeInstagram;