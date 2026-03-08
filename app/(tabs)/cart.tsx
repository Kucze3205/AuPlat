import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useCart } from '@/hooks/cart';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CartScreen() {
  const scheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const { items, removeFromCart, clearCart } = useCart();

  const total = items.reduce((sum, item) => sum + item.currentPrice, 0);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.pageContent, styles.scroll]}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>Basket</ThemedText>
          {items.length > 0 && (
            <Pressable
              style={[styles.clearBtn, { borderColor: '#e74c3c' }]}
              onPress={clearCart}
            >
              <ThemedText style={{ color: '#e74c3c', fontWeight: '700' }}>Clear basket</ThemedText>
            </Pressable>
          )}
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ThemedText style={styles.emptyText}>Your basket is empty.</ThemedText>
            <Pressable
              style={({ pressed }) => [styles.browseBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.replace('/(tabs)')}
            >
              <ThemedText style={styles.browseBtnText}>Browse auctions</ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.summaryCard, { borderColor: Colors[scheme].icon }]}>
              <ThemedText type="defaultSemiBold">Items: {items.length}</ThemedText>
              <ThemedText type="defaultSemiBold">Estimated total: ${total.toFixed(2)}</ThemedText>
            </View>

            {items.map((item) => (
              <View key={item.id} style={[styles.itemCard, { borderColor: Colors[scheme].icon }]}> 
                <Pressable style={styles.itemMain} onPress={() => router.push({ pathname: '/auction/[id]', params: { id: item.id } })}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImageFallback]} />
                  )}

                  <View style={styles.itemInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.title}</ThemedText>
                    <ThemedText style={styles.itemPrice}>${item.currentPrice.toFixed(2)}</ThemedText>
                    <ThemedText style={styles.itemHint}>Tap to open auction</ThemedText>
                  </View>
                </Pressable>

                <Pressable style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
                  <ThemedText style={styles.removeBtnText}>Remove</ThemedText>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 70 },
  pageContent: { width: '100%', maxWidth: 960, alignSelf: 'center' },
  scroll: { paddingHorizontal: 32, paddingVertical: 16, paddingBottom: 40, gap: 12 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  title: { fontSize: 30, lineHeight: 32 },
  clearBtn: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyWrap: {
    marginTop: 30,
    alignItems: 'center',
    gap: 14,
  },
  emptyText: { opacity: 0.65, textAlign: 'center' },
  browseBtn: {
    borderRadius: 3,
    backgroundColor: '#ea7a1f',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  browseBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 3,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 3,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 3,
    backgroundColor: '#ececec',
  },
  itemImageFallback: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
  },
  itemInfo: { flex: 1, gap: 1 },
  itemPrice: { fontSize: 15, fontWeight: '700' },
  itemHint: { fontSize: 12, opacity: 0.5 },
  removeBtn: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeBtnText: { color: '#e74c3c', fontWeight: '700' },
});
