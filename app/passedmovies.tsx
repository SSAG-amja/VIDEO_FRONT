import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // 💡 변경된 임포트
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePassedStore } from '../store/usePassedStore';

export default function HiddenMoviesScreen() {
  const { passedMovies, unpassMovie } = usePassedStore();

  const handleUnpass = (id: number, title: string) => {
    Alert.alert(
      "숨김 해제",
      `'${title}'의 숨김 처리를 해제하시겠습니까?\n해제된 영화는 다시 추천 목록에 나타날 수 있습니다.`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: "해제", 
          onPress: () => unpassMovie(id),
          style: "default"
        }
      ]
    );
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
        <View style={{ width: 40 }} /> {/* 좌우 밸런스를 위한 빈 뷰 */}
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