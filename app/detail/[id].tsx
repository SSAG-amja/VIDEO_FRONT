import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, ScrollView, 
  Pressable, Image, Animated, Dimensions, BackHandler 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DetailScreen() {
  const { movieData } = useLocalSearchParams();
  
  let movieDetail = null;
  try {
    if (typeof movieData === 'string') movieDetail = JSON.parse(movieData);
    else if (Array.isArray(movieData)) movieDetail = JSON.parse(movieData[0]);
  } catch (error) {
    console.log("데이터 파싱 에러:", error);
  }

  const [isExpanded, setIsExpanded] = useState(false);
  
  // 상하 이동 애니메이션 값
  const translateY = useRef(new Animated.Value(0)).current;

  // 💡 화면을 밑으로 내리며 닫는 애니메이션 함수
  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  // 물리 뒤로가기 버튼(제스처) 제어
  useEffect(() => {
    const onBackPress = () => {
      closeModal();
      return true; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  if (!movieDetail) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#aaa' }}>데이터를 불러올 수 없습니다.</Text>
        <Pressable onPress={closeModal} style={{ marginTop: 20 }}>
          <Text style={{ color: '#FF5A36' }}>메인으로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.transparentWrapper}>
      <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          bounces={false} 
        >
          {/* 💡 핵심: 포스터 영역 전체를 Pressable로 감싸서, 터치 시 closeModal 실행 */}
          <Pressable onPress={closeModal}>
            <ImageBackground source={{ uri: `https://image.tmdb.org/t/p/w780${movieDetail.posterPath}` }} style={styles.posterImage}>
              <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', '#111']} locations={[0, 0.3, 1]} style={styles.posterGradient}>
                {/* 좌상단 화살표 버튼은 직관성을 위해 디자인으로 남겨둠 */}
                <View style={styles.backButton}>
                  <Ionicons name="chevron-down" size={36} color="#fff" />
                </View>
              </LinearGradient>
            </ImageBackground>
          </Pressable>

          {/* 컨텐츠 영역 */}
          <View style={styles.contentBody}>
            <View style={styles.handleBarAlign}>
              <View style={styles.handleBar} />
            </View>

            <Text style={styles.title}>{movieDetail.title}</Text>
            <Text style={styles.infoText}>{movieDetail.info}</Text>

            <View style={styles.tagRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {movieDetail.tags?.map((tag: string, index: number) => (
                  <View key={index} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>시놉시스</Text>
              <Text style={styles.synopsisText} numberOfLines={isExpanded ? undefined : 4}>
                {movieDetail.overview}
              </Text>
              {movieDetail.overview && movieDetail.overview.length > 0 && (
                <Pressable onPress={() => setIsExpanded(!isExpanded)}>
                  <Text style={styles.readMoreText}>{isExpanded ? '접기' : '더보기'}</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>출연진</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castScroll}>
                {movieDetail.cast?.map((person: any) => (
                  <View key={person.id} style={styles.castCard}>
                    <Image source={{ uri: person.image }} style={styles.castImage} />
                    <Text style={styles.castName} numberOfLines={1}>{person.name}</Text>
                    <Text style={styles.castRole} numberOfLines={1}>{person.role}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.pinButton}>
            <Ionicons name="heart" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.pinButtonText}>이 영화 Pin 하기</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  transparentWrapper: { flex: 1, backgroundColor: 'transparent' }, 
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  container: { flex: 1, backgroundColor: '#111' }, 
  scrollContent: { flexGrow: 1 },
  posterImage: { width: '100%', height: 450 },
  posterGradient: { flex: 1, paddingTop: 50, paddingHorizontal: 20, justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  contentBody: { backgroundColor: '#111', borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: -40, paddingHorizontal: 20, paddingBottom: 20 },
  handleBarAlign: { alignItems: 'center', paddingVertical: 15 },
  handleBar: { width: 40, height: 5, backgroundColor: '#333', borderRadius: 2.5 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  infoText: { color: '#888', fontSize: 14, marginBottom: 20 },
  tagRow: { marginBottom: 30 },
  tag: { borderWidth: 1, borderColor: '#FF5A36', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, backgroundColor: 'rgba(255, 90, 54, 0.1)' },
  tagText: { color: '#FF5A36', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  synopsisText: { color: '#ccc', lineHeight: 22, fontSize: 14 },
  readMoreText: { color: '#FF5A36', marginTop: 8, fontWeight: 'bold' },
  castScroll: { paddingRight: 20 },
  castCard: { marginRight: 15, alignItems: 'center', width: 80 },
  castImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#333', marginBottom: 8 },
  castName: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  castRole: { color: '#888', fontSize: 11, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'transparent' },
  pinButton: { backgroundColor: '#FF5A36', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 30, shadowColor: '#FF5A36', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  pinButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});