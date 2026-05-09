import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // 💡 변경된 임포트
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { getUserOttsApi, updateUserOttsApi } from '../api/user';

const OTTS = [
  { id: 8, name: '넷플릭스' }, { id: 337, name: '디즈니 플러스' }, { id: 1883, name: '티빙' },
  { id: 356, name: '웨이브' }, { id: 97, name: '왓챠' }, { id: 350, name: '애플 TV' },
  { id: 119, name: '아마존 프라임 비디오' }, { id: 3, name: '구글 플레이 무비' }, { id: 283, name: '크런치롤' }
];

export default function EditOttScreen() {
  const router = useRouter();
  const subtitle = '현재 구독 중인 OTT를\n모두 선택해주세요';
  
  const [selectedOtts, setSelectedOtts] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 화면 진입 시 기존 OTT 정보 불러오기
  useEffect(() => {
    const fetchOtts = async () => {
      try {
        const response: any = await getUserOttsApi();
        if (response && response.data) {
          setSelectedOtts(response.data);
        }
      } catch (error) {
        console.error('OTT 정보 로드 실패:', error);
        Alert.alert('오류', '구독 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOtts();
  }, []);

  const toggleItem = (itemId: number) => {
    if (selectedOtts.includes(itemId)) {
      setSelectedOtts(selectedOtts.filter((id) => id !== itemId));
    } else {
      setSelectedOtts([...selectedOtts, itemId]);
    }
  };

  const handleUpdate = async () => {
    if (selectedOtts.length === 0) {
      Alert.alert('알림', '최소 1개 이상의 OTT를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserOttsApi(selectedOtts);
      Alert.alert('성공', '구독 정보가 수정되었습니다.');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '정보 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color="#FF5A36" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>구독 OTT 수정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subTitle}>{subtitle}</Text>
        
        <View style={styles.tagContainer}>
          {OTTS.map((ott) => {
            const isSelected = selectedOtts.includes(ott.id);
            return (
              <Pressable 
                key={ott.id} 
                onPress={() => toggleItem(ott.id)} 
                style={[styles.genreTag, isSelected ? styles.genreTagSelected : null]}
              >
                {isSelected && <Feather name="check" size={16} color="#111" style={styles.checkIcon} />}
                <Text style={[styles.genreText, isSelected ? styles.genreTextSelected : null]}>{ott.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.nextButton, isSubmitting ? styles.buttonDisabled : null]} 
          onPress={handleUpdate} 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.nextButtonText}>수정 완료</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centerAll: { justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { width: 32 },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 100 },
  subTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', lineHeight: 34, marginBottom: 30 },
  
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1a1a1a', 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: '#333' 
  },
  genreTagSelected: { backgroundColor: '#FF5A36', borderColor: '#FF5A36' },
  checkIcon: { marginRight: 6 },
  genreText: { color: '#aaa', fontSize: 16 },
  genreTextSelected: { color: '#111', fontWeight: 'bold' },
  
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 20, 
    paddingBottom: 40, 
    backgroundColor: '#0a0a0a', 
    borderTopWidth: 1, 
    borderTopColor: '#1a1a1a' 
  },
  nextButton: { backgroundColor: '#FF5A36', paddingVertical: 18, borderRadius: 30, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  nextButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});
