import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Auction } from '@/services/api';

interface Props {
  auction: Auction;
  label?: string;
  onPress: () => void;
}

export function MiniAuctionCard({ auction, label, onPress }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const endsAt = new Date(auction.endsAt);
  const isEnded = endsAt.getTime() < Date.now();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderColor: Colors[scheme].icon }]}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ flex: 1 }}>
          {auction.title}
        </ThemedText>
        {label && (
          <View style={[styles.badge, { backgroundColor: Colors[scheme].tint }]}>
            <ThemedText style={styles.badgeText}>{label}</ThemedText>
          </View>
        )}
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.price}>
          ${auction.currentPrice.toFixed(2)}
        </ThemedText>
        <ThemedText style={{ color: isEnded ? '#e74c3c' : '#27ae60', fontSize: 13 }}>
          {isEnded ? 'Ended' : `Ends ${endsAt.toLocaleDateString()}`}
        </ThemedText>
      </View>
      <ThemedText style={styles.bids}>
        {auction.bids.length} bid{auction.bids.length !== 1 ? 's' : ''}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontWeight: '600' },
  bids: { fontSize: 12, opacity: 0.4, marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
