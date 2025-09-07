const mangayomiSources = [{
    "name": "Jable",
    "id": 482910987,
    "lang": "all",
    "baseUrl": "https://en.jable.tv",
    "apiUrl": "",
    "iconUrl": "https://raw.githubusercontent.com/slaerez/myext/main/javascript/icon/all.jable.png",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/all/jable.js",
}];

class DefaultExtension extends MProvider {
  constructor() {
    super();
    this.client = new Client();
  }

  getBaseUrl() {
    return this.source.baseUrl;
  }

  getHeaders(url) {
    return {
      'Referer': url,
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    };
  }
    
    
    async getPopular(page) {
  const offset = String(page).padStart(2, "0");
  const url = `https://en.jable.tv/hot/?mode=async&function=get_block&block_id=list_videos_common_videos_list&sort_by=video_viewed&from=${offset}`;

  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.video-img-box"));

  elements.forEach(el => {
    const a = el.selectFirst("a");
    const img = el.selectFirst("img");
    const title = el.selectFirst("h6.title a")?.text?.trim() ?? "Untitled";

    if (!a || !img) return;

    const link = a.attr("href")?.trim() ?? "";
    const imageUrl = img.attr("data-src") ?? img.attr("src") ?? "";

    items.push({
      name: title,
      link,
      imageUrl
    });
  });

  const hasNextPage = elements.length > 0;
  return { list: items, hasNextPage };
}

    
    
    get supportsLatest() {
  return true;
}
    
    
    async getLatestUpdates(page) {
  const offset = String(page).padStart(2, "0");
  const url = `https://en.jable.tv/latest-updates/?mode=async&function=get_block&block_id=list_videos_latest_videos_list&sort_by=post_date&from=${offset}`;

  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.video-img-box"));

  elements.forEach(el => {
    const a = el.selectFirst("a");
    const img = el.selectFirst("img");
    const title = el.selectFirst("h6.title a")?.text?.trim() ?? "Untitled";

    if (!a || !img) return;

    const link = a.attr("href")?.trim() ?? "";
    const imageUrl = img.attr("data-src") ?? img.attr("src") ?? "";

    items.push({
      name: title,
      link,
      imageUrl
    });
  });

  const hasNextPage = elements.length > 0;
  return { list: items, hasNextPage };
}

    
    
    async search(query, page) {
  const offset = String(page).padStart(2, "0"); 
  const url = `https://en.jable.tv/search/${encodeURIComponent(query)}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${encodeURIComponent(query)}&sort_by=&from=${offset}`;

  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.video-img-box"));

  elements.forEach(el => {
    const a = el.selectFirst("a");
    const img = el.selectFirst("img");
    const title = el.selectFirst("h6.title a")?.text?.trim() ?? "Untitled";

    if (!a || !img) return;

    const link = a.attr("href")?.trim() ?? "";
    const imageUrl = img.attr("data-src") ?? img.attr("src") ?? "";

    items.push({
      name: title,
      link,
      imageUrl
    });
  });

  const hasNextPage = elements.length > 0;
  return { list: items, hasNextPage };
}

    
    async getDetail(url) {
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const title = doc.selectFirst('meta[property="og:title"]')?.attr("content")?.trim() ?? "Untitled";
  const imageUrl = doc.selectFirst('meta[property="og:image"]')?.attr("content")?.trim() ?? "";

  
  const h6 = doc.selectFirst("h6");
  const spans = h6 ? Array.from(h6.select("span")) : [];

  const time = spans[0]?.text?.trim() ?? "";
  const views = spans[1]?.text?.trim().replace(/\s+/g, "") ?? "";
  const description = time && views ? `${time} | ${views} views` : "";

  
  const genres = Array.from(doc.select("h5.tags a")).map(el => el.text?.trim()).filter(Boolean);

  return {
    title,
    imageUrl,
    description,
    author: "",
    genres,
    status: 1,
    episodes: [
      {
        name: title,
        url
      }
    ]
  };
}
    
       
    async getVideoList(url) {
  const res = await this.client.get(url, this.getHeaders(url));
  const body = res.body;

  const videos = [];

  const match = body.match(/var\s+hlsUrl\s*=\s*['"]([^'"]+\.m3u8[^'"]*)['"]/);
  if (match) {
    const hlsUrl = match[1];

    videos.push({
      url: hlsUrl,
      originalUrl: hlsUrl,
      quality: "HLS",
      format: "hls",
      headers: this.getHeaders(url)
    });
  }

  if (videos.length === 0) {
    throw new Error("❌ No playable video sources found");
  }

  return videos;
}

    
    
    
    
    
    getFilterList() {
        throw new Error("getFilterList not implemented");
    }
    
    
    
    getSourcePreferences() {
        throw new Error("getSourcePreferences not implemented");
    }
}
