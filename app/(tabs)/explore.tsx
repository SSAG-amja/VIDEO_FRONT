import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ImageBackground, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { fetchSearchData, fetchRecommendData } from '../../api/explore'; 

const MOOD_TAGS = ['#대한민국 인기작', '#전세계 인기작', '#평점 높은 명작', '#도파민 폭발 액션', '#가볍게 웃기 좋은'];

export default function ExploreScreen() {
  const [activeTag, setActiveTag] = useState(MOOD_TAGS[0]); 
  
  // 🔍 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 🔽 정렬 상태에 'rating'(평점순) 추가
  const [sortOrder, setSortOrder] = useState<'latest' | 'likes' | 'rating'>('latest');

  // 🏷️ 태그 기반 추천 관련 상태
  const [defaultMovies, setDefaultMovies] = useState<any[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // 무드 태그 검색
  useEffect(() => {
    const loadRecommendMovies = async () => {
      setIsLoadingTags(true);
      const results = await fetchRecommendData(activeTag);
      
      const moviesWithHeight = results.map((m: any) => ({
        ...m,
        height: Math.floor(Math.random() * (300 - 200 + 1)) + 200 
      }));
      
      setDefaultMovies(moviesWithHeight);
      setIsLoadingTags(false);
    };

    if (searchQuery.trim() === '') {
      loadRecommendMovies();
    }
  }, [activeTag, searchQuery]); 

  // 🔍 검색 디바운스 로직 (sortOrder가 바뀔 때도 재검색)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      const results = await fetchSearchData(searchQuery, sortOrder);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, sortOrder]); 

  const leftDefault = defaultMovies.filter((_, i) => i % 2 === 0);
  const rightDefault = defaultMovies.filter((_, i) => i % 2 !== 0);
  
  const leftSearch = searchResults.filter((_, i) => i % 2 === 0);
  const rightSearch = searchResults.filter((_, i) => i % 2 !== 0);

  const MovieCard = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.cardContainer, { height: item.height || 220 }]} 
      onPress={() => {
        const safeMovieData = {
          id: item.id,
          title: item.title,
          posterPath: item.image?.replace('https://image.tmdb.org/t/p/w500', '') || '',
          rating: item.rating,
          overview: "상세 정보를 불러오는 중입니다...", 
          info: "탐색을 통해 진입했습니다.",
          tags: [], cast: []
        };
        router.push({ pathname: "/detail/[id]", params: { id: item.id, movieData: JSON.stringify(safeMovieData) } });
      }}
    >
      <ImageBackground source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover">
        {item.badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardGradient}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardRating}>★ {item.rating}</Text>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>탐색</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="영화 제목, 배우, 감독 검색..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery} 
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        )}
      </View>

      {searchQuery.trim() !== '' ? (
        <View style={{ flex: 1 }}>
          {/* 🔽 정렬 토글 버튼 UI (평점순 추가) */}
          <View style={styles.sortToggleContainer}>
            <Pressable 
              style={[styles.sortButton, sortOrder === 'latest' && styles.sortButtonActive]} 
              onPress={() => setSortOrder('latest')}
            >
              <Text style={[styles.sortButtonText, sortOrder === 'latest' && styles.sortButtonTextActive]}>최신순</Text>
            </Pressable>
            <Pressable 
              style={[styles.sortButton, sortOrder === 'likes' && styles.sortButtonActive]} 
              onPress={() => setSortOrder('likes')}
            >
              <Text style={[styles.sortButtonText, sortOrder === 'likes' && styles.sortButtonTextActive]}>좋아요순</Text>
            </Pressable>
            <Pressable 
              style={[styles.sortButton, sortOrder === 'rating' && styles.sortButtonActive]} 
              onPress={() => setSortOrder('rating')}
            >
              <Text style={[styles.sortButtonText, sortOrder === 'rating' && styles.sortButtonTextActive]}>평점순</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
            {isSearching ? (
              <ActivityIndicator size="large" color="#FF5A36" style={{ marginTop: 50 }} />
            ) : searchResults.length > 0 ? (
              <View style={styles.masonryContainer}>
                <View style={styles.column}>{leftSearch.map((m) => <MovieCard key={m.id} item={m} />)}</View>
                <View style={styles.column}>{rightSearch.map((m) => <MovieCard key={m.id} item={m} />)}</View>
              </View>
            ) : (
              <Text style={styles.noResultText}>검색 결과가 없습니다.</Text>
            )}
          </ScrollView>
        </View>
      ) : (
        <>
          <View style={styles.tagWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
              {MOOD_TAGS.map((tag) => (
                <Pressable key={tag} onPress={() => setActiveTag(tag)} style={[styles.tag, activeTag === tag && styles.activeTag]}>
                  <Text style={[styles.tagText, activeTag === tag && styles.activeTagText]}>{tag}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
            {isLoadingTags ? (
              <ActivityIndicator size="large" color="#FF5A36" style={{ marginTop: 50 }} />
            ) : (
              <View style={styles.masonryContainer}>
                <View style={styles.column}>{leftDefault.map((m) => <MovieCard key={m.id} item={m} />)}</View>
                <View style={styles.column}>{rightDefault.map((m) => <MovieCard key={m.id} item={m} />)}</View>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 25, marginHorizontal: 20, paddingHorizontal: 15, height: 50, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  
  // 정렬 버튼 스타일
  sortToggleContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
  sortButton: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#333', backgroundColor: '#1a1a1a' },
  sortButtonActive: { borderColor: '#FF5A36', backgroundColor: 'rgba(255, 90, 54, 0.1)' },
  sortButtonText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  sortButtonTextActive: { color: '#FF5A36', fontWeight: 'bold' },

  tagWrapper: { height: 40, marginBottom: 20 },
  tagScroll: { paddingHorizontal: 20, gap: 10 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', justifyContent: 'center' },
  activeTag: { backgroundColor: '#FF5A36', borderColor: '#FF5A36' },
  tagText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  activeTagText: { color: '#111', fontWeight: 'bold' },
  gridScroll: { paddingHorizontal: 20, paddingBottom: 100 },
  masonryContainer: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 12 },
  cardContainer: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#222' },
  cardImage: { flex: 1, justifyContent: 'flex-end' },
  cardGradient: { padding: 12, paddingTop: 30 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  cardRating: { color: '#aaa', fontSize: 12 },
  noResultText: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 16 },
  badgeContainer: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255, 90, 54, 0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});