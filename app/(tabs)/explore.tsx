import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ImageBackground, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// 임시 무드 태그 데이터
const MOOD_TAGS = ['#비오는날', '#새벽감성', '#가볍게', '#몰입', '#로맨틱', '#스릴있는'];

// 임시 탐색 영화 데이터 (height 값을 다르게 주어 Masonry 레이아웃 구현)
const EXPLORE_MOVIES = [
  { id: '1', title: '라라랜드', rating: '8.4', height: 260, image: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' },
  { id: '2', title: '올드보이', rating: '8.4', height: 200, image: 'https://image.tmdb.org/t/p/w500/pT1xYy2y2mO5yHmbR11iZ890KzE.jpg' },
  { id: '3', title: '하울의 움직이는 성', rating: '8.3', height: 220, image: 'https://image.tmdb.org/t/p/w500/xK2EBng0D0S8F5I3zYyq1mPqLza.jpg' },
  { id: '4', title: '인터스텔라', rating: '8.6', height: 280, image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
];

export default function ExploreScreen() {
  const [activeTag, setActiveTag] = useState('#비오는날');

  // Masonry 레이아웃을 위해 데이터를 홀수/짝수 인덱스(왼쪽/오른쪽 컬럼)로 나눕니다.
  const leftColumn = EXPLORE_MOVIES.filter((_, index) => index % 2 === 0);
  const rightColumn = EXPLORE_MOVIES.filter((_, index) => index % 2 !== 0);

  // 개별 영화 카드 컴포넌트
  const MovieCard = ({ item }: { item: typeof EXPLORE_MOVIES[0] }) => (
    <View style={[styles.cardContainer, { height: item.height }]}>
      <ImageBackground source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover">
        {/* 텍스트 가독성을 위한 하단 그라데이션 */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        >
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardRating}>★ {item.rating}</Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 1. 상단 타이틀 */}
      <Text style={styles.headerTitle}>탐색</Text>

      {/* 2. 검색 바 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="영화 제목, 배우, 감독 검색..."
          placeholderTextColor="#666"
        />
      </View>

      {/* 3. 가로 스크롤 무드 태그 */}
      <View style={styles.tagWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
          {MOOD_TAGS.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <Pressable 
                key={tag} 
                onPress={() => setActiveTag(tag)}
                style={[styles.tag, isActive && styles.activeTag]}
              >
                <Text style={[styles.tagText, isActive && styles.activeTagText]}>{tag}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Masonry 그리드 영화 목록 */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
        <View style={styles.masonryContainer}>
          {/* 왼쪽 컬럼 */}
          <View style={styles.column}>
            {leftColumn.map((movie) => (
              <MovieCard key={movie.id} item={movie} />
            ))}
          </View>
          
          {/* 오른쪽 컬럼 */}
          <View style={styles.column}>
            {rightColumn.map((movie) => (
              <MovieCard key={movie.id} item={movie} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 },
  
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 20 },
  
  // 검색 바 스타일
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 25,
    marginHorizontal: 20, paddingHorizontal: 15, height: 50, marginBottom: 20,
    borderWidth: 1, borderColor: '#333'
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },

  // 태그 스타일
  tagWrapper: { height: 40, marginBottom: 20 }, // 스크롤 영역 높이 고정
  tagScroll: { paddingHorizontal: 20, gap: 10 },
  tag: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333',
    justifyContent: 'center'
  },
  activeTag: { backgroundColor: '#FF5A36', borderColor: '#FF5A36' },
  tagText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  activeTagText: { color: '#111', fontWeight: 'bold' },

  // Masonry 그리드 스타일
  gridScroll: { paddingHorizontal: 20, paddingBottom: 100 },
  masonryContainer: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 12 }, // 두 컬럼이 화면을 반씩 나눠 가짐
  
  // 개별 카드 스타일
  cardContainer: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#222' },
  cardImage: { flex: 1, justifyContent: 'flex-end' },
  cardGradient: { padding: 12, paddingTop: 30 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  cardRating: { color: '#aaa', fontSize: 12 },
});