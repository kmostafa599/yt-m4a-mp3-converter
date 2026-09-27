import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Music as LucideMusic, Cpu as LucideCpu, Sparkles as LucideSparkles, Code as LucideCode } from 'lucide-react';
import { theme } from '../styles/theme';


interface HeaderProps {
  activeTab: 'converter' | 'nativeCode' | 'history';
  onTabChange: (tab: 'converter' | 'nativeCode' | 'history') => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, historyCount }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.iconBadge}>
            <LucideMusic color={theme.colors.primary} size={28} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>SonicCraft</Text>
              <Text style={styles.subTitleText}> Studio</Text>
            </View>
            <Text style={styles.tagline}>Premium Audio Extractor • Studio Grade HD MP3</Text>
          </View>
        </View>

        <View style={styles.techBadges}>
          <View style={[styles.badge, { borderColor: 'rgba(0, 242, 254, 0.4)' }]}>
            <LucideCpu size={14} color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>HD Audio Core</Text>
          </View>

          <View style={[styles.badge, { borderColor: 'rgba(255, 8, 68, 0.4)' }]}>
            <LucideSparkles size={14} color={theme.colors.accent} />
            <Text style={[styles.badgeText, { color: theme.colors.accent }]}>Instant Engine</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'converter' && styles.tabButtonActive]}
          onPress={() => onTabChange('converter')}
        >
          <LucideMusic size={16} color={activeTab === 'converter' ? theme.colors.primary : theme.colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'converter' && styles.tabTextActive]}>
            Converter Studio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => onTabChange('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Converted MP3s ({historyCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'nativeCode' && styles.tabButtonActive]}
          onPress={() => onTabChange('nativeCode')}
        >
          <LucideCode size={16} color={activeTab === 'nativeCode' ? theme.colors.secondary : theme.colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'nativeCode' && styles.tabTextActive]}>
            React Native Code
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  subTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  tagline: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  techBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
    paddingTop: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});
