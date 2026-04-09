import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, ScrollView, Pressable, 
  Image, Modal, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { fetchSearchData } from '../../api/explore'; 

// 💡 내 보관함 데이터를 가져오기 위해 Store 임포트 추가
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { usePinStore } from '../../store/usePinStore';

// 💡 4. 목업 데이터 5개 추가 및 좋아요(isLiked)/댓글(commentList) 상태 데이터 추가
const INITIAL_MOCK_POSTS = [
  { 
    id: '1', user: '김호영', time: '2시간 전', likes: 12, isLiked: false, comments: 3,
    commentList: [
      { id: 'c1', user: '우주덕후', text: '한스 짐머 음악은 진짜 전설이죠 ㅠㅠ' },
      { id: 'c2', user: '팝콘도둑', text: '극장에서 다시 보고 싶습니다.' },
      { id: 'c3', user: '영화광', text: '제 인생 영화 1순위!' }
    ],
    movie: { id: '157336', title: '인터스텔라', image: 'https://image.tmdb.org/t/p/w200/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' }, 
    content: '우주 장면은 언제 봐도 경이롭네요. 한스 짐머 OST 들으면서 보니까 전율이 돋습니다.', 
    hashtags: ['#우주', '#인생영화', '#크리스토퍼놀란']
  },
  { 
    id: '2', user: '김호영바보', time: '5시간 전', likes: 34, isLiked: true, comments: 2,
    commentList: [
      { id: 'c4', user: '엠마스톤팬', text: '마지막 피아노 씬에서 눈물 콧물 다 뺐어요.' },
      { id: 'c5', user: '재즈사랑', text: 'City of stars~ 🎶' }
    ],
    movie: { id: '313369', title: '라라랜드', image: 'https://image.tmdb.org/t/p/w200/uDO8zWDhfWwoFdKS4fzkUJt0Vy0.jpg' }, 
    content: '마지막 눈빛 교환 씬에서 오열했습니다 ㅠㅠ 다들 이 영화 볼 때 휴지 필수입니다.', 
    hashtags: ['#로맨스', '#음악', '#폭풍눈물']
  },
  { 
    id: '3', user: '씨네필', time: '1일 전', likes: 8, isLiked: false, comments: 0,
    commentList: [],
    movie: { id: '496243', title: '기생충', image: 'https://image.tmdb.org/t/p/w200/7BsvSuDQuoqhWmU2fL7W2GOcZHU.jpg' }, 
    content: '다시 봐도 봉준호 감독의 디테일은 소름이 돋네요. 냄새라는 소재를 이렇게 풀어내다니...', 
    hashtags: ['#명작', '#봉준호', '#스릴러']
  },
  { 
    id: '4', user: '히어로매니아', time: '1일 전', likes: 45, isLiked: false, comments: 1,
    commentList: [{ id: 'c6', user: '아이언맨', text: '3000만큼 사랑해...' }],
    movie: { id: '299534', title: '어벤져스: 엔드게임', image: 'https://image.tmdb.org/t/p/w200/or06FN3Dka5tukK1e9sl16pB3iy.jpg' }, 
    content: '10년간의 여정을 완벽하게 마무리한 최고의 히어로 영화. 어셈블 외칠 때 뽕차올랐음.', 
    hashtags: ['#마블', '#액션', '#감동']
  },
  { 
    id: '5', user: '밤샘러', time: '2일 전', likes: 5, isLiked: false, comments: 0,
    commentList: [],
    movie: { id: '155', title: '다크 나이트', image: 'https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg' }, 
    content: '히스 레저의 조커는 영화사에 길이 남을 악당입니다. 선과 악의 경계가 무너지는 묘사가 일품.', 
    hashtags: ['#조커', '#액션', '#명작']
  },
  { 
    id: '6', user: '애니덕후', time: '3일 전', likes: 19, isLiked: true, comments: 1,
    commentList: [{ id: 'c7', user: '지브리러버', text: 'OST가 아직도 귓가에 맴돌아요.' }],
    movie: { id: '129', title: '센과 치히로의 행방불명', image: 'https://image.tmdb.org/t/p/w200/39wmItIWsg5sZMyRU84xZpalFjE.jpg' }, 
    content: '어릴 때 볼 때랑 어른이 되어서 볼 때 느끼는 감정이 완전히 다른 영화.', 
    hashtags: ['#지브리', '#애니메이션', '#힐링']
  },
  { 
    id: '7', user: '스릴러만봄', time: '3일 전', likes: 22, isLiked: false, comments: 0,
    commentList: [],
    movie: { id: '680', title: '펄프 픽션', image: 'https://image.tmdb.org/t/p/w200/w0q9WAFoUeqL5L3V2fO351Kq32n.jpg' }, 
    content: '타란티노 특유의 찰진 대사와 엇갈린 시간 배열. 진짜 스타일리시함의 끝판왕.', 
    hashtags: ['#범죄', '#타란티노', '#스타일리시']
  },
];

