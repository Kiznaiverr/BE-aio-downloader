import axios from "axios";
import { load } from "cheerio";
// use URLSearchParams instead of deprecated 'querystring'

class FacebookScraper {
  constructor() {
    this.headers = {
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'id,en;q=0.9,ja;q=0.8,ms;q=0.7',
      'content-length': '71',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'cookie': '_ga=GA1.1.749071809.1759904597; __cflb=04dToeZfC9vebXjRcJCMjjSQh5PprejjehWU4Y8cv7; _ga_96G5RB4BBD=GS2.1.s1759906734$o2$g1$t1759906777$j17$l0$h0',
      'dnt': '1',
      'hx-current-url': 'https://getmyfb.com/id',
      'hx-request': 'true',
      'hx-target': 'target',
      'hx-trigger': 'form',
      'origin': 'https://getmyfb.com',
      'priority': 'u=1, i',
      'referer': 'https://getmyfb.com/id',
      'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
    };
  }

  async scrapeFacebook(facebookUrl) {
    if (!facebookUrl) {
      throw new Error("URL is required");
    }

    if (!this.isValidFacebookUrl(facebookUrl)) {
      throw new Error('Invalid Facebook URL');
    }

    try {
      const payload = new URLSearchParams({
        id: facebookUrl,
        locale: 'id'
      }).toString();

      const response = await axios.post('https://getmyfb.com/process', payload, {
        headers: this.headers
      });

      const html = response.data;
      const $ = load(html);

      const title = $('a[download]').first().attr('download')?.replace(/-(hd|sd)\.mp4$/, '') || $('.results-item-text').text().trim() || 'Facebook Video';
      const thumbnail = $('.results-item-image').attr('src') || null;

      const downloads = [];
      $('.results-list-item').each((i, elem) => {
        const qualityText = $(elem).contents().filter((index, el) => el.type === 'text').text().trim();
        const url = $(elem).find('a').attr('href');
        if (url && qualityText) {
          downloads.push({
            quality: qualityText,
            url: url
          });
        }
      });

      // Separate videos and audio
      const videos = downloads.filter(d => !d.quality.toLowerCase().includes('mp3'));
      const audio = downloads.find(d => d.quality.toLowerCase().includes('mp3'));

      return {
        status: true,
        code: 200,
        data: {
          id: facebookUrl.split('/').pop(),
          title: title,
          thumbnail: thumbnail,
          videos: videos,
          audio: audio ? { url: audio.url } : null
        }
      };
    } catch (error) {
      console.error('Facebook scraping error:', error.message);
      return {
        status: false,
        code: 500,
        message: 'Failed to download from Facebook',
        error: error.message
      };
    }
  }

  isValidFacebookUrl(url) {
    const facebookRegex = /^https?:\/\/(www\.)?facebook\.com\/share\/v\/[a-zA-Z0-9_-]+/;
    return facebookRegex.test(url);
  }
}

async function scrapeFacebook(facebookUrl) {
  const scraper = new FacebookScraper();
  return await scraper.scrapeFacebook(facebookUrl);
}

export default scrapeFacebook;