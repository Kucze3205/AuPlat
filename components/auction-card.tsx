import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Auction } from '@/services/api';

interface Props {
  auction: Auction;
  onPress: () => void;
}

export function AuctionCard({ auction, onPress }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const endsAt = new Date(auction.endsAt);
  const isEnded = endsAt.getTime() < Date.now();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: Colors[scheme].background, borderColor: Colors[scheme].icon }]}
      accessibilityRole="button"
    >
      <View style={styles.body}>
        <View style={styles.info}>
          <ThemedText type="subtitle" style={styles.title}>
            {auction.title}
          </ThemedText>
          <ThemedText numberOfLines={2} style={styles.desc}>
            {auction.description}
          </ThemedText>
          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">
              ${auction.currentPrice.toFixed(2)}
            </ThemedText>
            <ThemedText style={{ color: isEnded ? '#e74c3c' : '#27ae60' }}>
              {isEnded ? 'Ended' : `Ends ${endsAt.toLocaleDateString()}`}
            </ThemedText>
          </View>
          <ThemedText style={styles.bidCount}>
            {auction.bids.length} bid{auction.bids.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        {auction.imageUrl && (
          <Image source={{ uri: auction.imageUrl }} style={styles.image} contentFit="contain" />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 3, padding: 16, borderWidth: 1 },
  body: { flexDirection: 'row', gap: 12 },
  info: { flex: 1, gap: 4 },
  image: { width: 100, height: 100, borderRadius: 3, backgroundColor: '#f0f0f0' },
  title: { marginBottom: 2 },
  desc: { opacity: 0.7 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  bidCount: { fontSize: 13, opacity: 0.5 },
});
