const mangayomiSources = [{
  "name": "Rule34Video",
  "id": 902023999,
  "lang": "all",
  "baseUrl": "https://rule34video.com",
  "apiUrl": "https://rule34video.com",
  "iconUrl": "https://raw.githubusercontent.com/slaerez/myext/main/javascript/icon/all.rule34video.png",
  "typeSource": "single",
  "itemType": 1,
  "isNsfw": true,
  "version": "0.0.1",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "anime/src/all/rule34video.js"
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

  getSupportsLatest() {
    return true;
  }

  async getPopular(page) {
  const from = page === 1 ? 0 : page;
  const url = `https://rule34video.com/?mode=async&function=get_block&block_id=custom_list_videos_most_recent_videos&sort_by=video_viewed&from=${from}&_=${Date.now()}`;
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);
  const items = [];

  const elements = Array.from(doc.select('div.item.thumb[class*=video_]'));

  elements.forEach((el) => {
    const a = el.selectFirst("a.th.js-open-popup");
    const img = el.selectFirst("img.thumb.lazy-load");

    const title = a?.attr("title")?.trim() ?? "";
    const link = a?.attr("href");
    const imageUrl = img?.attr("data-original");

    if (title && link) {
      items.push({
        name: title,
        link,
        imageUrl,
      });
    }
  });

  const hasNextPage = elements.length === 36;
  return {
    list: items,
    hasNextPage,
  };
}


  async getLatestUpdates(page) {
  const offset = (page - 1) * 36;
  const url = `${this.getBaseUrl()}/?mode=async&function=get_block&block_id=custom_list_videos_most_recent_videos&sort_by=video_added&from=${offset}&_=${Date.now()}`;
  const res = await this.client.get(url, this.getHeaders(url));
  const doc = new Document(res.body);

  const elements = Array.from(doc.select('div.item.thumb[class*=video_]'));
  const items = [];

  elements.forEach((el, i) => {
    try {
      const a = el.selectFirst("a.th.js-open-popup");
      const img = el.selectFirst("img.thumb.lazy-load");

      const name = a?.attr("title")?.trim() || "";
      const link = a?.attr("href");
      const imageUrl = img?.attr("data-original");

      if (name && link && imageUrl) {
        items.push({ name, link, imageUrl });
      } else {
        console.warn(`❌ Skipping [${i}] | name: ${name}, link: ${link}, imageUrl: ${imageUrl}`);
      }
    } catch (e) {
      console.warn(`❌ Error parsing item [${i}]:`, e.message);
    }
  });

  
  const hasNextPage = true;
  return { list: items, hasNextPage };
}

  
          search(query, page) {
  const offset = (page - 1) * 24;
  const cleanedQuery = query.trim().replace(/\s+/g, '+');
  const url = `${this.getBaseUrl()}/search/${cleanedQuery}/?mode=async&function=get_block&block_id=custom_list_videos_videos_list_search&q=${cleanedQuery}&from_videos=${page}&from_albums=2&_=${Date.now()}`;

  return this.client.get(url, this.getHeaders(url)).then(res => {
    const doc = new Document(res.body);
    const items = [];

    const elements = Array.from(doc.select("div.item.thumb[class*=video_]"));
    console.log(`🔍 Found ${elements.length} video blocks for search '${query}'`);

    elements.forEach((el, index) => {
      try {
        const a = el.selectFirst("a.th.js-open-popup");
        const img = el.selectFirst("img.thumb.lazy-load");

        const title = a?.attr("title")?.trim() || "";
        const link = a?.attr("href");
        const imageUrl = img?.attr("data-original");

        if (title && link && imageUrl) {
          items.push({ name: title, link, imageUrl });
          console.log(`✅ [${index}] ${title}`);
        } else {
          console.warn(`❌ Skipping [${index}] | title: ${title}, link: ${link}, image: ${imageUrl}`);
        }
      } catch (err) {
        console.warn(`❌ Error at [${index}]: ${err.message}`);
      }
    });

    const hasNextPage = elements.length === 24;
    return { list: items, hasNextPage };
  });
}


    async getDetail(url) {
  const client = new Client();
  const res = await client.get(url, {
    "Cookie": "age_verified=1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  });

  const doc = new Document(res.body);

  const title = doc.selectFirst("h1")?.text || "";
  const image = doc.selectFirst("video#player")?.attr("poster") || "";
  const infoSpans = Array.from(doc.select("div.info.row span"));
  const description = infoSpans.map(s => s.text?.trim()).filter(Boolean).join(" | ");

  
  const author = Array.from(
  doc.select(".col:has(.label:contains(Artist)) span.name")
)
  .map(span => span.text.trim())
  .filter(Boolean)
  .join(", ");


  const genres = Array.from(doc.select("a.tag_item"))
    .map(tag => tag.text)
    .filter(tag => tag && !tag.includes("+") && !tag.includes("p"));

  const episodeName = title;
  const episodeUrl = url;

  return {
    title,
    image,
    description,
    author,
    genre: genres,
    status: 0,
    episodes: [
      {
        name: episodeName,
        url: episodeUrl
      }
    ]
  };
}


    async getVideoList(url) {
  const client = new Client();
  
  const res = await client.get(url, {
    "Cookie": "age_verified=1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  });
  const body = res.body;

  const videos = [];

  
  const qualityKeys = [
    { label: "2160p", key: "video_alt_url4" },
    { label: "1080p", key: "video_alt_url3" },
    { label: "720p",   key: "video_alt_url2" },
    { label: "480p",   key: "video_alt_url" },
    { label: "360p",   key: "video_url" }
  ];
  for (const { label, key } of qualityKeys) {
    const re = new RegExp(`${key}\\s*:\\s*['"]function/0/([^'"]+)['"]`);
    const m = body.match(re);
    if (m) {
      
      const mp4Path = m[1];
      const indirect = `https://${this.source.baseUrl.replace(/^https?:\/\//, "")}${mp4Path}`;
      try {
        
        const r2 = await client.get(indirect, {
          "Referer": url,
          "Cookie": "age_verified=1",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        });
        if (r2.url && r2.url.endsWith(".mp4")) {
          videos.push({ url: r2.url, originalUrl: r2.url, quality: label });
        }
      } catch (e) {
        console.warn(`❌ ${label} resolution failed: ${e.message}`);
      }
    }
  }

  
  if (videos.length === 0) {
    const vid = body.match(/<video[^>]+src=['"]([^'"]+)['"]/);
    if (vid) {
      videos.push({ url: vid[1], originalUrl: vid[1], quality: "default" });
    }
  }

  
  if (videos.length === 0) {
    
    const dlSection = body.match(
      /<div[^>]*>\s*<div class="label">\s*Download\s*<\/div>([\s\S]*?)<\/div>/
    );
    if (dlSection) {
      
      const linkRe = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
      let lm;
      while ((lm = linkRe.exec(dlSection[1])) !== null) {
        const href = lm[1];
        const text = lm[2].trim(); 
        
        if (href.includes(".mp4")) {
          
          const q = text.match(/(\d{3,4}p)/)?.[1] || "download";
          videos.push({
            url: href,
            originalUrl: href,
            quality: q
          });
        }
      }
    }
  }

  if (videos.length === 0) {
    throw new Error("No playable video URLs found.");
  }

  return videos;
}



  getSourcePreferences() {
    return [];
  }
}
