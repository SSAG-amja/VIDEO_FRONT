import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  ImageStyle,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type FeedFilter = 'all' | 'playlist' | 'movie';
type SortMode = 'popular' | 'latest';

type MoviePreview = {
  id: string;
  title: string;
  poster: string;
};

type CommunityPost = {
  id: string;
  type: 'playlist' | 'movie';
  user: string;
  handle: string;
  time: string;
  title: string;
  content: string;
  tag: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  movie?: MoviePreview;
  playlist?: {
    title: string;
    description: string;
    saves: number;
    movies: MoviePreview[];
  };
  commentList: { id: string; user: string; text: string }[];
};

const POSTERS = {
  lalaland: 'https://image.tmdb.org/t/p/w500/7BsvSuDQuoqhWmU2fL7W2GOcZHU.jpg',
  everything: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
  spirited: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  parasite: 'https://image.tmdb.org/t/p/w500/7BsvSuDQuoqhWmU2fL7W2GOcZHU.jpg',
  avengers: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  darkKnight: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  pulpFiction: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
  interstellar: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
};

const FALLBACK_POSTERS = Object.values(POSTERS);

function PosterImage({ uri, style, fallbackIndex = 0 }: { uri?: string; style: StyleProp<ImageStyle>; fallbackIndex?: number }) {
  const [hasError, setHasError] = useState(false);
  const fallbackUri = FALLBACK_POSTERS[fallbackIndex % FALLBACK_POSTERS.length];

  return (
    <Image
      source={{ uri: hasError || !uri ? fallbackUri : uri }}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}

const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    type: 'playlist',
    user: '민서',
    handle: '@movie_mins',
    time: '12분 전',
    title: '비 오는 밤의 영화',
    content: '잔잔하지만 너무 처지지는 않는 영화만 골랐어요. 대사가 좋고 여운이 긴 작품 위주입니다.',
    tag: '감성',
    likes: 128,
    comments: 24,
    isLiked: false,
    playlist: {
      title: '비 오는 밤의 영화',
      description: '잔잔한 드라마와 로맨스 8편',
      saves: 47,
      movies: [
        { id: '313369', title: '라라랜드', poster: POSTERS.lalaland },
        { id: '545611', title: '에브리씽 에브리웨어 올 앳 원스', poster: POSTERS.everything },
        { id: '129', title: '센과 치히로의 행방불명', poster: POSTERS.spirited },
      ],
    },
    commentList: [
      { id: 'c1', user: '도윤', text: '이 플리 저장해뒀다가 금요일에 볼게요.' },
      { id: 'c2', user: '혜린', text: '라라랜드 넣은 거 너무 좋다.' },
    ],
  },
  {
    id: 'p2',
    type: 'movie',
    user: '준호',
    handle: '@bongnight',
    time: '34분 전',
    title: '기생충은 다시 봐도 장면 배치가 미쳤네요',
    content: '처음에는 스토리만 봤는데, 다시 보니까 공간을 쓰는 방식이 훨씬 잘 보여요.',
    tag: '다시보기',
    likes: 94,
    comments: 18,
    isLiked: true,
    movie: { id: '496243', title: '기생충', poster: POSTERS.parasite },
    commentList: [
      { id: 'c3', user: '서연', text: '저는 계단 연출 볼 때마다 감탄해요.' },
      { id: 'c4', user: '태오', text: '이 영화는 해석글 읽고 다시 보면 더 재밌음.' },
    ],
  },
  {
    id: 'p3',
    type: 'playlist',
    user: '수아',
    handle: '@action_room',
    time: '1시간 전',
    title: '친구들이랑 틀면 실패 없는 액션 모음',
    content: '중간에 늘어지는 영화 빼고 바로 몰입되는 작품만 모았습니다. 팝콘용으로 추천.',
    tag: '액션',
    likes: 211,
    comments: 31,
    isLiked: false,
    playlist: {
      title: '도파민 액션 10선',
      description: '초반부터 몰아치는 액션 영화',
      saves: 86,
      movies: [
        { id: '299534', title: '어벤져스: 엔드게임', poster: POSTERS.avengers },
        { id: '155', title: '다크 나이트', poster: POSTERS.darkKnight },
        { id: '680', title: '펄프 픽션', poster: POSTERS.pulpFiction },
      ],
    },
    commentList: [
      { id: 'c5', user: '현우', text: '다크 나이트는 언제 봐도 실패가 없죠.' },
      { id: 'c6', user: '민재', text: '매드맥스도 추가하면 딱일 듯.' },
    ],
  },
  {
    id: 'p4',
    type: 'movie',
    user: '유진',
    handle: '@soundtracker',
    time: '2시간 전',
    title: '인터스텔라 OST는 극장에서 들어야 완성되는 듯',
    content: '집에서 볼 때도 좋지만, 극장 사운드로 들으면 감정선이 완전히 달라져요.',
    tag: 'OST',
    likes: 76,
    comments: 9,
    isLiked: false,
    movie: { id: '157336', title: '인터스텔라', poster: POSTERS.interstellar },
    commentList: [
      { id: 'c7', user: '지훈', text: '도킹 장면은 진짜 사운드가 절반.' },
    ],
  },
];

