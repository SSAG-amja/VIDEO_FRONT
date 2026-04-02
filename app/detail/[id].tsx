import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, ScrollView, 
  Pressable, Image, Animated, Dimensions, BackHandler,
  Modal, Alert, TextInput, Linking 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { usePinStore } from '../../store/usePinStore';
import { fetchMovieDetailData } from '../../api/movies'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DUMMY_OTTS = [
  { id: 'netflix', name: '넷플릭스', color: '#E50914', scheme: 'nflx://' },
  { id: 'watcha', name: '왓챠', color: '#FF0558', scheme: 'watcha://' },
  { id: 'tving', name: '티빙', color: '#FF153C', scheme: 'tving://' },
  { id: 'disney', name: '디즈니+', color: '#113CCF', scheme: 'disneyplus://' },
];

export default function DetailScreen() {
  const { movieData } = useLocalSearchParams();
  
  const [movieDetail, setMovieDetail] = useState<any>(() => {
    try {
      if (typeof movieData === 'string') return JSON.parse(movieData);
      else if (Array.isArray(movieData)) return JSON.parse(movieData[0]);
    } catch (error) {
      console.log("데이터 파싱 에러:", error);
      return null;
    }
    return null;
  });

  useEffect(() => {
    const checkAndFetchMissingData = async () => {
      if (
        movieDetail && 
        (!movieDetail.cast || movieDetail.cast.length === 0 || movieDetail.overview === "상세 정보를 불러오는 중입니다...")
      ) {
        const fullData = await fetchMovieDetailData(movieDetail.id);
        if (fullData) {
          setMovieDetail(fullData); 
        }
      }
    };

    checkAndFetchMissingData();
  }, [movieDetail?.id]);

  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  // 💡 최신 Pin 스토어 로직 적용 (객체 형태 확인)
  const pinnedMovies = usePinStore((state) => state.pinnedMovies);
  const togglePin = usePinStore((state) => state.togglePin);
  const isPinned = movieDetail ? pinnedMovies.some((m) => m.id === movieDetail.id) : false;

  const [isPlaylistModalVisible, setPlaylistModalVisible] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  // 💡 최신 재생목록 스토어 로직 적용 (객체 형태 및 메서드 적용)
  const { customPlaylists, createPlaylist, addMovieToPlaylist } = usePlaylistStore();

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  useEffect(() => {
    const onBackPress = () => {
      closeModal();
      return true; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
    if (movieDetail) {
      addMovieToPlaylist(playlistId, {
        id: movieDetail.id.toString(),
        title: movieDetail.title,
        image: `https://image.tmdb.org/t/p/w780${movieDetail.posterPath}`
      });
      Alert.alert('추가 완료', `'${playlistName}'에 영화가 추가되었습니다.`);
      setPlaylistModalVisible(false);
    }
  };

  const handleCreateAndAddPlaylist = () => {
    const trimmedName = newPlaylistName.trim();
    if (trimmedName.length === 0) return;

    createPlaylist(trimmedName);
    
    // 방금 생성한 재생목록을 찾아 영화를 바로 추가
    const updatedPlaylists = usePlaylistStore.getState().customPlaylists;
    const newPlaylist = updatedPlaylists.find(p => p.name === trimmedName);
    
    if (newPlaylist) {
      handleAddToPlaylist(newPlaylist.id, newPlaylist.name);
    }
    
    setNewPlaylistName('');
    setIsCreatingNew(false);
  };

  const handleOpenOtt = async (ott: typeof DUMMY_OTTS[0]) => {
    try {
      const supported = await Linking.canOpenURL(ott.scheme);
      if (supported) {
        await Linking.openURL(ott.scheme);
      } else {
        Alert.alert(`${ott.name} 앱 실행`, `기기에 ${ott.name} 앱이 설치되어 있지 않습니다.`);
      }
    } catch (error) {
      Alert.alert('실행 오류', '앱을 열 수 없습니다.');
    }
  };

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
          <Pressable onPress={closeModal}>
            <ImageBackground source={{ uri: `https://image.tmdb.org/t/p/w780${movieDetail.posterPath}` }} style={styles.posterImage}>
              <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', '#111']} locations={[0, 0.3, 1]} style={styles.posterGradient}>
                <View style={styles.backButton}>
                  <Ionicons name="chevron-down" size={36} color="#fff" />
                </View>
              </LinearGradient>
            </ImageBackground>
          </Pressable>

          <View style={styles.contentBody}>
            <View style={styles.handleBarAlign}><View style={styles.handleBar} /></View>
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
              <Text style={styles.synopsisText} numberOfLines={isExpanded ? undefined : 4}>{movieDetail.overview}</Text>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>바로 시청하기</Text>
              <View style={styles.ottList}>
                {DUMMY_OTTS.map((ott) => (
                  <Pressable key={ott.id} style={[styles.ottItem, { borderColor: ott.color }]} onPress={() => handleOpenOtt(ott)}>
                    <Text style={[styles.ottName, { color: ott.color }]}>{ott.name}</Text>
                    <Ionicons name="play-circle" size={24} color={ott.color} />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.playlistIconBtn} onPress={() => setPlaylistModalVisible(true)}>
            <Ionicons name="folder-open-outline" size={26} color="#fff" />
          </Pressable>
          
          <Pressable 
            style={[styles.pinButton, isPinned && styles.pinButtonActive]} 
            onPress={() => movieDetail && togglePin({
              id: movieDetail.id, 
              title: movieDetail.title, 
              image: `https://image.tmdb.org/t/p/w780${movieDetail.posterPath}`
            })}
          >
            <Ionicons name={isPinned ? "heart" : "heart-outline"} size={24} color={isPinned ? "#FF5A36" : "#fff"} style={{ marginRight: 8 }} />
            <Text style={[styles.pinButtonText, isPinned && { color: '#FF5A36' }]}>
              {isPinned ? "Pin 취소" : "이 영화 Pin 하기"}
            </Text>
          </Pressable>
        </View>

        <Modal visible={isPlaylistModalVisible} transparent={true} animationType="slide" onRequestClose={() => setPlaylistModalVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => { setPlaylistModalVisible(false); setIsCreatingNew(false); }}>
            <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>재생목록에 저장</Text>
              
              {!isCreatingNew ? (
                <>
                  <Text style={styles.sheetSubtitle}>어떤 폴더에 저장할까요?</Text>
                  <ScrollView style={styles.playlistScroll} showsVerticalScrollIndicator={false}>
                    <Pressable style={styles.addPlaylistBtn} onPress={() => setIsCreatingNew(true)}>
                      <View style={styles.addPlaylistIconBg}>
                        <Feather name="plus" size={20} color="#FF5A36" />
                      </View>
                      <Text style={styles.addPlaylistText}>새 재생목록 추가</Text>
                    </Pressable>

                    {customPlaylists.map((playlist) => (
                      <Pressable key={playlist.id} style={styles.playlistItem} onPress={() => handleAddToPlaylist(playlist.id, playlist.name)}>
                        <Ionicons name="folder" size={24} color="#666" style={{ marginRight: 15 }} />
                        <Text style={styles.playlistItemText}>{playlist.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <View style={styles.createFormContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="재생목록 이름을 입력하세요"
                    placeholderTextColor="#666"
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                    autoFocus={true}
                  />
                  <View style={styles.modalButtonContainer}>
                    <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setIsCreatingNew(false)}>
                      <Text style={styles.cancelBtnText}>취소</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.confirmBtn]} onPress={handleCreateAndAddPlaylist}>
                      <Text style={styles.confirmBtnText}>추가</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

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
  
  ottList: { gap: 12 },
  ottItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, borderWidth: 1 },
  ottName: { fontSize: 16, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: 'transparent', flexDirection: 'row', gap: 15 },
  playlistIconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  pinButton: { flex: 1, backgroundColor: '#FF5A36', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 30, shadowColor: '#FF5A36', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  pinButtonActive: { backgroundColor: '#333', shadowColor: 'transparent', borderWidth: 1, borderColor: '#444' },
  pinButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  sheetSubtitle: { color: '#aaa', fontSize: 14, marginBottom: 24, textAlign: 'center' },
  playlistScroll: { maxHeight: 300, marginBottom: 10 },
  addPlaylistBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 10 },
  addPlaylistIconBg: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255, 90, 54, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  addPlaylistText: { color: '#FF5A36', fontSize: 16, fontWeight: 'bold' },
  playlistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  playlistItemText: { color: '#fff', fontSize: 16 },
  createFormContainer: { marginTop: 10 },
  textInput: { backgroundColor: '#0a0a0a', color: '#fff', borderRadius: 8, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  modalButtonContainer: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#333' },
  confirmBtn: { backgroundColor: '#FF5A36' },
  cancelBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  confirmBtnText: { color: '#111', fontSize: 16, fontWeight: 'bold' },
});