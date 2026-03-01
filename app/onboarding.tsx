import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// 장르 목록 데이터
const GENRES = [
  'SF/판타지', '로맨스', '스릴러', '액션', '드라마', '호러',
  '코미디', '애니메이션', '다큐멘터리', '범죄', '음악', '미스터리'
];

// 인생 영화 미리보기 임시 데이터
const PREVIEW_MOVIES = [
  { id: 1, title: '인터스텔라', image: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: 2, title: '라라랜드', image: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' },
  { id: 3, title: '올드보이', image: 'https://image.tmdb.org/t/p/w500/pT1xYy2y2mO5yHmbR11iZ890KzE.jpg' },
];

export default function OnboardingScreen() {
  // 사용자가 선택한 장르를 담는 배열 (시안처럼 미리 몇 개 선택해두기)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['SF/판타지', '스릴러', '드라마']);

  // 장르 선택/해제 토글 함수
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      // 최대 3개까지만 선택 가능하도록 제한하려면 아래 주석을 해제하세요
      // if (selectedGenres.length >= 3) return;
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. 상단 헤더 영역 */}
        <View style={styles.header}>
          <Text style={styles.stepText}>STEP 1/2</Text>
          <Text style={styles.title}>좋아하는 장르를{'\n'}3개 선택해주세요</Text>
          
          {/* 진행바 (Progress Bar) */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarFill} />
            <View style={styles.progressBarEmpty} />
          </View>
        </View>

        {/* 2. 장르 선택 태그 영역 */}
        <View style={styles.genreContainer}>
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <Pressable
                key={genre}
                onPress={() => toggleGenre(genre)}
                style={[styles.genreTag, isSelected && styles.genreTagSelected]}
              >
                {isSelected && <Feather name="check" size={16} color="#111" style={styles.checkIcon} />}
                <Text style={[styles.genreText, isSelected && styles.genreTextSelected]}>
                  {genre}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 3. 인생 영화 미리보기 영역 */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>인생 영화 미리보기</Text>
          <View style={styles.movieCardsContainer}>
            {PREVIEW_MOVIES.map((movie) => (
              <View key={movie.id} style={styles.movieCard}>
                <ImageBackground 
                  source={{ uri: movie.image }} 
                  style={styles.movieImage} 
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View style={styles.movieTitleOverlay}>
                    <Text style={styles.movieTitleText}>{movie.title}</Text>
                  </View>
                </ImageBackground>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* 4. 하단 고정 버튼 */}
      <View style={styles.footer}>
        <Pressable 
          style={styles.nextButton} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.nextButtonText}>다음 단계로</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollContent: { padding: 20, paddingBottom: 100 }, // 하단 버튼에 가리지 않도록 여백
  
  // 헤더 스타일
  header: { marginTop: 40, marginBottom: 30 },
  stepText: { color: '#FF5A36', fontSize: 14, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', lineHeight: 40, marginBottom: 20 },
  
  progressBarContainer: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { flex: 1, backgroundColor: '#FF5A36' },
  progressBarEmpty: { flex: 1, backgroundColor: '#333' },

  // 장르 태그 스타일
  genreContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 50 },
  genreTag: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 18, 
    borderRadius: 25, borderWidth: 1, borderColor: '#333' 
  },
  genreTagSelected: { backgroundColor: '#FF5A36', borderColor: '#FF5A36' },
  checkIcon: { marginRight: 6 },
  genreText: { color: '#aaa', fontSize: 16 },
  genreTextSelected: { color: '#111', fontWeight: 'bold' },

  // 미리보기 영역 스타일
  previewSection: { marginBottom: 30 },
  previewTitle: { color: '#888', fontSize: 14, marginBottom: 15 },
  movieCardsContainer: { flexDirection: 'row', gap: 10 },
  movieCard: { flex: 1, aspectRatio: 2/3 }, // 세로로 긴 포스터 비율 유지
  movieImage: { flex: 1, justifyContent: 'flex-end' },
  movieTitleOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 10,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  },
  movieTitleText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },

  // 하단 버튼 스타일
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: 20, backgroundColor: '#0a0a0a',
    borderTopWidth: 1, borderTopColor: '#1a1a1a'
  },
  nextButton: { 
    backgroundColor: '#FF5A36', paddingVertical: 18, 
    borderRadius: 30, alignItems: 'center' 
  },
  nextButtonText: { color: '#111', fontSize: 16, fontWeight: 'bold' }
});