export default function CommunityScreen() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [isWriteOpen, setIsWriteOpen] = useState(false);

  const isSearching = searchQuery.trim().length > 0;
  const featuredPosts = posts.slice(0, 4);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      if (activeFilter !== 'all' && post.type !== activeFilter) return false;
      if (!query) return true;
      return [
        post.title,
        post.content,
        post.user,
        post.tag,
        post.movie?.title,
        post.playlist?.title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'latest') {
        return posts.findIndex((post) => post.id === a.id) - posts.findIndex((post) => post.id === b.id);
      }
      const score = (post: CommunityPost) => post.likes + post.comments * 3 + (post.playlist?.saves ?? 0) * 2;
      return score(b) - score(a);
    });
  }, [activeFilter, posts, searchQuery, sortMode]);

  const toggleFilter = (target: FeedFilter) => {
    setActiveFilter((current) => (current === target ? 'all' : target));
  };

  const toggleLike = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
  };

  const openMovieDetail = (movie?: MoviePreview) => {
    if (!movie) return;
    router.push({
      pathname: '/detail/[id]',
      params: {
        id: movie.id,
        movieData: JSON.stringify({
          id: Number(movie.id),
          title: movie.title,
          posterPath: movie.poster.replace('https://image.tmdb.org/t/p/w500', ''),
          overview: '상세 정보를 불러오는 중입니다...',
        }),
      },
    } as any);
  };

  const renderMiniPosters = (movies: MoviePreview[]) => (
    <View style={styles.miniPosterRow}>
      {movies.slice(0, 3).map((movie, index) => (
        <PosterImage key={movie.id} uri={movie.poster} style={styles.miniPoster} fallbackIndex={index} />
      ))}
    </View>
  );

  const getPostCover = (post: CommunityPost) => post.playlist?.movies[0] ?? post.movie;
  const getPostMovies = (post: CommunityPost) => post.playlist?.movies ?? (post.movie ? [post.movie] : []);

  const renderFeaturedCard = (post: CommunityPost, index: number) => {
    const cover = getPostCover(post);
    const movies = getPostMovies(post);
    if (!cover) return null;

    const label = post.type === 'playlist' ? '오늘 많이 저장한 플리' : '오늘 많이 본 영화';
    const title = post.playlist?.title ?? post.movie?.title ?? post.title;
    const meta = post.type === 'playlist'
      ? `saved ${post.playlist?.saves ?? 0} · comments ${post.comments}`
      : `watched ${post.likes} · comments ${post.comments}`;

    return (
      <Pressable
        key={post.id}
        style={styles.featuredCard}
        onPress={() => (post.movie ? openMovieDetail(post.movie) : setActiveFilter('playlist'))}
      >
        <ImageBackground source={{ uri: cover.poster }} style={styles.featuredImage} imageStyle={styles.featuredImageStyle}>
          <View style={styles.featuredShade}>
            <View style={styles.featuredPosterStack}>
              {movies.slice(0, 4).map((movie, posterIndex) => (
                <PosterImage
                  key={movie.id}
                  uri={movie.poster}
                  fallbackIndex={index + posterIndex}
                  style={[
                    styles.featuredStackPoster,
                    { right: posterIndex * 20, transform: [{ rotate: `${(posterIndex - 1) * 4}deg` }] },
                  ]}
                />
              ))}
            </View>
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredLabel}>{label}</Text>
              <Text style={styles.featuredTitle} numberOfLines={2}>{title}</Text>
              <Text style={styles.featuredSub} numberOfLines={2}>{post.content}</Text>
              <Text style={styles.featuredMeta}>{meta}</Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    );
  };

  const renderFeatured = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={332}
        decelerationRate="fast"
        contentContainerStyle={styles.featuredRow}
      >
        {featuredPosts.map(renderFeaturedCard)}
      </ScrollView>
    );
  };

  const renderContent = (post: CommunityPost) => {
    if (post.type === 'playlist' && post.playlist) {
      return (
        <Pressable style={styles.playlistPreview}>
          {renderMiniPosters(post.playlist.movies)}
          <View style={styles.previewText}>
            <Text style={styles.previewTitle} numberOfLines={1}>{post.playlist.title}</Text>
            <Text style={styles.previewSub} numberOfLines={1}>{post.playlist.description}</Text>
          </View>
          <Ionicons name="bookmark-outline" size={20} color="#FF6B4A" />
        </Pressable>
      );
    }

    return (
      <Pressable style={styles.moviePreview} onPress={() => openMovieDetail(post.movie)}>
        <PosterImage uri={post.movie?.poster} style={styles.moviePoster} fallbackIndex={3} />
        <View style={styles.previewText}>
          <Text style={styles.previewTitle} numberOfLines={1}>{post.movie?.title}</Text>
          <Text style={styles.previewSub}>영화 이야기 보기</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#666" />
      </Pressable>
    );
  };

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.user.slice(0, 1)}</Text>
        </View>
        <View style={styles.author}>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.userMeta}>{item.handle} · {item.time}</Text>
        </View>
        <Text style={styles.postTag}>#{item.tag}</Text>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>{item.content}</Text>
      {renderContent(item)}

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={() => toggleLike(item.id)}>
          <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={20} color={item.isLiked ? '#FF6B4A' : '#999'} />
          <Text style={[styles.actionText, item.isLiked && styles.actionTextActive]}>{item.likes}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => setCommentPost(item)}>
          <Ionicons name="chatbubble-outline" size={18} color="#999" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </Pressable>
        <View style={styles.actionSpacer} />
        <Pressable style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{item.type === 'playlist' ? 'saved' : 'watched'}</Text>
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
        <Ionicons name="search" size={18} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="영화, 플리, 키워드 검색"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {isSearching && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
        ListHeaderComponent={
          <>
            {!isSearching && renderFeatured()}

            <View style={styles.controlBar}>
              <View style={styles.filterGroup}>
                <Pressable
                  style={[styles.filterButton, activeFilter === 'playlist' && styles.filterButtonActive]}
                  onPress={() => toggleFilter('playlist')}
                >
                  <Text style={[styles.filterText, activeFilter === 'playlist' && styles.filterTextActive]}>플리만</Text>
                </Pressable>
                <Pressable
                  style={[styles.filterButton, activeFilter === 'movie' && styles.filterButtonActive]}
                  onPress={() => toggleFilter('movie')}
                >
                  <Text style={[styles.filterText, activeFilter === 'movie' && styles.filterTextActive]}>영화만</Text>
                </Pressable>
              </View>

              <View style={styles.sortGroup}>
                <Pressable onPress={() => setSortMode('popular')}>
                  <Text style={[styles.sortText, sortMode === 'popular' && styles.sortTextActive]}>인기</Text>
                </Pressable>
                <Text style={styles.sortDivider}>·</Text>
                <Pressable onPress={() => setSortMode('latest')}>
                  <Text style={[styles.sortText, sortMode === 'latest' && styles.sortTextActive]}>최신</Text>
                </Pressable>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>조건에 맞는 게시글이 없습니다.</Text>}
      />

      <Pressable style={styles.fab} onPress={() => setIsWriteOpen(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <Modal visible={Boolean(commentPost)} transparent animationType="slide" onRequestClose={() => setCommentPost(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCommentPost(null)} />
          <View style={styles.commentSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>댓글 {commentPost?.comments ?? 0}</Text>
              <Pressable onPress={() => setCommentPost(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            <FlatList
              data={commentPost?.commentList ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{item.user.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentUser}>{item.user}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
            />
            <View style={styles.commentInputRow}>
              <TextInput placeholder="댓글을 입력하세요" placeholderTextColor="#666" style={styles.commentInput} />
              <Pressable style={styles.commentSubmit}>
                <Text style={styles.commentSubmitText}>등록</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isWriteOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsWriteOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.writeModal}>
          <View style={styles.writeHeader}>
            <Pressable onPress={() => setIsWriteOpen(false)}>
              <Text style={styles.writeCancel}>취소</Text>
            </Pressable>
            <Text style={styles.writeTitle}>공유하기</Text>
            <Pressable onPress={() => setIsWriteOpen(false)}>
              <Text style={styles.writeSubmit}>등록</Text>
            </Pressable>
          </View>
          <View style={styles.writeBody}>
            <TextInput
              style={styles.writeInput}
              multiline
              placeholder="어떤 영화나 플리를 추천하고 싶나요?"
              placeholderTextColor="#666"
            />
            <View style={styles.shareTypeRow}>
              <Pressable style={styles.shareType}>
                <Ionicons name="albums-outline" size={20} color="#FF6B4A" />
                <Text style={styles.shareTypeText}>플리</Text>
              </Pressable>
              <Pressable style={styles.shareType}>
                <Ionicons name="film-outline" size={20} color="#FF6B4A" />
                <Text style={styles.shareTypeText}>영화</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090909', paddingTop: 58 },
  header: { paddingHorizontal: 20, marginBottom: 14 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, marginHorizontal: 20, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#151515', borderWidth: 1, borderColor: '#242424' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  feedContent: { paddingBottom: 110 },
  featuredRow: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  featuredCard: { width: 320, height: 214, borderRadius: 18, overflow: 'hidden', backgroundColor: '#151515' },
  featuredImage: { flex: 1 },
  featuredImageStyle: { borderRadius: 18 },
  featuredShade: { flex: 1, justifyContent: 'flex-end', padding: 18, backgroundColor: 'rgba(0,0,0,0.52)' },
  featuredCopy: { width: '68%', zIndex: 2 },
  featuredLabel: { color: '#FFB199', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  featuredTitle: { color: '#fff', fontSize: 25, lineHeight: 31, fontWeight: '900', marginBottom: 8 },
  featuredSub: { color: '#ddd', fontSize: 13, lineHeight: 19 },
  featuredMeta: { color: '#ddd', fontSize: 12, fontWeight: '700', marginTop: 14 },
  featuredPosterStack: { position: 'absolute', right: 14, bottom: 22, width: 132, height: 146 },
  featuredStackPoster: { position: 'absolute', bottom: 0, width: 76, height: 118, borderRadius: 10, backgroundColor: '#222', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  miniPosterRow: { flexDirection: 'row', alignItems: 'center', width: 88 },
  miniPoster: { width: 38, height: 56, borderRadius: 7, marginRight: -13, backgroundColor: '#222', borderWidth: 1, borderColor: '#101010' },
  controlBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 16, marginBottom: 2 },
  filterGroup: { flexDirection: 'row', gap: 8 },
  filterButton: { height: 34, paddingHorizontal: 13, borderRadius: 17, justifyContent: 'center', backgroundColor: '#151515', borderWidth: 1, borderColor: '#292929' },
  filterButtonActive: { backgroundColor: '#FF6B4A', borderColor: '#FF6B4A' },
  filterText: { color: '#aaa', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  sortGroup: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sortText: { color: '#777', fontSize: 13, fontWeight: '800' },
  sortTextActive: { color: '#fff' },
  sortDivider: { color: '#444', fontSize: 13 },
  postCard: { marginHorizontal: 20, marginTop: 14, padding: 15, backgroundColor: '#121212', borderRadius: 16, borderWidth: 1, borderColor: '#242424' },
  postTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  author: { flex: 1 },
  userName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  userMeta: { color: '#777', fontSize: 12, marginTop: 2 },
  postTag: { color: '#FF8B70', fontSize: 12, fontWeight: '800' },
  postTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 7 },
  postContent: { color: '#cfcfcf', fontSize: 14, lineHeight: 21, marginBottom: 13 },
  playlistPreview: { flexDirection: 'row', alignItems: 'center', minHeight: 76, padding: 10, borderRadius: 12, backgroundColor: '#191919', marginBottom: 13 },
  moviePreview: { flexDirection: 'row', alignItems: 'center', minHeight: 76, padding: 10, borderRadius: 12, backgroundColor: '#191919', marginBottom: 13 },
  moviePoster: { width: 42, height: 62, borderRadius: 7, backgroundColor: '#222', marginRight: 12 },
  previewText: { flex: 1, minWidth: 0 },
  previewTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  previewSub: { color: '#777', fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 18 },
  actionText: { color: '#999', fontSize: 13, fontWeight: '700' },
  actionTextActive: { color: '#FF6B4A' },
  actionSpacer: { flex: 1 },
  saveButton: { height: 31, paddingHorizontal: 12, borderRadius: 15, backgroundColor: '#211715', justifyContent: 'center' },
  saveButtonText: { color: '#FF8B70', fontSize: 12, fontWeight: '800' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40 },
  fab: { position: 'absolute', right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF6B4A', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  commentSheet: { height: '66%', backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 18 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#333' },
  commentTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  commentItem: { flexDirection: 'row', paddingVertical: 14 },
  commentAvatar: { width: 31, height: 31, borderRadius: 16, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  commentAvatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  commentBody: { flex: 1 },
  commentUser: { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 3 },
  commentText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333' },
  commentInput: { flex: 1, minHeight: 42, borderRadius: 21, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', color: '#fff', paddingHorizontal: 14 },
  commentSubmit: { paddingHorizontal: 15, height: 42, borderRadius: 21, backgroundColor: '#FF6B4A', justifyContent: 'center' },
  commentSubmitText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  writeModal: { flex: 1, backgroundColor: '#0a0a0a' },
  writeHeader: { height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#222' },
  writeCancel: { color: '#aaa', fontSize: 15 },
  writeTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  writeSubmit: { color: '#FF6B4A', fontSize: 15, fontWeight: '800' },
  writeBody: { padding: 20 },
  writeInput: { minHeight: 160, color: '#fff', fontSize: 15, lineHeight: 22, textAlignVertical: 'top', borderRadius: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#282828', padding: 14, marginBottom: 14 },
  shareTypeRow: { flexDirection: 'row', gap: 10 },
  shareType: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#282828', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareTypeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
