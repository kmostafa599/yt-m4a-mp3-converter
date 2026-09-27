/**
 * SaveFrom API Audio Stream Extractor for Native iOS & Android
 */

export interface NativeMediaMetadata {
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  m4aUrl: string;
  quality: string;
}

export async function fetchSaveFromAudioNative(youtubeUrl: string): Promise<NativeMediaMetadata> {
  const cleanUrl = youtubeUrl.trim();
  
  // 1. Extract Video ID
  const match = cleanUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/);
  const videoId = match && match[2].length === 11 ? match[2] : cleanUrl;
  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // 2. Query SaveFrom worker API directly from iOS (Native fetch circumvents browser CORS limitations)
    const savefromEndpoint = `https://worker.savefrom.net/savefrom.php?url=${encodeURIComponent(fullUrl)}`;
    
    const response = await fetch(savefromEndpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.url && data.url.length > 0) {
        // Filter for M4A format (AAC audio stream)
        const m4aStream = data.url.find((item: any) => item.ext === 'm4a' || item.attr?.class === 'm4a') || data.url[0];
        
        return {
          id: videoId,
          title: data.meta?.title || 'YouTube Audio Track',
          author: data.meta?.author || 'YouTube Creator',
          duration: parseInt(data.meta?.duration || '180', 10),
          thumbnail: data.meta?.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          m4aUrl: m4aStream.url,
          quality: 'SaveFrom AAC M4A (Original Stream)',
        };
      }
    }
  } catch (err) {
    console.warn('[iOS SaveFrom API] Primary endpoint error, trying fallback:', err);
  }

  // 3. Cobalt API fallback for iOS
  try {
    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
      body: JSON.stringify({
        url: fullUrl,
        isAudioOnly: true,
        audioFormat: 'm4a',
      }),
    });

    if (cobaltRes.ok) {
      const data = await cobaltRes.json();
      if (data.url) {
        return {
          id: videoId,
          title: 'YouTube M4A Track',
          author: 'YouTube Channel',
          duration: 200,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          m4aUrl: data.url,
          quality: 'M4A Direct Stream',
        };
      }
    }
  } catch (err) {
    console.error('[iOS SaveFrom API] Fallback error:', err);
  }

  throw new Error('Unable to extract M4A audio stream for this YouTube video.');
}
