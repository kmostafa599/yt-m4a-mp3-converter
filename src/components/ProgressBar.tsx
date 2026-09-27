import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Cpu, AlertTriangle, ArrowRight } from 'lucide-react';
import { theme } from '../styles/theme';
import type { ConversionProgress } from '../types/converter';


interface ProgressBarProps {
  progress: ConversionProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const getStageStep = () => {
    switch (progress.stage) {
      case 'extracting':
        return 1;
      case 'downloading':
        return 1;
      case 'transcoding':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const step = getStageStep();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.stageTitleRow}>
          <Cpu size={18} color={theme.colors.primary} />
          <Text style={styles.stageTitle}>
            {progress.stage === 'downloading' && 'Downloading SaveFrom M4A Stream...'}
            {progress.stage === 'transcoding' && 'FFmpeg Transcoding M4A -> MP3...'}
            {progress.stage === 'completed' && 'Conversion Successfully Completed!'}
            {progress.stage === 'error' && 'Conversion Failed'}
          </Text>
        </View>

        <Text style={styles.percentText}>{progress.percent}%</Text>
      </View>

      {/* Step Indicator Badges */}
      <View style={styles.stepsRow}>
        <View style={[styles.stepBadge, step >= 1 && styles.stepBadgeActive]}>
          <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1. SaveFrom M4A</Text>
        </View>
        <ArrowRight size={12} color={theme.colors.textDim} />
        <View style={[styles.stepBadge, step >= 2 && styles.stepBadgeActive]}>
          <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2. FFmpeg Core</Text>
        </View>
        <ArrowRight size={12} color={theme.colors.textDim} />
        <View style={[styles.stepBadge, step >= 3 && styles.stepBadgeActive]}>
          <Text style={[styles.stepText, step >= 3 && styles.stepTextActive]}>3. MP3 Ready</Text>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress.percent}%` }]} />
      </View>

      {/* Detail log message */}
      {progress.detailMsg && (
        <Text style={styles.detailMsg} numberOfLines={2}>
          {progress.detailMsg}
        </Text>
      )}

      {progress.errorMsg && (
        <View style={styles.errorBox}>
          <AlertTriangle size={16} color={theme.colors.danger} />
          <Text style={styles.errorText}>{progress.errorMsg}</Text>
        </View>
      )}
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
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  percentText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  stepBadgeActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: theme.colors.primary,
  },
  stepText: {
    fontSize: 11,
    color: theme.colors.textDim,
    fontWeight: '600',
  },
  stepTextActive: {
    color: theme.colors.primary,
  },
  track: {
    height: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
  detailMsg: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
