import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { ConversionOptions, ConversionProgress } from '../types/converter';


let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

export async function getFFmpegInstance(
  onProgress?: (progress: ConversionProgress) => void
): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  ffmpegInstance = new FFmpeg();

  // Handle log messages for parsing progress
  ffmpegInstance.on('log', ({ message }) => {
    console.log('[FFmpeg Log]:', message);
    if (onProgress && message.includes('time=')) {
      const timeMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const hours = parseFloat(timeMatch[1]);
        const minutes = parseFloat(timeMatch[2]);
        const seconds = parseFloat(timeMatch[3]);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        onProgress({
          stage: 'transcoding',
          percent: Math.min(99, Math.round((totalSeconds / 180) * 100)),
          timeTranscoded: `${minutes.toString().padStart(2, '0')}:${Math.floor(seconds).toString().padStart(2, '0')}`,
          detailMsg: `Transcoding frames with FFmpeg log: ${message.slice(0, 40)}...`,
        });
      }
    }
  });

  ffmpegInstance.on('progress', ({ progress, time }) => {
    if (onProgress) {
      const pct = Math.min(99, Math.round(progress * 100));
      onProgress({
        stage: 'transcoding',
        percent: pct > 0 ? pct : 50,
        timeTranscoded: `${Math.floor(time / 1000000)}s`,
        detailMsg: `Processing audio stream with FFmpeg Core...`,
      });
    }
  });

  if (onProgress) {
    onProgress({
      stage: 'transcoding',
      percent: 5,
      detailMsg: 'Loading FFmpeg WebAssembly core binaries...',
    });
  }

  try {
    // Load FFmpeg core WASM from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    isLoaded = true;
    return ffmpegInstance;
  } catch (err) {
    console.error('Failed to load standard WASM core, attempting fallback load:', err);
    try {
      await ffmpegInstance.load();
      isLoaded = true;
      return ffmpegInstance;
    } catch (fallbackErr) {
      console.error('FFmpeg load failed completely:', fallbackErr);
      throw new Error('Could not initialize FFmpeg WebAssembly engine: ' + (fallbackErr as Error).message);
    }
  }
}

/**
 * Convert M4A audio file stream to MP3 using FFmpeg with user options
 */
export async function convertM4aToMp3(
  m4aUrl: string,
  options: ConversionOptions,
  onProgress: (progress: ConversionProgress) => void
): Promise<{ mp3Blob: Blob; mp3Url: string; fileSize: number }> {
  try {
    // Step 1: Downloading M4A Stream
    onProgress({
      stage: 'downloading',
      percent: 15,
      detailMsg: 'Fetching M4A audio stream from SaveFrom API link...',
    });

    const m4aData = await fetchFile(m4aUrl);

    onProgress({
      stage: 'downloading',
      percent: 35,
      detailMsg: 'Audio stream loaded into memory buffer. Preparing FFmpeg container...',
    });

    // Step 2: Initialize FFmpeg
    const ffmpeg = await getFFmpegInstance(onProgress);

    onProgress({
      stage: 'transcoding',
      percent: 45,
      detailMsg: 'Writing input.m4a to FFmpeg Virtual File System...',
    });

    await ffmpeg.writeFile('input.m4a', m4aData);

    // Step 3: Build FFmpeg Command Arguments
    // -i input.m4a -vn -codec:a libmp3lame -b:a 320k -ar 44100 output.mp3
    const args: string[] = ['-i', 'input.m4a', '-vn', '-codec:a', 'libmp3lame'];

    // Bitrate
    args.push('-b:a', options.bitrate);

    // Sample rate
    if (options.sampleRate) {
      args.push('-ar', options.sampleRate.toString());
    }

    // Audio trimming options
    if (options.trimStart > 0) {
      args.push('-ss', options.trimStart.toString());
    }
    if (options.trimEnd > options.trimStart && options.trimEnd > 0) {
      args.push('-to', options.trimEnd.toString());
    }

    // ID3 Tag metadata
    if (options.metadata.title) {
      args.push('-metadata', `title=${options.metadata.title}`);
    }
    if (options.metadata.artist) {
      args.push('-metadata', `artist=${options.metadata.artist}`);
    }
    if (options.metadata.album) {
      args.push('-metadata', `album=${options.metadata.album}`);
    }

    args.push('output.mp3');

    onProgress({
      stage: 'transcoding',
      percent: 60,
      detailMsg: `Executing FFmpeg command: ffmpeg ${args.join(' ')}`,
    });

    // Execute transcoding
    await ffmpeg.exec(args);

    onProgress({
      stage: 'transcoding',
      percent: 90,
      detailMsg: 'Finalizing MP3 header metadata & ID3 tags...',
    });

    // Step 4: Read output file
    const data = await ffmpeg.readFile('output.mp3');
    const mp3Blob = new Blob([data as unknown as BlobPart], { type: 'audio/mp3' });
    const mp3Url = URL.createObjectURL(mp3Blob);


    // Cleanup virtual filesystem
    try {
      await ffmpeg.deleteFile('input.m4a');
      await ffmpeg.deleteFile('output.mp3');
    } catch (e) {
      // ignore cleanup warnings
    }

    onProgress({
      stage: 'completed',
      percent: 100,
      detailMsg: 'M4A to MP3 conversion successfully completed!',
    });

    return {
      mp3Blob,
      mp3Url,
      fileSize: mp3Blob.size,
    };
  } catch (error: any) {
    console.error('Error during FFmpeg conversion:', error);
    onProgress({
      stage: 'error',
      percent: 0,
      errorMsg: error.message || 'An unexpected error occurred during FFmpeg transcoding.',
    });
    throw error;
  }
}
