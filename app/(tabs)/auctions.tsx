import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    Auction,
    createAuction,
    fetchAuctions,
    fetchMe,
    login,
    logout,
    onAuthChanged,
    register,
    UserProfile,
} from '@/services/api';

// ─── Auction Card ──────────────────────────────────────────

function AuctionCard({ auction }: { auction: Auction }) {
  const scheme = useColorScheme() ?? 'light';
  const endsAt = new Date(auction.endsAt);
  const isEnded = endsAt.getTime() < Date.now();

  return (
    <View style={[styles.card, { backgroundColor: Colors[scheme].background, borderColor: Colors[scheme].icon }]}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        {auction.title}
      </ThemedText>
      <ThemedText numberOfLines={2} style={styles.cardDesc}>
        {auction.description}
      </ThemedText>
      <View style={styles.cardRow}>
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
  );
}

// ─── Create Auction Modal ──────────────────────────────────

function CreateAuctionModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [durationHours, setDurationHours] = useState('24');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !startingPrice) {
      Alert.alert('Validation', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await createAuction({
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        durationHours: parseInt(durationHours, 10) || 24,
      });
      setTitle('');
      setDescription('');
      setStartingPrice('');
      setDurationHours('24');
      onCreated();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not create auction');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: Colors[scheme].text,
      borderColor: Colors[scheme].icon,
      backgroundColor: scheme === 'dark' ? '#1e2022' : '#f9f9f9',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: Colors[scheme].background }]}>
          <ThemedText type="title" style={styles.modalTitle}>
            New Auction
          </ThemedText>

          <TextInput
            style={inputStyle}
            placeholder="Title (min 3 chars)"
            placeholderTextColor={Colors[scheme].icon}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[...inputStyle, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Description (min 10 chars)"
            placeholderTextColor={Colors[scheme].icon}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            style={inputStyle}
            placeholder="Starting price"
            placeholderTextColor={Colors[scheme].icon}
            value={startingPrice}
            onChangeText={setStartingPrice}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={inputStyle}
            placeholder="Duration (hours, 1-240)"
            placeholderTextColor={Colors[scheme].icon}
            value={durationHours}
            onChangeText={setDurationHours}
            keyboardType="number-pad"
          />

          <View style={styles.modalButtons}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <ThemedText type="defaultSemiBold">Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
                  Create
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Login / Register Modal ────────────────────────────────

function AuthModal({
  visible,
  onClose,
  onAuth,
}: {
  visible: boolean;
  onClose: () => void;
  onAuth: (user: UserProfile) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('seller');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        const profile = await register({ email, password, role });
        onAuth(profile);
      } else {
        const profile = await login({ email, password });
        onAuth(profile);
      }
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: Colors[scheme].text,
      borderColor: Colors[scheme].icon,
      backgroundColor: scheme === 'dark' ? '#1e2022' : '#f9f9f9',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: Colors[scheme].background }]}>
          <ThemedText type="title" style={styles.modalTitle}>
            {isRegister ? 'Register' : 'Login'}
          </ThemedText>

          <TextInput
            style={inputStyle}
            placeholder="Email"
            placeholderTextColor={Colors[scheme].icon}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={inputStyle}
            placeholder="Password"
            placeholderTextColor={Colors[scheme].icon}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isRegister && (
            <View style={styles.roleRow}>
              <Pressable
                style={[styles.roleBtn, role === 'seller' && styles.roleBtnActive]}
                onPress={() => setRole('seller')}
              >
                <ThemedText style={role === 'seller' ? { color: '#fff' } : undefined}>
                  Seller
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.roleBtn, role === 'buyer' && styles.roleBtnActive]}
                onPress={() => setRole('buyer')}
              >
                <ThemedText style={role === 'buyer' ? { color: '#fff' } : undefined}>
                  Buyer
                </ThemedText>
              </Pressable>
            </View>
          )}

          <View style={styles.modalButtons}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <ThemedText type="defaultSemiBold">Cancel</ThemedText>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
                  {isRegister ? 'Register' : 'Login'}
                </ThemedText>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => setIsRegister(!isRegister)} style={{ marginTop: 12 }}>
            <ThemedText type="link">
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────

export default function AuctionsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const loadAuctions = useCallback(async () => {
    try {
      const data = await fetchAuctions();
      setAuctions(data);
    } catch {
      Alert.alert('Error', 'Could not load auctions. Is the server running?');
    }
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchMe();
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
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
      Alert.alert('Permission denied', 'Only sellers can create auctions.');
      return;
    }
    setShowCreate(true);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors[scheme].icon }]}>
        <ThemedText type="title">Auctions</ThemedText>
        <View style={styles.headerRight}>
          {user ? (
            <Pressable onPress={handleLogout}>
              <ThemedText type="link">{user.email} (logout)</ThemedText>
            </Pressable>
          ) : (
            <Pressable onPress={() => setShowAuth(true)}>
              <ThemedText type="link">Login</ThemedText>
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} color={Colors[scheme].tint} />
      ) : (
        <FlatList
          data={auctions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AuctionCard auction={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
              No auctions yet. Be the first to create one!
            </ThemedText>
          }
        />
      )}

      {/* FAB - Create Auction */}
      <Pressable style={[styles.fab, { backgroundColor: Colors[scheme].tint }]} onPress={handleNewAuction}>
        <ThemedText style={styles.fabText}>+</ThemedText>
      </Pressable>

      {/* Modals */}
      <CreateAuctionModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadAuctions}
      />
      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        onAuth={(u) => setUser(u)}
      />
    </ThemedView>
  );
}

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.6,
  },

  // Card
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  cardTitle: {
    marginBottom: 2,
  },
  cardDesc: {
    opacity: 0.7,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bidCount: {
    fontSize: 13,
    opacity: 0.5,
  },

  // FAB
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#0a7ea4',
  },
  btnCancel: {
    backgroundColor: 'transparent',
  },

  // Role selector
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  roleBtnActive: {
    backgroundColor: '#0a7ea4',
  },
});
