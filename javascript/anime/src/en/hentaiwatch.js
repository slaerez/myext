const mangayomiSources = [{
  "name": "HentaiWatch",
  "lang": "en",
  "baseUrl": "https://watchhentai.net",
  "apiUrl": "https://watchhentai.net",
  "iconUrl": "https://i.pinimg.com/474x/14/52/f8/1452f83b6999575552cb96eb785ccbe7.jpg",
  "typeSource": "single",
  "itemType": 1,
  "isNsfw": true,
  "version": "0.0.1",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "anime/src/en/hentaiwatch.js"
}];

class DefaultExtension extends MProvider {
  constructor() {
    super();
    this.client = new Client();
  }

  getHeaders(url) {
    return {
      'Referer': url,
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6788.76 Safari/537.36"
    };
  }

  getBaseUrl() {
    return this.source.baseUrl;
  }

  async getPopular(page) {
    const url = `${this.getBaseUrl()}/trending/page/${page}/`;
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);
    const items = [];

    doc.select("article.item.tvshows").forEach(el => {
      const img = el.selectFirst("img");
      const a = el.selectFirst("h3 > a");

      if (img && a) {
        const name = img.attr("alt") || a.text().trim();
        const link = a.attr("href");
        const imageUrl = img.attr("data-src") || img.attr("src") || "";
        items.push({ name, link, imageUrl });
      }
    });

    const hasNextPage = doc.selectFirst("a.next") !== null;
    return { list: items, hasNextPage };
  }

  async getLatestUpdates(page) {
    const url = `${this.getBaseUrl()}/videos/page/${page}/`;
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);
    const items = [];

    doc.select("article.item.se.episodes").forEach(el => {
      const img = el.selectFirst("img");
      const a = el.selectFirst("a");

      if (img && a) {
        const name = img.attr("alt") || a.text().trim();
        const link = a.attr("href");
        const imageUrl = img.attr("data-src") || img.attr("src") || "";
        items.push({ name, link, imageUrl });
      }
    });

    const hasNextPage = doc.selectFirst("a.next") !== null;
    return { list: items, hasNextPage };
  }

  get supportsLatest() {
    return true;
  }

  async search(query, page, filters) {
    if (!query || query.trim() === "") {
      return { list: [], hasNextPage: false };
    }

    const url = `${this.getBaseUrl()}/page/${page}/?s=${encodeURIComponent(query)}`;
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);
    const items = [];

    doc.select("div.result-item").forEach(el => {
      const img = el.selectFirst("img");
      const a = el.selectFirst("div.title > a");

      if (img && a) {
        const name = img.attr("alt") || a.text().trim();
        const link = a.attr("href");
        const imageUrl = img.attr("data-src") || img.attr("src") || "";
        items.push({ name, link, imageUrl });
      }
    });

    const hasNextPage = doc.selectFirst("a.next") !== null;
    return { list: items, hasNextPage };
  }

  statusFromString(status) {
    return {
      "Ongoing": 0,
      "Completed": 1
    }[status] ?? 5;
  }

  async request(slug) {
    const url = `${this.getBaseUrl()}${slug}`;
    const res = await this.client.get(url, this.getHeaders(url));
    return new Document(res.body);
  }

  async getDetail(url) {
    const fullUrl = url.startsWith("http") ? url : this.getBaseUrl() + url;
    const res = await this.client.get(fullUrl, this.getHeaders(fullUrl));
    const doc = new Document(res.body);
    const body = doc.selectFirst("div#single");

    const title = body.selectFirst("h1")?.text?.trim() || "";

    const imgEl = body.selectFirst("div.poster img");
    let cover = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src") || "") : "";
    if (cover.startsWith("data:image")) cover = "";

    let desc = "";
    try {
      desc = body.selectFirst("div.synopsis")?.text?.trim() || "";
      if (!desc || desc.toLowerCase() === "synopsis") {
        desc = body.selectFirst("div.wp-content > p")?.text?.trim() || "";
      }
    } catch {
      desc = "";
    }

    let genres = [];
    try {
      genres = body.select("div.sgeneros a").map(e => e.text.trim());
    } catch {
      genres = [];
    }

    const chapters = body.select("ul.episodios li").map(el => {
      const a = el.selectFirst(".episodiotitle a");
      return {
        name: a?.text?.trim() || "Episode",
        url: a?.attr("href") || "",
        scanlator: "",
        dateUpload: ""
      };
    });

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
  const res = await this.client.get(url, this.getHeaders(this.getBaseUrl() + url));
  const doc = new Document(res.body);

  const iframeSrc = doc.selectFirst("iframe.metaframe")?.attr("src");
  if (!iframeSrc) throw new Error("Iframe not found");

  const iframeRes = await this.client.get(iframeSrc, this.getHeaders(iframeSrc));
  const html = iframeRes.body;

  // Try to extract sources[] array
  const sourcesMatch = html.match(/sources\s*:\s*(\[[\s\S]*?\])\s*,?\s*[\n}]/);
  if (sourcesMatch) {
    try {
      let sourcesRaw = sourcesMatch[1];
      sourcesRaw = sourcesRaw
        .replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":') // unquoted keys
        .replace(/'/g, '"')                       // single → double quotes
        .replace(/,\s*([\]}])/g, '$1');           // trailing commas

      const sources = JSON.parse(sourcesRaw);

      return sources.map(source => ({
        url: source.file,
        originalUrl: source.file,
        quality: source.label || "Unknown",
        headers: this.getHeaders(iframeSrc)
      }));
    } catch (err) {
      throw new Error("❌ Failed to parse sources[]: " + err.message);
    }
  }

  // Fallback: extract jw.file (for no-quality pages)
  const fileMatch = html.match(/"file"\s*:\s*"([^"]+\.mp4)"/);
  if (fileMatch) {
    const videoUrl = fileMatch[1].replace(/\\/g, ""); // clean \/
    return [{
      url: videoUrl,
      originalUrl: videoUrl,
      quality: "Unknown",
      headers: this.getHeaders(iframeSrc)
    }];
  }

  throw new Error("❌ No valid video source found in iframe page");
}





  getSourcePreferences() {
    return [];
  }
}
