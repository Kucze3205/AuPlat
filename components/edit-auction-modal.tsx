import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Toast } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    Auction,
    getErrorMessage,
    updateAuction,
    uploadAuctionImage,
} from '@/services/api';

interface Props {
  visible: boolean;
  auction: Auction;
  onClose: () => void;
  onUpdated: (auction: Auction) => void;
}

export function EditAuctionModal({ visible, auction, onClose, onUpdated }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const [title, setTitle] = useState(auction.title);
  const [description, setDescription] = useState(auction.description);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync fields when a different auction is opened
  useEffect(() => {
    if (visible) {
      setTitle(auction.title);
      setDescription(auction.description);
      setImageUri(null);
      setToastMsg(null);
    }
  }, [visible, auction.id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      setToastMsg('Title and description are required.');
      return;
    }
    setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        imageUrl = await uploadAuctionImage(imageUri);
      }

      const payload: Record<string, string> = {};
      if (title !== auction.title) payload.title = title;
      if (description !== auction.description) payload.description = description;
      if (imageUrl) payload.imageUrl = imageUrl;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const updated = await updateAuction(auction.id, payload);
      onUpdated(updated);
      onClose();
    } catch (e: any) {
      setToastMsg(getErrorMessage(e));
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

  const currentImage = imageUri ?? auction.imageUrl;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: Colors[scheme].background }]}>
          <ThemedText type="title" style={styles.title}>
            Edit Auction
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

          <Pressable style={[styles.imagePicker, { borderColor: Colors[scheme].icon }]} onPress={pickImage}>
            {currentImage ? (
              <>
                <Image source={{ uri: currentImage }} style={styles.imagePreview} contentFit="contain" />
                <ThemedText style={styles.imageHint}>
                  {imageUri ? 'New image selected' : 'Tap to change image'}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={{ opacity: 0.5 }}>Tap to add image (optional)</ThemedText>
            )}
          </Pressable>
          {imageUri && (
            <Pressable onPress={() => setImageUri(null)}>
              <ThemedText type="link" style={{ marginBottom: 8 }}>Revert image</ThemedText>
            </Pressable>
          )}

          <View style={styles.buttons}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <ThemedText type="defaultSemiBold">Cancel</ThemedText>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Save</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      <Toast type="error" message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  content: { borderRadius: 4, padding: 24 },
  title: { marginBottom: 16 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 3, padding: 12, marginBottom: 10, fontSize: 16 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 3, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#ea7a1f' },
  btnCancel: { backgroundColor: 'transparent' },
  imagePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 100,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: 150, borderRadius: 3 },
  imageHint: { fontSize: 11, opacity: 0.4, marginTop: 6, marginBottom: 4 },
});
