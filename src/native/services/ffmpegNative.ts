/**
 * Native iOS FFmpeg Service using `ffmpeg-kit-react-native`
 * Supports iOS background execution, progress statistics, and high-quality MP3 encoding.
 */

import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

export interface NativeConversionOptions {
  bitrate: '128k' | '192k' | '256k' | '320k';
  title?: string;
  artist?: string;
  album?: string;
}

export interface NativeProgress {
  percent: number;
  timeMs: number;
  speed: string;
  statusText: string;
}

export async function convertM4aToMp3Native(
  m4aUrl: string,
  options: NativeConversionOptions,
  onProgress: (progress: NativeProgress) => void
): Promise<{ mp3Path: string; fileSize: number }> {
  // 1. Define iOS Sandbox file paths
  const localM4aPath = `${FileSystem.cacheDirectory}temp_input_${Date.now()}.m4a`;
  const outputMp3Path = `${FileSystem.documentDirectory}converted_${Date.now()}_${options.bitrate}.mp3`;

  // 2. Download M4A file locally on iOS
  onProgress({
    percent: 10,
    timeMs: 0,
    speed: '0x',
    statusText: 'Downloading M4A stream to iOS Sandbox...',
  });

  const downloadResult = await FileSystem.downloadAsync(m4aUrl, localM4aPath);
  if (downloadResult.status !== 200) {
    throw new Error(`Failed to download M4A file to iOS storage (HTTP ${downloadResult.status})`);
  }

  // 3. Build FFmpeg command for iOS native execution
  // Example: -i input.m4a -vn -ar 44100 -ac 2 -b:a 320k -metadata title="Title" output.mp3
  const args: string[] = [
    '-i', `"${downloadResult.uri}"`,
    '-vn',
    '-codec:a', 'libmp3lame',
    '-b:a', options.bitrate,
    '-ar', '44100',
    '-ac', '2',
  ];

  if (options.title) args.push('-metadata', `title="${options.title}"`);
  if (options.artist) args.push('-metadata', `artist="${options.artist}"`);
  if (options.album) args.push('-metadata', `album="${options.album}"`);

  args.push(`"${outputMp3Path}"`);
  const ffmpegCommand = args.join(' ');

  onProgress({
    percent: 30,
    timeMs: 0,
    speed: '1x',
    statusText: 'Executing native iOS FFmpeg binary...',
  });

  // 4. Enable FFmpeg Statistics listener on iOS
  FFmpegKitConfig.enableStatisticsCallback((stats: any) => {

    const timeInMs = stats.getTime();
    const speed = stats.getSpeed();
    // Calculate progress based on standard track duration (approx 200s)
    const estimatedPercent = Math.min(98, Math.max(30, Math.round((timeInMs / 200000) * 100)));
    
    onProgress({
      percent: estimatedPercent,
      timeMs: timeInMs,
      speed: `${speed.toFixed(2)}x`,
      statusText: `FFmpeg encoding at ${speed.toFixed(2)}x speed...`,
    });
  });

  // 5. Execute FFmpeg command natively on iOS C/C++ engine
  const session = await FFmpegKit.execute(ffmpegCommand);
  const returnCode = await session.getReturnCode();

  if (ReturnCode.isSuccess(returnCode)) {
    // Read file size on iOS FileSystem
    const fileInfo = await FileSystem.getInfoAsync(outputMp3Path);

    onProgress({
      percent: 100,
      timeMs: 0,
      speed: 'Done',
      statusText: 'M4A to MP3 conversion complete!',
    });

    // Cleanup input cache file
    FileSystem.deleteAsync(localM4aPath, { idempotent: true });

    return {
      mp3Path: outputMp3Path,
      fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
    };
  } else {
    const logs = await session.getAllLogsAsString();
    FileSystem.deleteAsync(localM4aPath, { idempotent: true });
    throw new Error(`FFmpeg iOS error (code ${returnCode}): ${logs}`);
  }
}
