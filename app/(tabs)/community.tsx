import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, ScrollView, Pressable, 
  Image, Modal, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { fetchSearchData } from '../../api/explore'; 

// 💡 1. 내 보관함 데이터를 가져오기 위해 Store 임포트 추가
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { usePinStore } from '../../store/usePinStore';

const MOCK_POSTS = [
  { 
    id: '1', user: '김호영똥방구', time: '2시간 전', likes: 12, comments: 3,
    movie: { id: '157336', title: '인터스텔라', image: 'https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' }, 
    content: '우주 장면은 언제 봐도 경이롭네요. 한스 짐머 OST 들으면서 보니까 전율이 돋습니다.', 
    hashtags: ['#우주', '#인생영화', '#크리스토퍼놀란']
  },
  { 
    id: '2', user: '김호영배꼽냄새푸르르', time: '5시간 전', likes: 34, comments: 8,
    movie: { id: '313369', title: '라라랜드', image: 'https://image.tmdb.org/t/p/w200/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' }, 
    content: '마지막 눈빛 교환 씬에서 오열했습니다 ㅠㅠ 다들 이 영화 볼 때 휴지 필수입니다.', 
    hashtags: ['#로맨스', '#음악', '#폭풍눈물']
  },
];

export default function CommunityScreen() {
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  
  // 모달 상태 관리
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  
  // 💡 2. 모달 내 검색/보관함 탭 관리
  const [writeTab, setWriteTab] = useState<'Search' | 'Library'>('Search');
  
  const [writeSearchQuery, setWriteSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null); // 태그된 영화/플레이리스트
  const [toastMessage, setToastMessage] = useState('');

  // 💡 3. 내 보관함(Pin, Playlist) 데이터 가져오기
  const pinnedMovies = usePinStore(state => state.pinnedMovies);
  const customPlaylists = usePlaylistStore(state => state.customPlaylists);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const filteredPosts = MOCK_POSTS.filter(post => 
    feedSearchQuery === '' || post.movie.title.includes(feedSearchQuery)
  );

  useEffect(() => {
    if (writeTab !== 'Search') return; // 검색 탭일 때만 디바운스 작동
    
    if (writeSearchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      const results = await fetchSearchData(writeSearchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [writeSearchQuery, writeTab]);

  const handleSubmitPost = () => {
    if (!selectedMovie) return showToast("콘텐츠를 먼저 태그해주세요.");
    if (!postContent.trim()) return showToast("내용을 입력해주세요.");
    
    showToast("게시글이 등록되었습니다.");
    setTimeout(() => {
      setIsWriteModalVisible(false);
      setSelectedMovie(null);
      setPostContent('');
      setPostTags('');
      setWriteSearchQuery('');
      setWriteTab('Search'); // 닫을 때 탭 초기화
    }, 1000);
  };

  const renderPost = ({ item }: { item: typeof MOCK_POSTS[0] }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}><Ionicons name="person" size={16} color="#aaa" /></View>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.postTime}>· {item.time}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
      </View>

      <View style={styles.taggedMovieCard}>
        <Image source={{ uri: item.movie.image }} style={styles.taggedMovieImage} />
        <View style={styles.taggedMovieInfo}>
          <Text style={styles.taggedMovieTitle}>{item.movie.title}</Text>
          <Text style={styles.taggedMovieLabel}>이 작품에 대한 이야기</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>

      <Text style={styles.postContent}>{item.content}</Text>
      
      <View style={styles.hashtagsRow}>
        {item.hashtags.map((tag, idx) => (
          <Text key={idx} style={styles.hashtagText}>{tag}</Text>
        ))}
      </View>

      <View style={styles.postActions}>
        <Pressable style={styles.actionBtn}>
          <Ionicons name="heart-outline" size={20} color="#aaa" />
          <Text style={styles.actionText}>{item.likes}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color="#aaa" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="특정 영화의 리뷰 모아보기..."
          placeholderTextColor="#666"
          value={feedSearchQuery}
          onChangeText={setFeedSearchQuery}
        />
        {feedSearchQuery.length > 0 && (
          <Pressable onPress={() => setFeedSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        )}
      </View>

      <FlatList 
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedScroll}
        ListEmptyComponent={
          <Text style={styles.noResultText}>"{feedSearchQuery}"에 대한 게시글이 없습니다.</Text>
        }
      />

      <Pressable 
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.9 }] }]} 
        onPress={() => setIsWriteModalVisible(true)}
      >
        <Ionicons name="pencil" size={26} color="#fff" />
      </Pressable>

      <Modal visible={isWriteModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setIsWriteModalVisible(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </Pressable>
            <Text style={styles.modalTitle}>새 게시글</Text>
            <Pressable onPress={handleSubmitPost}>
              <Text style={styles.modalSubmitText}>등록</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* 💡 4. 영화/플레이리스트 선택 영역 (탭 구조 적용) */}
            {!selectedMovie ? (
              <View style={styles.writeSearchSection}>
                <Text style={styles.sectionLabel}>어떤 작품에 대해 이야기할까요?</Text>
                
                {/* 검색 / 내 보관함 토글 탭 */}
                <View style={styles.writeTabContainer}>
                  <Pressable 
                    style={[styles.writeTabBtn, writeTab === 'Search' && styles.writeTabBtnActive]}
                    onPress={() => setWriteTab('Search')}
                  >
                    <Text style={[styles.writeTabText, writeTab === 'Search' && styles.writeTabTextActive]}>직접 검색</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.writeTabBtn, writeTab === 'Library' && styles.writeTabBtnActive]}
                    onPress={() => setWriteTab('Library')}
                  >
                    <Text style={[styles.writeTabText, writeTab === 'Library' && styles.writeTabTextActive]}>내 보관함</Text>
                  </Pressable>
                </View>

                {/* --- [직접 검색 탭] --- */}
                {writeTab === 'Search' ? (
                  <View>
                    <View style={[styles.searchContainer, { marginHorizontal: 0, marginBottom: 10 }]}>
                      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                      <TextInput 
                        style={styles.searchInput}
                        placeholder="영화 제목 검색..."
                        placeholderTextColor="#666"
                        value={writeSearchQuery}
                        onChangeText={setWriteSearchQuery}
                      />
                    </View>
                    {isSearching ? <ActivityIndicator color="#FF5A36" style={{ padding: 20 }} /> : null}
                    {writeSearchQuery.trim() !== '' && searchResults.length > 0 && (
                      <ScrollView style={styles.searchResultsBox} nestedScrollEnabled={true}>
                        {searchResults.map((movie) => (
                          <Pressable 
                            key={movie.id} 
                            style={styles.searchResultItem}
                            onPress={() => {
                              setSelectedMovie({ ...movie, type: 'movie' });
                              setWriteSearchQuery('');
                            }}
                          >
                            <Image source={{ uri: movie.image }} style={styles.searchResultImage} />
                            <View>
                              <Text style={styles.searchResultTitle}>{movie.title}</Text>
                              <Text style={styles.searchResultSub}>영화 · ★ {movie.rating}</Text>
                            </View>
                          </Pressable>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ) : (
                  // --- [내 보관함 탭] ---
                  <ScrollView style={styles.libraryScrollBox} nestedScrollEnabled={true}>
                    {/* 1. Pin한 영화 리스트 */}
                    <Text style={styles.librarySubTitle}>내가 Pin한 영화</Text>
                    {pinnedMovies.length > 0 ? pinnedMovies.map(movie => (
                      <Pressable 
                        key={`pin-${movie.id}`} 
                        style={styles.searchResultItem}
                        onPress={() => setSelectedMovie({ ...movie, type: 'movie' })}
                      >
                        <Image source={{ uri: movie.image }} style={styles.searchResultImage} />
                        <View>
                          <Text style={styles.searchResultTitle}>{movie.title}</Text>
                          <Text style={styles.searchResultSub}>Pin 됨</Text>
                        </View>
                      </Pressable>
                    )) : <Text style={styles.emptyLibraryText}>Pin한 영화가 없습니다.</Text>}

                    {/* 2. 내 플레이리스트 */}
                    <Text style={[styles.librarySubTitle, { marginTop: 15 }]}>내 재생목록</Text>
                    {customPlaylists && customPlaylists.length > 0 ? customPlaylists.map(playlist => (
                      <Pressable 
                        key={`list-${playlist.id}`} 
                        style={styles.searchResultItem}
                        onPress={() => setSelectedMovie({ 
                          id: playlist.id, title: playlist.name, type: 'playlist', 
                          image: 'https://via.placeholder.com/150/111/FF5A36?text=Playlist' // 임시 폴더 아이콘 느낌
                        })}
                      >
                        <View style={styles.folderIconMini}>
                          <Ionicons name="folder" size={20} color="#FF5A36" />
                        </View>
                        <View>
                          <Text style={styles.searchResultTitle}>{playlist.name}</Text>
                          <Text style={styles.searchResultSub}>영화 {playlist.movies?.length || 0}편</Text>
                        </View>
                      </Pressable>
                    )) : <Text style={styles.emptyLibraryText}>저장된 재생목록이 없습니다.</Text>}
                  </ScrollView>
                )}
              </View>
            ) : (
              // 💡 선택된 콘텐츠가 있을 때 (영화 or 플레이리스트)
              <View style={styles.selectedMovieBox}>
                {selectedMovie.type === 'playlist' ? (
                  <View style={[styles.selectedMovieImage, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
                     <Ionicons name="folder" size={30} color="#FF5A36" />
                  </View>
                ) : (
                  <Image source={{ uri: selectedMovie.image }} style={styles.selectedMovieImage} />
                )}
                
                <View style={styles.selectedMovieInfo}>
                  <Text style={styles.selectedMovieTitle}>{selectedMovie.title}</Text>
                  <Text style={styles.selectedMovieLabel}>
                    {selectedMovie.type === 'playlist' ? '플레이리스트 태그됨' : '영화 태그됨'}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedMovie(null)} style={styles.removeMovieBtn}>
                  <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
              </View>
            )}

            <View style={styles.inputSection}>
              <TextInput
                style={styles.contentInput}
                placeholder="이 콘텐츠에 대한 알버트님의 생각을 자유롭게 남겨주세요."
                placeholderTextColor="#666"
                multiline
                maxLength={500}
                value={postContent}
                onChangeText={setPostContent}
              />
            </View>

            <View style={styles.inputSection}>
              <View style={styles.tagInputWrapper}>
                <Ionicons name="pricetag-outline" size={18} color="#666" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.tagInput}
                  placeholder="해시태그 띄어쓰기로 구분 (예: #스릴러 #반전)"
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 25, marginHorizontal: 20, paddingHorizontal: 15, height: 46, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  feedScroll: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },
  noResultText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 15 },

  postContainer: { backgroundColor: '#111', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  userName: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginRight: 6 },
  postTime: { color: '#666', fontSize: 12 },
  
  taggedMovieCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  taggedMovieImage: { width: 40, height: 60, borderRadius: 6, marginRight: 12 },
  taggedMovieInfo: { flex: 1 },
  taggedMovieTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  taggedMovieLabel: { color: '#FF5A36', fontSize: 11 },
  postContent: { color: '#eee', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  hashtagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  hashtagText: { color: '#FF5A36', fontSize: 13 },
  postActions: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#aaa', marginLeft: 6, fontSize: 14 },

  modalContainer: { flex: 1, backgroundColor: '#0a0a0a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalCancelText: { color: '#aaa', fontSize: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalSubmitText: { color: '#FF5A36', fontSize: 16, fontWeight: 'bold' },
  
  modalBody: { padding: 20 },
  sectionLabel: { color: '#aaa', fontSize: 14, marginBottom: 10, fontWeight: 'bold' },
  writeSearchSection: { marginBottom: 20, zIndex: 10 },

  // --- 💡 새로 추가된 글 작성 모달 내 탭 스타일 ---
  writeTabContainer: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 8, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  writeTabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  writeTabBtnActive: { backgroundColor: '#333' },
  writeTabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  writeTabTextActive: { color: '#fff', fontWeight: 'bold' },

  searchResultsBox: { maxHeight: 200, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  libraryScrollBox: { maxHeight: 300, backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222', padding: 10 },
  librarySubTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  emptyLibraryText: { color: '#555', fontSize: 13, marginLeft: 5, marginBottom: 10 },
  folderIconMini: { width: 30, height: 45, borderRadius: 4, backgroundColor: 'rgba(255, 90, 54, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },

  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  searchResultImage: { width: 30, height: 45, borderRadius: 4, marginRight: 12 },
  searchResultTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  searchResultSub: { color: '#666', fontSize: 12, marginTop: 2 },

  selectedMovieBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FF5A36' },
  selectedMovieImage: { width: 50, height: 75, borderRadius: 8, marginRight: 15 },
  selectedMovieInfo: { flex: 1 },
  selectedMovieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  selectedMovieLabel: { color: '#aaa', fontSize: 13 },
  removeMovieBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },

  inputSection: { marginBottom: 20 },
  contentInput: { color: '#fff', fontSize: 16, lineHeight: 24, textAlignVertical: 'top', minHeight: 150 },
  tagInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#333' },
  tagInput: { flex: 1, color: '#FF5A36', fontSize: 14 },

  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF5A36', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF5A36', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6, zIndex: 100 },
  toastContainer: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(255, 90, 54, 0.95)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  toastText: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
});