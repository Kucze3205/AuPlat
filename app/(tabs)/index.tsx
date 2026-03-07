import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AuctionCard } from '@/components/auction-card';
import { AuthModal } from '@/components/auth-modal';
import { CreateAuctionModal } from '@/components/create-auction-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Toast } from '@/components/toast';
import { useAuctionSearch } from '@/hooks/auction-search';
import { useAuth } from '@/hooks/use-auth';
import { Auction, fetchAuctions, getErrorMessage } from '@/services/api';

export default function AuctionsScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { searchQuery } = useAuctionSearch();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAuctions = useCallback(async () => {
    try {
      setError(null);
      setAuctions(await fetchAuctions());
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    loadAuctions().finally(() => setLoading(false));
  }, [loadAuctions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAuctions();
    setRefreshing(false);
  };

  const filteredAuctions = useMemo(() => {
    if (!searchQuery) return auctions;
    return auctions.filter((auction) => {
      const title = auction.title.toLowerCase();
      const description = auction.description.toLowerCase();
      return title.includes(searchQuery) || description.includes(searchQuery);
    });
  }, [auctions, searchQuery]);

  const handleNewAuction = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (user.role !== 'seller') {
      setError('Permission denied: Only sellers can create auctions.');
      return;
    }
    setShowCreate(true);
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} color="#ea7a1f" />
      ) : (
        <FlatList
          data={filteredAuctions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AuctionCard
              auction={item}
              onPress={() => router.push({ pathname: '/auction/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={[styles.pageContent, styles.list]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
              {searchQuery ? 'No auctions match your search.' : 'No auctions yet. Be the first to create one!'}
            </ThemedText>
          }
        />
      )}

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: '#ea7a1f', opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={handleNewAuction}
      >
        <View style={styles.fabIconWrap}>
          <ThemedText style={styles.fabIcon}>+</ThemedText>
        </View>
        <ThemedText style={styles.fabLabel}>New Auction</ThemedText>
      </Pressable>

      <CreateAuctionModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={loadAuctions} />
      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} onAuth={setUser} />
      
      <Toast message={error} onDismiss={() => setError(null)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 70 },
  pageContent: { width: '100%', maxWidth: 960, alignSelf: 'center' },
  list: { paddingHorizontal: 32, paddingVertical: 16, gap: 12 },
  empty: { textAlign: 'center', marginTop: 40, opacity: 0.6 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 4,
    paddingRight: 18,
    borderRadius: 3,
    elevation: 6,
    boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.28)',
  },
  fabIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 3,
    backgroundColor: '#ea7a1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: { color: '#fff', fontSize: 24, lineHeight: 24, fontWeight: '700' },
  fabLabel: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
