export default async function handler(req, res) {
  // Enable CORS headers for all origins
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

  // 1. oEmbed metadata
  try {
    const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(fullUrl)}`);
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) title = oembed.title;
      if (oembed.author_name) author = oembed.author_name;
      if (oembed.thumbnail_url) thumbnail = oembed.thumbnail_url;
    }
  } catch (e) {}

  // 2. Query Loader.to server-side (No browser CORS restriction)
  try {
    const initRes = await fetch(`https://loader.to/ajax/download.php?format=${format}&url=${encodeURIComponent(fullUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });

    if (initRes.ok) {
      const initData = await initRes.json();
      if (initData.title) title = initData.title;
      if (initData.thumbnail_url) thumbnail = initData.thumbnail_url;

      if (initData.download_url) {
        return res.status(200).json({
          id: videoId,
          title,
          author,
          thumbnail,
          m4aUrl: initData.download_url,
          format,
        });
      }

      const pollUrl = initData.progress_url || (initData.id ? `https://loader.to/ajax/progress.php?id=${initData.id}` : null);
      if (pollUrl) {
        for (let attempt = 0; attempt < 15; attempt++) {
          await new Promise((r) => setTimeout(r, 1200));
          try {
            const progRes = await fetch(pollUrl);
            if (progRes.ok) {
              const progData = await progRes.json();
              if (progData.download_url) {
                return res.status(200).json({
                  id: videoId,
                  title,
                  author,
                  thumbnail,
                  m4aUrl: progData.download_url,
                  format,
                });
              }
            }
          } catch (pErr) {}
        }
      }
    }
  } catch (loaderErr) {
    console.warn('Serverless Loader.to error:', loaderErr);
  }

  // 3. Fallback: SaveFrom worker endpoint
  try {
    const sfRes = await fetch(`https://worker.savefrom.net/savefrom.php?url=${encodeURIComponent(fullUrl)}`);
    if (sfRes.ok) {
      const sfData = await sfRes.json();
      if (sfData?.url?.[0]?.url) {
        return res.status(200).json({
          id: videoId,
          title: sfData.meta?.title || title,
          author: sfData.meta?.author || author,
          thumbnail: sfData.meta?.thumbnail || thumbnail,
          m4aUrl: sfData.url[0].url,
          format: 'm4a',
        });
      }
    }
  } catch (sfErr) {}

  return res.status(500).json({ error: 'Unable to extract audio stream URL for this video' });
}
