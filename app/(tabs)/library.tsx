import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

// 상단 탭 메뉴 목록
const TABS = ['Pinned', 'Watched', '공유 폴더'];

// 임시 보관함 영화 데이터
const PINNED_MOVIES = [
  { id: '1', title: '인터스텔라', time: '2일 전 Pin', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: '2', title: '라라랜드', time: '3일 전 Pin', image: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' },
  { id: '3', title: '하울의 움직이는 성', time: '5일 전 Pin', image: 'https://image.tmdb.org/t/p/w500/xK2EBng0D0S8F5I3zYyq1mPqLza.jpg' },
  { id: '4', title: '올드보이', time: '1주 전 Pin', image: 'https://image.tmdb.org/t/p/w500/pT1xYy2y2mO5yHmbR11iZ890KzE.jpg' },
];

export default function LibraryScreen() {
  // 현재 선택된 탭 상태 관리 (기본값: 'Pinned')
  const [activeTab, setActiveTab] = useState('Pinned');

  return (
    <View style={styles.container}>
      {/* 1. 상단 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>보관함</Text>
        {/* 새 폴더 추가 버튼 */}
        <Pressable style={styles.addButton}>
          <Feather name="plus" size={20} color="#FF5A36" />
        </Pressable>
      </View>

      {/* 2. 탭 전환 버튼 영역 */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 3. 영화 리스트 영역 */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {/* 현재 탭이 'Pinned'일 때만 리스트를 보여줌 */}
        {activeTab === 'Pinned' ? (
          PINNED_MOVIES.map((movie) => (
            <View key={movie.id} style={styles.movieCard}>
              <Image source={{ uri: movie.image }} style={styles.movieImage} />
              
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.movieTime}>{movie.time}</Text>
              </View>

              {/* 폴더 이동 아이콘 (시안의 아이콘과 가장 유사한 아이콘 적용) */}
              <Pressable style={styles.folderIcon}>
                <Ionicons name="folder-open-outline" size={22} color="#FF5A36" />
              </Pressable>
            </View>
          ))
        ) : (
          /* Watched나 공유 폴더 탭을 눌렀을 때 보여줄 임시 화면 */
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{activeTab} 목록이 아직 없습니다.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60, paddingHorizontal: 20 },
  
  // 헤더 스타일
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addButton: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
    justifyContent: 'center', alignItems: 'center' 
  },

  // 탭 버튼 스타일
  tabContainer: { 
    flexDirection: 'row', backgroundColor: '#1a1a1a', 
    borderRadius: 30, padding: 5, marginBottom: 20 
  },
  tabButton: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center' },
  activeTabButton: { backgroundColor: '#FF5A36' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#111', fontWeight: 'bold' },

  // 리스트 영역 스타일
  listContainer: { paddingBottom: 100, gap: 15 },
  
  // 개별 영화 카드 스타일
  movieCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', padding: 10,
    borderRadius: 16, borderWidth: 1, borderColor: '#222'
  },
  movieImage: { width: 60, height: 85, borderRadius: 10, backgroundColor: '#333' },
  movieInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  movieTime: { color: '#888', fontSize: 13 },
  folderIcon: { padding: 10 },

  // 빈 화면 스타일
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 16 }
});