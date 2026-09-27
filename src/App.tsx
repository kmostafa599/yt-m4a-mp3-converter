import { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from './components/SafeAreaView';

import { Header } from './components/Header';

import { UrlInput } from './components/UrlInput';
import { VideoCard } from './components/VideoCard';
import { ConversionControls } from './components/ConversionControls';
import { ProgressBar } from './components/ProgressBar';
import { AudioPlayer } from './components/AudioPlayer';
import { HistoryList } from './components/HistoryList';
import { ReactNativeCodeViewer } from './components/ReactNativeCodeViewer';

import { theme } from './styles/theme';
import type { ConversionOptions, ConversionProgress, ConvertedTrack, MediaMetadata } from './types/converter';
import { fetchYouTubeAudioMetadata } from './services/youtubeService';
import { convertM4aToMp3 } from './services/ffmpegService';


export function App() {
  const [activeTab, setActiveTab] = useState<'converter' | 'nativeCode' | 'history'>('converter');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [currentTrack, setCurrentTrack] = useState<ConvertedTrack | null>(null);
  const [history, setHistory] = useState<ConvertedTrack[]>([]);

  const handleFetchAudio = async (url: string) => {
    setIsExtracting(true);
    setProgress(null);
    setCurrentTrack(null);
    try {
      const data = await fetchYouTubeAudioMetadata(url);
      setMetadata(data);
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleStartConversion = async (options: ConversionOptions) => {
    if (!metadata) return;

    setIsConverting(true);
    setProgress({
      stage: 'extracting',
      percent: 5,
      detailMsg: 'Starting conversion flow...',
    });

    try {
      const { mp3Url, fileSize } = await convertM4aToMp3(
        metadata.m4aUrl,
        options,
        (prog) => setProgress(prog)
      );


      const track: ConvertedTrack = {
        id: metadata.id + '_' + Date.now(),
        title: options.metadata.title || metadata.title,
        artist: options.metadata.artist || metadata.author,
        duration: metadata.duration,
        fileSize,
        bitrate: options.bitrate,
        mp3Url,
        m4aUrl: metadata.m4aUrl,
        thumbnail: metadata.thumbnail,
        timestamp: Date.now(),
      };

      setCurrentTrack(track);
      setHistory((prev) => [track, ...prev]);
    } catch (err) {
      console.error('Conversion failed:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainContainer}>
          <Header
            activeTab={activeTab}
            onTabChange={setActiveTab}
            historyCount={history.length}
          />

          {activeTab === 'converter' && (
            <>
              <UrlInput onFetchAudio={handleFetchAudio} isLoading={isExtracting} />

              {metadata && <VideoCard metadata={metadata} />}

              {metadata && !currentTrack && (
                <ConversionControls
                  metadata={metadata}
                  onStartConversion={handleStartConversion}
                  isConverting={isConverting}
                />
              )}

              {progress && <ProgressBar progress={progress} />}

              {currentTrack && <AudioPlayer track={currentTrack} />}
            </>
          )}

          {activeTab === 'history' && (
            <HistoryList
              history={history}
              onClearHistory={handleClearHistory}
              onSelectTrack={(track) => {
                setCurrentTrack(track);
                setActiveTab('converter');
              }}
            />
          )}

          {activeTab === 'nativeCode' && <ReactNativeCodeViewer />}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Made with ❤️ by Kareem Mostafa • SonicCraft Studio
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mainContainer: {
    width: '100%',
    maxWidth: 860,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  footerText: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontFamily: theme.fonts.mono,
  },
});

export default App;
