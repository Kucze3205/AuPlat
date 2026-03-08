import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google.js';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Toast } from '@/components/toast';
import { auth } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getErrorMessage, login, register, syncGoogleProfile, UserProfile } from '@/services/api';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

interface Props {
  visible: boolean;
  onClose: () => void;
  onAuth: (user: UserProfile) => void;
}

export function AuthModal({ visible, onClose, onAuth }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('seller');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

  const requiredClientEnv = Platform.select({
    web: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    android: 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    ios: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    default: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  });
  const platformClientId = Platform.select({
    web: googleWebClientId,
    android: googleAndroidClientId,
    ios: googleIosClientId,
    default: googleWebClientId,
  });
  const isGoogleConfigured = !!platformClientId;
  const redirectUri = makeRedirectUri({
    scheme: 'auctionplat',
    path: 'oauthredirect',
  });

  const [request, _response, promptAsync] = Google.useAuthRequest({
    // expo-auth-session throws if current platform client id is undefined.
    // Provide placeholders to keep the screen render-safe when env vars are missing.
    webClientId: googleWebClientId || 'missing-web-client-id',
    androidClientId: googleAndroidClientId || 'missing-android-client-id',
    iosClientId: googleIosClientId || 'missing-ios-client-id',
    responseType: 'token',
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  const handleSubmit = async () => {
    if (!email || !password) {
      setToastMsg('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const profile = isRegister
        ? await register({ email, password, role })
        : await login({ email, password });
      onAuth(profile);
      onClose();
    } catch (e: any) {
      setToastMsg(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setToastMsg(null);

      if (!isGoogleConfigured) {
        setToastMsg(`Google login is not configured. Set ${requiredClientEnv} and restart Expo.`);
        return;
      }

      setGoogleLoading(true);

      const result = await promptAsync();
      if (result.type !== 'success') {
        return;
      }

      const idToken = result.authentication?.idToken ?? result.params?.id_token;
      const accessToken = result.authentication?.accessToken ?? result.params?.access_token;
      if (!idToken && !accessToken) {
        throw new Error('Google login failed: missing OAuth token.');
      }

      const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
      await signInWithCredential(auth, credential);

      const profile = await syncGoogleProfile(isRegister ? role : undefined);
      onAuth(profile);
      onClose();
    } catch (e: any) {
      setToastMsg(getErrorMessage(e));
    } finally {
      setGoogleLoading(false);
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
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: Colors[scheme].background }]}>
          <ThemedText type="title" style={styles.title}>
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

          <View style={styles.buttons}>
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

          <Pressable
            style={[
              styles.googleBtn,
              {
                opacity: request && isGoogleConfigured && !loading && !googleLoading ? 1 : 0.6,
                borderColor: Colors[scheme].icon,
              },
            ]}
            disabled={!request || !isGoogleConfigured || loading || googleLoading}
            onPress={handleGoogleLogin}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors[scheme].text} />
            ) : (
              <ThemedText type="defaultSemiBold">Continue with Google</ThemedText>
            )}
          </Pressable>

          <Pressable onPress={() => setIsRegister(!isRegister)} style={{ marginTop: 12 }}>
            <ThemedText type="link">
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </ThemedText>
          </Pressable>
        </View>
      </View>
      <Toast type="error" message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 4,
    padding: 24,
  },
  title: {
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 3,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 3,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#ea7a1f',
  },
  googleBtn: {
    borderWidth: 1,
    borderRadius: 3,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnCancel: {
    backgroundColor: 'transparent',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#ea7a1f',
  },
  roleBtnActive: {
    backgroundColor: '#ea7a1f',
  },
});
