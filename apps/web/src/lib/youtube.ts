const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

function isYoutubeVideoId(id: string | null | undefined): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  return trimmed.length >= 8 && trimmed.length <= 20 && /^[A-Za-z0-9_-]+$/.test(trimmed);
}

function pickVideoId(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const match = candidate.trim().match(/^([A-Za-z0-9_-]+)/);
  const id = match?.[1];
  return id && isYoutubeVideoId(id) ? id : null;
}

export function normalizeYoutubeInputUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function extractYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  let parsed: URL;
  try {
    parsed = new URL(normalizeYoutubeInputUrl(url));
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host === "youtu.be") {
    return pickVideoId(parsed.pathname.split("/").filter(Boolean)[0]);
  }

  const fromQuery = pickVideoId(parsed.searchParams.get("v"));
  if (fromQuery) return fromQuery;

  const segments = parsed.pathname.split("/").filter(Boolean);
  const prefixes = new Set(["shorts", "embed", "v", "live"]);
  if (segments.length >= 2 && prefixes.has(segments[0])) {
    return pickVideoId(segments[1]);
  }

  return null;
}

export function looksLikeYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null;
}

/** Thumbnail otimista (sem verificar existência) — igual ao backend para preview rápido. */
export function buildYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function youtubeThumbnailFromDestUrl(url: string): string | null {
  const id = extractYoutubeVideoId(url);
  return id ? buildYoutubeThumbnailUrl(id) : null;
}
