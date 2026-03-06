import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface Props {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * An inline error banner shown at the top of a screen.
 * Supports optional retry and dismiss actions.
 */
export function ErrorBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <ThemedText style={styles.icon}>⚠</ThemedText>
        <ThemedText style={styles.message}>
          {message}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        {onRetry && (
          <Pressable style={styles.retryBtn} onPress={onRetry}>
            <ThemedText type="defaultSemiBold" style={styles.retryText}>
              Retry
            </ThemedText>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable onPress={onDismiss} style={styles.dismissBtn}>
            <ThemedText style={styles.dismissText}>✕</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  icon: {
    fontSize: 18,
    color: '#dc2626',
  },
  message: {
    color: '#991b1b',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 13,
  },
  dismissBtn: {
    padding: 4,
  },
  dismissText: {
    color: '#991b1b',
    fontSize: 16,
    fontWeight: '700',
  },
});
