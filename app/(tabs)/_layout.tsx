import { AuthModal } from '@/components/auth-modal';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { AuctionSearchProvider, useAuctionSearch } from '@/hooks/auction-search';
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
  const { searchInput, setSearchInput, applySearch, clearSearch } = useAuctionSearch();
  const [showAuth, setShowAuth] = useState(false);
  const shellWidth = Math.min(Math.max(width - 24, 320), 1200);
  const shellLeft = Math.max((width - shellWidth) / 2, 0);
  const headerSlot =
    shellWidth >= 1100 ? 700 : shellWidth >= 900 ? 600 : shellWidth >= 700 ? 460 : 280;
  const toggleThemeMode = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };
  const isOnProfile = pathname?.includes('/profile');

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.marketHeader,
          {
            borderBottomColor: Colors[scheme].icon,
            backgroundColor: Colors[scheme].surface,
            left: shellLeft,
            width: headerSlot,
          },
        ]}>
        <Pressable
          onPress={() => {
            clearSearch();
            router.replace('/(tabs)');
          }}>
          <ThemedText style={styles.brand}>Auction</ThemedText>
        </Pressable>
        <View style={styles.searchRow}>
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
            style={({ pressed }) => [styles.searchBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={applySearch}>
            <ThemedText style={styles.searchBtnText}>Search</ThemedText>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.navBar,
          {
            borderBottomColor: Colors[scheme].icon,
            backgroundColor: Colors[scheme].surface,
            left: 0,
            right: 0,
            paddingLeft: shellLeft + headerSlot,
            paddingRight: 58,
          },
        ]}>

        <Pressable
          style={styles.navButton}
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
          <ThemedText
            style={[
              styles.navLabel,
              { color: isOnProfile ? Colors[scheme].tint : Colors[scheme].tabIconDefault },
            ]}>
            {user ? 'Profile' : 'Sign / Login'}
          </ThemedText>
        </Pressable>
      </View>

      <Slot />

      <Pressable
        onPress={toggleThemeMode}
        style={[
          styles.themeNavBtn,
          { borderColor: Colors[scheme].icon, backgroundColor: Colors[scheme].surface },
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

      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} onAuth={setUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  marketHeader: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    color: '#ea7a1f',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 30,
    minWidth: 98,
  },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  navBar: {
    position: 'absolute',
    top: 0,
    height: 56,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
    zIndex: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    maxWidth: 170,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeNavBtn: {
    position: 'absolute',
    top: 9,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
});
