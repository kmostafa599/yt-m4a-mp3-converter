export default async function handler(req, res) {
  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, format = 'mp3' } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing YouTube video URL' });
  }

  const cleanUrl = decodeURIComponent(url);
  const videoIdMatch = cleanUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/);
  const videoId = videoIdMatch && videoIdMatch[2].length === 11 ? videoIdMatch[2] : cleanUrl;
  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let title = `YouTube Track (${videoId})`;
  let author = 'YouTube Creator';
  let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  // 1. Fetch metadata via oEmbed
  try {
    const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(fullUrl)}`);
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) title = oembed.title;
      if (oembed.author_name) author = oembed.author_name;
      if (oembed.thumbnail_url) thumbnail = oembed.thumbnail_url;
    }
  } catch (e) {}

  // 2. Direct Extraction from Invidious & Cobalt Direct Media Proxies
  const directExtractors = [
    `https://api.cobalt.tools/api/json`,
    `https://yewtu.be/api/v1/videos/${videoId}`,
    `https://inv.tux.pizza/api/v1/videos/${videoId}`,
    `https://invidious.nerdvpn.de/api/v1/videos/${videoId}`,
  ];

  for (const endpoint of directExtractors) {
    try {
      if (endpoint.includes('cobalt')) {
        const cobaltRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify({
            url: fullUrl,
            downloadMode: 'audio',
            audioFormat: format,
          })
        });
        if (cobaltRes.ok) {
          const cData = await cobaltRes.json();
          if (cData.url) {
            return res.status(200).json({
              id: videoId,
              title,
              author,
              thumbnail,
              m4aUrl: cData.url,
              format,
            });
          }
        }
      } else {
        const invRes = await fetch(endpoint, { signal: AbortSignal.timeout(3500) });
        if (invRes.ok) {
          const invData = await invRes.json();
          const formats = invData.adaptiveFormats || [];
          const audioStream = formats.find((f) => f.type?.includes('audio/mp4')) || formats.find((f) => f.type?.includes('audio'));
          if (audioStream?.url) {
            return res.status(200).json({
              id: videoId,
              title: invData.title || title,
              author: invData.author || author,
              thumbnail: invData.videoThumbnails?.[0]?.url || thumbnail,
              m4aUrl: audioStream.url,
              format: 'm4a',
            });
          }
        }
      }
    } catch (e) {}
  }

  // 3. Fallback: Secondary Extractor Pipeline
  try {
    const loaderRes = await fetch(`https://loader.to/ajax/download.php?format=${format}&url=${encodeURIComponent(fullUrl)}`);
    if (loaderRes.ok) {
      const initData = await loaderRes.json();
      if (initData.download_url) {
        return res.status(200).json({
          id: videoId,
          title: initData.title || title,
          author,
          thumbnail: initData.thumbnail_url || thumbnail,
          m4aUrl: initData.download_url,
          format,
        });
      }
    }
  } catch (e) {}

  return res.status(500).json({ error: 'Unable to extract audio stream for this video' });
}
