import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const localApiPlugin = () => ({
  name: 'local-api-proxy',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/api/extract')) {
        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const videoUrl = urlObj.searchParams.get('url');
          const format = urlObj.searchParams.get('format') || 'mp3';
          
          // @ts-ignore
          const extractModule = await import('./api/extract.js');
          const handler = extractModule.default;
          const mockReq = { query: { url: videoUrl, format }, method: req.method };
          const mockRes = {
            setHeader: (k: string, v: string) => res.setHeader(k, v),
            status: (code: number) => {
              res.statusCode = code;
              return mockRes;
            },
            json: (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            end: () => res.end(),
          };
          return await handler(mockReq, mockRes);
        } catch (err: any) {
          console.error('[Local Dev API] Extract error:', err);
        }
      }

      if (req.url?.startsWith('/api/download')) {
        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');
          const audioUrl = urlObj.searchParams.get('url');
          const filename = urlObj.searchParams.get('filename') || 'SonicCraft_Audio.mp3';

          // @ts-ignore
          const downloadModule = await import('./api/download.js');
          const handler = downloadModule.default;
          const mockReq = { query: { url: audioUrl, filename }, method: req.method };
          const mockRes = {
            setHeader: (k: string, v: string) => res.setHeader(k, v),
            status: (code: number) => {
              res.statusCode = code;
              return mockRes;
            },
            send: (buf: any) => {
              res.end(buf);
            },
          };
          return await handler(mockReq, mockRes);
        } catch (err: any) {
          console.error('[Local Dev API] Download error:', err);
        }
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'expo-audio': path.resolve(import.meta.dirname, 'src/stubs/expo-audio.js'),
      'expo-file-system/legacy': path.resolve(import.meta.dirname, 'src/stubs/expo-file-system.js'),
      'expo-file-system': path.resolve(import.meta.dirname, 'src/stubs/expo-file-system.js'),
      'expo-sharing': path.resolve(import.meta.dirname, 'src/stubs/expo-sharing.js'),
    },
  },
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  },
});
