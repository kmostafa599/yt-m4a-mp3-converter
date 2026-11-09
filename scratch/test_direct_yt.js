const fetch = globalThis.fetch;

async function testWebAndEmbedded(videoId) {
  const payloads = [
    {
      name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
      body: {
        videoId: videoId,
        context: {
          client: {
            clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
            clientVersion: '2.0',
            hl: 'en',
            gl: 'US'
          }
        },
        contentCheckOk: true,
        racyCheckOk: true
      }
    },
    {
      name: 'WEB_EMBEDDED_PLAYER',
      body: {
        videoId: videoId,
        context: {
          client: {
            clientName: 'WEB_EMBEDDED_PLAYER',
            clientVersion: '1.20241118.00.00',
            hl: 'en',
            gl: 'US'
          }
        },
        contentCheckOk: true,
        racyCheckOk: true
      }
    },
    {
      name: 'WEB_PLAYER',
      body: {
        videoId: videoId,
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20241118.00.00',
            hl: 'en',
            gl: 'US'
          }
        },
        playbackContext: {
          contentPlaybackContext: {
            html5Preference: 'HTML5_PREFER_SERVER_CONFIG',
            signatureTimestamp: 19800
          }
        },
        contentCheckOk: true,
        racyCheckOk: true
      }
    }
  ];

  for (const p of payloads) {
    console.log(`\n=== Testing ${p.name} ===`);
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(p.body)
      });

      console.log('Status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Video Details:', data.videoDetails?.title);
        const adaptive = data.streamingData?.adaptiveFormats || [];
        const formats = data.streamingData?.formats || [];
        const all = [...formats, ...adaptive];
        console.log('Total Stream Formats Found:', all.length);

        const directUrlStream = all.find(f => f.url);
        const cipherStream = all.find(f => f.signatureCipher || f.cipher);

        if (directUrlStream) {
          console.log('✅ DIRECT UNENCRYPTED URL FOUND:', directUrlStream.mimeType, '\nURL:', directUrlStream.url.substring(0, 120) + '...');
        } else if (cipherStream) {
          console.log('🔒 CIPHER ENCRYPTED STREAM FOUND:', cipherStream.mimeType, '\nCipher String:', (cipherStream.signatureCipher || cipherStream.cipher).substring(0, 100) + '...');
        } else {
          console.log('No formats or cipher found. Playback status:', data.playabilityStatus?.status, data.playabilityStatus?.reason);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

testWebAndEmbedded('OuxcdPbILFE');
