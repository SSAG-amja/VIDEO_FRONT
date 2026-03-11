import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// --- 더미 데이터 ---
const OTTS = ['넷플릭스', '왓챠', '티빙', '웨이브', '디즈니+', '애플TV+', '쿠팡플레이', '라프텔'];

const GENRES = [
  'SF/판타지', '로맨스', '스릴러', '액션', '드라마', '호러',
  '코미디', '애니메이션', '다큐멘터리', '범죄', '음악', '미스터리'
];

// 초기 영화 데이터
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
  // 스텝 상태 (1: OTT, 2: 장르, 3: 영화)
  const [step, setStep] = useState<number>(1);

  // 사용자 선택 상태
  const [selectedOtts, setSelectedOtts] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);

  // 무한 스크롤 관련 상태
  const [movies, setMovies] = useState(INITIAL_MOVIES);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 항목 토글 공통 로직
  const toggleItem = (item: any, selectedList: any[], setSelectedList: any) => {
    if (selectedList.includes(item)) {
      setSelectedList(selectedList.filter((i) => i !== item));
    } else {
      setSelectedList([...selectedList, item]);
    }
  };

  // 무한 스크롤 더미 로드 함수 (실제 백엔드 연결 시 API 호출로 변경)
  const loadMoreMovies = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const newMovies = [
        { id: Date.now() + 1, title: '새로운 영화 1', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
        { id: Date.now() + 2, title: '새로운 영화 2', image: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' },
        { id: Date.now() + 3, title: '새로운 영화 3', image: 'https://image.tmdb.org/t/p/w500/pT1xYy2y2mO5yHmbR11iZ890KzE.jpg' },
      ];
      setMovies((prev) => [...prev, ...newMovies]);
      setIsLoadingMore(false);
    }, 1000); // 1초 딜레이로 네트워크 통신 흉내
  };

  // 다음 스텝 진행 로직
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // 마지막 스텝이면 메인 탭으로 이동 (추후 이 위치에서 서버로 유저 설정값 POST 요청)
      router.replace('/(tabs)');
    }
  };

  // 스텝별 제목 설정
  const getStepTitle = () => {
    switch(step) {
      case 1: return '현재 구독 중인\nOTT를 선택해주세요';
      case 2: return '좋아하는 장르를\n선택해주세요';
      case 3: return '취향에 맞는\n인생 영화를 골라주세요';
      default: return '';
    }
  };

  // --- 스크린 렌더링 ---
  return (
    <View style={styles.container}>
      {/* 1. 상단 헤더 영역 (고정) */}
      <View style={styles.header}>
        <Text style={styles.stepText}>STEP {step}/3</Text>
        <Text style={styles.title}>{getStepTitle()}</Text>
        
        {/* 진행바 (Progress Bar) */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
      </View>

      {/* 2. 메인 컨텐츠 영역 (스텝별 조건부 렌더링) */}
      <View style={styles.contentArea}>
        {/* STEP 1: OTT 선택 */}
        {step === 1 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.tagContainer}>
              {OTTS.map((ott) => {
                const isSelected = selectedOtts.includes(ott);
                return (
                  <Pressable
                    key={ott}
                    onPress={() => toggleItem(ott, selectedOtts, setSelectedOtts)}
                    style={[styles.genreTag, isSelected && styles.genreTagSelected]}
                  >
                    {isSelected && <Feather name="check" size={16} color="#111" style={styles.checkIcon} />}
                    <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>{ott}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* STEP 2: 장르 선택 */}
        {step === 2 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.tagContainer}>
              {GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <Pressable
                    key={genre}
                    onPress={() => toggleItem(genre, selectedGenres, setSelectedGenres)}
                    style={[styles.genreTag, isSelected && styles.genreTagSelected]}
                  >
                    {isSelected && <Feather name="check" size={16} color="#111" style={styles.checkIcon} />}
                    <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>{genre}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* STEP 3: 영화 선택 (무한 스크롤) */}
        {step === 3 && (
          <FlatList
            data={movies}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            columnWrapperStyle={styles.movieRow}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreMovies}
            onEndReachedThreshold={0.5} // 스크롤이 절반쯤 남았을 때 로딩 시작
            ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#FF5A36" style={{ marginVertical: 20 }} /> : null}
            renderItem={({ item }) => {
              const isSelected = selectedMovies.includes(item.id);
              return (
                <Pressable 
                  style={styles.movieCard} 
                  onPress={() => toggleItem(item.id, selectedMovies, setSelectedMovies)}
                >
                  <ImageBackground 
                    source={{ uri: item.image }} 
                    style={styles.movieImage} 
                    imageStyle={{ borderRadius: 8, opacity: isSelected ? 0.4 : 1 }} // 선택 시 어둡게
                  >
                    {/* 선택 체크 아이콘 오버레이 */}
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

      {/* 3. 하단 고정 버튼 */}
      <View style={styles.footer}>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {step === 3 ? '시작하기' : '다음 단계로'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  contentArea: { flex: 1 }, // 스크롤 영역이 헤더와 푸터 사이를 꽉 채우도록 설정
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  flatListContent: { paddingHorizontal: 15, paddingBottom: 100 },
  
  // 헤더 스타일
  header: { paddingHorizontal: 20, marginTop: 60, marginBottom: 20 },
  stepText: { color: '#FF5A36', fontSize: 14, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', lineHeight: 36, marginBottom: 20 },
  
  progressBarContainer: { height: 4, borderRadius: 2, backgroundColor: '#333', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FF5A36' },

  // 태그(OTT, 장르) 공통 스타일
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genreTag: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 18, 
    borderRadius: 25, borderWidth: 1, borderColor: '#333' 
  },
  genreTagSelected: { backgroundColor: '#FF5A36', borderColor: '#FF5A36' },
  checkIcon: { marginRight: 6 },
  genreText: { color: '#aaa', fontSize: 16 },
  genreTextSelected: { color: '#111', fontWeight: 'bold' },

  // 영화 리스트(FlatList) 스타일
  movieRow: { gap: 10, marginBottom: 10 },
  movieCard: { flex: 1, aspectRatio: 2/3, maxWidth: '32%' }, // 3열 배치 설정
  movieImage: { flex: 1, justifyContent: 'flex-end' },
  movieTitleOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)', padding: 6,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  },
  movieTitleText: { color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  movieSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },

  // 하단 버튼 스타일
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: 20, paddingBottom: 40, backgroundColor: '#0a0a0a',
    borderTopWidth: 1, borderTopColor: '#1a1a1a'
  },
  nextButton: { 
    backgroundColor: '#FF5A36', paddingVertical: 18, 
    borderRadius: 30, alignItems: 'center' 
  },
  nextButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' }
});