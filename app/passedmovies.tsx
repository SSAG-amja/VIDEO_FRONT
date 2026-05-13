import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // 💡 변경된 임포트
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePassedStore } from '../store/usePassedStore';
import { clearPassedMoviesApi, deletePassedMovieApi, fetchPassedMoviesApi } from '../api/library';

export default function HiddenMoviesScreen() {
  const { passedMovies, unpassMovie, setPassedMovies, clearPassedMovies } = usePassedStore();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      // 2026.05.13 박현식
      // 관심없음 화면 진입 시 passed 목록을 백엔드 기준으로 동기화한다.
      const syncPassedMovies = async () => {
        try {
          const movies = await fetchPassedMoviesApi();
          if (isActive) {
            setPassedMovies(movies);
          }
        } catch (error) {
          console.error('Passed Load Error:', error);
        }
      };

      syncPassedMovies();

      return () => {
        isActive = false;
      };
    }, [setPassedMovies])
  );

  // 2026.05.13 박현식
  // 숨긴 영화 하나를 passed 목록에서 제거하고 백엔드 삭제 API를 호출한다.
  const handleUnpass = (id: number, title: string) => {
    Alert.alert(
      "숨김 해제",
      `'${title}'의 숨김 처리를 해제하시겠습니까?\n해제된 영화는 다시 추천 목록에 나타날 수 있습니다.`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: "해제", 
          onPress: async () => {
            try {
              await deletePassedMovieApi(id);
              unpassMovie(id);
            } catch (error) {
              console.error('Unpass API Error:', error);
              Alert.alert('해제 실패', '숨김 처리를 해제하지 못했습니다.');
            }
          },
          style: "default"
        }
      ]
    );
  };

  // 2026.05.13 박현식
  // 관심없음 목록 전체 삭제를 백엔드와 전역 상태에 반영한다.
  const handleClearPassed = () => {
    if (passedMovies.length === 0) return;

    Alert.alert('관심없음 전체 삭제', '숨긴 영화를 모두 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '전체 삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearPassedMoviesApi();
            clearPassedMovies();
          } catch (error) {
            console.error('Clear Passed API Error:', error);
            Alert.alert('삭제 실패', '숨긴 영화를 전체 삭제하지 못했습니다.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.movieCard}>
      <Image source={{ uri: item.image }} style={styles.movieImage} />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.passedDate}>
          숨긴 날짜: {new Date(item.passedAt).toLocaleDateString()}
        </Text>
      </View>
      <Pressable 
        style={styles.unpassButton}
        onPress={() => handleUnpass(item.id, item.title)}
      >
        <Ionicons name="refresh-outline" size={20} color="#fff" />
        <Text style={styles.unpassButtonText}>복구</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>숨긴 영화 관리</Text>
        <Pressable
          onPress={handleClearPassed}
          style={[styles.clearButton, passedMovies.length === 0 && styles.clearButtonDisabled]}
          disabled={passedMovies.length === 0}
        >
          <Ionicons name="trash-outline" size={18} color={passedMovies.length === 0 ? "#555" : "#ff6b5a"} />
        </Pressable>
      </View>

      <FlatList
        data={passedMovies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="eye-off-outline" size={60} color="#333" style={{ marginBottom: 15 }} />
            <Text style={styles.emptyText}>숨긴 영화가 없습니다.</Text>
            <Text style={styles.emptySubText}>메인 화면에서 X를 누르거나 넘긴 영화가 이곳에 보관됩니다.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  backButton: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clearButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 69, 58, 0.1)' },
  clearButtonDisabled: { backgroundColor: '#111' },
  
  listContent: { padding: 20 },
  movieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  movieImage: { width: 60, height: 90, borderRadius: 8, backgroundColor: '#333' },
  movieInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  passedDate: { color: '#666', fontSize: 12 },
  
  unpassButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  unpassButtonText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 4 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubText: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
