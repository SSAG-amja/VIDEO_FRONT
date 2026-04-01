// 필요한 모듈 및 컴포넌트 임포트
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '../../constants/api';
import { usePinStore } from '../../store/usePinStore';

// 화면 크기 및 비디오 비율 등 UI 계산을 위한 상수
const { width: WINDOW_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = WINDOW_WIDTH * (9 / 16); 
const SWIPE_CUE_THRESHOLD = WINDOW_WIDTH * 0.25;

// 영화 데이터 타입 정의
interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  youtubeId: string;
  info: string;
  rating: number; 
  runtime: number; 
  tags: string[];
}

// 숏폼 아이템 컴포넌트 속성 타입 정의
interface ShortsItemProps {
  movie: Movie;
  isActive: boolean; // 현재 화면에 보이는 영상인지 여부
  isScreenFocused: boolean; // 현재 화면(탭)이 포커스 되어있는지 여부
  layoutHeight: number;
  isGlobalMuted: boolean;
  setIsGlobalMuted: (muted: boolean) => void;
  onPass: () => void; // 다음 영상으로 넘어가는 함수
}

// 개별 숏폼 영상 아이템 컴포넌트
const ShortsItem = ({ movie, isActive, isScreenFocused, layoutHeight, isGlobalMuted, setIsGlobalMuted, onPass }: ShortsItemProps) => {
  // 애니메이션 및 웹뷰 상태 관리
  const blurAnim = useRef(new Animated.Value(0)).current;
  const webviewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Pin 상태 전역 관리
  const pinnedMovies = usePinStore((state) => state.pinnedMovies);
  const togglePin = usePinStore((state) => state.togglePin);
  const isPinned = pinnedMovies.some((m) => m.id === movie.id);

  // 스와이프 및 팝업 애니메이션 값
  const pan = useRef(new Animated.ValueXY()).current;
  const manualPinAnim = useRef(new Animated.Value(0)).current; // 하트 버튼 클릭 전용 애니메이션

  // Pin 추가 및 해제 처리 함수
  const handlePinAction = () => {
    togglePin({
      id: movie.id,
      title: movie.title,
      image: `https://image.tmdb.org/t/p/w780${movie.posterPath}`
    });
  };

  // 화면 스와이프 제스처 처리
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 120; 
        if (gestureState.dx > swipeThreshold) {
          // 오른쪽 스와이프: Pin 동작
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          handlePinAction();
        } else if (gestureState.dx < -swipeThreshold) {
          // 왼쪽 스와이프: 다음 영상으로 넘어가기
          Animated.timing(pan, { toValue: { x: -WINDOW_WIDTH, y: 0 }, duration: 200, useNativeDriver: false }).start(() => {
            onPass();
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          // 임계치 미달 시 제자리 복귀
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  // X 버튼 클릭 시 실행되는 함수
  const triggerPass = () => {
    Animated.timing(pan, { toValue: { x: -WINDOW_WIDTH, y: 0 }, duration: 250, useNativeDriver: false }).start(() => {
      onPass();
      pan.setValue({ x: 0, y: 0 });
    });
  };

  // 하트 버튼 클릭 시 실행되는 함수 (화면 흔들림 없이 중앙 팝업 후 이동)
  const triggerPin = () => {
    handlePinAction(); 
    Animated.sequence([
      Animated.spring(manualPinAnim, { toValue: 1, useNativeDriver: false }),
      Animated.timing(manualPinAnim, { toValue: 0, duration: 200, delay: 300, useNativeDriver: false })
    ]).start(() => {
      onPass(); 
    });
  };

  // 스와이프 거리에 따른 카드 회전 및 팝업 투명도 계산
  const rotate = pan.x.interpolate({
    inputRange: [-WINDOW_WIDTH / 2, 0, WINDOW_WIDTH / 2],
    outputRange: ['-3deg', '0deg', '3deg'], 
    extrapolate: 'clamp',
  });

  const likeCueOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_CUE_THRESHOLD],
    outputRange: [0, 1], 
    extrapolate: 'clamp',
  });

  const dislikeCueOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_CUE_THRESHOLD, 0],
    outputRange: [1, 0], 
    extrapolate: 'clamp',
  });

  const cueScale = pan.x.interpolate({
    inputRange: [-WINDOW_WIDTH / 2, 0, WINDOW_WIDTH / 2],
    outputRange: [1.2, 0.5, 1.2], 
    extrapolate: 'clamp',
  });

  const manualPinScale = manualPinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.2], 
    extrapolate: 'clamp',
  });

  // 영상 포커스 상태에 따른 유튜브 재생 및 일시정지 제어
  useEffect(() => {
    if (!isReady || !webviewRef.current) return;

    if (isActive && isScreenFocused) {
      const muteCommand = isGlobalMuted ? 'player.mute();' : 'player.unMute();';
      // 🚨 수정: WebView 내부에서도 JS 실행 딜레이를 주어 명령이 씹히는 현상 방지
      webviewRef.current.injectJavaScript(`
        if(player && typeof player.playVideo === 'function'){
          ${muteCommand}
          setTimeout(function() {
            player.playVideo();
          }, 50);
        }
        true;
      `);
      Animated.timing(blurAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    } else {
      webviewRef.current.injectJavaScript(`
        if(player && typeof player.pauseVideo === 'function'){
          player.pauseVideo();
        }
        true;
      `);
      Animated.timing(blurAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [isActive, isReady, isGlobalMuted, blurAnim, isScreenFocused]);

  // 유튜브 플레이어 삽입용 HTML 스트링
  const htmlContent = `
    <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>body, html { width: 100%; height: 100%; margin: 0; padding: 0; background-color: transparent; overflow: hidden; } #player { width: 100vw; height: 100vh; pointer-events: none; }</style>
    </head><body><div id="player"></div><script src="https://www.youtube.com/iframe_api"></script><script>
    var player; function onYouTubeIframeAPIReady() { player = new YT.Player('player', { videoId: '${movie.youtubeId}', host: 'https://www.youtube-nocookie.com',
    playerVars: { 'playsinline': 1, 'autoplay': 0, 'mute': 1, 'controls': 0, 'loop': 1, 'playlist': '${movie.youtubeId}' },
    events: { 'onReady': function(event) { window.ReactNativeWebView.postMessage(JSON.stringify({type:'onReady'})); } } }); }
    </script></body></html>`;

  return (
    <View style={[styles.itemContainer, { height: layoutHeight }]}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0a0a0a' }]} />
      
      <Animated.View 
        {...panResponder.panHandlers} 
        style={[StyleSheet.absoluteFillObject, styles.cardContainer, { transform: [{ translateX: pan.x }, { rotate: rotate }] }]}
      >
        {/* 배경 포스터 및 블러 효과 */}
        <Image source={{ uri: `https://image.tmdb.org/t/p/w780${movie.posterPath}` }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: blurAnim }]} pointerEvents="none">
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        </Animated.View>
        
        {/* 중앙 웹뷰 영상 플레이어 영역 */}
        <View style={styles.videoWrapper}>
          <WebView 
            ref={webviewRef} 
            source={{ html: htmlContent, baseUrl: 'https://localhost' }} 
            style={{ width: WINDOW_WIDTH, height: VIDEO_HEIGHT, backgroundColor: 'transparent' }} 
            allowsInlineMediaPlayback 
            mediaPlaybackRequiresUserAction={false} 
            onMessage={(e) => { if(JSON.parse(e.nativeEvent.data).type === 'onReady') setIsReady(true); }} 
            scrollEnabled={false} 
          />
        </View>

        {/* 투명 오버레이 UI 영역 */}
        <View style={styles.uiOverlay} pointerEvents="box-none">
          {/* 상단 로고 및 뱃지 */}
          <View style={styles.header}>
            <Text style={styles.logoText}>Pin<Text style={styles.logoHighlight}>lm</Text></Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>오늘의 피드</Text>
            </View>
          </View>
          
          {/* 하단 영화 정보 및 버튼 */}
          <LinearGradient colors={['transparent', 'rgba(10, 10, 10, 0.8)', '#0a0a0a']} style={styles.bottomGradient} pointerEvents="box-none">
            <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
            <Text style={styles.subtitle}>{movie.overview?.slice(0, 30)}...</Text>
            
            <View style={styles.infoRow}>
              <FontAwesome name="star" size={14} color="#FFD700" />
              <Text style={styles.infoTextBold}>{movie.rating}</Text>
              <Ionicons name="time-outline" size={14} color="#aaa" style={{ marginLeft: 10 }} />
              <Text style={styles.infoText}>{movie.runtime}분</Text>
              
              <Pressable onPress={() => setIsGlobalMuted(!isGlobalMuted)} style={styles.muteToggleContainer}>
                <Ionicons name={isGlobalMuted ? "volume-mute" : "volume-high"} size={18} color={isGlobalMuted ? "#aaa" : "#FF5A36"} />
                <Text style={[styles.infoText, !isGlobalMuted && { color: '#FF5A36', fontWeight: 'bold' }]}>
                  {isGlobalMuted ? "소리 꺼짐" : "소리 켜짐"}
                </Text>
              </Pressable>
            </View>
            
            <Pressable onPress={() => router.push({ pathname: '/detail/[id]', params: { id: movie.id, movieData: JSON.stringify(movie) } } as any)} style={styles.detailPrompt}>
              <Ionicons name="chevron-up" size={20} color="#666" />
              <Text style={styles.detailPromptText}>탭하여 상세 보기</Text>
            </Pressable>
            
            <View style={styles.actionRow}>
              <Pressable 
                onPress={triggerPass}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && { transform: [{ scale: 0.85 }], backgroundColor: 'rgba(255, 90, 54, 0.2)' }
                ]}
              >
                <Ionicons name="close" size={32} color="#FF5A36" />
              </Pressable>
              
              <Pressable 
                onPress={triggerPin}
                style={({ pressed }) => [
                  styles.actionButton, styles.pinButton, 
                  isPinned && { backgroundColor: 'rgba(255, 90, 54, 0.1)' },
                  pressed && { transform: [{ scale: 0.85 }], backgroundColor: 'rgba(255, 90, 54, 0.2)' }
                ]}
              >
                <Ionicons name={isPinned ? "heart" : "heart-outline"} size={32} color="#FF5A36" />
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* 중앙 팝업 아이콘 영역 */}
      <View style={[StyleSheet.absoluteFillObject, styles.centralPopupOverlay]} pointerEvents="none">
        <Animated.View style={[styles.popupIconCircle, { opacity: likeCueOpacity, transform: [{ scale: cueScale }] }]}>
          <Ionicons name="heart" size={70} color="#FF5A36" />
        </Animated.View>
        
        <Animated.View style={[styles.popupIconCircle, { opacity: manualPinAnim, transform: [{ scale: manualPinScale }] }]}>
          <Ionicons name="heart" size={70} color="#FF5A36" />
        </Animated.View>

        <Animated.View style={[styles.popupIconCircle, { opacity: dislikeCueOpacity, transform: [{ scale: cueScale }] }]}>
          <Ionicons name="close" size={70} color="#FF5A36" />
        </Animated.View>
      </View>
    </View>
  );
};

