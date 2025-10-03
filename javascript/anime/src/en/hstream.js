const mangayomiSources = [{
  "name": "Hstream",
  "id": 219341837,
  "lang": "en",
  "baseUrl": "https://hstream.moe",
  "apiUrl": "",
  "iconUrl": "https://raw.githubusercontent.com/slaerez/myext/main/javascript/icon/en.hstream.png",
  "typeSource": "single",
  "itemType": 1,
  "isNsfw": true,
  "version": "0.0.1",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "anime/src/en/hstream.js",

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
      "Referer": url,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    };
  }

  async getPopular(page) {
    const url = `${this.getBaseUrl()}/search?order=view-count&page=${page}`;
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const items = [];
    const elements = Array.from(doc.select("div.items-center div.w-full > a"));

    elements.forEach(a => {
      const href = a.attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${this.getBaseUrl()}${href}`;

      const img = a.selectFirst("img");
      const title = img?.attr("alt")?.trim() ?? "Untitled";

      const slug = link.split("/").filter(Boolean).pop() ?? "";
      const episodeNumber = slug.split("-").pop();
      const displayTitle = episodeNumber && /^\d+$/.test(episodeNumber)
        ? `${title} – Episode ${episodeNumber}`
        : title;

      const slugBase = slug.replace(/-\d+$/, "");
      const imageUrl = `${this.getBaseUrl()}/images/hentai/${slugBase}/cover-ep-${episodeNumber}.webp`;

      items.push({
        name: displayTitle,
        link,
        imageUrl
      });
    });

    const hasNextPage = doc.selectFirst("span[aria-current] + a") !== null;
    return { list: items, hasNextPage };
  }

  get supportsLatest() {
    return true;
  }

  async getLatestUpdates(page) {
    const url = `${this.getBaseUrl()}/search?order=recently-uploaded&page=${page}`;
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const items = [];
    const elements = Array.from(doc.select("div.items-center div.w-full > a"));

    elements.forEach(a => {
      const href = a.attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${this.getBaseUrl()}${href}`;

      const img = a.selectFirst("img");
      const title = img?.attr("alt")?.trim() ?? "Untitled";

      const slug = link.split("/").filter(Boolean).pop() ?? "";
      const episodeNumber = slug.split("-").pop();
      const displayTitle = episodeNumber && /^\d+$/.test(episodeNumber)
        ? `${title} – Episode ${episodeNumber}`
        : title;

      const slugBase = slug.replace(/-\d+$/, "");
      const imageUrl = `${this.getBaseUrl()}/images/hentai/${slugBase}/cover-ep-${episodeNumber}.webp`;

      items.push({
        name: displayTitle,
        link,
        imageUrl
      });
    });

    const hasNextPage = doc.selectFirst("span[aria-current] + a") !== null;
    return { list: items, hasNextPage };
  }

  async search(query, page) {
    const url = `${this.getBaseUrl()}/search?search=${encodeURIComponent(query)}&page=${page}`;
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const items = [];
    const elements = Array.from(doc.select("div.items-center div.w-full > a"));

    elements.forEach(a => {
      const href = a.attr("href") ?? "";
      const link = href.startsWith("http") ? href : `${this.getBaseUrl()}${href}`;

      const img = a.selectFirst("img");
      const title = img?.attr("alt")?.trim() ?? "Untitled";

      const slug = link.split("/").filter(Boolean).pop() ?? "";
      const episodeNumber = slug.split("-").pop();
      const displayTitle = episodeNumber && /^\d+$/.test(episodeNumber)
        ? `${title} – Episode ${episodeNumber}`
        : title;

      const slugBase = slug.replace(/-\d+$/, "");
      const imageUrl = `${this.getBaseUrl()}/images/hentai/${slugBase}/cover-ep-${episodeNumber}.webp`;

      items.push({
        name: displayTitle,
        link,
        imageUrl
      });
    });

    const hasNextPage = doc.selectFirst("span[aria-current] + a") !== null;
    return { list: items, hasNextPage };
  }

  async getDetail(url) {
    const res = await this.client.get(url, this.getHeaders(url));
    const doc = new Document(res.body);

    const title = doc.selectFirst("div.relative > div.justify-between > div h1")?.text?.trim() ?? "Untitled";
    const author = doc.selectFirst('a[href*="studios"]')?.text?.trim() ?? "";
    const description = doc.selectFirst("div.relative > p.leading-tight")?.text?.trim() ?? "";
    const imageUrl = doc.selectFirst("div.float-left > img.object-cover")?.attr("src")?.trim();
    const fullImage = imageUrl?.startsWith("http") ? imageUrl : `${this.getBaseUrl()}${imageUrl}`;

    const genres = Array.from(doc.select("ul.list-none.text-center a"))
      .map(a => a.text?.trim())
      .filter(tag => tag && tag !== "|");

    const episodes = [];

    const seriesLink = doc.selectFirst('a.text-rose-600[href*="/hentai/"]')?.attr("href");
    if (seriesLink) {
      const seriesUrl = seriesLink.startsWith("http") ? seriesLink : `${this.getBaseUrl()}${seriesLink}`;
      const seriesRes = await this.client.get(seriesUrl, this.getHeaders(seriesUrl));
      const seriesDoc = new Document(seriesRes.body);

      Array.from(seriesDoc.select("div.grid div.relative a")).forEach(a => {
        const rawTitle = a.selectFirst('p.text-sm.text-center.text-black.dark\\:text-white')?.text ?? "";
        const epTitle = rawTitle.replace(/\s+/g, " ").trim() || "Episode";
        const epUrl = a.attr("href");
        if (epUrl) {
          episodes.push({
            name: epTitle,
            url: epUrl.startsWith("http") ? epUrl : `${this.getBaseUrl()}${epUrl}`
          });
        }
      });
    }

    if (episodes.length === 0) {
      const slug = url.split("/").filter(Boolean).pop() ?? "";
      const epNum = slug.split("-").pop();
      const episodeName = /^\d+$/.test(epNum) ? `Episode ${epNum}` : "Episode";
      episodes.push({ name: episodeName, url });
    }

    return {
      title,
      description,
      imageUrl: fullImage,
      author,
      genre: genres,
      episodes
    };
  }

  async getVideoList(url) {
  const videos = [];

  const res = await this.client.get(url, {
    headers: {
      Referer: "https://hstream.moe",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    }
  });
  const html = res.body;

  const idMatch = html.match(/<input[^>]+id=["']e_id["'][^>]+value=["'](\d+)["']/);
  if (!idMatch) throw new Error("❌ Episode ID not found in HTML");
  const episodeId = idMatch[1];

  const assMatch = html.match(/<a[^>]+href=["'](https?:\/\/[^/]+)\/(\d{4})\/([^/]+)\/(E\d{2}[^/]*)\/eng\.ass["']/i);
  if (!assMatch) throw new Error("❌ Subtitle (.ass) link not found in page");

  const domain = assMatch[1];
  const releaseYear = assMatch[2];
  const streamTitle = assMatch[3];
  const episodeNum = assMatch[4];

  const streamPath = `${releaseYear}/${streamTitle}/${episodeNum}`;
  const subtitleUrl = `${domain}/${streamPath}/eng.ass`;

  const qualities = ["2160", "1080", "720"];

  
  qualities.forEach((q) => {
    const mpd = `${domain}/${streamPath}/${q}/manifest.mpd`;
    videos.push({
      url: mpd,
      originalUrl: mpd,
      quality: q,
      headers: {
        Referer: "https://hstream.moe",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
      }
    });
  });

  
  const fallbackMp4 = `${domain}/${streamPath}/x264.720p.mp4`;
  videos.push({
    url: fallbackMp4,
    originalUrl: fallbackMp4,
    quality: "720p MP4 (fallback)",
    headers: {
      Referer: "https://hstream.moe",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
    }
  });

  if (videos.length > 0) {
    videos[0].subtitles = [
      {
        label: "English",
        file: subtitleUrl
      }
    ];
  }

  if (videos.length === 0) {
    throw new Error("❌ No video sources found");
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
