import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { History, Download, Trash2, Music, ExternalLink } from 'lucide-react';
import { theme } from '../styles/theme';
import type { ConvertedTrack } from '../types/converter';


interface HistoryListProps {
  history: ConvertedTrack[];
  onClearHistory: () => void;
  onSelectTrack: (track: ConvertedTrack) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onClearHistory,
  onSelectTrack,
}) => {
  if (history.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <History size={40} color={theme.colors.textDim} />
        <Text style={styles.emptyTitle}>No Converted MP3s Yet</Text>
        <Text style={styles.emptySub}>
          Extract YouTube videos with SaveFrom M4A and transcode them using FFmpeg to fill your library!
        </Text>
      </View>
    );
  }

  const formatSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const downloadFile = (track: ConvertedTrack) => {
    const link = document.createElement('a');
    link.href = track.mp3Url;
    link.download = `${track.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${track.bitrate}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <History size={18} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Conversion History ({history.length})</Text>
        </View>

        <TouchableOpacity style={styles.clearBtn} onPress={onClearHistory}>
          <Trash2 size={14} color={theme.colors.danger} />
          <Text style={styles.clearBtnText}>Clear History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {history.map((track) => (
          <View key={track.id + track.timestamp} style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <View style={styles.musicIconBadge}>
                <Music size={18} color={theme.colors.primary} />
              </View>

              <View style={styles.itemMeta}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <View style={styles.itemTags}>
                  <Text style={styles.tagText}>{track.artist}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.tagHighlight}>{track.bitrate} MP3</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.tagText}>{formatSize(track.fileSize)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.actionPlayBtn}
                onPress={() => onSelectTrack(track)}
              >
                <ExternalLink size={14} color={theme.colors.primary} />
                <Text style={styles.actionPlayText}>Play</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionDownloadBtn}
                onPress={() => downloadFile(track)}
              >
                <Download size={14} color="#ffffff" />
                <Text style={styles.actionDownloadText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 400,
  },
  container: {
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearBtnText: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 200,
  },
  musicIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  tagHighlight: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dot: {
    fontSize: 10,
    color: theme.colors.textDim,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionPlayText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionDownloadText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
  },
});
