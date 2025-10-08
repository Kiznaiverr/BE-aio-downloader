import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import FormData from "form-data";
import WebSocket from "ws";
import { load } from "cheerio";
import { CookieJar } from "tough-cookie";
import crypto from "crypto";

class YouTubeScraper {
  constructor() {
    this.api = {
      base: {
        video: 'https://amp4.cc',
        audio: 'https://amp3.cc'
      }
    };
    this.headers = {
      Accept: 'application/json',
      'User-Agent': 'Postify/1.0.0',
    };
    this.jar = new CookieJar();
    this.client = wrapper(axios.create({ jar: new CookieJar() }));
    this.ytRegex = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/;
    this.formats = {
      video: ['144p', '240p', '360p', '480p', '720p', '1080p'],
      audio: ['64k', '128k', '192k', '256k', '320k']
    };
  }

  async hashChallenge(salt, number, algorithm) {
    return crypto.createHash(algorithm.toLowerCase()).update(salt + number).digest('hex');
  }

  async verifyChallenge(challengeData, salt, algorithm, maxNumber) {
    for (let i = 0; i <= maxNumber; i++) {
      if (await this.hashChallenge(salt, i, algorithm) === challengeData) {
        return { number: i, took: Date.now() };
      }
    }
    throw new Error('Captcha verification failed');
  }

  async solveCaptcha(challenge) {
    const { algorithm, challenge: challengeData, salt, maxnumber, signature } = challenge;
    const solution = await this.verifyChallenge(challengeData, salt, algorithm, maxnumber);
    return Buffer.from(
      JSON.stringify({
        algorithm,
        challenge: challengeData,
        number: solution.number,
        salt,
        signature,
        took: solution.took,
      })
    ).toString('base64');
  }

  validateUrl(url) {
    if (!url) {
      return {
        status: false,
        code: 400,
        message: 'YouTube URL is required'
      };
    }

    if (!this.ytRegex.test(url)) {
      return {
        status: false,
        code: 400,
        message: 'Invalid YouTube URL format'
      };
    }

    return {
      status: true,
      code: 200,
      id: url.match(this.ytRegex)[3]
    };
  }

  async connect(id, isAudio = false) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`wss://${isAudio ? 'amp3' : 'amp4'}.cc/ws`, ['json'], {
        headers: { 
          ...this.headers,
          Origin: `https://${isAudio ? 'amp3' : 'amp4'}.cc`
        },
        rejectUnauthorized: false,
      });

      let fileInfo = {};
      let timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 30000);

      ws.on('open', () => ws.send(id));
      ws.on('message', (data) => {
        const res = JSON.parse(data);
        if (res.event === 'query' || res.event === 'queue') {
          fileInfo = { 
            thumbnail: res.thumbnail, 
            title: res.title, 
            duration: res.duration, 
            uploader: res.uploader 
          };
        } else if (res.event === 'file' && res.done) {
          clearTimeout(timeoutId);
          ws.close();
          resolve({ ...fileInfo, ...res });
        }
      });
      ws.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(new Error('WebSocket connection failed'));
      });
    });
  }

  getOptimalQuality(requestedQuality, isAudio = false) {
    const formatOptions = isAudio ? this.formats.audio : this.formats.video;
    
    if (formatOptions.includes(requestedQuality)) {
      return requestedQuality;
    }
    
    if (isAudio) {
      // Audio fallback: 256k -> 128k -> 320k -> 192k -> 64k
      const audioFallback = ['256k', '128k', '320k', '192k', '64k'];
      for (const quality of audioFallback) {
        if (formatOptions.includes(quality)) {
          return quality;
        }
      }
    } else {
      // Video fallback: 720p -> 480p -> 1080p -> 360p -> 240p -> 144p
      const videoFallback = ['720p', '480p', '1080p', '360p', '240p', '144p'];
      for (const quality of videoFallback) {
        if (formatOptions.includes(quality)) {
          return quality;
        }
      }
    }
    
    return formatOptions[0];
  }

  async convert(url, format, quality, isAudio = false) {
    try {
      const validation = this.validateUrl(url);
      if (!validation.status) return validation;

      const formatOptions = isAudio ? this.formats.audio : this.formats.video;
      
      const optimalQuality = this.getOptimalQuality(quality, isAudio);
      
      if (!optimalQuality) {
        return {
          status: false,
          code: 400,
          message: 'No available quality formats',
          available_formats: formatOptions
        };
      }

      const fixedURL = `https://youtu.be/${validation.id}`;
      const base = isAudio ? this.api.base.audio : this.api.base.video;

      const pages = await this.client.get(`${base}/`);
      const $ = load(pages.data);
      const csrfToken = $('meta[name="csrf-token"]').attr('content');

      if (!csrfToken) {
        return {
          status: false,
          code: 500,
          message: 'CSRF token not found'
        };
      }

      const form = new FormData();
      form.append('url', fixedURL);
      form.append('format', format);
      form.append('quality', optimalQuality);
      form.append('service', 'youtube');
      
      if (isAudio) {
        form.append('playlist', 'false');
      }

      form.append('_token', csrfToken);

      const captchaResponse = await this.client.get(`${base}/captcha`, {
        headers: { 
          ...this.headers,
          Origin: base,
          Referer: `${base}/`
        },
      });
      
      if (captchaResponse.data) {
        const solvedCaptcha = await this.solveCaptcha(captchaResponse.data);
        form.append('altcha', solvedCaptcha);
      }

      const endpoint = isAudio ? '/convertAudio' : '/convertVideo';
      const response = await this.client.post(`${base}${endpoint}`, form, {
        headers: { 
          ...form.getHeaders(),
          ...this.headers,
          Origin: base,
          Referer: `${base}/`
        },
      });

      if (!response.data.success) {
        return {
          status: false,
          code: 400,
          message: response.data.message || 'Conversion failed'
        };
      }

      const wsData = await this.connect(response.data.message, isAudio);
      const downloadLink = `${base}/dl/${wsData.worker}/${response.data.message}/${encodeURIComponent(wsData.file)}`;

      return {
        status: true,
        code: 200,
        data: {
          video_id: validation.id,
          title: wsData.title || 'Unknown Title',
          uploader: wsData.uploader || 'Unknown Channel',
          duration: wsData.duration || 'Unknown',
          thumbnail: wsData.thumbnail || `https://i.ytimg.com/vi/${validation.id}/maxresdefault.jpg`,
          type: isAudio ? 'audio' : 'video',
          format: format,
          quality: optimalQuality,
          requested_quality: quality,
          download_url: downloadLink,
          file_size: wsData.filesize || 'Unknown'
        }
      };

    } catch (error) {
      return {
        status: false,
        code: 500,
        message: 'Internal server error during conversion',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  async downloadYoutube(url, format = null) {
    try {
      const isAudio = format === 'mp3';
      
      let defaultQuality;
      let defaultFormat;
      
      if (isAudio) {
        defaultFormat = 'mp3';
        defaultQuality = '256k'; // Default audio quality
      } else {
        defaultFormat = 'mp4';
        defaultQuality = format || '720p'; // Default video quality
      }
      
      return await this.convert(
        url,
        defaultFormat,
        defaultQuality,
        isAudio
      );
    } catch (error) {
      return {
        status: false,
        code: 500,
        message: 'Download service unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }
}

async function downloadYoutube(youtubeUrl, format = '720p') {
  const scraper = new YouTubeScraper();
  return await scraper.downloadYoutube(youtubeUrl, format);
}

export default downloadYoutube;