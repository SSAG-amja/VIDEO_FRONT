// app/playlist/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, Pressable, Alert, Modal, TextInput, 
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { fetchSearchData } from '../../api/explore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { 
    customPlaylists, 
    deletePlaylist, 
    togglePlaylistVisibility, 
    addMovieToPlaylist,
    removeMovieFromPlaylist,
    updatePlaylistOrder 
  } = usePlaylistStore();

  const playlist = customPlaylists.find(p => p.id.toString() === id);

  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // 💡 커뮤니티 글 작성 관련 상태
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await fetchSearchData(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("검색 중 오류 발생:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!playlist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>재생목록을 찾을 수 없습니다.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const handleDeletePlaylist = () => {
    Alert.alert(
      "재생목록 삭제",
      `'${playlist.name}' 재생목록을 삭제하시겠습니까?`,
      [{ text: "취소", style: "cancel" }, { text: "삭제", onPress: () => { deletePlaylist(playlist.id); router.back(); }, style: "destructive" }]
    );
  };

  const handleRemoveMovie = (movieId: string, movieTitle: string) => {
    Alert.alert(
      "영화 삭제",
      `'${movieTitle}' 영화를 목록에서 지우시겠습니까?`,
      [{ text: "취소", style: "cancel" }, { text: "삭제", onPress: () => removeMovieFromPlaylist(playlist.id, movieId), style: "destructive" }]
    );
  };

  const handleAddMovieToPlaylist = (apiMovie: any) => {
    const imageUrl = apiMovie.image || (apiMovie.posterPath ? `https://image.tmdb.org/t/p/w500${apiMovie.posterPath}` : 'https://via.placeholder.com/150');
    const movieToAdd = { id: apiMovie.id.toString(), title: apiMovie.title, image: imageUrl, addedAt: new Date().toISOString() };
    addMovieToPlaylist(playlist.id, movieToAdd);
    Alert.alert("추가 완료", `'${movieToAdd.title}' 영화가 추가되었습니다.`);
    setActiveMenuId(null); 
  };

  const handleGoToDetail = (apiMovie: any) => {
    const imageUrl = apiMovie.image || (apiMovie.posterPath ? `https://image.tmdb.org/t/p/w500${apiMovie.posterPath}` : 'https://via.placeholder.com/150');
    const safeMovieData = { id: apiMovie.id, title: apiMovie.title, posterPath: apiMovie.posterPath || '', image: imageUrl, rating: apiMovie.rating || 0, overview: apiMovie.overview || "상세 정보를 불러오는 중입니다...", info: "탐색을 통해 진입했습니다.", tags: apiMovie.tags || [], cast: apiMovie.cast || [] };
    setIsSearchModalVisible(false);
    setActiveMenuId(null);
    router.push({ pathname: '/detail/[id]', params: { id: apiMovie.id, movieData: JSON.stringify(safeMovieData) } } as any);
  };

  // 💡 글 작성 기능 핸들러
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleWritePostPress = () => {
    if (!playlist.isPublic) {
      Alert.alert(
        "비공개 재생목록",
        "커뮤니티에 글을 작성하려면 공유 플레이리스트(공개)로 설정해야 합니다.\n자물쇠 버튼을 눌러 공개로 변경해주세요."
      );
      return;
    }
    setIsWriteModalVisible(true);
  };

  const handleSubmitPost = () => {
    if (!postContent.trim()) return showToast("내용을 입력해주세요.");
    
    // TODO: 백엔드 API 연동 (playlist.id와 작성 내용 전송)
    
    showToast("게시글이 등록되었습니다.");
    setTimeout(() => {
      setIsWriteModalVisible(false);
      setPostContent('');
      setPostTags('');
    }, 1000);
  };

  const renderMovieItem = ({ item, drag, isActive }: RenderItemParams<any>) => (
    <ScaleDecorator>
      <Pressable 
        style={[styles.movieCard, isActive && styles.activeMovieCard]} 
        onLongPress={drag} 
        delayLongPress={200}
        onPress={() => router.push({ 
          pathname: '/detail/[id]', 
          params: { id: item.id, movieData: JSON.stringify(item) } 
        } as any)}
      >
        <Ionicons name="reorder-two" size={24} color="#555" style={{ marginRight: 10 }} />
        <Image source={{ uri: item.image }} style={styles.movieImage} />
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle}>{item.title}</Text>
        </View>
        <Pressable 
          style={styles.deleteMovieButton}
          onPress={() => handleRemoveMovie(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={20} color="#666" />
        </Pressable>
      </Pressable>
    </ScaleDecorator>
  );

  const renderSearchItem = ({ item }: { item: any }) => {
    const isMenuOpen = activeMenuId === item.id;
    const imageUrl = item.image || (item.posterPath ? `https://image.tmdb.org/t/p/w500${item.posterPath}` : 'https://via.placeholder.com/150');

    return (
      <View style={styles.searchItemWrapper}>
        <Pressable style={styles.searchItemRow} onPress={() => setActiveMenuId(isMenuOpen ? null : item.id)}>
          <Image source={{ uri: imageUrl }} style={styles.searchItemImage} />
          <Text style={styles.searchItemTitle} numberOfLines={2}>{item.title}</Text>
        </Pressable>

        {isMenuOpen && (
          <View style={styles.dropdownContainer}>
            <Pressable style={styles.dropdownButton} onPress={() => handleGoToDetail(item)}>
              <Ionicons name="information-circle-outline" size={20} color="#aaa" style={{ marginRight: 8 }} />
              <Text style={styles.dropdownText}>영화 상세보기</Text>
            </Pressable>
            <View style={styles.dropdownDivider} />
            <Pressable style={styles.dropdownButton} onPress={() => handleAddMovieToPlaylist(item)}>
              <Ionicons name="add-circle" size={20} color="#FF5A36" style={{ marginRight: 8 }} />
              <Text style={[styles.dropdownText, { color: '#FF5A36' }]}>이 영화를 재생목록에 추가</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderHeaderComponent = () => (
    <Pressable style={styles.addMovieCard} onPress={() => setIsSearchModalVisible(true)}>
      <View style={styles.addMovieIconContainer}>
        <Ionicons name="search" size={24} color="#FF5A36" />
      </View>
      <Text style={styles.addMovieText}>영화 검색하여 추가하기</Text>
    </Pressable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
          
          <Text style={styles.headerTitle} numberOfLines={1}>{playlist.name}</Text>
          
          <View style={styles.headerActions}>
            {/* 💡 커뮤니티 글쓰기 버튼 (공개 여부에 따라 스타일 및 동작 분기) */}
            <Pressable 
              style={[styles.iconButton, !playlist.isPublic && { opacity: 0.3 }]} 
              onPress={handleWritePostPress}
            >
              <Ionicons name="pencil" size={22} color="#fff" />
            </Pressable>

            <Pressable style={styles.iconButton} onPress={() => togglePlaylistVisibility(playlist.id)}>
              <Ionicons name={playlist.isPublic ? "lock-open" : "lock-closed"} size={24} color={playlist.isPublic ? "#FF5A36" : "#aaa"} />
            </Pressable>
            
            <Pressable style={styles.iconButton} onPress={handleDeletePlaylist}>
              <Ionicons name="trash-outline" size={24} color="#ff4444" />
            </Pressable>
          </View>
        </View>

        <DraggableFlatList
          data={playlist.movies}
          onDragEnd={({ data }) => updatePlaylistOrder(playlist.id, data)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovieItem}
          ListHeaderComponent={renderHeaderComponent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>이 재생목록에 저장된 영화가 없습니다.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* 영화 추가 모달 */}
        <Modal visible={isSearchModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsSearchModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>영화 추가</Text>
              <Pressable onPress={() => { setIsSearchModalVisible(false); setSearchQuery(''); setActiveMenuId(null); }}>
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput style={styles.searchInput} placeholder="영화 제목 검색..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} autoFocus />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </Pressable>
              )}
            </View>

            {isSearching ? (
              <ActivityIndicator size="large" color="#FF5A36" style={{ marginTop: 50 }} />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                renderItem={renderSearchItem}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              />
            ) : searchQuery.trim() !== '' ? (
              <Text style={styles.noResultText}>검색 결과가 없습니다.</Text>
            ) : (
              <Text style={styles.noResultText}>추가하고 싶은 영화를 검색해보세요.</Text>
            )}
          </View>
        </Modal>

        {/* --- 💡 글쓰기 모달 --- */}
        <Modal visible={isWriteModalVisible} animationType="slide" presentationStyle="pageSheet">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.writeModalContainer}>
            <View style={styles.writeModalHeader}>
              <Pressable onPress={() => setIsWriteModalVisible(false)}>
                <Text style={styles.writeModalCancelText}>취소</Text>
              </Pressable>
              <Text style={styles.writeModalTitle}>새 게시글</Text>
              <Pressable onPress={handleSubmitPost}>
                <Text style={styles.writeModalSubmitText}>등록</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.writeModalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              
              {/* 이미 태그된 플레이리스트 정보 표시 */}
              <View style={styles.selectedMovieBox}>
                <View style={[styles.selectedMovieImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
                   <Ionicons name="folder" size={30} color="#FF5A36" />
                </View>
                <View style={styles.selectedMovieInfo}>
                  <Text style={styles.selectedMovieTitle}>{playlist.name}</Text>
                  <Text style={styles.selectedMovieLabel}>플레이리스트 태그됨 (영화 {playlist.movies.length}편)</Text>
                </View>
              </View>

              {/* 본문 입력창 */}
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.contentInput}
                  placeholder="이 플레이리스트에 대한 생각을 자유롭게 남겨주세요."
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
                    placeholder="해시태그 띄어쓰기로 구분 (예: #스릴러모음 #띵작)"
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

      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  headerBackButton: { padding: 5 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginHorizontal: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconButton: { padding: 5 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  errorText: { color: '#aaa', fontSize: 16, marginBottom: 20 },
  backButton: { padding: 12, backgroundColor: '#333', borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#666', fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  movieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#222', marginBottom: 15 },
  activeMovieCard: { backgroundColor: '#222', borderColor: '#FF5A36', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  movieImage: { width: 60, height: 85, borderRadius: 10, backgroundColor: '#333' },
  movieInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  deleteMovieButton: { padding: 10 },
  addMovieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', marginBottom: 20 },
  addMovieIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255, 90, 54, 0.1)', justifyContent: 'center', alignItems: 'center' },
  addMovieText: { color: '#FF5A36', fontSize: 16, fontWeight: 'bold', marginLeft: 15 },

  modalContainer: { flex: 1, backgroundColor: '#111', paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 15, height: 50, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  noResultText: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 16 },
  
  searchItemWrapper: { marginBottom: 15, backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden' },
  searchItemRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  searchItemImage: { width: 50, height: 75, borderRadius: 8, backgroundColor: '#333' },
  searchItemTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: 'bold', marginLeft: 15 },
  
  dropdownContainer: { backgroundColor: '#2a2a2a', borderTopWidth: 1, borderColor: '#333' },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  dropdownDivider: { height: 1, backgroundColor: '#333', marginHorizontal: 20 },
  dropdownText: { color: '#aaa', fontSize: 15, fontWeight: 'bold' },

  // --- 💡 글쓰기 모달 스타일 추가 ---
  writeModalContainer: { flex: 1, backgroundColor: '#0a0a0a' },
  writeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  writeModalCancelText: { color: '#aaa', fontSize: 16 },
  writeModalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  writeModalSubmitText: { color: '#FF5A36', fontSize: 16, fontWeight: 'bold' },
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