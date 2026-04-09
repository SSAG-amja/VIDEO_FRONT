import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store'; // ✨ SecureStore 임포트 추가

// 방금 만든 api 유틸리티 함수 import (경로는 실제 프로젝트 구조에 맞게 수정해주세요)
import { API_BASE_URL } from "../constants/api";

// --- DB 테이블 기준 데이터 매핑 ---
const OTTS = [
  { id: 1, name: '넷플릭스' }, { id: 2, name: '왓챠' }, { id: 3, name: '티빙' }, 
  { id: 4, name: '웨이브' }, { id: 5, name: '디즈니+' }, { id: 6, name: '쿠팡플레이' }, 
  { id: 7, name: '애플TV+' }
];

const GENRES = [
  { id: 1, name: '액션' }, { id: 2, name: '어드벤처' }, { id: 3, name: '애니메이션' }, 
  { id: 4, name: '코미디' }, { id: 5, name: '범죄' }, { id: 6, name: '다큐멘터리' },
  { id: 7, name: '드라마' }, { id: 8, name: '가족' }, { id: 9, name: '판타지' }, 
  { id: 10, name: '역사' }, { id: 11, name: '호러' }, { id: 12, name: '음악' },
  { id: 13, name: '미스터리' }, { id: 14, name: '로맨스' }, { id: 15, name: 'SF' }, 
  { id: 16, name: 'TV 영화' }, { id: 17, name: '스릴러' }, { id: 18, name: '전쟁' },
  { id: 19, name: '서부' }
];

const INITIAL_MOVIES = [
  { id: 1, title: '인터스텔라', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: 2, title: '라라랜드', image: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' },
  { id: 3, title: '올드보이', image: 'https://image.tmdb.org/t/p/w500/pT1xYy2y2mO5yHmbR11iZ890KzE.jpg' },
  { id: 4, title: '다크 나이트', image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
  { id: 5, title: '인셉션', image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg' },
  { id: 6, title: '매트릭스', image: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' },
  { id: 7, title: '어벤져스', image: 'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmja8y.jpg' },
  { id: 8, title: '기생충', image: 'https://image.tmdb.org/t/p/w500/7BsvSuDQuoqhWmU2fL7W2GOcZHU.jpg' },
  { id: 9, title: '아바타', image: 'https://image.tmdb.org/t/p/w500/jRXYjXNqOce2shMelB4wGDs5Lp1.jpg' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState<number>(1);

  const [selectedOtts, setSelectedOtts] = useState<number[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);

  const [movies, setMovies] = useState(INITIAL_MOVIES);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const toggleItem = (itemId: number, selectedList: number[], setSelectedList: any) => {
    if (selectedList.includes(itemId)) {
      setSelectedList(selectedList.filter((id) => id !== itemId));
    } else {
      setSelectedList([...selectedList, itemId]);
    }
  };

  const loadMoreMovies = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const newMovies = [
        { id: Date.now() + 1, title: '새로운 영화 1', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
        { id: Date.now() + 2, title: '새로운 영화 2', image: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' },
      ];
      setMovies((prev) => [...prev, ...newMovies]);
      setIsLoadingMore(false);
    }, 1000);
  };

  // 백엔드 통신 로직 (임시 우회)
  const submitOnboardingData = async () => {
    if (selectedOtts.length === 0 || selectedGenres.length === 0 || selectedMovies.length === 0) {
      Alert.alert('알림', '모든 항목을 최소 1개 이상 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    // 로딩 스피너 살짝 보여주기 위해 0.5초 대기 후 바로 이동
    setTimeout(() => {
      /* // 💡 나중에 백엔드 API 연동할 때 아래 주석 풀고 사용!
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) {
          Alert.alert('인증 오류', '로그인 정보가 만료되었습니다.');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          ott_ids: selectedOtts,
          genre_ids: selectedGenres,
          movie_ids: selectedMovies,
        };

        const ENDPOINT = `${API_BASE_URL}/api/v1/users/me/onboarding`; // 백엔드 주소 맞춰서 수정 필요

        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('데이터 저장 실패');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('오류', '서버 통신 실패');
        setIsSubmitting(false);
        return;
      }
      */

      // API 성공했다고 치고 바로 메인 탭으로 이동
      setIsSubmitting(false);
      router.replace('/(tabs)');
    }, 500);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      submitOnboardingData();
    }
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
        <Text style={styles.stepText}>STEP {step}/3</Text>
        <Text style={styles.title}>{getStepTitle()}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.contentArea}>
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
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            columnWrapperStyle={styles.movieRow}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreMovies}
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
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.nextButton, isSubmitting && { opacity: 0.7 }]} onPress={handleNext} disabled={isSubmitting}>
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
  stepText: { color: '#FF5A36', fontSize: 14, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
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
  nextButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' }
});