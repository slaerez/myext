const mangayomiSources = [{
  name: "HentaiWatch",
  lang: "en",
  baseUrl: "https://watchhentai.net",
  apiUrl: "https://watchhentai.net",
  iconUrl: "https://upload.wikimedia.org/wikipedia/commons/4/49/A_black_image.jpg",
  typeSource: "single",
  itemType: 1,
  version: "0.0.1",
  pkgPath: "anime/src/en/testingtest.js"
}];

class DefaultExtension extends MProvider {
  constructor() {
    super();
    this.client = new Client();
  }

  getBaseUrl() {
    return this.source.baseUrl;
  }

  async getPopular(page) {
    return { list: [], hasNextPage: false };
  }

  async getLatestUpdates(page) {
    return { list: [], hasNextPage: false };
  }

  get supportsLatest() {
    return true;
  }

  async search(query, page, filters) {
    return { list: [], hasNextPage: false };
  }

  async getDetail(url) {
    return {
      name: "Test Title",
      imageUrl: "",
      description: "This is a test.",
      author: null,
      artist: null,
      genre: ["Test"],
      link: url,
      status: 0,
      chapters: []
    };
  }

  async getVideoList(url) {
    return [{
      url: "https://example.com/test.mp4",
      originalUrl: "https://example.com/test.mp4",
      quality: "720p",
      headers: {}
    }];
  }

  getSourcePreferences() {
    return [];
  }
}
