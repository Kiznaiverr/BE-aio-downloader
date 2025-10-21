import axios from 'axios';
import youtubeSearch from './youtubeSearchController.js';
import downloadYoutube from './youtubeController.js';

async function getSpotifyTrackInfo(spotifyUrl) {
  try {
    const response = await axios.post('https://spotifysave.com/track-info', {
      url: spotifyUrl
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://spotifysave.com',
        'Referer': 'https://spotifysave.com/',
        'Sec-Ch-Ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    if (response.data && response.data.title && response.data.artist) {
      return {
        title: response.data.title,
        artist: response.data.artist,
        duration: response.data.duration,
        image: response.data.image,
        url: response.data.url
      };
    } else {
      throw new Error('Invalid response from Spotify save API');
    }
  } catch (error) {
    throw new Error('Failed to get Spotify track info: ' + error.message);
  }
}

async function downloadSpotify(spotifyUrl) {
  try {
    const trackInfo = await getSpotifyTrackInfo(spotifyUrl);

    const searchQuery = `${trackInfo.title} ${trackInfo.artist}`;
    const searchResults = await youtubeSearch(searchQuery, 1);

    if (!searchResults.results || searchResults.results.length === 0) {
      return {
        status: false,
        code: 404,
        message: 'No YouTube results found for this Spotify track'
      };
    }

    const youtubeUrl = searchResults.results[0].url;

    const downloadResult = await downloadYoutube(youtubeUrl, 'mp3');

    if (downloadResult.status) {
      const mergedInfo = {
        ...trackInfo,
        type: downloadResult.data.type,
        format: downloadResult.data.format,
        quality: downloadResult.data.quality,
        requested_quality: downloadResult.data.requested_quality,
        download_url: downloadResult.data.download_url,
        file_size: downloadResult.data.file_size
      };

      return {
        status: true,
        code: 200,
        data: {
          spotify_info: mergedInfo
        }
      };
    } else {
      return downloadResult;
    }

  } catch (error) {
    return {
      status: false,
      code: 500,
      message: 'Internal server eror',
      error: error.message
    };
  }
}

export default downloadSpotify;