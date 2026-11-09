import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Clipboard,
  Share as RNShare,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import * as Sharing from 'expo-sharing';
import {
  fetchSaveFromAudioExpoGo,
  convertM4aToMp3ExpoGoInstant,
} from './ExpoGoFFmpegService';
import type {
  ExpoGoMediaMetadata,
  ExpoGoProgress,
} from './ExpoGoFFmpegService';
import { translations } from '../utils/translations';
import type { Language } from '../utils/translations';

export default function AppExpoGo() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [bitrate, setBitrate] = useState<'128k' | '192k' | '256k' | '320k'>('320k');
  
  const [metadata, setMetadata] = useState<ExpoGoMediaMetadata | null>(null);
  const [progress, setProgress] = useState<ExpoGoProgress | null>(null);
  const [mp3Uri, setMp3Uri] = useState<string | null>(null);
  const [fileExt, setFileExt] = useState<'mp3' | 'm4a'>('mp3');
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Toggle Language English <-> Arabic
  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  // Paste link from Clipboard
  const handlePaste = async () => {
    const text = await Clipboard.getString();
    if (text) setUrl(text);
  };

  // Share App with Friends via WhatsApp / iMessage / Social / Web Share
  const handleShareApp = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.share) {
        await navigator.share({
          title: t.appName,
          text: t.shareAppMessage,
          url: window.location.href,
        });
      } else {
        await RNShare.share({
          message: t.shareAppMessage,
          title: t.appName,
        });
      }
    } catch (e) {
      console.warn('Share app notice:', e);
    }
  };

  // Step 1: Fetch Video Details & Audio Metadata
  const handleExtract = async () => {
    if (!url.trim()) {
      Alert.alert(t.missingLinkTitle, t.missingLinkBody);
      return;
    }

    try {
      if (player) {
        try { player.pause(); } catch (e) {}
        setPlayer(null);
        setIsPlaying(false);
      }
      setLoading(true);
      setMetadata(null);
      setMp3Uri(null);
      setProgress(null);

      const data = await fetchSaveFromAudioExpoGo(url, 'mp3');
      setMetadata(data);
    } catch (err: any) {
      Alert.alert(t.errorTitle, err.message || t.status.preparing);
    } finally {
      setLoading(false);
    }
  };

  // Direct Instant Ad-Free File Saver (Zero Ads, Zero New Tabs, Instant Download)
  const triggerDirectAdFreeDownload = async (
    fileUri: string,
    ext: string,
    titleStr: string
  ) => {
    if (!fileUri) return;
    const cleanTitle = titleStr.replace(/[/\\?%*:|"<>]/g, '_').trim().substring(0, 50) || 'SonicCraft_Audio';
    const fileName = `${cleanTitle}.${ext}`;

    // 1. Native Mobile Device Sharing (iOS / Android Expo Go)
    if (await Sharing.isAvailableAsync()) {
      const mime = ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
      await Sharing.shareAsync(fileUri, { mimeType: mime, dialogTitle: `${t.shareAudioBtn} (${ext.toUpperCase()})` });
      return;
    }

    // 2. Web Browser Instant Local Blob Download (No target="_blank" to prevent ad redirects)
    if (typeof window !== 'undefined' && window.document) {
      // If fileUri is already a local in-memory blob URL (from client FFmpeg / blob fetch)
      if (fileUri.startsWith('blob:')) {
        const a = document.createElement('a');
        a.href = fileUri;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // Fetch external stream into local memory Blob in background
      try {
        const res = await fetch(fileUri);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        }
      } catch (e) {
        console.warn('Background blob download notice, trying serverless proxy:', e);
      }

      // Serverless Proxy Download Backup
      try {
        const proxyUrl = `/api/download?url=${encodeURIComponent(fileUri)}&filename=${encodeURIComponent(fileName)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        }
      } catch (e) {}
    }
  };

  // Step 2: Download & Package Audio Track + Immediate Download
  const handleStartConversion = async () => {
    if (!metadata) return;

    try {
      if (player) {
        try { player.pause(); } catch (e) {}
        setPlayer(null);
        setIsPlaying(false);
      }
      setConverting(true);
      setMp3Uri(null);
      setProgress({ percent: 10, statusText: t.status.preparing });

      const result = await convertM4aToMp3ExpoGoInstant(metadata, bitrate, (prog) => {
        setProgress(prog);
      });

      setMp3Uri(result.fileUri);
      setFileExt(result.fileExtension as 'mp3' | 'm4a');
      const mbSize = (result.size / 1024 / 1024).toFixed(2);

      // Trigger immediate ad-free download right away!
      await triggerDirectAdFreeDownload(result.fileUri, result.fileExtension, metadata.title);

      Alert.alert(t.successTitle, t.successBody(mbSize));
    } catch (err: any) {
      Alert.alert(t.errorTitle, err.message || 'Download failed');
    } finally {
      setConverting(false);
    }
  };

  // Cross-Platform Audio Playback (Native & Web)
  const handlePlayPause = async () => {
    if (!mp3Uri) return;

    try {
      if (player) {
        if (isPlaying) {
          player.pause();
          setIsPlaying(false);
        } else {
          player.play();
          setIsPlaying(true);
        }
      } else {
        if (typeof window !== 'undefined' && typeof window.document !== 'undefined' && !(window as any).expo) {
          // Web Browser HTML5 Audio Player
          const webAudio = new window.Audio(mp3Uri);
          webAudio.onended = () => setIsPlaying(false);
          webAudio.play();
          setPlayer(webAudio);
          setIsPlaying(true);
        } else {
          // Expo Go Native Audio Player
          try {
            const expoAudio = await import('expo-audio');
            const newPlayer = expoAudio.createAudioPlayer({ uri: mp3Uri });
            setPlayer(newPlayer);
            setIsPlaying(true);
            newPlayer.play();
          } catch (err) {
            console.warn('[Native Player Notice]:', err);
          }
        }
      }
    } catch (e) {
      console.warn('Audio playback notice:', e);
    }
  };

  // Direct Ad-Free Manual Download Button Handler
  const handleShareAudio = async () => {
    if (!mp3Uri || !metadata) return;
    await triggerDirectAdFreeDownload(mp3Uri, fileExt, metadata.title);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>

        {/* Top Header Bar with Language Selector & Share App Button */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.shareAppTopBtn} onPress={handleShareApp}>
            <Text style={styles.shareAppTopText}>{t.shareAppBtn}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>{isAr ? '🇬🇧 English' : '🇸🇦 العربية'}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Branding Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>{t.appBadge}</Text>
          <Text style={styles.title}>{t.appName}</Text>
          <Text style={styles.subtitle}>{t.appSubtitle}</Text>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <Text style={[styles.cardLabel, isAr && styles.rtlText]}>{t.pasteLabel}</Text>
          <View style={[styles.inputRow, isAr && styles.inputRowRtl]}>
            <TextInput
              style={[styles.input, isAr && styles.rtlText]}
              placeholder={t.inputPlaceholder}
              placeholderTextColor="#64748b"
              value={url}
              onChangeText={setUrl}
            />
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
              <Text style={styles.pasteBtnText}>{t.pasteBtn}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.actionBtn, loading && styles.disabledBtn]} onPress={handleExtract} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.actionBtnText}>{loading ? t.fetchingBtn : t.fetchBtn}</Text>}
          </TouchableOpacity>
        </View>

        {/* Video Preview & Bitrate Options */}
        {metadata && (
          <View style={styles.card}>
            <View style={[styles.metaRow, isAr && styles.inputRowRtl]}>
              <Image source={{ uri: metadata.thumbnail }} style={styles.thumbnail} />
              <View style={styles.metaCol}>
                <Text style={[styles.streamBadge, isAr && styles.rtlText]}>High Quality Audio 🎵</Text>
                <Text style={[styles.metaTitle, isAr && styles.rtlText]} numberOfLines={2}>{metadata.title}</Text>
                <Text style={[styles.metaAuthor, isAr && styles.rtlText]}>{metadata.author}</Text>
              </View>
            </View>

            <Text style={[styles.bitrateTitle, isAr && styles.rtlText]}>{t.selectQuality}</Text>
            <View style={styles.bitrateRow}>
              {(['128k', '192k', '256k', '320k'] as const).map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.bitrateChip, bitrate === b && styles.bitrateChipActive]}
                  onPress={() => setBitrate(b)}
                >
                  <Text style={[styles.bitrateChipText, bitrate === b && styles.bitrateChipTextActive]}>
                    {t.qualityOptions[b]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.convertBtn, converting && styles.disabledBtn]} onPress={handleStartConversion} disabled={converting}>
              {converting ? <ActivityIndicator color="#fff" /> : <Text style={styles.convertBtnText}>{converting ? t.generatingBtn : t.generateBtn}</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Real-time Progress Indicator */}
        {progress && (
          <View style={styles.card}>
            <View style={[styles.progressHeader, isAr && styles.inputRowRtl]}>
              <Text style={styles.progressText}>{progress.statusText}</Text>
              <Text style={styles.progressPercent}>{progress.percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
            </View>
          </View>
        )}

        {/* Audio Player & Export Card */}
        {mp3Uri && (
          <View style={[styles.card, styles.successCard]}>
            <Text style={[styles.successTitle, isAr && styles.rtlText]}>{t.readyTitle}</Text>

            <View style={[styles.playerRow, isAr && styles.inputRowRtl]}>
              <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
                <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>

              <View style={styles.playerMeta}>
                <Text style={[styles.playerTitle, isAr && styles.rtlText]} numberOfLines={1}>{metadata?.title}</Text>
                <Text style={[styles.playerSub, isAr && styles.rtlText]}>{t.qualityOptions[bitrate]} • {t.savedSub}</Text>
              </View>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShareAudio}>
                <Text style={styles.shareText}>{t.shareAudioBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer with Kareem Mostafa Signature */}
        <View style={styles.footer}>
          <Text style={styles.footerSignature}>{t.madeWithLove}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b14' },
  container: { padding: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  shareAppTopBtn: { backgroundColor: 'rgba(255, 8, 68, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ff0844' },
  shareAppTopText: { color: '#ff0844', fontSize: 12, fontWeight: '800' },
  langBtn: { backgroundColor: 'rgba(0, 242, 254, 0.12)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0, 242, 254, 0.3)' },
  langBtnText: { color: '#00f2fe', fontSize: 13, fontWeight: '700' },
  header: { alignItems: 'center', marginBottom: 20 },
  badge: { color: '#00f2fe', backgroundColor: 'rgba(0, 242, 254, 0.1)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, fontWeight: '500' },
  card: { backgroundColor: '#0f172a', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.15)' },
  successCard: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#f8fafc', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  inputRowRtl: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right' },
  input: { flex: 1, backgroundColor: '#1e293b', color: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 14 },
  pasteBtn: { backgroundColor: 'rgba(0, 242, 254, 0.15)', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#00f2fe' },
  pasteBtnText: { color: '#00f2fe', fontWeight: '800', fontSize: 13 },
  actionBtn: { backgroundColor: '#00f2fe', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#070b14', fontWeight: '900', fontSize: 15 },
  disabledBtn: { opacity: 0.5 },
  metaRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  thumbnail: { width: 96, height: 64, borderRadius: 10 },
  metaCol: { flex: 1, justifyContent: 'center' },
  streamBadge: { fontSize: 11, color: '#00f2fe', fontWeight: '700', marginBottom: 2 },
  metaTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  metaAuthor: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  bitrateTitle: { fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: '600' },
  bitrateRow: { flexDirection: 'column', gap: 8, marginBottom: 16 },
  bitrateChip: { backgroundColor: '#1e293b', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  bitrateChipActive: { backgroundColor: 'rgba(0, 242, 254, 0.15)', borderColor: '#00f2fe' },
  bitrateChipText: { color: '#94a3b8', fontWeight: '700', fontSize: 13 },
  bitrateChipTextActive: { color: '#00f2fe' },
  convertBtn: { backgroundColor: '#ff0844', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  convertBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  progressPercent: { color: '#00f2fe', fontSize: 14, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00f2fe' },
  successTitle: { fontSize: 16, fontWeight: '800', color: '#10b981', marginBottom: 12 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 18, color: '#fff' },
  playerMeta: { flex: 1 },
  playerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  playerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  shareBtn: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  shareText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  footer: { marginTop: 30, alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.1)' },
  footerSignature: { color: '#00f2fe', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
});
