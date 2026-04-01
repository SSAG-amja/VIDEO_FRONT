import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylistStore } from '../../store/usePlaylistStore';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // 💡 수정 1: id를 문자열로 변환하여 안전하게 비교 (플리커 해결)
  const playlist = usePlaylistStore(state => 
    state.customPlaylists.find(p => p.id.toString() === id)
  );

  if (!playlist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>재생목록을 찾을 수 없습니다.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const renderMovieItem = ({ item }: { item: any }) => (
    <Pressable 
      style={styles.movieCard}
      // 💡 수정 3: 라우터 파라미터에 'id' 명시적 추가
      onPress={() => router.push({ 
        pathname: '/detail/[id]', 
        params: { id: item.id, movieData: JSON.stringify(item) } 
      } as any)}
    >
      <Image source={{ uri: item.image }} style={styles.movieImage} />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{playlist.name}</Text>
        <View style={{ width: 28 }} /> 
      </View>

      {playlist.movies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>이 재생목록에 저장된 영화가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={playlist.movies}
          // 💡 수정 2: 반드시 문자열을 반환하도록 처리 (하단 에러 해결)
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovieItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  headerBackButton: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  errorText: { color: '#aaa', fontSize: 16, marginBottom: 20 },
  backButton: { padding: 12, backgroundColor: '#333', borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  movieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#222', marginBottom: 15 },
  movieImage: { width: 60, height: 85, borderRadius: 10, backgroundColor: '#333' },
  movieInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
});