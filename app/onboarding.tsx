import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from "../constants/api";

// 🔑 TMDB 다이렉트 호출용 API 키 (여기에 실제 키를 넣어주세요!)
const TMDB_API_KEY = "e7d44a8532cecb92b04d5e976449f337"; 

const OTTS = [
  { id: 1, name: '넷플릭스' }, { id: 2, name: '왓챠' }, { id: 3, name: '티빙' }, 
  { id: 4, name: '웨이브' }, { id: 5, name: '디즈니+' }, { id: 6, name: '쿠팡플레이' }, 
  { id: 7, name: '애플TV+' }
];

// ✅ TMDB 공식 ID 기준으로 깔끔하게 업데이트된 장르
const GENRES = [
  { id: 28, name: '액션' }, { id: 12, name: '모험' }, { id: 16, name: '애니메이션' }, 
  { id: 35, name: '코미디' }, { id: 80, name: '범죄' }, { id: 99, name: '다큐멘터리' },
  { id: 18, name: '드라마' }, { id: 10751, name: '가족' }, { id: 14, name: '판타지' }, 
  { id: 36, name: '역사' }, { id: 27, name: '공포' }, { id: 10402, name: '음악' },
  { id: 9648, name: '미스터리' }, { id: 10749, name: '로맨스' }, { id: 878, name: 'SF' }, 
  { id: 10770, name: 'TV 영화' }, { id: 53, name: '스릴러' }, { id: 10752, name: '전쟁' },
  { id: 37, name: '서부' }
];

