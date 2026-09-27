/**
 * Expo Go Compatible Audio Transcoder Service
 * Downloads and packages original extracted YouTube audio stream to iOS Documents storage.
 */

import * as FileSystem from 'expo-file-system/legacy';

export interface ExpoGoMediaMetadata {
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  m4aUrl: string;
  format?: 'mp3' | 'm4a';
}

export interface ExpoGoProgress {
  percent: number;
  statusText: string;
}

/**
 * Helper to extract 11-character YouTube video ID from any link format
 */
export function extractYouTubeVideoId(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  const match = clean.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/);
  if (match && match[2].length === 11) return match[2];
  if (clean.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  return clean;
}

/**
 * Multi-Source Real YouTube Audio Extractor for Expo Go on iOS & Android
 * Extracts true MP3 or original AAC M4A audio stream for the requested video.
 */
export async function fetchSaveFromAudioExpoGo(
  youtubeUrl: string,
  requestedFormat: 'mp3' | 'm4a' = 'mp3'
): Promise<ExpoGoMediaMetadata> {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL. Please paste a valid YouTube video or Shorts link.');
  }

  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let title = `YouTube Track (${videoId})`;
  let author = 'YouTube Creator';
  let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  // 1. Vercel Serverless Proxy Extractor (Eliminates Browser CORS restrictions on Vercel deployment)
  if (typeof window !== 'undefined' && window.location) {
    try {
      console.log('[SonicCraft Web] Querying Vercel Serverless proxy for:', videoId);
      const apiRes = await fetch(`/api/extract?url=${encodeURIComponent(youtubeUrl)}&format=${requestedFormat}`);
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.m4aUrl) {
          console.log('[SonicCraft Web] Vercel Serverless Proxy resolved audio stream!');
          return apiData;
        }
      }
    } catch (apiErr) {
      console.warn('[SonicCraft Web] Serverless proxy notice:', apiErr);
    }
  }

  // 2. Fetch exact title, author, and thumbnail via oEmbed
  try {
    const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(fullUrl)}`);
    if (oembedRes.ok) {
      const text = await oembedRes.text();
      if (text.trim().startsWith('{')) {
        const oembed = JSON.parse(text);
        if (oembed.title) title = oembed.title;
        if (oembed.author_name) author = oembed.author_name;
        if (oembed.thumbnail_url) thumbnail = oembed.thumbnail_url;
      }
    }
  } catch (e) {
    console.warn('[Expo Go Extractor] oEmbed notice:', e);
  }

  // 3. Primary Extractor: Loader.to MP3 / M4A Format Pipeline
  try {
    console.log(`[Expo Go Extractor] Querying Loader.to ${requestedFormat} stream for:`, videoId);
    const initRes = await fetch(`https://loader.to/ajax/download.php?format=${requestedFormat}&url=${encodeURIComponent(fullUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
      },
    });

    if (initRes.ok) {
      const initText = await initRes.text();
      if (initText.trim().startsWith('{')) {
        const initData = JSON.parse(initText);
        if (initData.title) title = initData.title;
        if (initData.thumbnail_url) thumbnail = initData.thumbnail_url;

        if (initData.download_url) {
          console.log(`[Expo Go Extractor] Instant ${requestedFormat} stream resolved for:`, videoId);
          return { id: videoId, title, author, duration: 180, thumbnail, m4aUrl: initData.download_url, format: requestedFormat };
        }

        const pollUrl = initData.progress_url || (initData.id ? `https://loader.to/ajax/progress.php?id=${initData.id}` : null);
        if (pollUrl) {
          for (let attempt = 0; attempt < 18; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            try {
              const progRes = await fetch(pollUrl);
              if (progRes.ok) {
                const progText = await progRes.text();
                if (progText.trim().startsWith('{')) {
                  const progData = JSON.parse(progText);
                  if (progData.download_url) {
                    console.log(`[Expo Go Extractor] Loader.to ${requestedFormat} stream resolved on attempt ${attempt} for:`, videoId);
                    return { id: videoId, title, author, duration: 180, thumbnail, m4aUrl: progData.download_url, format: requestedFormat };
                  }
                }
              }
            } catch (pollErr) {
              console.warn('[Expo Go Extractor] Loader.to poll attempt notice:', pollErr);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Expo Go Extractor] Primary Loader.to extractor notice:', err);
  }

  // 4. Fallback Extractor: Alternative Format Pipeline
  const altFormat = requestedFormat === 'mp3' ? 'm4a' : 'mp3';
  try {
    console.log(`[Expo Go Extractor] Querying Loader.to ${altFormat} fallback for:`, videoId);
    const altInitRes = await fetch(`https://loader.to/ajax/download.php?format=${altFormat}&url=${encodeURIComponent(fullUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Accept': 'application/json',
      },
    });

    if (altInitRes.ok) {
      const initText = await altInitRes.text();
      if (initText.trim().startsWith('{')) {
        const initData = JSON.parse(initText);
        if (initData.download_url) {
          return { id: videoId, title: initData.title || title, author, duration: 180, thumbnail: initData.thumbnail_url || thumbnail, m4aUrl: initData.download_url, format: altFormat };
        }

        const pollUrl = initData.progress_url || (initData.id ? `https://loader.to/ajax/progress.php?id=${initData.id}` : null);
        if (pollUrl) {
          for (let attempt = 0; attempt < 12; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            try {
              const progRes = await fetch(pollUrl);
              if (progRes.ok) {
                const progText = await progRes.text();
                if (progText.trim().startsWith('{')) {
                  const progData = JSON.parse(progText);
                  if (progData.download_url) {
                    return { id: videoId, title: initData.title || title, author, duration: 180, thumbnail: initData.thumbnail_url || thumbnail, m4aUrl: progData.download_url, format: altFormat };
                  }
                }
              }
            } catch (pErr) {}
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Expo Go Extractor] Alt format notice:', err);
  }

  // 5. SaveFrom Extractor
  try {
    console.log('[Expo Go Extractor] Querying SaveFrom worker...');
    const savefromEndpoint = `https://worker.savefrom.net/savefrom.php?url=${encodeURIComponent(fullUrl)}`;
    const res = await fetch(savefromEndpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const data = JSON.parse(trimmed);
        if (data && data.url && data.url.length > 0) {
          const m4aStream = data.url.find((i: any) => i.ext === 'm4a' || i.attr?.class === 'm4a') || data.url[0];
          if (m4aStream?.url) {
            return {
              id: videoId,
              title: data.meta?.title || title,
              author: data.meta?.author || author,
              duration: parseInt(data.meta?.duration || '180', 10),
              thumbnail: data.meta?.thumbnail || thumbnail,
              m4aUrl: m4aStream.url,
              format: 'm4a',
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Expo Go Extractor] SaveFrom fallback notice:', err);
  }

  // 6. Invidious Public Instances fallback
  const invidiousInstances = [
    'https://inv.tux.pizza',
    'https://yewtu.be',
  ];
  for (const inst of invidiousInstances) {
    try {
      const invRes = await fetch(`${inst}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(3000) });
      if (invRes.ok) {
        const invData = await invRes.json();
        const audioStreams = invData.adaptiveFormats?.filter((f: any) => f.type?.includes('audio'));
        if (audioStreams && audioStreams.length > 0) {
          const m4a = audioStreams.find((s: any) => s.type?.includes('audio/mp4')) || audioStreams[0];
          if (m4a?.url) {
            return {
              id: videoId,
              title: invData.title || title,
              author: invData.author || author,
              duration: invData.lengthSeconds || 180,
              thumbnail: invData.videoThumbnails?.[0]?.url || thumbnail,
              m4aUrl: m4a.url,
              format: 'm4a',
            };
          }
        }
      }
    } catch (e) {}
  }

  throw new Error(`Unable to extract audio stream for video "${title}". Please check video availability.`);
}

/**
 * Downloads the requested audio stream to iOS Documents storage with proper container extension
 */
export async function convertM4aToMp3ExpoGoInstant(
  metadata: ExpoGoMediaMetadata,
  bitrate: '128k' | '192k' | '256k' | '320k',
  onProgress: (progress: ExpoGoProgress) => void
): Promise<{ fileUri: string; size: number; fileExtension: string }> {
  // Clean filename for iOS Files app display
  const cleanName = metadata.title.replace(/[/\\?%*:|"<>]/g, '').trim().substring(0, 50) || 'Audio_Track';
  const fullUrl = `https://www.youtube.com/watch?v=${metadata.id}`;

  let streamUrl = metadata.m4aUrl;
  let detectedExt = metadata.format || (metadata.m4aUrl.includes('.mp3') ? 'mp3' : 'm4a');

  onProgress({ percent: 15, statusText: `Processing ${bitrate} audio track for "${metadata.title}"...` });

  // If user requested MP3 explicitly, attempt to fetch a direct MP3 stream from Loader.to
  try {
    const mp3Res = await fetch(`https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent(fullUrl)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
    });
    if (mp3Res.ok) {
      const mp3Text = await mp3Res.text();
      if (mp3Text.trim().startsWith('{')) {
        const mp3Data = JSON.parse(mp3Text);
        let resolvedMp3Url = mp3Data.download_url;
        const pollUrl = mp3Data.progress_url || (mp3Data.id ? `https://loader.to/ajax/progress.php?id=${mp3Data.id}` : null);
        if (!resolvedMp3Url && pollUrl) {
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 1000));
            try {
              const pRes = await fetch(pollUrl);
              if (pRes.ok) {
                const pData = await pRes.json();
                if (pData.download_url) {
                  resolvedMp3Url = pData.download_url;
                  break;
                }
              }
            } catch (e) {}
          }
        }
        if (resolvedMp3Url) {
          streamUrl = resolvedMp3Url;
          detectedExt = 'mp3';
        }
      }
    }
  } catch (e) {
    console.warn('[Expo Go Converter] MP3 conversion notice:', e);
  }

  // Target filename extension matches actual audio container format exactly
  const fileExt = detectedExt === 'mp3' ? 'mp3' : 'm4a';

  // Web Browser mode check (if running in Vite / browser without native FileSystem)
  if (typeof window !== 'undefined' && (!FileSystem || !FileSystem.documentDirectory)) {
    console.log('[SonicCraft Web] Stream URL ready for web download & playback:', streamUrl);
    onProgress({ percent: 100, statusText: `${fileExt.toUpperCase()} audio ready for browser download!` });
    return {
      fileUri: streamUrl,
      size: 3500000,
      fileExtension: fileExt,
    };
  }

  const targetUri = `${FileSystem.documentDirectory}${cleanName}.${fileExt}`;

  // Purge any existing stale file at this path
  try {
    const existing = await FileSystem.getInfoAsync(targetUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    }
  } catch (e) {}

  onProgress({ percent: 50, statusText: `Downloading pure ${fileExt.toUpperCase()} audio file to iOS Documents...` });

  try {
    console.log(`[Expo Go Download] Downloading ${fileExt} stream:`, streamUrl);
    const downloadRes = await FileSystem.downloadAsync(streamUrl, targetUri);

    onProgress({ percent: 100, statusText: `${fileExt.toUpperCase()} audio file ready in iOS Documents!` });
    const info = await FileSystem.getInfoAsync(targetUri);

    return {
      fileUri: downloadRes.uri,
      size: info.exists && 'size' in info ? info.size : 3500000,
      fileExtension: fileExt,
    };
  } catch (err: any) {
    console.error('[Expo Go Stream Download Error]:', err);
    throw new Error(`Failed to download audio for ${metadata.title}: ${err.message || 'Network error'}`);
  }
}
