import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Copy, Check, Smartphone, Apple, Zap } from 'lucide-react';

import { theme } from '../styles/theme';

const EXPO_GO_CODE = `// App.expogo.tsx - 100% Expo Go Compatible YouTube M4A to MP3 Converter
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';

export default function AppExpoGo() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [bitrate, setBitrate] = useState<'128k' | '192k' | '256k' | '320k'>('320k');
  const [metadata, setMetadata] = useState<any>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [mp3Uri, setMp3Uri] = useState<string | null>(null);
  const [webViewHtml, setWebViewHtml] = useState<string | null>(null);

  const extractM4a = async () => {
    if (!url.trim()) return Alert.alert('Error', 'Please enter a YouTube link');
    setLoading(true);
    try {
      const match = url.match(/^.*(youtu.be\\/|v\\/|watch\\?v=)([^#\\&\\?]*).*/);
      const videoId = match && match[2].length === 11 ? match[2] : url;
      const res = await fetch(\`https://worker.savefrom.net/savefrom.php?url=\${encodeURIComponent(url)}\`);
      const data = await res.json();
      const m4a = data.url.find((item: any) => item.ext === 'm4a') || data.url[0];
      setMetadata({ id: videoId, title: data.meta?.title, m4aUrl: m4a.url, thumbnail: \`https://img.youtube.com/vi/\${videoId}/maxresdefault.jpg\` });
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const startConversion = () => {
    setConverting(true);
    setProgressPercent(15);
    const html = \`
      <!DOCTYPE html><html><head><script src="https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js"></script><script src="https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js"></script></head>
      <body><script>
        async function run() {
          const { FFmpeg } = window.FFmpegWASM; const { fetchFile } = window.FFmpegUtil;
          const ffmpeg = new FFmpeg();
          ffmpeg.on('progress', ({ progress }) => { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', percent: Math.round(progress * 100) })); });
          await ffmpeg.load();
          const data = await fetchFile('\${metadata.m4aUrl}');
          await ffmpeg.writeFile('input.m4a', data);
          await ffmpeg.exec(['-i', 'input.m4a', '-vn', '-codec:a', 'libmp3lame', '-b:a', '\${bitrate}', 'output.mp3']);
          const out = await ffmpeg.readFile('output.mp3');
          const blob = new Blob([out], { type: 'audio/mp3' });
          const reader = new FileReader(); reader.readAsDataURL(blob);
          reader.onloadend = () => { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'complete', base64: reader.result })); };
        } run();
      </script></body></html>\`;
    setWebViewHtml(html);
  };

  const onWebViewMessage = async (e: any) => {
    const msg = JSON.parse(e.nativeEvent.data);
    if (msg.type === 'progress') setProgressPercent(msg.percent);
    if (msg.type === 'complete') {
      setConverting(false);
      const uri = \`\${FileSystem.documentDirectory}output_\${Date.now()}.mp3\`;
      await FileSystem.writeAsStringAsync(uri, msg.base64.split(',')[1], { encoding: FileSystem.EncodingType.Base64 });
      setMp3Uri(uri);
      Alert.alert('Expo Go Success!', 'Saved MP3 to iOS Documents');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0f1d' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, color: '#00f2fe', textAlign: 'center', fontWeight: 'bold' }}>Expo Go YouTube Converter</Text>
        <TextInput style={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, padding: 12, marginVertical: 14 }} placeholder="YouTube Link..." placeholderTextColor="#64748b" value={url} onChangeText={setUrl} />
        <TouchableOpacity style={{ backgroundColor: '#00f2fe', padding: 14, borderRadius: 8, alignItems: 'center' }} onPress={extractM4a}>
          <Text style={{ color: '#000', fontWeight: 'bold' }}>Extract M4A Stream</Text>
        </TouchableOpacity>
        {metadata && (
          <TouchableOpacity style={{ backgroundColor: '#ff0844', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 14 }} onPress={startConversion}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Convert to {bitrate} MP3</Text>
          </TouchableOpacity>
        )}
        {webViewHtml && <View style={{ height: 0, opacity: 0 }}><WebView source={{ html: webViewHtml }} onMessage={onWebViewMessage} javaScriptEnabled /></View>}
      </ScrollView>
    </SafeAreaView>
  );
}
`;

