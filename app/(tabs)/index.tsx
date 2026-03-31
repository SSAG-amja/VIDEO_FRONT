import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { API_BASE_URL } from '../../constants/api';
import { usePinStore } from '../../store/usePinStore'; // 💡 전역 스토어 임포트

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = WINDOW_WIDTH * (9 / 16); 

const SWIPE_CUE_THRESHOLD = WINDOW_WIDTH * 0.25;

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
  cast: { id: number; name: string; role: string; image: string; }[];
}

interface ShortsItemProps {
  movie: Movie;
  isActive: boolean;
  layoutHeight: number;
  isGlobalMuted: boolean;
  setIsGlobalMuted: (muted: boolean) => void;
  onPass: () => void;
}

const ShortsItem = ({ movie, isActive, layoutHeight, isGlobalMuted, setIsGlobalMuted, onPass }: ShortsItemProps) => {
  const blurAnim = useRef(new Animated.Value(0)).current;
  const webviewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  
  // 💡 로컬 useState 제거 및 전역 상태 연결
  const pinnedMovies = usePinStore((state) => state.pinnedMovies);
  const togglePin = usePinStore((state) => state.togglePin);
  const isPinned = pinnedMovies.includes(movie.id);

  const pan = useRef(new Animated.ValueXY()).current;

  // 💡 id를 전달하여 전역 상태 토글
  const handlePinAction = () => {
    togglePin(movie.id);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 120; 

        if (gestureState.dx > swipeThreshold) {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          handlePinAction();
        } else if (gestureState.dx < -swipeThreshold) {
          Animated.timing(pan, { toValue: { x: -WINDOW_WIDTH, y: 0 }, duration: 200, useNativeDriver: false }).start(() => {
            onPass();
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  const triggerPass = () => {
    Animated.timing(pan, {
      toValue: { x: -WINDOW_WIDTH, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => {
      onPass();
      pan.setValue({ x: 0, y: 0 });
    });
  };

  const triggerPin = () => {
    Animated.sequence([
      Animated.timing(pan, {
        toValue: { x: WINDOW_WIDTH / 1.5, y: 0 },
        duration: 150,
        useNativeDriver: false
      }),
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false
      })
    ]).start(() => {
      handlePinAction();
    });
  };

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

  useEffect(() => {
    if (!isReady) return;

    if (isActive) {
      webviewRef.current?.injectJavaScript(`
        if (player && typeof player.playVideo === 'function') {
          ${isGlobalMuted ? 'player.mute();' : 'player.unMute();'}
          player.playVideo();
        }
        true;
      `);
      Animated.timing(blurAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    } else {
      webviewRef.current?.injectJavaScript(`
        if (player && typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
        true;
      `);
      Animated.timing(blurAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [isActive, isReady, isGlobalMuted]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'onReady') {
        setIsReady(true);
        if (isActive) {
          setTimeout(() => {
            webviewRef.current?.injectJavaScript(`
              if (player && typeof player.playVideo === 'function') {
                ${isGlobalMuted ? 'player.mute();' : 'player.unMute();'}
                player.playVideo();
              }
              true;
            `);
          }, 300);
        }
      }
    } catch (e) {
      console.log("메시지 파싱 에러:", e);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html { width: 100%; height: 100%; margin: 0; padding: 0; background-color: transparent; overflow: hidden; }
          #player { width: 100vw; height: 100vh; pointer-events: none; }
        </style>
      </head>
      <body>
        <div id="player"></div>
        <script>
          function sendToRN(type, payload) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
            }
          }
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              videoId: '${movie.youtubeId}',
              host: 'https://www.youtube-nocookie.com',
              playerVars: {
                'playsinline': 1, 'autoplay': 0, 'mute': 1, 'controls': 0, 'loop': 1, 'playlist': '${movie.youtubeId}'
              },
              events: { 'onReady': function(event) { sendToRN('onReady', 'Ready'); } }
            });
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.itemContainer, { height: layoutHeight }]}>
      
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0a0a0a' }]} />

      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          StyleSheet.absoluteFillObject,
          styles.cardContainer, 
          {
            transform: [
              { translateX: pan.x },
              { rotate: rotate }
            ]
          }
        ]}
      >
        <Image source={{ uri: `https://image.tmdb.org/t/p/w780${movie.posterPath}` }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: blurAnim }]} pointerEvents="none">
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
        </Animated.View>

        <View style={styles.videoWrapper}>
          <WebView
            ref={webviewRef} source={{ html: htmlContent, baseUrl: 'https://localhost' }}
            style={{ width: WINDOW_WIDTH, height: VIDEO_HEIGHT, backgroundColor: 'transparent' }} 
            allowsInlineMediaPlayback={true} mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true} domStorageEnabled={true} onMessage={onMessage} scrollEnabled={false}
          />
        </View>

        <View style={styles.uiOverlay} pointerEvents="box-none">
          <View style={styles.header}>
            <Text style={styles.logoText}>Pin<Text style={styles.logoHighlight}>lm</Text></Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>오늘의 피드</Text>
            </View>
          </View>

          <LinearGradient colors={['transparent', 'rgba(10, 10, 10, 0.8)', '#0a0a0a']} locations={[0, 0.5, 1]} style={styles.bottomGradient} pointerEvents="box-none">
            <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
            <Text style={styles.subtitle}>{movie.overview.slice(0, 30)}...</Text>
            
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
                  styles.actionButton, 
                  styles.pinButton,
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

      <View style={[StyleSheet.absoluteFillObject, styles.centralPopupOverlay]} pointerEvents="none">
        <Animated.View style={[styles.popupIconCircle, { opacity: likeCueOpacity, transform: [{ scale: cueScale }] }]}>
          <Ionicons name="heart" size={70} color="#FF5A36" />
        </Animated.View>
        
        <Animated.View style={[styles.popupIconCircle, { opacity: dislikeCueOpacity, transform: [{ scale: cueScale }] }]}>
          <Ionicons name="close" size={70} color="#FF5A36" />
        </Animated.View>
      </View>
    </View>
  );
};

export default function HomeFeedScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [layoutHeight, setLayoutHeight] = useState<number>(0);
  const [isGlobalMuted, setIsGlobalMuted] = useState<boolean>(true);

  const flatListRef = useRef<FlatList>(null); 

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

  useEffect(() => {
    fetchMovies(1);
  }, []);

  const loadMoreMovies = () => {
    if (!isFetchingMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMovies(nextPage);
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handlePass = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < movies.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5A36" />
        <Text style={styles.loadingText}>영화를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={(event) => setLayoutHeight(event.nativeEvent.layout.height)}>
      {layoutHeight > 0 && (
        <FlatList
          ref={flatListRef}
          data={movies}
          renderItem={({ item, index }) => (
            <ShortsItem 
              movie={item} 
              isActive={index === activeIndex} 
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
          viewabilityConfig={viewabilityConfig} 
          windowSize={3} 
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#FF5A36', marginTop: 10, fontWeight: 'bold' },
  itemContainer: { width: WINDOW_WIDTH, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  videoWrapper: { width: WINDOW_WIDTH, height: VIDEO_HEIGHT, zIndex: 3, justifyContent: 'center', backgroundColor: 'transparent' },
  
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  centralPopupOverlay: {
    zIndex: 10, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupIconCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

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
  infoTextBold: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 14 },
  infoText: { color: '#aaa', marginLeft: 5, fontSize: 14 },
  muteToggleContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 15, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  detailPrompt: { alignItems: 'center', marginBottom: 20 },
  detailPromptText: { color: '#666', fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  actionButton: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: '#333', backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pinButton: { borderColor: '#FF5A36' },
});