import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { EditAuctionModal } from '@/components/edit-auction-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Toast } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    Auction,
    fetchAuction,
    getErrorMessage,
    placeBid,
} from '@/services/api';

export default function AuctionDetailsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const { id: auctionId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const loadAuction = useCallback(async () => {
    if (!auctionId) {
      setError('Auction id is missing.');
      return;
    }

    try {
      setError(null);
      const data = await fetchAuction(auctionId);
      setAuction(data);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [auctionId]);

  useEffect(() => {
    loadAuction().finally(() => setLoading(false));
  }, [loadAuction]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAuction();
    setRefreshing(false);
  };

  const handleBid = async () => {
    if (!auction || !auctionId) return;

    const amount = Number.parseFloat(bidAmount);
    if (!Number.isFinite(amount)) {
      setError('Please enter a valid number for your bid.');
      return;
    }

    if (amount <= auction.currentPrice) {
      setError(`Your bid must be above $${auction.currentPrice.toFixed(2)}.`);
      return;
    }

    setSubmitting(true);
    try {
      setError(null);
      setSuccess(null);
      const updated = await placeBid(auctionId, amount);
      setAuction(updated);
      setBidAmount('');
      setSuccess('Bid placed successfully.');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors[scheme].tint} />
      </ThemedView>
    );
  }

  if (!auction) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText type="title" style={{ marginBottom: 8 }}>
          Auction
        </ThemedText>
        <ThemedText style={{ opacity: 0.7, textAlign: 'center', paddingHorizontal: 16 }}>
          Unable to load this auction.
        </ThemedText>
        <Pressable style={[styles.button, styles.retryButton]} onPress={loadAuction}>
          <ThemedText type="defaultSemiBold" style={styles.retryButtonText}>
            Retry
          </ThemedText>
        </Pressable>
        <Toast message={error} onDismiss={() => setError(null)} />
      </ThemedView>
    );
  }

  const endsAt = new Date(auction.endsAt);
  const createdAt = new Date(auction.createdAt);
  const isEnded = endsAt.getTime() < Date.now();
  const canBid = !!user && user.id !== auction.sellerId && user.role === 'buyer' && !isEnded;
  const isOwner = !!user && user.id === auction.sellerId;

  const bidInputStyle = [
    styles.bidInput,
    {
      color: Colors[scheme].text,
      borderColor: Colors[scheme].icon,
      backgroundColor: scheme === 'dark' ? '#1e2022' : '#f7f7f7',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {auction.imageUrl && (
          <Image source={{ uri: auction.imageUrl }} style={styles.heroImage} contentFit="cover" />
        )}

        <ThemedText type="title" style={styles.title}>
          {auction.title}
        </ThemedText>

        {isOwner && (
          <Pressable
            style={[styles.button, styles.editButton]}
            onPress={() => setShowEdit(true)}
          >
            <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Edit Auction</ThemedText>
          </Pressable>
        )}

        <ThemedText style={styles.description}>{auction.description}</ThemedText>

        <View style={styles.priceRow}>
          <ThemedText type="subtitle">Current price</ThemedText>
          <ThemedText type="subtitle">${auction.currentPrice.toFixed(2)}</ThemedText>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Status</ThemedText>
            <ThemedText style={{ color: isEnded ? '#e74c3c' : '#27ae60' }}>
              {isEnded ? 'Ended' : 'Active'}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Created</ThemedText>
            <ThemedText>{createdAt.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Ends</ThemedText>
            <ThemedText>{endsAt.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Total bids</ThemedText>
            <ThemedText>{auction.bids.length}</ThemedText>
          </View>
        </View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Place a bid
        </ThemedText>

        {!user && (
          <ThemedText style={styles.helperText}>
            Login as a buyer to place bids.
          </ThemedText>
        )}

        {user && user.id === auction.sellerId && (
          <ThemedText style={styles.helperText}>
            You are the seller for this auction, so bidding is disabled.
          </ThemedText>
        )}

        {user && user.role !== 'buyer' && user.id !== auction.sellerId && (
          <ThemedText style={styles.helperText}>
            Only buyer accounts can place bids.
          </ThemedText>
        )}

        {isEnded && (
          <ThemedText style={styles.helperText}>
            This auction has ended and no longer accepts bids.
          </ThemedText>
        )}

        <View style={styles.bidRow}>
          <TextInput
            style={bidInputStyle}
            value={bidAmount}
            onChangeText={setBidAmount}
            keyboardType="decimal-pad"
            placeholder="Enter your bid"
            placeholderTextColor={Colors[scheme].icon}
            editable={canBid && !submitting}
          />
          <Pressable
            style={[
              styles.button,
              styles.bidButton,
              { opacity: canBid && !submitting ? 1 : 0.5 },
            ]}
            disabled={!canBid || submitting}
            onPress={handleBid}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.bidButtonText}>
                Bid
              </ThemedText>
            )}
          </Pressable>
        </View>

        {success && <ThemedText style={styles.successText}>{success}</ThemedText>}
      </ScrollView>

      <Toast message={error} onDismiss={() => setError(null)} />

      {auction && (
        <EditAuctionModal
          visible={showEdit}
          auction={auction}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => setAuction(updated)}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    backgroundColor: '#e5e5e5',
  },
  title: {
    marginTop: 4,
  },
  description: {
    opacity: 0.8,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metaCard: {
    borderWidth: 1,
    borderColor: '#cfd6dd',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    opacity: 0.6,
  },
  sectionTitle: {
    marginTop: 8,
  },
  helperText: {
    opacity: 0.65,
    lineHeight: 19,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  bidInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidButton: {
    backgroundColor: '#0a7ea4',
    minWidth: 72,
  },
  editButton: {
    backgroundColor: '#0a7ea4',
    alignSelf: 'flex-start',
  },
  bidButtonText: {
    color: '#fff',
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
  },
  successText: {
    color: '#27ae60',
    marginTop: 2,
    fontWeight: '600',
  },
});
