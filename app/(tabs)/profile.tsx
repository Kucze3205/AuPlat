import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AuthModal } from '@/components/auth-modal';
import { ErrorBanner } from '@/components/error-banner';
import { MiniAuctionCard } from '@/components/mini-auction-card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Auction, fetchMyAuctions, getErrorMessage, logout } from '@/services/api';

// ─── Section Header ─────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText style={styles.sectionCount}>{count}</ThemedText>
    </View>
  );
}

// ─── Profile Screen ─────────────────────────────────────────

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const { user, setUser, authLoading } = useAuth();
  const [selling, setSelling] = useState<Auction[]>([]);
  const [bidding, setBidding] = useState<Auction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMyAuctions = useCallback(async () => {
    if (!user) {
      setSelling([]);
      setBidding([]);
      return;
    }
    setError(null);
    try {
      const data = await fetchMyAuctions();
      setSelling(data.selling);
      setBidding(data.bidding);
    } catch (e: any) {
      setError(getErrorMessage(e));
    }
  }, [user]);

  useEffect(() => {
    loadMyAuctions();
  }, [loadMyAuctions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyAuctions();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (e: any) {
      Alert.alert('Error', getErrorMessage(e));
    }
  };

  const navigateToAuction = (id: string) =>
    router.push({ pathname: '/auction/[id]', params: { id } });

  // ── Loading state ──
  if (authLoading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors[scheme].tint} />
      </ThemedView>
    );
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText type="title" style={{ marginBottom: 8 }}>Profile</ThemedText>
        <ThemedText style={{ opacity: 0.6, marginBottom: 24, textAlign: 'center' }}>
          Login or register to see your profile, auctions, and bids.
        </ThemedText>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => setShowAuth(true)}>
          <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Login / Register</ThemedText>
        </Pressable>
        <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} onAuth={setUser} />
      </ThemedView>
    );
  }

  // ── Logged in ──
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalBidsPlaced = bidding.reduce(
    (sum, a) => sum + a.bids.filter((b) => b.bidderId === user.id).length,
    0,
  );

  const totalEarnings = selling
    .filter((a) => a.bids.length > 0)
    .reduce((sum, a) => sum + a.currentPrice, 0);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => { setError(null); loadMyAuctions(); }}
            onDismiss={() => setError(null)}
          />
        )}

        {/* ── Profile Header ── */}
        <View style={[styles.profileHeader, { borderBottomColor: Colors[scheme].icon }]}>
          <ProfileAvatar user={user} onUpdated={setUser} scheme={scheme} />
          <ThemedText type="title" style={styles.email}>{user.email}</ThemedText>
          <View style={[styles.rolePill, { borderColor: Colors[scheme].tint }]}>
            <ThemedText style={[styles.roleText, { color: Colors[scheme].tint }]}>
              {user.role.toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.memberSince}>Member since {memberSince}</ThemedText>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="title" style={styles.statNumber}>{selling.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Auctions</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: Colors[scheme].icon }]} />
          <View style={styles.statItem}>
            <ThemedText type="title" style={styles.statNumber}>{totalBidsPlaced}</ThemedText>
            <ThemedText style={styles.statLabel}>Bids Placed</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: Colors[scheme].icon }]} />
          <View style={styles.statItem}>
            <ThemedText type="title" style={styles.statNumber}>${totalEarnings.toFixed(0)}</ThemedText>
            <ThemedText style={styles.statLabel}>Earnings</ThemedText>
          </View>
        </View>

        {/* ── My Auctions (selling) ── */}
        {user.role === 'seller' && (
          <>
            <SectionHeader title="My Auctions" count={selling.length} />
            {selling.length === 0 ? (
              <ThemedText style={styles.emptyText}>You haven't created any auctions yet.</ThemedText>
            ) : (
              selling.map((a) => (
                <MiniAuctionCard key={a.id} auction={a} onPress={() => navigateToAuction(a.id)} />
              ))
            )}
          </>
        )}

        {/* ── My Bids ── */}
        <SectionHeader title="My Bids" count={bidding.length} />
        {bidding.length === 0 ? (
          <ThemedText style={styles.emptyText}>You haven't placed any bids yet.</ThemedText>
        ) : (
          bidding.map((a) => {
            const myBids = a.bids.filter((b) => b.bidderId === user.id);
            const highest = Math.max(...myBids.map((b) => b.amount));
            const isWinning = a.currentPrice === highest;
            return (
              <MiniAuctionCard
                key={a.id}
                auction={a}
                label={isWinning ? 'Winning' : 'Outbid'}
                onPress={() => navigateToAuction(a.id)}
              />
            );
          })
        )}

        {/* ── Logout ── */}
        <Pressable style={[styles.logoutBtn, { borderColor: '#e74c3c' }]} onPress={handleLogout}>
          <ThemedText type="defaultSemiBold" style={{ color: '#e74c3c' }}>Logout</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  email: { fontSize: 20, marginBottom: 6 },
  rolePill: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3, marginBottom: 8 },
  roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  memberSince: { fontSize: 13, opacity: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 24 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 24 },
  statLabel: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  statDivider: { width: 1, height: 36, opacity: 0.3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 8 },
  sectionCount: { fontSize: 14, opacity: 0.5 },
  emptyText: { textAlign: 'center', opacity: 0.5, marginBottom: 16 },
  logoutBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 24 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#0a7ea4' },
});
