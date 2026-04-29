import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, ScrollView, 
  Pressable, Image, Animated, Dimensions, BackHandler,
  Modal, Alert, TextInput, Linking, KeyboardAvoidingView, Platform 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import YoutubePlayer from 'react-native-youtube-iframe'; 

import { usePlaylistStore } from '../../store/usePlaylistStore';
import { usePinStore } from '../../store/usePinStore';
import { fetchMovieDetailData } from '../../api/movies'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const OTT_SCHEME_MAP: Record<number, { scheme: string, name: string, customLocalLogo?: any }> = {
  8: { scheme: 'nflx://', name: '넷플릭스' }, 
  97: { 
    scheme: 'watcha://', 
    name: '왓챠', 
    customLocalLogo: require('../../assets/images/watcha-icon.png') 
  }, 
  96: { scheme: 'tving://', name: '티빙' }, 
  337: { scheme: 'disneyplus://', name: '디즈니+' }, 
  356: { scheme: 'wavve://', name: '웨이브' }, 
  538: { scheme: 'coupangplay://', name: '쿠팡플레이' },
  350: { scheme: 'appletv://', name: 'Apple TV+' }
};

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

  const pinnedMovies = usePinStore((state) => state.pinnedMovies);
  const togglePin = usePinStore((state) => state.togglePin);
  const isPinned = movieDetail ? pinnedMovies.some((m) => m.id === movieDetail.id) : false;

  const [isPlaylistModalVisible, setPlaylistModalVisible] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isNewPlaylistPublic, setIsNewPlaylistPublic] = useState(false); 
  
  const { customPlaylists, createPlaylist, addMovieToPlaylist } = usePlaylistStore();

  // 💡 커뮤니티 글 작성 관련 상태 관리 추가
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

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

    createPlaylist(trimmedName, isNewPlaylistPublic);
    
    const updatedPlaylists = usePlaylistStore.getState().customPlaylists;
    const newPlaylist = updatedPlaylists.find(p => p.name === trimmedName);
    
    if (newPlaylist) {
      handleAddToPlaylist(newPlaylist.id, newPlaylist.name);
    }
    
    setNewPlaylistName('');
    setIsNewPlaylistPublic(false);
    setIsCreatingNew(false);
  };

  const handleOpenOtt = async (providerId: number) => {
    const mappedOtt = OTT_SCHEME_MAP[providerId];
    
    if (!mappedOtt) {
      Alert.alert('알림', '해당 OTT의 앱 바로가기를 아직 지원하지 않습니다.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(mappedOtt.scheme);
      if (supported) {
        await Linking.openURL(mappedOtt.scheme);
      } else {
        Alert.alert(`${mappedOtt.name} 앱 실행`, `기기에 ${mappedOtt.name} 앱이 설치되어 있지 않습니다.`);
      }
    } catch (error) {
      Alert.alert('실행 오류', '앱을 열 수 없습니다.');
    }
  };

  // 💡 게시글 등록 함수
  const handleSubmitPost = () => {
    if (!postContent.trim()) return showToast("내용을 입력해주세요.");
    
    // TODO: 백엔드 API 연동 위치 (현재 movieDetail.id 와 내용 전송)
    
    showToast("게시글이 등록되었습니다.");
    setTimeout(() => {
      setIsWriteModalVisible(false);
      setPostContent('');
      setPostTags('');
    }, 1000);
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
            
            <View style={styles.infoContainer}>
              <Ionicons name="star" size={15} color="#FFD700" style={styles.starIcon} />
              <Text style={styles.infoText}>
                {(movieDetail.rating || 0).toFixed(1)} | {movieDetail.info}
              </Text>
            </View>

            <View style={styles.tagRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {movieDetail.tags?.map((tag: string, index: number) => (
                  <View key={index} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                ))}
              </ScrollView>
            </View>

            {movieDetail.youtubeId && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>공식 예고편</Text>
                <View style={styles.videoContainer}>
                  <YoutubePlayer
                    height={210}
                    play={false}
                    videoId={movieDetail.youtubeId}
                    webViewProps={{
                      androidLayerType: 'hardware', 
                    }}
                  />
                </View>
              </View>
            )}

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
              {movieDetail.providers && movieDetail.providers.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ottScrollContainer}>
                  {movieDetail.providers.map((provider: any) => {
                    const mappedOtt = OTT_SCHEME_MAP[provider.provider_id];
                    
                    const imageSource = mappedOtt?.customLocalLogo
                      ? mappedOtt.customLocalLogo
                      : { uri: `https://image.tmdb.org/t/p/w154${provider.logo_path}` };

                    return (
                      <Pressable 
                        key={provider.provider_id} 
                        style={styles.ottIconWrapper} 
                        onPress={() => handleOpenOtt(provider.provider_id)}
                      >
                        <Image 
                          source={imageSource} 
                          style={styles.ottIconImage} 
                          resizeMode="cover"
                        />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.emptyOttText}>현재 스트리밍 가능한 OTT 정보가 없습니다.</Text>
              )}
            </View>

          </View>
          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          {/* 💡 재생목록 추가 버튼 */}
          <Pressable style={styles.circleIconBtn} onPress={() => setPlaylistModalVisible(true)}>
            <Ionicons name="folder-open-outline" size={26} color="#fff" />
          </Pressable>

          {/* 💡 커뮤니티 글 작성 버튼 */}
          <Pressable style={styles.circleIconBtn} onPress={() => setIsWriteModalVisible(true)}>
            <Ionicons name="pencil" size={24} color="#fff" />
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

        {/* --- 💡 글쓰기 모달 --- */}
        <Modal visible={isWriteModalVisible} animationType="slide" presentationStyle="pageSheet">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.writeModalContainer}>
            <View style={styles.writeModalHeader}>
              <Pressable onPress={() => setIsWriteModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </Pressable>
              <Text style={styles.writeModalTitle}>새 게시글</Text>
              <Pressable onPress={handleSubmitPost}>
                <Text style={styles.modalSubmitText}>등록</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.writeModalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              {/* 이미 태그된 콘텐츠 정보 표시 */}
              <View style={styles.selectedMovieBox}>
                <Image source={{ uri: `https://image.tmdb.org/t/p/w780${movieDetail.posterPath}` }} style={styles.selectedMovieImage} />
                <View style={styles.selectedMovieInfo}>
                  <Text style={styles.selectedMovieTitle}>{movieDetail.title}</Text>
                  <Text style={styles.selectedMovieLabel}>영화 태그됨</Text>
                </View>
              </View>

              {/* 본문 입력창 */}
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.contentInput}
                  placeholder="이 콘텐츠에 대한 생각을 자유롭게 남겨주세요."
                  placeholderTextColor="#666"
                  multiline
                  maxLength={500}
                  value={postContent}
                  onChangeText={setPostContent}
                  autoFocus
                />
              </View>

              {/* 해시태그 입력창 */}
              <View style={styles.inputSection}>
                <View style={styles.tagInputWrapper}>
                  <Ionicons name="pricetag-outline" size={18} color="#666" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.tagInput}
                    placeholder="해시태그 띄어쓰기로 구분 (예: #스릴러 #명작)"
                    placeholderTextColor="#666"
                    value={postTags}
                    onChangeText={setPostTags}
                  />
                </View>
              </View>
            </ScrollView>

            {toastMessage !== '' && (
              <View style={styles.toastContainer}>
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            )}
          </KeyboardAvoidingView>
        </Modal>

        {/* 기존 재생목록 모달 */}
        <Modal 
          visible={isPlaylistModalVisible} 
          transparent={true} 
          animationType="slide" 
          onRequestClose={() => { setPlaylistModalVisible(false); setIsCreatingNew(false); }}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={{ flex: 1 }}
          >
            <Pressable style={styles.modalOverlay} onPress={() => { setPlaylistModalVisible(false); setIsCreatingNew(false); }}>
              <Pressable 
                style={[styles.bottomSheet, Platform.OS === 'ios' && isCreatingNew && { paddingBottom: 60 }]} 
                onPress={(e) => e.stopPropagation()}
              >
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
                      returnKeyType="done"
                    />

                    <View style={styles.privacySelector}>
                      <Pressable 
                        style={[styles.privacyOption, !isNewPlaylistPublic && styles.privacyOptionActive]} 
                        onPress={() => setIsNewPlaylistPublic(false)}
                      >
                        <Ionicons name="lock-closed" size={18} color={!isNewPlaylistPublic ? "#FF5A36" : "#666"} />
                        <Text style={[styles.privacyText, !isNewPlaylistPublic && styles.privacyTextActive]}>비공개</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.privacyOption, isNewPlaylistPublic && styles.privacyOptionActive]} 
                        onPress={() => setIsNewPlaylistPublic(true)}
                      >
                        <Ionicons name="lock-open" size={18} color={isNewPlaylistPublic ? "#FF5A36" : "#666"} />
                        <Text style={[styles.privacyText, isNewPlaylistPublic && styles.privacyTextActive]}>공개</Text>
                      </Pressable>
                    </View>

                    <View style={styles.modalButtonContainer}>
                      <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={() => { setIsCreatingNew(false); setIsNewPlaylistPublic(false); }}>
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
          </KeyboardAvoidingView>
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
  
  infoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  starIcon: { marginRight: 4, marginBottom: 1 },
  infoText: { color: '#888', fontSize: 14 },
  
  tagRow: { marginBottom: 30 },
  tag: { borderWidth: 1, borderColor: '#FF5A36', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, backgroundColor: 'rgba(255, 90, 54, 0.1)' },
  tagText: { color: '#FF5A36', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  
  videoContainer: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  synopsisText: { color: '#ccc', lineHeight: 22, fontSize: 14 },
  readMoreText: { color: '#FF5A36', marginTop: 8, fontWeight: 'bold' },
  castScroll: { paddingRight: 20 },
  castCard: { marginRight: 15, alignItems: 'center', width: 80 },
  castImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#333', marginBottom: 8 },
  castName: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  castRole: { color: '#888', fontSize: 11, textAlign: 'center' },
  
  ottScrollContainer: { gap: 16, paddingRight: 20 },
  ottIconWrapper: { width: 60, height: 60, borderRadius: 16, overflow: 'hidden', backgroundColor: '#333', marginRight: 12, borderWidth: 1, borderColor: '#222' },
  ottIconImage: { width: '100%', height: '100%' },
  emptyOttText: { color: '#666', fontSize: 14, fontStyle: 'italic' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: 'transparent', flexDirection: 'row', gap: 10 },
  // 💡 버튼 이름 변경: playlistIconBtn -> circleIconBtn (공용으로 사용)
  circleIconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
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
  privacySelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  privacyOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333', backgroundColor: '#0a0a0a', gap: 6 },
  privacyOptionActive: { borderColor: '#FF5A36', backgroundColor: 'rgba(255, 90, 54, 0.05)' },
  privacyText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
  privacyTextActive: { color: '#FF5A36' },
  modalButtonContainer: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#333' },
  confirmBtn: { backgroundColor: '#FF5A36' },
  cancelBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  confirmBtnText: { color: '#111', fontSize: 16, fontWeight: 'bold' },

  // --- 💡 글쓰기 모달 관련 스타일 ---
  writeModalContainer: { flex: 1, backgroundColor: '#0a0a0a' },
  writeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalCancelText: { color: '#aaa', fontSize: 16 },
  writeModalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalSubmitText: { color: '#FF5A36', fontSize: 16, fontWeight: 'bold' },
  writeModalBody: { padding: 20 },
  selectedMovieBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FF5A36' },
  selectedMovieImage: { width: 50, height: 75, borderRadius: 8, marginRight: 15 },
  selectedMovieInfo: { flex: 1 },
  selectedMovieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  selectedMovieLabel: { color: '#aaa', fontSize: 13 },
  inputSection: { marginBottom: 20 },
  contentInput: { color: '#fff', fontSize: 16, lineHeight: 24, textAlignVertical: 'top', minHeight: 150 },
  tagInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#333' },
  tagInput: { flex: 1, color: '#FF5A36', fontSize: 14 },
  toastContainer: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(255, 90, 54, 0.95)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  toastText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
});