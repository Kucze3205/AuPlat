import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AuctionCard } from '@/components/auction-card';
import { AuthModal } from '@/components/auth-modal';
import { CreateAuctionModal } from '@/components/create-auction-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Toast } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { useAuctionSearch } from '@/hooks/auction-search';
import { useCart } from '@/hooks/cart';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Auction, fetchAuctions, getErrorMessage } from '@/services/api';

export default function AuctionsScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const { user, setUser } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { searchQuery } = useAuctionSearch();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [onlyWithImage, setOnlyWithImage] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

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
    const min = Number.parseFloat(minPrice);
    const max = Number.parseFloat(maxPrice);
    const hasMin = Number.isFinite(min);
    const hasMax = Number.isFinite(max);

    const filtered = auctions.filter((auction) => {
      const title = auction.title.toLowerCase();
      const description = auction.description.toLowerCase();
      const matchesSearch = !searchQuery || title.includes(searchQuery) || description.includes(searchQuery);

      const isEnded = new Date(auction.endsAt).getTime() < Date.now();
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !isEnded) ||
        (statusFilter === 'ended' && isEnded);

      const matchesImage = !onlyWithImage || !!auction.imageUrl;
      const matchesMin = !hasMin || auction.currentPrice >= min;
      const matchesMax = !hasMax || auction.currentPrice <= max;

      return matchesSearch && matchesStatus && matchesImage && matchesMin && matchesMax;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'priceAsc') return a.currentPrice - b.currentPrice;
      if (sortMode === 'priceDesc') return b.currentPrice - a.currentPrice;
      if (sortMode === 'endingSoon') {
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [auctions, searchQuery, statusFilter, onlyWithImage, minPrice, maxPrice, sortMode]);

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

  const handleAddToCart = (auction: Auction) => {
    addToCart(auction);
    setInfoMessage(`Added "${auction.title}" to basket.`);
  };

  const resetFilters = () => {
    setSortMode('newest');
    setStatusFilter('all');
    setOnlyWithImage(false);
    setMinPrice('');
    setMaxPrice('');
  };

  const isDesktopLayout = width >= 1000;

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} color="#ea7a1f" />
      ) : (
        <View style={[styles.pageContent, styles.mainRow, !isDesktopLayout && styles.mainRowStacked]}>
          <View
            style={[
              styles.sidebar,
              {
                borderColor: Colors[scheme].icon,
                backgroundColor: Colors[scheme].surface,
              },
              !isDesktopLayout && styles.sidebarStacked,
            ]}>
            <ThemedText type="subtitle" style={styles.sidebarTitle}>Sort & Filters</ThemedText>
            <ThemedText style={styles.resultsCount}>{filteredAuctions.length} results</ThemedText>

            <ThemedText style={styles.label}>Sort by</ThemedText>
            <View style={styles.optionRow}>
              <FilterChip label="Newest" active={sortMode === 'newest'} onPress={() => setSortMode('newest')} scheme={scheme} />
              <FilterChip label="Ending soon" active={sortMode === 'endingSoon'} onPress={() => setSortMode('endingSoon')} scheme={scheme} />
              <FilterChip label="Price low-high" active={sortMode === 'priceAsc'} onPress={() => setSortMode('priceAsc')} scheme={scheme} />
              <FilterChip label="Price high-low" active={sortMode === 'priceDesc'} onPress={() => setSortMode('priceDesc')} scheme={scheme} />
            </View>

            <ThemedText style={styles.label}>Status</ThemedText>
            <View style={styles.optionRow}>
              <FilterChip label="All" active={statusFilter === 'all'} onPress={() => setStatusFilter('all')} scheme={scheme} />
              <FilterChip label="Active" active={statusFilter === 'active'} onPress={() => setStatusFilter('active')} scheme={scheme} />
              <FilterChip label="Ended" active={statusFilter === 'ended'} onPress={() => setStatusFilter('ended')} scheme={scheme} />
            </View>

            <ThemedText style={styles.label}>Price range</ThemedText>
            <View style={styles.priceRow}>
              <TextInput
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="decimal-pad"
                placeholder="Min"
                placeholderTextColor={Colors[scheme].icon}
                style={[
                  styles.priceInput,
                  {
                    color: Colors[scheme].text,
                    borderColor: Colors[scheme].icon,
                    backgroundColor: Colors[scheme].background,
                  },
                ]}
              />
              <TextInput
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="decimal-pad"
                placeholder="Max"
                placeholderTextColor={Colors[scheme].icon}
                style={[
                  styles.priceInput,
                  {
                    color: Colors[scheme].text,
                    borderColor: Colors[scheme].icon,
                    backgroundColor: Colors[scheme].background,
                  },
                ]}
              />
            </View>

            <ThemedText style={styles.label}>Image</ThemedText>
            <View style={styles.optionRow}>
              <FilterChip
                label={onlyWithImage ? 'With image only' : 'Any'}
                active={onlyWithImage}
                onPress={() => setOnlyWithImage((prev) => !prev)}
                scheme={scheme}
              />
            </View>

            <Pressable style={styles.resetBtn} onPress={resetFilters}>
              <ThemedText style={styles.resetBtnText}>Reset filters</ThemedText>
            </Pressable>
          </View>

          <FlatList
            data={filteredAuctions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AuctionCard
                auction={item}
                onPress={() => router.push({ pathname: '/auction/[id]', params: { id: item.id } })}
                onAddToCart={() => handleAddToCart(item)}
                inCart={isInCart(item.id)}
              />
            )}
            style={styles.listWrap}
            contentContainerStyle={[styles.list, { paddingBottom: 140 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <ThemedText style={styles.empty}>
                {searchQuery ? 'No auctions match your search.' : 'No auctions yet. Be the first to create one!'}
              </ThemedText>
            }
          />
        </View>
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
      
      <Toast type="error" message={error} onDismiss={() => setError(null)} />
      <Toast type="success" message={infoMessage} onDismiss={() => setInfoMessage(null)} />
    </ThemedView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  scheme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  scheme: 'light' | 'dark';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        !active && { borderColor: Colors[scheme].icon, backgroundColor: Colors[scheme].background },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 70 },
  pageContent: { width: '100%', maxWidth: 1220, alignSelf: 'center' },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  mainRowStacked: {
    flexDirection: 'column',
  },
  listWrap: {
    flex: 1,
  },
  list: { gap: 12 },
  sidebar: {
    width: 290,
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 3,
    padding: 12,
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#f7f7f7',
  },
  sidebarStacked: {
    width: '100%',
  },
  sidebarTitle: {
    marginBottom: 0,
  },
  resultsCount: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    opacity: 0.7,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#b7b7b7',
    borderRadius: 3,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  chipActive: {
    borderColor: '#ea7a1f',
    backgroundColor: '#ea7a1f',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#b7b7b7',
    borderRadius: 3,
    maxWidth: 92,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  resetBtn: {
    marginTop: 6,
    borderRadius: 3,
    backgroundColor: '#5e676f',
    paddingVertical: 9,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
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
