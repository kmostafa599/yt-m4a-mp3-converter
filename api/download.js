export default async function handler(req, res) {
  const { url, filename = 'SonicCraft_Audio.mp3' } = req.query;
  if (!url) {
    return res.status(400).send('Missing audio URL');
  }

  const cleanUrl = decodeURIComponent(url);
  const cleanFilename = decodeURIComponent(filename).replace(/[/\\?%*:|"<>]/g, '_');

  try {
    const audioRes = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://loader.to/'
      }
    });

    if (!audioRes.ok) {
      return res.status(audioRes.status).send('Failed to fetch audio stream from source');
    }

    const contentType = audioRes.headers.get('content-type') || (cleanFilename.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg');
    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanFilename)}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    res.status(200).send(buffer);
  } catch (err) {
    console.error('Download proxy error:', err);
    res.status(500).send('Error streaming audio file');
  }
}
