export type BitrateOption = '128k' | '192k' | '256k' | '320k';

export interface MediaMetadata {
  id: string;
  title: string;
  author: string;
  duration: number; // in seconds
  thumbnail: string;
  m4aUrl: string;
  filesize?: number;
  format: string;
  quality: string;
  isFallback?: boolean;
}

export interface ConversionOptions {
  bitrate: BitrateOption;
  sampleRate: number; // e.g. 44100
  trimStart: number; // seconds
  trimEnd: number; // seconds
  metadata: {
    title: string;
    artist: string;
    album: string;
  };
}

export type ConversionStage = 'idle' | 'extracting' | 'downloading' | 'transcoding' | 'completed' | 'error';

export interface ConversionProgress {
  stage: ConversionStage;
  percent: number; // 0 to 100
  speed?: string;
  timeTranscoded?: string;
  detailMsg?: string;
  errorMsg?: string;
}

export interface ConvertedTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  fileSize: number;
  bitrate: BitrateOption;
  mp3Url: string;
  m4aUrl: string;
  thumbnail: string;
  timestamp: number;
}
