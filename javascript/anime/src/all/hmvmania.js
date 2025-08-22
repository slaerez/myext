const mangayomiSources = [{
    "name": "HMVMania",
    "id": 985627280,
    "lang": "all",
    "baseUrl": "https://hmvmania.com",
    "apiUrl": "",
    "iconUrl": "https://raw.githubusercontent.com/slaerez/myext/main/javascript/icon/all.hmvmania.png",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/all/hmvmania.js"
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
  // Only one static page
  if (page !== 1) {
    return { list: [], hasNextPage: false };
  }

  const url = "https://hmvmania.com/top-50/";
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.video-item-card"));

  elements.forEach(el => {
    const linkEl = el.selectFirst("div.video-thumbnail a");
    const titleEl = el.selectFirst("div.video-content h5");
    const imgEl = el.selectFirst("div.video-thumbnail img");

    if (!linkEl || !titleEl || !imgEl) return;

    const link = linkEl.attr("href") ?? "";
    const title = titleEl.text?.trim() ?? "Untitled";
    const imageUrl = imgEl.attr("data-src") || imgEl.attr("src") || "";

    items.push({
      name: title,
      link,
      imageUrl
    });
  });

  return {
    list: items,
    hasNextPage: false
  };
}

     
    get supportsLatest() {
  return true;
}
    
    
    
    async getLatestUpdates(page) {
  const url = `https://hmvmania.com/video-category/hmv/page/${page}/`;
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.video-item-card"));

  elements.forEach(el => {
    const linkEl = el.selectFirst("div.video-thumbnail a");
    const titleEl = el.selectFirst("div.video-content h5");
    const imgEl = el.selectFirst("div.video-thumbnail img");

    if (!linkEl || !titleEl || !imgEl) return;

    const link = linkEl.attr("href") ?? "";
    const title = titleEl.text?.trim() ?? "Untitled";
    const imageUrl = imgEl.attr("data-src") || imgEl.attr("src") || "";

    items.push({
      name: title,
      link,
      imageUrl
    });
  });

  const hasNextPage = elements.length === 10;

  return {
    list: items,
    hasNextPage
  };
}
    
    
    async search(query, page) {
  const encoded = encodeURIComponent(query).replace(/%20/g, "+");
  const url = page === 1
    ? `https://hmvmania.com/?s=${encoded}&post_type=video`
    : `https://hmvmania.com/page/${page}/?s=${encoded}&post_type=video`;

  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.video-item-horizontal"));

  elements.forEach(el => {
    const titleEl = el.selectFirst("div.col-md-7 h4");
    const linkEl = el.selectFirst("div.col-md-7 a[href]");
    const imgEl = el.selectFirst("div.video-thumbnail img");

    if (!linkEl || !titleEl || !imgEl) return;

    const title = titleEl.text?.trim() ?? "Untitled";
    const link = linkEl.attr("href") ?? "";
    const imageUrl = imgEl.attr("data-src") || imgEl.attr("src") || "";

    items.push({
      name: title,
      link,
      imageUrl
    });
  });

  const hasNextPage = elements.length === 10;

  return {
    list: items,
    hasNextPage
  };
}
    
    
    
    async getDetail(url) {
  const [realUrl, imageUrl] = url.split("|");

  const res = await this.client.get(realUrl, this.getHeaders(realUrl));
  const doc = new Document(res.body);

  const title = doc.selectFirst("h1.video-entry-title")?.text?.trim() ?? "Untitled";

  const descRaw = doc.selectFirst("div.entry-content p")?.text?.trim() ?? "";
  const description = descRaw.startsWith("HMV Maker:") ? descRaw : "";

  const author =
    doc.selectFirst('div.my-auto a[href*="/author/"] img')?.attr("alt")?.trim() ?? "";

  const episodes = [
    {
      name: title,
      url: realUrl // use clean url for video loading
    }
  ];

  return {
    title,
    imageUrl,
    description,
    author,
    genres: [],
    episodes
  };
}

    
    
    async getVideoList(url) {
  const [realUrl] = url.split("|");
  const res = await this.client.get(realUrl, this.getHeaders(realUrl));
  const doc = new Document(res.body);

  const elements = Array.from(doc.select('ul[id^="playlist"] > li'));
  const videos = [];

  elements.forEach(el => {
    const videoUrl = el.attr("data-video-source")?.trim();
    if (!videoUrl || !videoUrl.endsWith(".mp4")) return;

    const match = videoUrl.match(/_(\d{3,4}p?)_/);
    const quality = match?.[1] ?? "default";

    videos.push({
      url: videoUrl,
      originalUrl: videoUrl,
      quality,
      format: "mp4",
      headers: this.getHeaders(realUrl)
    });
  });

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
