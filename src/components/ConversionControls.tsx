import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Sliders, Tag, Zap } from 'lucide-react';
import { theme } from '../styles/theme';
import type { BitrateOption, ConversionOptions, MediaMetadata } from '../types/converter';

interface ConversionControlsProps {
  metadata: MediaMetadata;
  onStartConversion: (options: ConversionOptions) => void;
  isConverting: boolean;
}

export const ConversionControls: React.FC<ConversionControlsProps> = ({
  metadata,
  onStartConversion,
  isConverting,
}) => {
  const [bitrate, setBitrate] = useState<BitrateOption>('320k');
  const [sampleRate] = useState<number>(44100);
  const [trimStart] = useState<number>(0);
  const [trimEnd] = useState<number>(metadata.duration || 180);

  
  const [id3Title, setId3Title] = useState(metadata.title);
  const [id3Artist, setId3Artist] = useState(metadata.author);
  const [id3Album, setId3Album] = useState('YouTube FFmpeg Downloads');
  const [showMetadata, setShowMetadata] = useState(false);

  const bitrates: { label: string; value: BitrateOption; desc: string }[] = [
    { label: '128 kbps', value: '128k', desc: 'Compact Size' },
    { label: '192 kbps', value: '192k', desc: 'Standard Quality' },
    { label: '256 kbps', value: '256k', desc: 'High Definition' },
    { label: '320 kbps', value: '320k', desc: 'Maximum HD Quality' },
  ];

  const handleConvert = () => {
    onStartConversion({
      bitrate,
      sampleRate,
      trimStart,
      trimEnd,
      metadata: {
        title: id3Title,
        artist: id3Artist,
        album: id3Album,
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Sliders size={18} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Audio Quality Settings</Text>
        </View>
        <TouchableOpacity
          style={styles.toggleMetaBtn}
          onPress={() => setShowMetadata(!showMetadata)}
        >
          <Tag size={14} color={theme.colors.primary} />
          <Text style={styles.toggleMetaText}>
            {showMetadata ? 'Hide Track Info' : 'Edit Track Info'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bitrate Selector */}
      <Text style={styles.label}>Select Output Audio Quality:</Text>
      <View style={styles.bitrateGrid}>
        {bitrates.map((b) => (
          <TouchableOpacity
            key={b.value}
            style={[styles.bitrateCard, bitrate === b.value && styles.bitrateCardActive]}
            onPress={() => setBitrate(b.value)}
            disabled={isConverting}
          >
            <Text style={[styles.bitrateLabel, bitrate === b.value && styles.bitrateLabelActive]}>
              {b.label}
            </Text>
            <Text style={styles.bitrateDesc}>{b.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ID3 Tag Metadata Editor collapsible */}
      {showMetadata && (
        <View style={styles.metadataBox}>
          <Text style={styles.metaBoxTitle}>Embedded Track Metadata:</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Track Title:</Text>
            <TextInput
              style={styles.metaInput}
              value={id3Title}
              onChangeText={setId3Title}
              placeholder="Track Title"
              placeholderTextColor={theme.colors.textDim}
              editable={!isConverting}
            />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Artist / Creator:</Text>
            <TextInput
              style={styles.metaInput}
              value={id3Artist}
              onChangeText={setId3Artist}
              placeholder="Artist"
              placeholderTextColor={theme.colors.textDim}
              editable={!isConverting}
            />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Album Name:</Text>
            <TextInput
              style={styles.metaInput}
              value={id3Album}
              onChangeText={setId3Album}
              placeholder="Album"
              placeholderTextColor={theme.colors.textDim}
              editable={!isConverting}
            />
          </View>
        </View>
      )}

      {/* Start Action Button */}
      <TouchableOpacity
        style={[styles.convertBtn, isConverting && styles.convertBtnDisabled]}
        onPress={handleConvert}
        disabled={isConverting}
      >
        <Zap size={20} color="#ffffff" />
        <Text style={styles.convertBtnText}>
          {isConverting ? 'Processing Audio Stream...' : `Download & Save Audio (${bitrate})`}
        </Text>
      </TouchableOpacity>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  toggleMetaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
  },
  toggleMetaText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 10,
  },
  bitrateGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  bitrateCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
  },
  bitrateCardActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: theme.colors.primary,
  },
  bitrateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  bitrateLabelActive: {
    color: theme.colors.primary,
  },
  bitrateDesc: {
    fontSize: 11,
    color: theme.colors.textDim,
  },
  metadataBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    gap: 10,
  },
  metaBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaLabel: {
    width: 100,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  metaInput: {
    flex: 1,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: theme.colors.text,
    fontSize: 13,
  },

  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primaryGradientStart,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    elevation: 4,
  },
  convertBtnDisabled: {
    opacity: 0.5,
  },
  convertBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
