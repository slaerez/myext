const mangayomiSources = [{
  "name": "Hanime1",
  "lang": "zh",
  "baseUrl": "https://hanime1.me",
  "apiUrl": "https://hanime1.me",
  "iconUrl": "https://avatarfiles.alphacoders.com/358/thumb-1920-358564.png",
  "typeSource": "single",
  "itemType": 1,
  "isNsfw": true,
  "version": "0.0.1",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "javascript/anime/src/zh/hanime1.js"
}];

class DefaultExtension extends MProvider {
  constructor() {
    super();
    this.client = new Client();
  }

  getHeaders(url) {
    return {
      'Referer': url,
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    };
  }

  getBaseUrl() {
    return this.source.baseUrl;
  }

    async getPopular(page) {
  const url = `${this.getBaseUrl()}/search?sort=觀看次數&page=${page}`;
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);
  const items = [];

  const elements = Array.from(doc.select('div.col-xs-6.search-doujin-videos'));
  console.log(`[getPopular] Found ${elements.length} elements`);

  elements.forEach(el => {
    try {
      const titleEl = el.selectFirst("div.card-mobile-title");
      const a = el.selectFirst("a.overlay");
      const img = el.selectFirst('img[src*="/thumbnail/"]');

      const name = titleEl?.text?.trim();
      const link = a?.attr("href");
      const imageUrl = img?.attr("src");

      if (name && link && imageUrl) {
        items.push({ name, link, imageUrl });
        console.log(`[getPopular] Parsed item:`, { name });
      }
    } catch (e) {
      console.warn("[getPopular] Error parsing item:", e.message);
    }
  });

  const hasNextPage = doc.selectFirst(`a[href*="page=${page + 1}"]`) !== null;
  return { list: items, hasNextPage };
}


  async getLatestUpdates(page) {
  const url = `${this.getBaseUrl()}/search?sort=最新更新&page=${page}`;
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);
  const items = [];

  const elements = Array.from(doc.select('div.col-xs-6.search-doujin-videos'));
  console.log(`[getLatestUpdates] Found ${elements.length} elements`);

  elements.forEach(el => {
    try {
      const titleEl = el.selectFirst("div.card-mobile-title");
      const a = el.selectFirst("a.overlay");
      const img = el.selectFirst('img[src*="/thumbnail/"]');

      const name = titleEl?.text?.trim();
      const link = a?.attr("href");
      const imageUrl = img?.attr("src");

      if (name && link && imageUrl) {
        items.push({ name, link, imageUrl });
        console.log(`[getLatestUpdates] Parsed item:`, { name });
      }
    } catch (e) {
      console.warn("[getLatestUpdates] Error parsing item:", e.message);
    }
  });

  const hasNextPage = doc.selectFirst(`a[href*="page=${page + 1}"]`) !== null;
  return { list: items, hasNextPage };
}


  async search(query, page, filters) {
  if (!query || query.trim() === "") {
    return { list: [], hasNextPage: false };
  }

  const url = `${this.getBaseUrl()}/search?query=${encodeURIComponent(query)}&page=${page}`;
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);
  const items = [];

  const elements = Array.from(doc.select('div.col-xs-6.search-doujin-videos'));
  console.log(`[search] Found ${elements.length} elements`);

  elements.forEach(el => {
    try {
      const titleEl = el.selectFirst("div.card-mobile-title");
      const a = el.selectFirst("a.overlay");
      const img = el.selectFirst('img[src*="/thumbnail/"]');

      const name = titleEl?.text?.trim();
      const link = a?.attr("href");
      const imageUrl = img?.attr("src");

      if (name && link && imageUrl) {
        items.push({ name, link, imageUrl });
        console.log(`[search] Parsed item:`, { name });
      }
    } catch (e) {
      console.warn("[search] Error parsing item:", e.message);
    }
  });

  const hasNextPage = doc.selectFirst(`a[href*="page=${page + 1}"]`) !== null;
  return { list: items, hasNextPage };
}


  async getDetail(url) {
  const fullUrl = url.startsWith("http") ? url : this.getBaseUrl() + url;
  const res = await this.client.get(fullUrl, this.getHeaders(fullUrl));
  const doc = new Document(res.body);
  const body = doc.selectFirst("div#content-div");

  // Title
  const title = body.selectFirst("h3#shareBtn-title")?.text?.trim() || "";

  // Cover image from <video poster="">
  const imgEl = doc.selectFirst("video#player");
  let cover = imgEl ? imgEl.attr("poster") || "" : "";
  if (cover.startsWith("data:image")) cover = "";

  // Description
  let desc = "";
  try {
    desc = body.selectFirst("div.video-caption-text")?.text?.trim() || "";
  } catch {
    desc = "";
  }

  // Genres / tags
  let genres = [];
  try {
    genres = body.select("div.video-tags-wrapper div.single-video-tag a").map(e => e.text.trim());
  } catch {
    genres = [];
  }

  // Chapters / episodes (usually just 1 video per page)
  const chapters = [{
    name: title || "Episode 1",
    url: fullUrl,
    scanlator: "",
    dateUpload: ""
  }];

  return {
    name: title,
    imageUrl: cover,
    description: desc,
    author: null,
    artist: null,
    genre: genres,
    link: fullUrl,
    status: 0,
    chapters: chapters
  };
}



  async getVideoList(url) {
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const videoEl = doc.selectFirst("video#player");
    if (!videoEl) throw new Error("❌ <video> element not found");

    const sources = doc.select("video > source").map(source => {
      const file = source.attr("src");
      const quality = source.attr("size") || "Unknown";
      return {
        url: file,
        originalUrl: file,
        quality,
        headers: this.getHeaders(url)
      };
    });

    if (sources.length > 0) return sources;

    const fallback = videoEl.attr("src");
    if (fallback) {
      return [{
        url: fallback,
        originalUrl: fallback,
        quality: "Unknown",
        headers: this.getHeaders(url)
      }];
    }

    throw new Error("❌ No video source found");
  }

  getSourcePreferences() {
    return [];
  }
}
