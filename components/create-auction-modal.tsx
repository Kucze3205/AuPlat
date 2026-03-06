import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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
import { createAuction, getErrorMessage, uploadAuctionImage } from '@/services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAuctionModal({ visible, onClose, onCreated }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [durationHours, setDurationHours] = useState('24');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
    if (!title || !description || !startingPrice) {
      setToastMsg('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) imageUrl = await uploadAuctionImage(imageUri);
      await createAuction({
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        durationHours: parseInt(durationHours, 10) || 24,
        imageUrl,
      });
      setTitle('');
      setDescription('');
      setStartingPrice('');
      setDurationHours('24');
      setImageUri(null);
      onCreated();
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: Colors[scheme].background }]}>
          <ThemedText type="title" style={styles.title}>
            New Auction
          </ThemedText>

          <TextInput style={inputStyle} placeholder="Title (min 3 chars)" placeholderTextColor={Colors[scheme].icon} value={title} onChangeText={setTitle} />
          <TextInput style={[...inputStyle, { height: 80, textAlignVertical: 'top' }]} placeholder="Description (min 10 chars)" placeholderTextColor={Colors[scheme].icon} value={description} onChangeText={setDescription} multiline />
          <TextInput style={inputStyle} placeholder="Starting price" placeholderTextColor={Colors[scheme].icon} value={startingPrice} onChangeText={setStartingPrice} keyboardType="decimal-pad" />
          <TextInput style={inputStyle} placeholder="Duration (hours, 1-240)" placeholderTextColor={Colors[scheme].icon} value={durationHours} onChangeText={setDurationHours} keyboardType="number-pad" />

          <Pressable style={[styles.imagePicker, { borderColor: Colors[scheme].icon }]} onPress={pickImage}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="contain" />
                <ThemedText style={styles.imageHint}>Preview (displayed at fixed height)</ThemedText>
              </>
            ) : (
              <ThemedText style={{ opacity: 0.5 }}>Tap to add image (optional)</ThemedText>
            )}
          </Pressable>
          {imageUri && (
            <Pressable onPress={() => setImageUri(null)}>
              <ThemedText type="link" style={{ marginBottom: 8 }}>Remove image</ThemedText>
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
                <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Create</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  content: { borderRadius: 16, padding: 24 },
  title: { marginBottom: 16 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#0a7ea4' },
  btnCancel: { backgroundColor: 'transparent' },
  imagePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 100,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: 150, borderRadius: 8 },
  imageHint: { fontSize: 11, opacity: 0.4, marginTop: 6, marginBottom: 4 },
});
