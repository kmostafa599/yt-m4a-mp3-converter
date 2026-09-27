declare module 'ffmpeg-kit-react-native' {
  export class FFmpegKit {
    static execute(command: string): Promise<any>;
    static executeAsync(command: string, completeCallback?: any, logCallback?: any, statsCallback?: any): Promise<any>;
  }
  export class FFmpegKitConfig {
    static enableStatisticsCallback(callback: (stats: any) => void): void;
  }
  export class ReturnCode {
    static isSuccess(code: any): boolean;
  }
}

declare module 'expo-file-system' {
  export const cacheDirectory: string;
  export const documentDirectory: string;
  export enum EncodingType {
    Base64 = 'base64',
    UTF8 = 'utf8'
  }
  export function downloadAsync(url: string, fileUri: string, options?: any): Promise<any>;
  export function getInfoAsync(fileUri: string): Promise<any>;
  export function deleteAsync(fileUri: string, options?: any): Promise<any>;
  export function writeAsStringAsync(fileUri: string, contents: string, options?: any): Promise<void>;
}

declare module 'expo-file-system/legacy' {
  export const cacheDirectory: string;
  export const documentDirectory: string;
  export enum EncodingType {
    Base64 = 'base64',
    UTF8 = 'utf8'
  }
  export function downloadAsync(url: string, fileUri: string, options?: any): Promise<any>;
  export function getInfoAsync(fileUri: string): Promise<any>;
  export function deleteAsync(fileUri: string, options?: any): Promise<any>;
  export function writeAsStringAsync(fileUri: string, contents: string, options?: any): Promise<void>;
}



declare module 'expo-sharing' {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(url: string, options?: any): Promise<any>;
}

declare module 'expo-av' {
  export namespace Audio {
    export class Sound {
      static createAsync(source: any): Promise<{ sound: Sound }>;
      playAsync(): Promise<any>;
      pauseAsync(): Promise<any>;
      setOnPlaybackStatusUpdate(callback: (status: any) => void): void;
    }
  }
}

declare module 'react-native-webview' {
  export const WebView: any;
}