// 홈 피드 메인 화면 컴포넌트
export default function HomeFeedScreen() {
  // 상태 관리 (무한 스크롤, 화면 인덱스, 음소거 등)
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [layoutHeight, setLayoutHeight] = useState<number>(0);
  const [isGlobalMuted, setIsGlobalMuted] = useState<boolean>(true);
  
  const [isScreenFocused, setIsScreenFocused] = useState<boolean>(true);

  const flatListRef = useRef<FlatList>(null);

  // 🚨 수정: 탭 전환 애니메이션 시간을 고려하여 약간의 딜레이를 두고 포커스 활성화
  useFocusEffect(
    useCallback(() => {
      let isActiveScreen = true;
      
      // 300ms 대기 (React Navigation 화면 전환 애니메이션이 끝날 때까지 대기)
      const timer = setTimeout(() => {
        if (isActiveScreen) {
          setIsScreenFocused(true);
        }
      }, 300);

      return () => {
        isActiveScreen = false;
        clearTimeout(timer); // 탭을 빠르게 전환할 경우 타이머 취소
        setIsScreenFocused(false);
        setIsGlobalMuted(true);
      };
    }, [])
  );

  // 영화 목록 API 패칭 함수 (페이지네이션 적용)
  const fetchMovies = async (pageNumber: number) => {
    if (isFetchingMore && pageNumber !== 1) return;
    try {
      if (pageNumber === 1) setIsLoading(true);
      else setIsFetchingMore(true);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/movie_load/shorts?page=${pageNumber}`); 
      const data = await response.json();
      
      if (data.movies && data.movies.length > 0) {
        setMovies(prevMovies => pageNumber === 1 ? data.movies : [...prevMovies, ...data.movies]);
      }
    } catch (error) {
      console.error("API Fetch Error:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  // 컴포넌트 마운트 시 최초 데이터 로드
  useEffect(() => {
    fetchMovies(1);
  }, []);

  // 리스트 끝에 도달했을 때 다음 페이지 로드
  const loadMoreMovies = () => {
    if (!isFetchingMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMovies(nextPage);
    }
  };

  // 현재 화면에 보이는 아이템의 인덱스 업데이트
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  // 다음 영상으로 스크롤 이동 처리
  const handlePass = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < movies.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  };

  // 최초 로딩 UI 렌더링
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5A36" />
        <Text style={styles.loadingText}>영화를 불러오는 중...</Text>
      </View>
    );
  }

  // 메인 리스트 렌더링
  return (
    <View style={styles.container} onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}>
      {layoutHeight > 0 && (
        <FlatList 
          ref={flatListRef} 
          data={movies} 
          renderItem={({ item, index }) => (
            <ShortsItem 
              movie={item} 
              isActive={index === activeIndex} 
              isScreenFocused={isScreenFocused} 
              layoutHeight={layoutHeight} 
              isGlobalMuted={isGlobalMuted} 
              setIsGlobalMuted={setIsGlobalMuted} 
              onPass={() => handlePass(index)} 
            />
          )} 
          keyExtractor={(item, index) => `${item.id}-${index}`} 
          pagingEnabled 
          showsVerticalScrollIndicator={false} 
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }} 
          windowSize={3} // 렌더링 성능 최적화를 위한 윈도우 사이즈
          getItemLayout={(data, index) => ({ length: layoutHeight, offset: layoutHeight * index, index })} 
          onEndReached={loadMoreMovies} 
          onEndReachedThreshold={0.5} 
          ListFooterComponent={
            isFetchingMore ? (
              <View style={[styles.itemContainer, { height: 100, backgroundColor: '#0a0a0a' }]}>
                <ActivityIndicator size="small" color="#FF5A36" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

// UI 스타일 정의
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#FF5A36', marginTop: 10, fontWeight: 'bold' }, 
  itemContainer: { width: WINDOW_WIDTH, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  videoWrapper: { width: WINDOW_WIDTH, height: VIDEO_HEIGHT, zIndex: 3, backgroundColor: 'transparent' },
  cardContainer: { justifyContent: 'center', alignItems: 'center' },
  centralPopupOverlay: { zIndex: 10, justifyContent: 'center', alignItems: 'center' },
  popupIconCircle: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  uiOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 4 },
  
  header: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  logoHighlight: { color: '#FF5A36' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 6 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 150 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#ccc', marginBottom: 15 }, 
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoTextBold: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  infoText: { color: '#aaa', marginLeft: 5 },
  muteToggleContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 15, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }, 
  
  detailPrompt: { alignItems: 'center', marginBottom: 20 },
  detailPromptText: { color: '#666', fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 40 },
  actionButton: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: '#333', backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pinButton: { borderColor: '#FF5A36' },
});