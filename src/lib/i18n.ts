// Internationalization utilities (client-safe)
export type Locale = "zh" | "en";

export const defaultLocale: Locale = "en";
export const LOCALE_STORAGE_KEY = "spi_locale";

// Client-side locale detection (for client components)
export function getLocaleClient(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  try {
    const stored =
      window.localStorage.getItem(LOCALE_STORAGE_KEY) ||
      document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${LOCALE_STORAGE_KEY}=`))
        ?.split("=")[1];
    if (stored === "zh" || stored === "en") {
      return stored;
    }
  } catch {
    // ignore storage / cookie errors and fall back to navigator
  }

  // Prefer documentElement.lang set by server
  try {
    const docLang = document.documentElement.lang || "";
    if (docLang.toLowerCase().includes("zh")) {
      return "zh";
    }
    if (docLang) {
      return "en";
    }
  } catch {
    // ignore and fall through to navigator
  }

  const lang = navigator.language || (navigator as any).userLanguage || "";
  if (lang.includes("zh")) {
    return "zh";
  }
  return defaultLocale;
}

// Translation keys
export const translations = {
  zh: {
    // Common
    back: "返回",
    backToHome: "返回首页",
    backToArtist: "返回艺术家",
    loading: "加载中...",
    error: "错误",
    retry: "重试",
    
    // Home page
    searchPlaceholder: "搜索艺术家或曲目",
    searchButton: "搜索",
    searching: "搜索中...",
    searchHint: "支持艺术家名称、Spotify 链接、URI 或 ID，例如：The Beatles 或 https://open.spotify.com/track/xxxxx",
    searchError: "请输入艺术家或曲目",
    searchFailed: "搜索失败，请稍后再试",
    noResults: "未找到匹配结果",
    
    // Artist page
    artistOverview: "艺术家概览",
    totalTracks: "曲目数量",
    firstIndexed: "首次收录",
    indexing: "采集中…",
    topTracks: "流行指数 TOP 10 歌曲",
    topTracksDesc: "共 {count} 首，按流行指数降序",
    noTracks: "暂无歌曲",
    
    // Track page
    trackInsight: "曲目详情",
    album: "专辑",
    duration: "时长",
    by: "by",
    
    // Chart
    spiTrend: "流行指数走势",
    noHistoryData: "暂无历史数据。历史数据正在收集中，请稍后查看或尝试手动同步。",
    
    // Metrics
    followers: "关注者",
    
    // Table
    song: "歌曲",
    albumCol: "专辑",
    updateDate: "更新日期",
    
    // Home page
    title: "用数据看清艺人 & 单曲在 Spotify 上的流行指数",
    subtitle: "输入 Spotify 链接或艺人名称，查看最新流行指数和历史走势。",
    searchLabel: "搜索艺人或歌曲",
    searchButtonText: "立即搜索",
    brandTitle: "Next Stage — 音乐增长",
    brandSubtitle: "我们用数据策略，帮中国独立音乐人找到第一批精准的海外听众。",
    spiIntroTitle: "一分钟读懂SPI与Spotify算法机制",
    spiIntroSummary: "SPI 是 Spotify 决定要不要把你推给陌生听众的关键分数。分数越高，你越有机会被丢进 Discover Weekly、新歌雷达等官方歌单，比“总播放量”更直接决定你未来还能多红多久。",
    spiIntroCta: "了解 SPI 的价值",
  },
  en: {
    // Common
    back: "Back",
    backToHome: "Back to Home",
    backToArtist: "Back to Artist",
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    
    // Home page
    searchPlaceholder: "Search for artist or track (e.g. The Beatles or https://open.spotify.com/track/xxxxx)",
    searchButton: "Search",
    searching: "Searching...",
    searchHint: "Supports artist name, Spotify profile URL, URI, or ID",
    searchError: "Please enter an artist or track",
    searchFailed: "Search failed. Please try again.",
    noResults: "No matching results found",
    
    // Artist page
    artistOverview: "Artist Overview",
    totalTracks: "Total Tracks",
    firstIndexed: "First Indexed",
    indexing: "Indexing…",
    topTracks: "Top 10 Tracks by Popularity",
    topTracksDesc: "{count} tracks, sorted by popularity descending",
    noTracks: "No tracks available",
    
    // Track page
    trackInsight: "Track Insight",
    album: "Album",
    duration: "Duration",
    by: "by",
    
    // Table
    song: "Song",
    albumCol: "Album",
    updateDate: "Updated",
    
    // Chart
    spiTrend: "Popularity Trend",
    noHistoryData: "No historical data yet. We're still collecting it — please check back later or try manual sync.",
    
    // Metrics
    followers: "Followers",
    
    // Home page
    title: "See Artist & Track Popularity on Spotify",
    subtitle: "Enter a Spotify link or artist name to view current popularity scores and historical trends.",
    searchLabel: "Spotify popularity search",
    searchButtonText: "Analyze Now",
    brandTitle: "Next Stage — Music Marketing",
    brandSubtitle: "We help indie artists grow on Spotify with data, ads, and creative content.",
    spiIntroTitle: "Why your Spotify SPI matters more than total streams",
    spiIntroSummary: "SPI is Spotify’s 0–100 popularity score for every artist and track. When your SPI climbs, the algorithm starts testing your music with new listeners in Discover Weekly, Release Radar, and more. If you want the platform to push your songs for you, this is the number to pay attention to.",
    spiIntroCta: "Learn why SPI matters",
  },
} as const;

export function t(locale: Locale, key: keyof typeof translations.en, params?: Record<string, string | number>): string {
  const translation = translations[locale][key] || translations[defaultLocale][key] || key;
  
  if (params) {
    return translation.replace(/\{(\w+)\}/g, (_, paramKey) => {
      return String(params[paramKey] || `{${paramKey}}`);
    });
  }
  
  return translation;
}