const IOS_APP_CODE = `// src/native/App.native.tsx - Standalone iOS App (Native FFmpegKit)
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { convertM4aToMp3Native } from './services/ffmpegNative';
import { fetchSaveFromAudioNative } from './services/savefromNative';

export default function AppIOS() {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState<any>(null);

  const handleStartConversion = async () => {
    const result = await convertM4aToMp3Native(metadata.m4aUrl, { bitrate: '320k' }, (p) => console.log(p));
    Alert.alert('Success', \`Saved MP3 at \${result.mp3Path}\`);
  };
}
`;

const IOS_PODFILE_CODE = `# ios/Podfile
platform :ios, '14.0'
use_frameworks! :linkage => :static

target 'YouTubeM4aToMp3Converter' do
  config = use_native_modules!
  pod 'ffmpeg-kit-react-native-full', '6.0'
  pod 'ExpoAudio', :path => '../node_modules/expo-av'
  pod 'ExpoFileSystem', :path => '../node_modules/expo-file-system'
end
`;

export const ReactNativeCodeViewer: React.FC = () => {
  const [selectedSubTab, setSelectedSubTab] = useState<'expogo' | 'app' | 'podfile'>('expogo');
  const [copied, setCopied] = useState(false);

  const getCode = () => {
    switch (selectedSubTab) {
      case 'expogo': return EXPO_GO_CODE;
      case 'app': return IOS_APP_CODE;
      case 'podfile': return IOS_PODFILE_CODE;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Zap size={22} color={theme.colors.primary} />
          <Text style={styles.titleText}>Expo Go & iOS Native React Native Implementation</Text>
        </View>

        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          {copied ? <Check size={16} color={theme.colors.success} /> : <Copy size={16} color={theme.colors.text} />}
          <Text style={[styles.copyBtnText, copied && { color: theme.colors.success }]}>
            {copied ? 'Copied File!' : 'Copy Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Switch between <Text style={styles.boldText}>`Expo Go Mode`</Text> (runs instantly on iPhone via Expo Go app) and <Text style={styles.boldText}>`Standalone iOS Native`</Text> (`ffmpeg-kit-react-native`):
      </Text>

      {/* Sub tabs for switching between files */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTab, selectedSubTab === 'expogo' && styles.subTabActive]}
          onPress={() => setSelectedSubTab('expogo')}
        >
          <Zap size={14} color={selectedSubTab === 'expogo' ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.subTabText, selectedSubTab === 'expogo' && styles.subTabTextActive]}>App.expogo.tsx (Expo Go)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, selectedSubTab === 'app' && styles.subTabActive]}
          onPress={() => setSelectedSubTab('app')}
        >
          <Smartphone size={14} color={selectedSubTab === 'app' ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.subTabText, selectedSubTab === 'app' && styles.subTabTextActive]}>App.native.tsx (iOS Standalone)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, selectedSubTab === 'podfile' && styles.subTabActive]}
          onPress={() => setSelectedSubTab('podfile')}
        >
          <Apple size={14} color={selectedSubTab === 'podfile' ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.subTabText, selectedSubTab === 'podfile' && styles.subTabTextActive]}>Podfile (iOS Native)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.codeScroll} horizontal={false}>
        <Text style={styles.codeText}>{getCode()}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  boldText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  subTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  subTabActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: theme.colors.primary,
  },
  subTabText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  codeScroll: {
    maxHeight: 400,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  codeText: {
    color: '#38bdf8',
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    lineHeight: 18,
  },
});
