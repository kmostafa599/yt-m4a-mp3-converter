import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Clock, ShieldCheck, FileAudio, User } from 'lucide-react';
import { theme } from '../styles/theme';
import type { MediaMetadata } from '../types/converter';


interface VideoCardProps {
  metadata: MediaMetadata;
}

export const VideoCard: React.FC<VideoCardProps> = ({ metadata }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.thumbnailWrapper}>
          <Image source={{ uri: metadata.thumbnail }} style={styles.thumbnail} />
          <View style={styles.durationBadge}>
            <Clock size={12} color="#ffffff" />
            <Text style={styles.durationText}>{formatTime(metadata.duration)}</Text>
          </View>
        </View>

        <View style={styles.detailsCol}>
          <View style={styles.sourceBadgeRow}>
            <View style={styles.m4aBadge}>
              <FileAudio size={12} color={theme.colors.primary} />
              <Text style={styles.m4aBadgeText}>Source: SaveFrom M4A Audio</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={theme.colors.success} />
              <Text style={styles.verifiedText}>Clean Stream</Text>
            </View>
          </View>

          <Text style={styles.titleText} numberOfLines={2}>
            {metadata.title}
          </Text>

          <View style={styles.authorRow}>
            <User size={14} color={theme.colors.textMuted} />
            <Text style={styles.authorText}>{metadata.author}</Text>
          </View>

          <View style={styles.specsRow}>
            <Text style={styles.specText}>Container: <Text style={styles.specVal}>M4A (AAC)</Text></Text>
            <Text style={styles.specDot}>•</Text>
            <Text style={styles.specText}>Target Output: <Text style={styles.specVal}>MP3</Text></Text>
            <Text style={styles.specDot}>•</Text>
            <Text style={styles.specText}>Engine: <Text style={styles.specVal}>FFmpeg Wasm</Text></Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  thumbnailWrapper: {
    width: 140,
    height: 90,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  detailsCol: {
    flex: 1,
    minWidth: 220,
  },
  sourceBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  m4aBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  m4aBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  authorText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  specText: {
    fontSize: 11,
    color: theme.colors.textDim,
  },
  specVal: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  specDot: {
    color: theme.colors.textDim,
    fontSize: 11,
  },
});