export default function CommunityScreen() {
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  
  // 💡 1. 피드 데이터 상태 관리 (좋아요 기능 구현을 위함)
  const [posts, setPosts] = useState(INITIAL_MOCK_POSTS);
  
  // 글쓰기 모달 상태 관리
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [writeTab, setWriteTab] = useState<'Search' | 'Library'>('Search');
  const [writeSearchQuery, setWriteSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState('');

  // 💡 2. 댓글 모달(Bottom Sheet) 상태 관리
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [activePostForComment, setActivePostForComment] = useState<typeof INITIAL_MOCK_POSTS[0] | null>(null);

  const pinnedMovies = usePinStore(state => state.pinnedMovies);
  const customPlaylists = usePlaylistStore(state => state.customPlaylists);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  // 💡 5. 특정 리뷰 모아보기 검색창 필터링 로직 수정 (# 기반 필터링)
  const filteredPosts = posts.filter(post => {
    if (feedSearchQuery.trim() === '') return true;
    
    // 검색어가 '#'으로 시작하면 해시태그 배열에서 검색
    if (feedSearchQuery.startsWith('#')) {
      const searchTag = feedSearchQuery.toLowerCase();
      return post.hashtags.some(tag => tag.toLowerCase().includes(searchTag));
    }
    
    // 그 외에는 영화 제목이나 본문에서 검색
    return post.movie.title.includes(feedSearchQuery) || post.content.includes(feedSearchQuery);
  });

  useEffect(() => {
    if (writeTab !== 'Search') return; 
    
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
      setWriteTab('Search');
    }, 1000);
  };

  // 💡 1-1. 좋아요 누르기 로직
  const handleToggleLike = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          return {
            ...post,
            isLiked: newIsLiked,
            likes: newIsLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      })
    );
  };

  // 💡 2-1. 댓글 버튼 누르기 로직
  const handleOpenComments = (post: typeof INITIAL_MOCK_POSTS[0]) => {
    setActivePostForComment(post);
    setIsCommentModalVisible(true);
  };

  const renderPost = ({ item }: { item: typeof INITIAL_MOCK_POSTS[0] }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}><Ionicons name="person" size={16} color="#aaa" /></View>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.postTime}>· {item.time}</Text>
        </View>
        {/* 💡 3. 우측 상단 메뉴바(...) 제거함 */}
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
        {/* 💡 1-2. 좋아요 버튼 기능 연결 (눌렸을 때 하트 채워지고 빨간색) */}
        <Pressable style={styles.actionBtn} onPress={() => handleToggleLike(item.id)}>
          <Ionicons 
            name={item.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={item.isLiked ? "#FF5A36" : "#aaa"} 
          />
          <Text style={[styles.actionText, item.isLiked && { color: '#FF5A36' }]}>
            {item.likes}
          </Text>
        </Pressable>
        
        {/* 💡 2-2. 댓글 버튼 기능 연결 */}
        <Pressable style={styles.actionBtn} onPress={() => handleOpenComments(item)}>
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
          placeholder="특정 영화의 리뷰 또는 #해시태그 모아보기..."
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

      {/* 새 글 작성 플로팅 버튼 */}
      <Pressable 
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.9 }] }]} 
        onPress={() => setIsWriteModalVisible(true)}
      >
        <Ionicons name="pencil" size={26} color="#fff" />
      </Pressable>

      {/* --- 글쓰기 모달 --- */}
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
            {!selectedMovie ? (
              <View style={styles.writeSearchSection}>
                <Text style={styles.sectionLabel}>어떤 작품에 대해 이야기할까요?</Text>
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
                  <ScrollView style={styles.libraryScrollBox} nestedScrollEnabled={true}>
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

                    <Text style={[styles.librarySubTitle, { marginTop: 15 }]}>내 재생목록</Text>
                    {customPlaylists && customPlaylists.length > 0 ? customPlaylists.map(playlist => (
                      <Pressable 
                        key={`list-${playlist.id}`} 
                        style={styles.searchResultItem}
                        onPress={() => setSelectedMovie({ 
                          id: playlist.id, title: playlist.name, type: 'playlist', 
                          image: 'https://via.placeholder.com/150/111/FF5A36?text=Playlist' 
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
                placeholder="이 콘텐츠에 대한 생각을 자유롭게 남겨주세요."
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

      {/* 💡 2-3. 댓글 보기 바텀 시트 (모달) */}
      <Modal visible={isCommentModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsCommentModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.commentModalOverlay}>
          <Pressable style={styles.commentModalBackdrop} onPress={() => setIsCommentModalVisible(false)} />
          <View style={styles.commentModalContent}>
            
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>댓글 {activePostForComment?.comments || 0}개</Text>
              <Pressable onPress={() => setIsCommentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            <FlatList
              data={activePostForComment?.commentList || []}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.commentUserAvatar}>
                    <Ionicons name="person" size={14} color="#aaa" />
                  </View>
                  <View style={styles.commentTextContainer}>
                    <Text style={styles.commentUser}>{item.user}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyCommentText}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</Text>}
            />

            {/* 댓글 입력창 */}
            <View style={styles.commentInputRow}>
              <TextInput 
                placeholder="댓글을 입력하세요..." 
                placeholderTextColor="#666" 
                style={styles.commentInput} 
              />
              <Pressable style={styles.commentSubmitBtn}>
                <Text style={styles.commentSubmitText}>등록</Text>
              </Pressable>
            </View>

          </View>
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

  // --- 💡 댓글 모달 스타일 추가 ---
  commentModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  commentModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  commentModalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '65%', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  commentModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  commentModalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentUserAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  commentTextContainer: { flex: 1 },
  commentUser: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  commentText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  emptyCommentText: { color: '#666', textAlign: 'center', marginTop: 30, fontSize: 14 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  commentInput: { flex: 1, backgroundColor: '#111', color: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  commentSubmitBtn: { marginLeft: 10, paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#FF5A36', borderRadius: 20 },
  commentSubmitText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});