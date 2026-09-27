import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, Download, Volume2, VolumeX, Music } from 'lucide-react';
import confetti from 'canvas-confetti';
import { theme } from '../styles/theme';
import type { ConvertedTrack } from '../types/converter';

interface AudioPlayerProps {
  track: ConvertedTrack;
  onDownloadTrack?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, onDownloadTrack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration || 180);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    // Create HTMLAudioElement for Web environment
    const audio = new Audio(track.mp3Url);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [track.mp3Url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDownload = () => {
    // Trigger confetti celebration!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#00f2fe', '#4facfe', '#ff0844', '#10b981'],
    });

    const link = document.createElement('a');
    link.href = track.mp3Url;
    link.download = `${track.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${track.bitrate}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onDownloadTrack) onDownloadTrack();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.topInfoRow}>
        <View style={styles.badgeRow}>
          <View style={styles.formatBadge}>
            <Music size={12} color={theme.colors.success} />
            <Text style={styles.formatText}>Converted MP3 ({track.bitrate})</Text>
          </View>
          <Text style={styles.sizeText}>{formatFileSize(track.fileSize)}</Text>
        </View>

        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
          <Download size={16} color="#ffffff" />
          <Text style={styles.downloadBtnText}>Save MP3 File</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.trackTitle} numberOfLines={1}>
        {track.title}
      </Text>
      <Text style={styles.artistName}>{track.artist}</Text>

      {/* Waveform Visualization Bars */}
      <View style={styles.waveformContainer}>
        {Array.from({ length: 32 }).map((_, idx) => {
          const heightFactor = Math.abs(Math.sin((idx + currentTime) * 0.5));
          const barHeight = isPlaying ? 10 + heightFactor * 32 : 12 + (idx % 5) * 4;
          return (
            <View
              key={idx}
              style={[
                styles.waveBar,
                {
                  height: barHeight,
                  backgroundColor: isPlaying ? theme.colors.primary : 'rgba(148, 163, 184, 0.4)',
                },
              ]}
            />
          );
        })}
      </View>

      {/* Controls Bar */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
          {isPlaying ? (
            <Pause size={20} color="#000000" />
          ) : (
            <Play size={20} color="#000000" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        <View style={styles.timerCol}>
          <Text style={styles.timerText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={toggleMute}>
          {isMuted ? (
            <VolumeX size={18} color={theme.colors.textMuted} />
          ) : (
            <Volume2 size={18} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formatText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  sizeText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fonts.mono,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  artistName: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 16,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCol: {
    flex: 1,
  },
  timerText: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 8,
  },
});