export default function OnboardingScreen() {
  const [step, setStep] = useState<number>(1);
  const [selectedOtts, setSelectedOtts] = useState<number[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);

  const [movies, setMovies] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [isFetchingMovies, setIsFetchingMovies] = useState(false); 
  const [isLoadingMore, setIsLoadingMore] = useState(false);     
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const toggleItem = (itemId: number, selectedList: number[], setSelectedList: any) => {
    if (selectedList.includes(itemId)) {
      setSelectedList(selectedList.filter((id) => id !== itemId));
    } else {
      setSelectedList([...selectedList, itemId]);
    }
  };

  // TMDB API 직접 호출 함수
  const fetchFromTMDB = async (genreIds: number[], pageNum: number) => {
    try {
      const genreString = genreIds.join(',');
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=ko-KR&sort_by=vote_average.desc&vote_count.gte=100&with_genres=${genreString}&page=${pageNum}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.results) return [];

      return data.results.map((item: any) => ({
        id: item.id,
        title: item.title,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image',
      }));
    } catch (err) {
      console.error("TMDB 호출 에러:", err);
      return [];
    }
  };

  const loadMovies = async (targetPage: number, isInitial: boolean = false) => {
    if (selectedGenres.length === 0) return;

    if (isInitial) {
      setIsFetchingMovies(true);
      setPage(1);
    } else {
      if (isLoadingMore) return;
      setIsLoadingMore(true);
    }

    try {
      const newMovies = await fetchFromTMDB(selectedGenres, targetPage);

      if (newMovies && newMovies.length > 0) {
        setMovies(prev => {
          if (isInitial) return newMovies;
          
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMovies = newMovies.filter((m: any) => !existingIds.has(m.id));
          return [...prev, ...uniqueNewMovies];
        });
        setPage(targetPage);
      }
    } catch (error) {
      console.error("영화 로드 실패:", error);
    } finally {
      setIsFetchingMovies(false);
      setIsLoadingMore(false);
      if (isInitial) setStep(3);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (selectedGenres.length === 0) {
        Alert.alert('알림', '최소 1개 이상의 장르를 선택해주세요.');
        return;
      }
      loadMovies(1, true);
    } else {
      submitOnboardingData();
    }
  };

  // ✅ 이전 단계로 돌아가는 함수 추가
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && !isFetchingMovies && movies.length > 0) {
      loadMovies(page + 1);
    }
  };

  const submitOnboardingData = async () => {
    if (selectedOtts.length === 0 || selectedGenres.length === 0 || selectedMovies.length === 0) {
      Alert.alert('알림', '모든 항목을 최소 1개 이상 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    // API 주석 처리 중 (프론트 통과 임시 로직)
    setTimeout(() => {
      setIsSubmitting(false);
      router.replace('/(tabs)'); 
    }, 500);
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return '현재 구독 중인\nOTT를 선택해주세요';
      case 2: return '좋아하는 장르를\n선택해주세요';
      case 3: return '취향에 맞는\n인생 영화를 골라주세요';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* ✅ 이전 버튼이 추가된 헤더 상단 영역 */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.stepText}>STEP {step}/3</Text>
          {step > 1 && (
            <Pressable onPress={handleBack} style={styles.prevButton}>
              <Feather name="chevron-left" size={16} color="#aaa" />
              <Text style={styles.prevButtonText}>이전 단계</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.title}>{getStepTitle()}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.contentArea}>
        {isFetchingMovies ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#FF5A36" />
            <Text style={styles.loadingText}>선택하신 장르의 명작을 찾는 중...</Text>
          </View>
        ) : (
          <>
            {step === 1 && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.tagContainer}>
                  {OTTS.map((ott) => {
                    const isSelected = selectedOtts.includes(ott.id);
                    return (
                      <Pressable key={ott.id} onPress={() => toggleItem(ott.id, selectedOtts, setSelectedOtts)} style={[styles.genreTag, isSelected && styles.genreTagSelected]}>
                        {isSelected && <Feather name="check" size={16} color="#111" style={styles.checkIcon} />}
                        <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>{ott.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {step === 2 && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.tagContainer}>
                  {GENRES.map((genre) => {
                    const isSelected = selectedGenres.includes(genre.id);
                    return (
                      <Pressable key={genre.id} onPress={() => toggleItem(genre.id, selectedGenres, setSelectedGenres)} style={[styles.genreTag, isSelected && styles.genreTagSelected]}>
                        {isSelected && <Feather name="check" size={16} color="#111" style={styles.checkIcon} />}
                        <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>{genre.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {step === 3 && (
              <FlatList
                data={movies}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                numColumns={3}
                columnWrapperStyle={styles.movieRow}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#FF5A36" style={{ marginVertical: 20 }} /> : null}
                renderItem={({ item }) => {
                  const isSelected = selectedMovies.includes(item.id);
                  return (
                    <Pressable style={styles.movieCard} onPress={() => toggleItem(item.id, selectedMovies, setSelectedMovies)}>
                      <ImageBackground source={{ uri: item.image }} style={styles.movieImage} imageStyle={{ borderRadius: 8, opacity: isSelected ? 0.4 : 1 }}>
                        {isSelected && (
                          <View style={styles.movieSelectedOverlay}>
                            <Feather name="check-circle" size={32} color="#FF5A36" />
                          </View>
                        )}
                        <View style={styles.movieTitleOverlay}>
                          <Text style={styles.movieTitleText} numberOfLines={1}>{item.title}</Text>
                        </View>
                      </ImageBackground>
                    </Pressable>
                  );
                }}
              />
            )}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.nextButton, (isSubmitting || isFetchingMovies) && { opacity: 0.7 }]} 
          onPress={handleNext} 
          disabled={isSubmitting || isFetchingMovies}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.nextButtonText}>{step === 3 ? '시작하기' : '다음 단계로'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  contentArea: { flex: 1 }, 
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  flatListContent: { paddingHorizontal: 15, paddingBottom: 100 },
  header: { paddingHorizontal: 20, marginTop: 60, marginBottom: 20 },
  
  // ✅ 헤더 및 이전 버튼 스타일 추가
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stepText: { color: '#FF5A36', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  prevButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  prevButtonText: { color: '#aaa', fontSize: 12, marginLeft: 4, fontWeight: '600' },
  
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', lineHeight: 36, marginBottom: 20 },
  progressBarContainer: { height: 4, borderRadius: 2, backgroundColor: '#333', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FF5A36' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 25, borderWidth: 1, borderColor: '#333' },
  genreTagSelected: { backgroundColor: '#FF5A36', borderColor: '#FF5A36' },
  checkIcon: { marginRight: 6 },
  genreText: { color: '#aaa', fontSize: 16 },
  genreTextSelected: { color: '#111', fontWeight: 'bold' },
  movieRow: { gap: 10, marginBottom: 10 },
  movieCard: { flex: 1, aspectRatio: 2/3, maxWidth: '32%' }, 
  movieImage: { flex: 1, justifyContent: 'flex-end' },
  movieTitleOverlay: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 6, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  movieTitleText: { color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  movieSelectedOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  nextButton: { backgroundColor: '#FF5A36', paddingVertical: 18, borderRadius: 30, alignItems: 'center' },
  nextButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 15, fontSize: 14, fontWeight: '600' }
});