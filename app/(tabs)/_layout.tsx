import { AuthModal } from '@/components/auth-modal';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { AuctionSearchProvider, useAuctionSearch } from '@/hooks/auction-search';
import { useCart } from '@/hooks/cart';
import { useThemeMode } from '@/hooks/theme-mode';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Slot, usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

export default function TabLayout() {
  return (
    <AuctionSearchProvider>
      <TabsShell />
    </AuctionSearchProvider>
  );
}

function TabsShell() {
  const scheme = useColorScheme() ?? 'light';
  const { themeMode, setThemeMode } = useThemeMode();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { itemCount } = useCart();
  const { searchInput, setSearchInput, applySearch, clearSearch } = useAuctionSearch();
  const [showAuth, setShowAuth] = useState(false);
  const shellWidth = Math.min(Math.max(width - 24, 320), 1200);
  const compactNav = shellWidth < 1080;
  const crampedNav = shellWidth < 860;

  const toggleThemeMode = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const isOnProfile = pathname?.includes('/profile');
  const isOnCart = pathname?.includes('/cart');

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.topBar,
          {
            borderBottomColor: Colors[scheme].icon,
            backgroundColor: Colors[scheme].surface,
            left: 0,
            right: 0,
          },
        ]}>
        <View
          style={[
            styles.topBarInner,
            {
              width: shellWidth,
              paddingHorizontal: compactNav ? 12 : 20,
            },
          ]}>
          <View
            style={[
              styles.leftSection,
              {
                width: crampedNav ? 132 : compactNav ? 160 : 220,
              },
            ]}>
            <Pressable
              onPress={() => {
                clearSearch();
                router.replace('/(tabs)');
              }}>
              <ThemedText style={styles.brand}>Auction</ThemedText>
            </Pressable>
          </View>

          <View
            style={[
              styles.centerSection,
              {
                maxWidth: crampedNav ? 360 : compactNav ? 440 : 560,
              },
            ]}>
            <View style={[styles.searchRow, { gap: crampedNav ? 4 : 8 }]}> 
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: Colors[scheme].text,
                    borderColor: Colors[scheme].icon,
                    backgroundColor: Colors[scheme].background,
                  },
                ]}
                placeholder="Search auctions"
                placeholderTextColor={Colors[scheme].icon}
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={applySearch}
                returnKeyType="search"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.searchBtn,
                  {
                    opacity: pressed ? 0.85 : 1,
                    paddingHorizontal: crampedNav ? 10 : 14,
                  },
                ]}
                onPress={applySearch}>
                <ThemedText style={styles.searchBtnText}>{crampedNav ? 'Go' : 'Search'}</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={[styles.rightSection, { gap: crampedNav ? 4 : 8 }]}> 
            <Pressable
              style={[
                styles.navButton,
                {
                  gap: crampedNav ? 0 : 6,
                  paddingHorizontal: crampedNav ? 4 : compactNav ? 6 : 8,
                },
              ]}
              onPress={() => router.replace('/(tabs)/cart')}>
              <View style={styles.cartIconWrap}>
                <IconSymbol
                  size={22}
                  name="cart.fill"
                  color={isOnCart ? Colors[scheme].tint : Colors[scheme].tabIconDefault}
                />
                {itemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <ThemedText style={styles.cartBadgeText}>{itemCount > 99 ? '99+' : itemCount}</ThemedText>
                  </View>
                )}
              </View>
              {!crampedNav && (
                <ThemedText
                  numberOfLines={1}
                  style={[
                    styles.navLabel,
                    { color: isOnCart ? Colors[scheme].tint : Colors[scheme].tabIconDefault },
                  ]}>
                  Basket
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.navButton,
                {
                  gap: crampedNav ? 0 : 6,
                  paddingHorizontal: crampedNav ? 4 : compactNav ? 6 : 8,
                },
              ]}
              onPress={() => {
                if (!user) {
                  setShowAuth(true);
                  return;
                }
                router.replace('/(tabs)/profile');
              }}>
              <IconSymbol
                size={22}
                name={user ? 'person.fill' : 'rectangle.portrait.and.arrow.right'}
                color={isOnProfile ? Colors[scheme].tint : Colors[scheme].tabIconDefault}
              />
              {!crampedNav && (
                <ThemedText
                  numberOfLines={1}
                  style={[
                    styles.navLabel,
                    { color: isOnProfile ? Colors[scheme].tint : Colors[scheme].tabIconDefault },
                  ]}>
                  {user ? 'Profile' : 'Sign in'}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={toggleThemeMode}
              style={[
                styles.themeNavBtn,
                {
                  borderColor: Colors[scheme].icon,
                  backgroundColor: Colors[scheme].surface,
                  width: compactNav ? 34 : 38,
                  height: compactNav ? 34 : 38,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Toggle theme mode"
            >
              <IconSymbol
                size={18}
                name={themeMode === 'light' ? 'moon.fill' : 'sun.max.fill'}
                color={Colors[scheme].tint}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <Slot />

      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} onAuth={setUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 0,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'space-between',
    height: '100%',
    gap: 8,
  },
  leftSection: {
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 8,
    flexShrink: 0,
  },
  brand: {
    color: '#ea7a1f',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 30,
    minWidth: 98,
  },
  searchRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  searchBtn: {
    borderRadius: 3,
    backgroundColor: '#ea7a1f',
    paddingHorizontal: 14,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  cartIconWrap: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -7,
    right: -11,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ea7a1f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '700',
  },
  themeNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
