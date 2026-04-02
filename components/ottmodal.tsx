// components/ottmodal.tsx
//260401 임재준
//상세정보에 삽입 하여 사용하지 않으나 추후 재사용을 위해 남겨둠
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_OTTS = [
  { id: 'netflix', name: '넷플릭스', color: '#E50914', scheme: 'nflx://' },
  { id: 'watcha', name: '왓챠', color: '#FF0558', scheme: 'watcha://' },
  { id: 'tving', name: '티빙', color: '#FF153C', scheme: 'tving://' },
  { id: 'disney', name: '디즈니+', color: '#113CCF', scheme: 'disneyplus://' },
];

interface OttModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function OttModal({ visible, onClose }: OttModalProps) {
  const handleOpenOtt = async (ott: typeof DUMMY_OTTS[0]) => {
    onClose();
    try {
      const supported = await Linking.canOpenURL(ott.scheme);
      if (supported) {
        await Linking.openURL(ott.scheme);
      } else {
        Alert.alert(`${ott.name} 앱 실행`, `기기에 ${ott.name} 앱이 설치되어 있지 않습니다.`);
      }
    } catch (error) {
      Alert.alert('실행 오류', '앱을 열 수 없습니다.');
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>바로 시청하기</Text>
          <Text style={styles.sheetSubtitle}>이 영화를 제공하는 구독 중인 서비스를 선택하세요.</Text>
          
          <View style={styles.ottList}>
            {DUMMY_OTTS.map((ott) => (
              <Pressable key={ott.id} style={[styles.ottItem, { borderColor: ott.color }]} onPress={() => handleOpenOtt(ott)}>
                <Text style={[styles.ottName, { color: ott.color }]}>{ott.name}</Text>
                <Ionicons name="play-circle" size={24} color={ott.color} />
              </Pressable>
            ))}
          </View>
          
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  sheetSubtitle: { color: '#aaa', fontSize: 14, marginBottom: 24, textAlign: 'center' },
  ottList: { gap: 12, marginBottom: 24 },
  ottItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 16, borderRadius: 12, borderWidth: 1 },
  ottName: { fontSize: 16, fontWeight: 'bold' },
  closeButton: { backgroundColor: '#333', padding: 16, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});