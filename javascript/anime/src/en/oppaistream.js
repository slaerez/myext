const mangayomiSources = [{
    "name": "OppaiStream",
    "id": 602983978,
    "lang": "en",
    "baseUrl": "https://oppai.stream/",
    "apiUrl": "",
    "iconUrl": "https://raw.githubusercontent.com/slaerez/myext/main/javascript/icon/all.oppaistream.png",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/en/oppaistream.js",
    
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
  // ❶ build the XHR URL oppai.stream actually uses
  const url =
    `https://oppai.stream/actions/search.php` +
    `?text=&order=views&page=${page}&limit=35` +
    `&genres=&blacklist=&studio=&ibt=0&swa=1`;

  // ❷ fetch the HTML with correct headers (same pattern as Rule34Video)
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.in-main-gr"));

  elements.forEach(el => {
    const a = el.selectFirst("a");
    if (!a) return;

    // absolute link to /watch?…
    const href = a.attr("href") ?? "";
    const link = href.startsWith("http") ? href : `https://oppai.stream${href}`;

    // title + optional episode number
    const title = el.selectFirst("font.title")?.text?.trim() ?? "Untitled";
    const ep    = el.selectFirst("font.ep")?.text?.trim();
    const full  = ep ? `${title} – Episode ${ep}` : title;

    // poster (falls back to empty string)
    const poster = el.selectFirst("img.cover-img-in")?.attr("original") ?? "";

    items.push({
      name: full,      // ← Mangayomi expects “name”
      link,            //   and “link”
      imageUrl: poster //   and “imageUrl”
    });
  });

  // oppai returns exactly 35 items per page
  const hasNextPage = elements.length === 35;

  return { list: items, hasNextPage };
}

      
    get supportsLatest() {
  return true;
}
        
    
    async getLatestUpdates(page) {
  // ❶ change order=uploaded instead of views
  const url =
    `https://oppai.stream/actions/search.php` +
    `?text=&order=uploaded&page=${page}&limit=35` +
    `&genres=&blacklist=&studio=&ibt=0&swa=1`;

  // ❷ fetch and parse
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.in-main-gr"));

  elements.forEach(el => {
    const a = el.selectFirst("a");
    if (!a) return;

    const href = a.attr("href") ?? "";
    const link = href.startsWith("http") ? href : `https://oppai.stream${href}`;

    const title = el.selectFirst("font.title")?.text?.trim() ?? "Untitled";
    const ep    = el.selectFirst("font.ep")?.text?.trim();
    const full  = ep ? `${title} – Episode ${ep}` : title;

    const poster = el.selectFirst("img.cover-img-in")?.attr("original") ?? "";

    items.push({
      name: full,
      link,
      imageUrl: poster
    });
  });

  const hasNextPage = elements.length === 35;

  return { list: items, hasNextPage };
}


    async search(query, page) {
  const url =
    `https://oppai.stream/actions/search.php` +
    `?text=${encodeURIComponent(query)}&order=recent&page=${page}&limit=35` +
    `&genres=&blacklist=&studio=&ibt=0&swa=1`;

  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const items = [];
  const elements = Array.from(doc.select("div.in-main-gr"));

  elements.forEach(el => {
    const a = el.selectFirst("a");
    if (!a) return;

    const href = a.attr("href") ?? "";
    const link = href.startsWith("http") ? href : `https://oppai.stream${href}`;

    const title = el.selectFirst("font.title")?.text?.trim() ?? "Untitled";
    const ep    = el.selectFirst("font.ep")?.text?.trim();
    const full  = ep ? `${title} – Episode ${ep}` : title;

    const poster = el.selectFirst("img.cover-img-in")?.attr("original") ?? "";

    items.push({
      name: full,
      link,
      imageUrl: poster
    });
  });

  const hasNextPage = elements.length === 35;

  return { list: items, hasNextPage };
}
      
    
    async getDetail(url) {
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const title = doc.selectFirst('meta[property="og:title"]')?.attr("content") ?? "Untitled";
  const imageUrl = doc.selectFirst('meta[property="og:image"]')?.attr("content") ?? "";
  const descFull = doc.selectFirst('meta[property="og:description"]')?.attr("content") ?? "";
  const description = descFull.split("|")[0].trim();
  const author = doc.selectFirst("h6.gray.line-5 a.red")?.text?.trim() ?? "";
  const genres = Array.from(doc.select("div.tags h5.gray")).map(tag => tag.text);

  const episodes = [];

  // 1. Try to load from series page (if available)
  const seriesLink = doc.selectFirst("a:contains(All Episodes)")?.attr("href");
  if (seriesLink) {
    const fullSeriesUrl = seriesLink.startsWith("http")
      ? seriesLink
      : `https://oppai.stream${seriesLink}`;
    const seriesRes = await this.client.get(fullSeriesUrl, this.getHeaders(fullSeriesUrl));
    const seriesDoc = new Document(seriesRes.body);

    Array.from(seriesDoc.select("div#allepisodes .in-grid")).forEach(ep => {
      const a = ep.selectFirst("a");
      if (!a) return;

      const epNum = a.selectFirst("font.ep")?.text?.trim() ?? "";
      const epTitle = a.selectFirst("font.title")?.text?.trim() ?? "Episode";
      const epName = epNum ? `${epTitle} – Episode ${epNum}` : epTitle;
      const epUrl = a.attr("href")?.startsWith("http")
        ? a.attr("href")
        : `https://oppai.stream${a.attr("href")}`;

      episodes.push({
        name: epName,
        url: epUrl
      });
    });
  }

  // 2. If series page missing or incomplete, fallback to same-folder on-page episodes
  if (episodes.length === 0) {
    const currentEpisode = doc.selectFirst("div.in-grid.episode-shown");
    const folder = currentEpisode?.attr("folder")?.trim() ?? "";

    Array.from(doc.select("div.in-grid.episode-shown")).forEach(ep => {
      if (ep.attr("folder")?.trim() === folder) {
        const a = ep.selectFirst("a");
        if (!a) return;

        const epNum = a.selectFirst("font.ep")?.text?.trim() ?? "";
        const epTitle = a.selectFirst("font.title")?.text?.trim() ?? "Episode";
        const epName = epNum ? `${epTitle} – Episode ${epNum}` : epTitle;
        const epUrl = a.attr("href")?.startsWith("http")
          ? a.attr("href")
          : `https://oppai.stream${a.attr("href")}`;

        episodes.push({
          name: epName,
          url: epUrl
        });
      }
    });
  }

  // Fallback if absolutely nothing found
  if (episodes.length === 0) {
    episodes.push({
      name: title,
      url: url
    });
  }

  return {
    title,
    imageUrl,
    description,
    author,
    genre: genres,
    episodes
  };
}




    async getVideoList(url) {
  const res = await this.client.get(url, {
    headers: {
      Referer: "https://oppai.stream",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });

  const body = res.body;
  const videos = [];

  // Match video sources (availableres JSON)
  const match = body.match(/var\s+availableres\s*=\s*(\{[^}]+\})/);
  if (match) {
    const jsonStr = match[1]
      .replace(/\\\//g, "/")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");

    try {
      const videoJson = JSON.parse(jsonStr);

      const qualityOrder = ["4k", "1080", "720"];
      for (const q of qualityOrder) {
        if (videoJson[q]) {
          videos.push({
            url: videoJson[q],
            originalUrl: videoJson[q],
            quality: q,
            headers: {
              Referer: "https://oppai.stream",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse availableres JSON:", e);
    }
  }

  if (videos.length === 0) {
    throw new Error("No playable video URLs found.");
  }

  // Find .vtt subtitle (e.g. _SUB_1.vtt)
  const subtitleMatch = body.match(/<track[^>]+src=["']([^"']+?_SUB_\d+\.vtt)["']/i);
  if (subtitleMatch) {
    const subtitleUrl = subtitleMatch[1];

    // ✅ Add to `subtitles` key on first stream
    videos[0].subtitles = [
      {
        label: "English",
        file: subtitleUrl
      }
    ];
  }

  return videos;
}


    
    
    // For manga chapter pages
    async getPageList(url) {
        throw new Error("getPageList not implemented");
    }
    getFilterList() {
        throw new Error("getFilterList not implemented");
    }
    getSourcePreferences() {
        throw new Error("getSourcePreferences not implemented");
    }
}
