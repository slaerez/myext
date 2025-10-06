const mangayomiSources = [{
  "name": "SpankBang",
  "id": 482916735,
  "lang": "all",
  "baseUrl": "https://spankbang.com/",
  "apiUrl": "",
  "iconUrl": "https://raw.githubusercontent.com/slaerez/myext/main/javascript/icon/all.spankbang.png",
  "typeSource": "single",
  "itemType": 1,
  "isNsfw": true,
  "version": "0.0.1",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "anime/src/all/spankbang.js"
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
    const url =
      page === 1
        ? "https://spankbang.com/most_popular/?p=y"
        : `https://spankbang.com/most_popular/${page}/?p=y`;

    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const items = [];
    let elements = Array.from(doc.select("div.video-item"));

    if (elements.length > 8) {
      elements = elements.slice(8);
    }

    elements.forEach(el => {
      const a = el.selectFirst("a.thumb");
      if (!a) return;

      const href = a.attr("href") ?? "";
      const link = href.startsWith("http")
        ? href
        : `https://spankbang.com${href}`;

      const title =
        el.selectFirst("p a[title] span")?.text?.trim() ??
        el.selectFirst("p a[title]")?.attr("title") ??
        "Untitled";

      const img =
        el.selectFirst("img[data-src]")?.attr("data-src") ??
        el.selectFirst("img")?.attr("src") ??
        "";

      items.push({
        name: title,
        link,
        imageUrl: img
      });
    });

    const hasNextPage = items.length >= 24;
    return { list: items, hasNextPage };
  }

  get supportsLatest() {
    return true;
  }

  async getLatestUpdates(page) {
    const url =
      page === 1
        ? "https://spankbang.com/new_videos/"
        : `https://spankbang.com/new_videos/${page}/`;

    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const items = [];
    let elements = Array.from(doc.select("div.video-item"));

    if (elements.length > 8) {
      elements = elements.slice(8);
    }

    elements.forEach(el => {
      const a = el.selectFirst("a.thumb");
      if (!a) return;

      const href = a.attr("href") ?? "";
      const link = href.startsWith("http")
        ? href
        : `https://spankbang.com${href}`;

      const title =
        el.selectFirst("p a[title] span")?.text?.trim() ??
        el.selectFirst("p a[title]")?.attr("title") ??
        "Untitled";

      const img =
        el.selectFirst("img[data-src]")?.attr("data-src") ??
        el.selectFirst("img")?.attr("src") ??
        "";

      items.push({
        name: title,
        link,
        imageUrl: img
      });
    });

    const hasNextPage = items.length >= 24;
    return { list: items, hasNextPage };
  }

  async search(query, page) {
    const encoded = encodeURIComponent(query);
    const url =
      page === 1
        ? `https://spankbang.com/s/${encoded}/`
        : `https://spankbang.com/s/${encoded}/${page}/`;

    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const items = [];
    let elements = Array.from(doc.select("[data-testid='video-item']"));

    if (elements.length > 8) {
      elements = elements.slice(8);
    }

    elements.forEach(el => {
      const a = el.selectFirst("a[href*='/video/']");
      if (!a) return;

      let href = a.attr("href") ?? "";
      if (!href) return;

      if (!href.startsWith("http")) href = `https://spankbang.com${href}`;
      if (!href.endsWith("/")) href += "/";

      const title =
        el.selectFirst("[data-testid='video-info-with-badge'] p a[title] span")?.text?.trim() ??
        el.selectFirst("[data-testid='video-info-with-badge'] p a[title]")?.attr("title") ??
        "Untitled";

      const img =
        el.selectFirst("img[data-src]")?.attr("data-src") ??
        el.selectFirst("img")?.attr("src") ??
        "";

      items.push({
        name: title,
        link: href,
        imageUrl: img
      });
    });

    const hasNextPage = items.length >= 24;
    return { list: items, hasNextPage };
  }

  async getDetail(url) {
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const title =
      doc.selectFirst("h1.main_content_title")?.text?.trim() ?? "Untitled";

    const imageUrl =
      doc.selectFirst('meta[property="og:image"]')?.attr("content") ?? "";

    const episodes = [
      {
        name: title,
        url: url
      }
    ];

    return {
      title,
      imageUrl,
      description: "",
      author: "",
      genres: [],
      episodes
    };
  }

  async getVideoList(url) {
    const res = await this.client.get(url, this.getHeaders(url));
    const body = res.body;
    const videos = [];

    const match = body.match(/var\s+stream_data\s*=\s*(\{.*?\});/s);
    if (match) {
      let jsonStr = match[1];
      jsonStr = jsonStr
        .replace(/'/g, '"')
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]");

      let streamData;
      try {
        streamData = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error("❌ Failed to parse stream_data JSON: " + e.message);
      }

      const qualityOrder = ["4k", "1080p", "720p", "480p", "320p", "240p"];

      qualityOrder.forEach(q => {
        if (streamData[q] && Array.isArray(streamData[q]) && streamData[q].length > 0) {
          const file = streamData[q][0];
          videos.push({
            url: file,
            originalUrl: file,
            quality: q,
            headers: {
              Referer: "https://spankbang.com",
              "User-Agent": "Mozilla/5.0"
            }
          });
        }
      });
    }

    if (videos.length === 0) {
      throw new Error("❌ No video streams found in stream_data");
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
