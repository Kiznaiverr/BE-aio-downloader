import axios from "axios";
import qs from "querystring"; 

const BASE_URL = "https://www.tikwm.com/api/";

async function tiktokDownload(tiktokUrl) {
  if (!tiktokUrl) {
    throw new Error("URL is required");
  }

  try {
    const payload = qs.stringify({
      url: tiktokUrl,
      count: 12,
      cursor: 0,
      web: 1,
      hd: 1,
    });

    const { data } = await axios.post(BASE_URL, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
        Origin: "https://www.tikwm.com",
        Referer: "https://www.tikwm.com/",
      },
    });

    if (data.code !== 0) {
      throw new Error(data.msg || "Failed to scrape video");
    }

    const d = data.data;
    const fullCover = d.cover ? "https://www.tikwm.com" + d.cover : null;
    const fullPlay = d.play ? "https://www.tikwm.com" + d.play : null;
    const fullHdPlay = d.hdplay ? "https://www.tikwm.com" + d.hdplay : null;
    const musicUrl = d.music
      ? d.music.startsWith("http")
        ? d.music
        : "https://www.tikwm.com" + d.music
      : null;

    const musicInfo = d.music_info
      ? {
          id: d.music_info.id,
          title: d.music_info.title,
          author: d.music_info.author,
          original: d.music_info.original,
          duration: d.music_info.duration,
          album: d.music_info.album,
        }
      : null;

    return {
      id: d.id,
      region: d.region,
      title: d.title,
      duration: d.duration,
      cover: fullCover,
      video: {
        url: fullPlay,
        hd_url: fullHdPlay
      },
      audio: {
        url: musicUrl,
        info: musicInfo
      },
      stats: {
        views: d.play_count,
        likes: d.digg_count,
        comments: d.comment_count,
        shares: d.share_count,
        downloads: d.download_count,
        favorites: d.collect_count,
      },
      author: {
        id: d.author?.id,
        username: d.author?.unique_id,
        nickname: d.author?.nickname,
        avatar: d.author?.avatar ? "https://www.tikwm.com" + d.author.avatar : null,
      },
    };
  } catch (err) {
    console.error("Tikwm scrape error:", err.message);
    throw err;
  }
}

export default tiktokDownload;
