import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { getErrorMessage, uploadProfilePicture, UserProfile } from '@/services/api';

// ─── Crop Modal (web — expo-image-picker editing is broken) ─

function CropModal({
  visible,
  imageUri,
  onDone,
  onCancel,
  scheme,
}: {
  visible: boolean;
  imageUri: string;
  onDone: (croppedUri: string) => void;
  onCancel: () => void;
  scheme: 'light' | 'dark';
}) {
  const VIEWPORT = 260;
  const OUTPUT = 400;

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!imageUri || !visible) return;
    setPos({ x: 0, y: 0 });
    setZoom(1);
    const img = new window.Image();
    img.onload = () => setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUri;
  }, [imageUri, visible]);

  const displayW = useMemo(() => {
    if (!imgDims.w || !imgDims.h) return VIEWPORT;
    const aspect = imgDims.w / imgDims.h;
    return aspect >= 1 ? VIEWPORT * aspect * zoom : VIEWPORT * zoom;
  }, [imgDims, zoom]);

  const displayH = useMemo(() => {
    if (!imgDims.w || !imgDims.h) return VIEWPORT;
    const aspect = imgDims.w / imgDims.h;
    return aspect >= 1 ? VIEWPORT * zoom : (VIEWPORT / aspect) * zoom;
  }, [imgDims, zoom]);

  const handleCrop = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d')!;

    const img = new window.Image();
    img.src = imageUri;
    await new Promise<void>((r) => { img.onload = () => r(); });

    const pixelScale = img.naturalWidth / displayW;
    const srcX = ((displayW - VIEWPORT) / 2 - pos.x) * pixelScale;
    const srcY = ((displayH - VIEWPORT) / 2 - pos.y) * pixelScale;
    const srcSize = VIEWPORT * pixelScale;

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
    onDone(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={cropStyles.overlay}>
        <View style={[cropStyles.container, { backgroundColor: Colors[scheme].background }]}>
          <ThemedText type="subtitle" style={{ marginBottom: 16, textAlign: 'center' }}>
            Adjust Photo
          </ThemedText>

          <View
            style={cropStyles.viewportOuter}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              lastPointer.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
            }}
            onResponderMove={(e) => {
              const dx = e.nativeEvent.pageX - lastPointer.current.x;
              const dy = e.nativeEvent.pageY - lastPointer.current.y;
              lastPointer.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
              setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
            }}
            onResponderRelease={() => {}}
          >
            <View pointerEvents="none" style={cropStyles.viewport}>
              {imgDims.w > 0 && (
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: displayW,
                    height: displayH,
                    position: 'absolute',
                    left: (VIEWPORT - displayW) / 2 + pos.x,
                    top: (VIEWPORT - displayH) / 2 + pos.y,
                  }}
                  contentFit="fill"
                />
              )}
            </View>
          </View>

          <View style={cropStyles.zoomRow}>
            <Pressable onPress={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(1)))} style={cropStyles.zoomBtn}>
              <ThemedText style={cropStyles.zoomBtnText}>−</ThemedText>
            </Pressable>
            <ThemedText style={{ minWidth: 50, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </ThemedText>
            <Pressable onPress={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(1)))} style={cropStyles.zoomBtn}>
              <ThemedText style={cropStyles.zoomBtnText}>+</ThemedText>
            </Pressable>
          </View>

          <View style={cropStyles.btnRow}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onCancel}>
              <ThemedText type="defaultSemiBold">Cancel</ThemedText>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleCrop}>
              <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Done</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Profile Avatar ─────────────────────────────────────────

interface Props {
  user: UserProfile;
  onUpdated: (u: UserProfile) => void;
  scheme: 'light' | 'dark';
}

export function ProfileAvatar({ user, onUpdated, scheme }: Props) {
  const [uploading, setUploading] = useState(false);
  const [cropUri, setCropUri] = useState<string | null>(null);

  const doUpload = async (uri: string) => {
    setUploading(true);
    try {
      onUpdated(await uploadProfilePicture(uri));
    } catch (e: any) {
      Alert.alert('Error', getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled || !result.assets[0]) return;
      setCropUri(result.assets[0].uri);
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;
      await doUpload(result.assets[0].uri);
    }
  };

  return (
    <>
      <Pressable onPress={pickImage} style={styles.wrapper}>
        {user.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: Colors[scheme].tint }]}>
            <ThemedText style={styles.placeholderText}>
              {user.email.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
        {uploading ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>✎</ThemedText>
          </View>
        )}
      </Pressable>
      {Platform.OS === 'web' && (
        <CropModal
          visible={!!cropUri}
          imageUri={cropUri || ''}
          onDone={(croppedUri) => { setCropUri(null); doUpload(croppedUri); }}
          onCancel={() => setCropUri(null)}
          scheme={scheme}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', marginBottom: 12 },
  image: { width: 80, height: 80, borderRadius: 40 },
  placeholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  overlay: {
    position: 'absolute', top: 0, left: 0, width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  badge: {
    position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#ea7a1f', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#ea7a1f' },
  btnCancel: { backgroundColor: 'transparent' },
});

const cropStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { borderRadius: 16, padding: 24, alignItems: 'center', width: 320 },
  viewportOuter: { width: 260, height: 260, borderRadius: 130, backgroundColor: '#000' },
  viewport: { width: 260, height: 260, borderRadius: 130, overflow: 'hidden' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16, marginBottom: 16 },
  zoomBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ea7a1f', justifyContent: 'center', alignItems: 'center' },
  zoomBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: 12 },
});
