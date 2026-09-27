import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, Search, Clipboard, X, Sparkles } from 'lucide-react';
import { theme } from '../styles/theme';
import { extractYouTubeId, SAMPLE_AUDIO_TRACKS } from '../services/youtubeService';

interface UrlInputProps {
  onFetchAudio: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onFetchAudio, isLoading }) => {
  const [url, setUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTextChange = (text: string) => {
    setUrl(text);
    setErrorMsg(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setErrorMsg(null);
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  const handleSubmit = () => {
    if (!url.trim()) {
      setErrorMsg('Please enter a YouTube video URL or ID');
      return;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setErrorMsg('Invalid YouTube URL format. Example: https://youtube.com/watch?v=...');
      return;
    }

    setErrorMsg(null);
    onFetchAudio(url);
  };

  const handleLoadSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setErrorMsg(null);
    onFetchAudio(sampleUrl);
  };

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Video color="#ff0000" size={20} />
          <Text style={styles.labelTitle}>YouTube Video Link</Text>
        </View>

        <Text style={styles.labelSub}>High-Fidelity Audio Extractor</Text>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Paste video link (e.g. https://www.youtube.com/watch?v=...)"
          placeholderTextColor={theme.colors.textDim}
          value={url}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSubmit}
          editable={!isLoading}
        />

        {url.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setUrl('')}>
            <X size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
          <Clipboard size={16} color={theme.colors.primary} />
          <Text style={styles.pasteBtnText}>Paste</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Search size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>Fetch Audio</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      <View style={styles.sampleSection}>
        <View style={styles.sampleHeader}>
          <Sparkles size={14} color={theme.colors.primary} />
          <Text style={styles.sampleTitle}>Try Instant Audio Demos:</Text>
        </View>
        <View style={styles.sampleButtonsRow}>
          {SAMPLE_AUDIO_TRACKS.map((sample, idx) => (
            <TouchableOpacity
              key={sample.id}
              style={styles.samplePill}
              onPress={() => handleLoadSample(`https://youtube.com/watch?v=${sample.id}`)}
              disabled={isLoading}
            >
              <Text style={styles.samplePillText}>
                Demo #{idx + 1}: {sample.title.slice(0, 26)}...
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  labelSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    height: 44,
    color: theme.colors.text,
    fontSize: 14,
    minWidth: 200,
  },

  clearBtn: {
    padding: 6,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  pasteBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryGradientStart,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  sampleSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  sampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sampleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  sampleButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  samplePill: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  samplePillText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
