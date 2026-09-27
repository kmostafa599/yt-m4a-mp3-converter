import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
