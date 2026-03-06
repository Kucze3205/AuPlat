import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Auction, fetchAuctions, getErrorMessage, logout } from '@/services/api';

export default function AuctionsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const { user, setUser } = useAuth();
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
      <View style={[styles.header, { borderBottomColor: Colors[scheme].icon }]}>
        <ThemedText type="title">Auctions</ThemedText>
        {user ? (
          <Pressable onPress={() => { logout(); setUser(null); }}>
            <ThemedText type="link">{user.email} (logout)</ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={() => setShowAuth(true)}>
            <ThemedText type="link">Login</ThemedText>
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} color={Colors[scheme].tint} />
      ) : (
        <FlatList
          data={auctions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AuctionCard
              auction={item}
              onPress={() => router.push({ pathname: '/auction/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>No auctions yet. Be the first to create one!</ThemedText>
          }
        />
      )}

      <Pressable style={[styles.fab, { backgroundColor: Colors[scheme].tint }]} onPress={handleNewAuction}>
        <ThemedText style={styles.fabText}>+</ThemedText>
      </Pressable>

      <CreateAuctionModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={loadAuctions} />
      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} onAuth={setUser} />
      <Toast message={error} onDismiss={() => setError(null)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', marginTop: 40, opacity: 0.6 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '700' },
});
