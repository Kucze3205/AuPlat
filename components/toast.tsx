import { ThemedText } from '@/components/themed-text';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

interface Props {
  message: string | null;
  /** Auto-dismiss after this many ms (default 4000) */
  duration?: number;
  onDismiss: () => void;
}

/**
 * A toast that slides up from the bottom, stays visible for a few seconds,
 * then slides back down automatically. Tap to dismiss early.
 */
export function Toast({ message, duration = 4000, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [onDismiss, translateY, opacity]);

  useEffect(() => {
    if (!message) return;

    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss
    timer.current = setTimeout(hide, duration);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [message, duration, hide, translateY, opacity]);

  if (!message) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
        <Pressable onPress={hide} style={styles.inner}>
          <ThemedText style={styles.icon}>⚠</ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    maxWidth: '90%',
    minWidth: '60%',
  },
  inner: {
    backgroundColor: '#1e1e2e',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 18,
    marginTop: 1,
  },
  message: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
