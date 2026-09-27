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
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';


import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';
import { fetchSaveFromAudioNative } from './services/savefromNative';
import type { NativeMediaMetadata } from './services/savefromNative';
import { convertM4aToMp3Native } from './services/ffmpegNative';
import type { NativeProgress } from './services/ffmpegNative';


export default function AppIOS() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [bitrate, setBitrate] = useState<'128k' | '192k' | '256k' | '320k'>('320k');
  
  const [metadata, setMetadata] = useState<NativeMediaMetadata | null>(null);
  const [progress, setProgress] = useState<NativeProgress | null>(null);
  const [mp3ResultPath, setMp3ResultPath] = useState<string | null>(null);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Paste from iOS Clipboard
  const handlePaste = async () => {
    const text = await Clipboard.getString();
    if (text) setUrl(text);
  };

  // Step 1: Extract M4A Audio Stream from SaveFrom API
  const handleExtractAudio = async () => {
    if (!url.trim()) {
      Alert.alert('Missing URL', 'Please enter a valid YouTube video link');
      return;
    }

    try {
      setLoading(true);
      setMetadata(null);
      setMp3ResultPath(null);
      setProgress(null);

      const media = await fetchSaveFromAudioNative(url);
      setMetadata(media);
    } catch (err: any) {
      Alert.alert('Extraction Error', err.message || 'Could not extract M4A stream.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Transcode M4A to MP3 using Native iOS FFmpegKit
  const handleStartConversion = async () => {
    if (!metadata) return;

    try {
      setConverting(true);
      setProgress({ percent: 5, timeMs: 0, speed: '1x', statusText: 'Initializing iOS FFmpeg session...' });

      const result = await convertM4aToMp3Native(
        metadata.m4aUrl,
        {
          bitrate,
          title: metadata.title,
          artist: metadata.author,
          album: 'YouTube iOS Downloads',
        },
        (prog) => setProgress(prog)
      );

      setMp3ResultPath(result.mp3Path);
      Alert.alert('iOS Conversion Complete!', `MP3 file saved to iOS Documents folder (${(result.fileSize / 1024 / 1024).toFixed(2)} MB)`);
    } catch (err: any) {
      Alert.alert('FFmpeg iOS Error', err.message || 'Transcoding failed.');
    } finally {
      setConverting(false);
    }
  };

  // Play audio on iOS using expo-av
  const handlePlayPause = async () => {
    if (!mp3ResultPath) return;

    try {
      if (soundObject) {
        if (isPlaying) {
          await soundObject.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundObject.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound } = await Audio.Sound.createAsync({ uri: mp3ResultPath });
        setSoundObject(sound);
        setIsPlaying(true);
        await sound.playAsync();

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (e) {
      console.error('iOS Playback error:', e);
    }
  };

  // Share or Save MP3 via iOS Native Share Sheet (Files / AirDrop / Apple Music)
  const handleShareMp3 = async () => {
    if (!mp3ResultPath) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(mp3ResultPath, {
        mimeType: 'audio/mpeg',
        dialogTitle: 'Save MP3 File on iOS',
        UTI: 'com.id3.mp3',
      });
    } else {
      Alert.alert('Saved', `File saved at: ${mp3ResultPath}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>


        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerBadge}>iOS & iPadOS Native</Text>
          <Text style={styles.headerTitle}>FFmpeg YouTube Converter</Text>
          <Text style={styles.headerSubtitle}>SaveFrom M4A Stream • FFmpegKit Native Engine</Text>
        </View>

        {/* Input Section */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Paste YouTube Video Link</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor="#64748b"
              value={url}
              onChangeText={setUrl}
            />
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
              <Text style={styles.pasteBtnText}>Paste</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, loading && styles.disabledBtn]}
            onPress={handleExtractAudio}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.actionBtnText}>Extract M4A Stream</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Video Metadata Preview Card */}
        {metadata && (
          <View style={styles.card}>
            <View style={styles.metaRow}>
              <Image source={{ uri: metadata.thumbnail }} style={styles.thumbnail} />
              <View style={styles.metaDetails}>
                <Text style={styles.badgeText}>Source: SaveFrom M4A (AAC)</Text>
                <Text style={styles.metaTitle} numberOfLines={2}>{metadata.title}</Text>
                <Text style={styles.metaAuthor}>{metadata.author}</Text>
              </View>
            </View>

            {/* Bitrate Selector */}
            <Text style={styles.bitrateLabel}>Select MP3 Bitrate:</Text>
            <View style={styles.bitrateGrid}>
              {(['128k', '192k', '256k', '320k'] as const).map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.bitrateChip, bitrate === b && styles.bitrateChipActive]}
                  onPress={() => setBitrate(b)}
                >
                  <Text style={[styles.bitrateChipText, bitrate === b && styles.bitrateChipTextActive]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.convertBtn, converting && styles.disabledBtn]}
              onPress={handleStartConversion}
              disabled={converting}
            >
              {converting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.convertBtnText}>Convert to {bitrate} MP3 with FFmpeg</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Real-time FFmpeg iOS Progress Bar */}
        {progress && (
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{progress.statusText}</Text>
              <Text style={styles.progressPercent}>{progress.percent}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
            </View>
            <Text style={styles.progressSpeed}>Native Execution Speed: {progress.speed}</Text>
          </View>
        )}

        {/* Audio Player & iOS Share Card */}
        {mp3ResultPath && (
          <View style={[styles.card, styles.successCard]}>
            <Text style={styles.successTitle}>Converted MP3 Ready on iOS!</Text>

            <View style={styles.playerRow}>
              <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}>
                <Text style={styles.playBtnIcon}>{isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>

              <View style={styles.playerInfo}>
                <Text style={styles.playerTrackTitle} numberOfLines={1}>
                  {metadata?.title}
                </Text>
                <Text style={styles.playerTrackSub}>{bitrate} MP3 • Native iOS File</Text>
              </View>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShareMp3}>
                <Text style={styles.shareBtnText}>Save / Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0f1d' },
  container: { padding: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  headerBadge: { color: '#00f2fe', backgroundColor: 'rgba(0,242,254,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', textAlign: 'center' },
  headerSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
  card: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.2)' },
  successCard: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#f8fafc', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#1e293b', color: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  pasteBtn: { backgroundColor: 'rgba(0, 242, 254, 0.15)', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#00f2fe' },
  pasteBtnText: { color: '#00f2fe', fontWeight: '700', fontSize: 13 },
  actionBtn: { backgroundColor: '#00f2fe', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#000000', fontWeight: '800', fontSize: 15 },
  disabledBtn: { opacity: 0.5 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  thumbnail: { width: 90, height: 60, borderRadius: 8 },
  metaDetails: { flex: 1 },
  badgeText: { fontSize: 11, color: '#00f2fe', fontWeight: '600', marginBottom: 2 },
  metaTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  metaAuthor: { fontSize: 12, color: '#94a3b8' },
  bitrateLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  bitrateGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  bitrateChip: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  bitrateChipActive: { backgroundColor: '#00f2fe' },
  bitrateChipText: { color: '#94a3b8', fontWeight: '700', fontSize: 12 },
  bitrateChipTextActive: { color: '#000000' },
  convertBtn: { backgroundColor: '#ff0844', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  convertBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  progressPercent: { color: '#00f2fe', fontSize: 14, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#00f2fe' },
  progressSpeed: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
  successTitle: { fontSize: 15, fontWeight: '800', color: '#10b981', marginBottom: 10 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  playBtnIcon: { fontSize: 16, color: '#fff' },
  playerInfo: { flex: 1 },
  playerTrackTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  playerTrackSub: { fontSize: 11, color: '#94a3b8' },
  shareBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  shareBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
});
