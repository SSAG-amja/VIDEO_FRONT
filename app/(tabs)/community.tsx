import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  CommunityPost,
  CreatePostPayload,
  createPostApi,
  deletePostApi,
  fetchPostsApi,
  likePostApi,
  MoviePreview,
  reportPostApi,
  unlikePostApi,
  updatePostApi,
} from '../../api/posts';
import PostWriteModal from '../../components/PostWriteModal';
import PollWidget from '../../components/PollWidget';
import ReportModal from '../../components/ReportModal';
import KeyboardAccessory, { KEYBOARD_ACCESSORY_ID } from '../../components/KeyboardAccessory';

type FeedFilter = 'all' | 'playlist' | 'movie';
type SortMode = 'popular' | 'latest';

// 2026.05.18 박현식
// 포스터 로딩 실패 시 기본 이미지를 대신 표시한다.
function PosterImage({ uri, style }: { uri?: string; style: any }) {
  const [hasError, setHasError] = useState(false);
  return (
    <Image
      source={{ uri: hasError || !uri ? 'https://via.placeholder.com/160x240?text=No+Image' : uri }}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}

export default function CommunityScreen() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 2026.08.14 임재준: 당겨서 새로고침 상태
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2026.08.22 임재준: 게시글 신고 모달 상태
  const [reportingPost, setReportingPost] = useState<CommunityPost | null>(null);

  // 2026.08.14 임재준
  // 피드 목록에서 스포일러 가림막을 클릭해 내용을 열람한 게시물 ID 목록을 관리한다.
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  // 2026.08.14 임재준
  // 스포일러 가림막 클릭 시 해당 게시물의 본문 가림 상태를 토글한다.
  const toggleRevealSpoiler = (postId: string, event: any) => {
    event.stopPropagation();
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  // 2026.05.18 박현식
  // 커뮤니티 게시물 목록을 API에서 불러와 화면 상태에 반영한다.
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setPosts(await fetchPostsApi());
    } catch (error) {
      console.error('Post API Load Error:', error);
      Alert.alert('오류', '게시물을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2026.08.14 임재준
  // 화면을 위에서 아래로 당겼을 때 최신 커뮤니티 게시물 목록을 새로고침한다.
  const onRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setPosts(await fetchPostsApi());
    } catch (error) {
      console.error('Post API Refresh Error:', error);
      Alert.alert('오류', '게시물을 새로고침하지 못했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 2026.08.14 임재준 수정: 상세 화면에서 뒤로 돌아왔을 때 재로딩 및 스크롤 초기화가 되지 않도록 최초 1회만 로드
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 2026.05.18 박현식
  // 목록에 떠 있는 동일 게시물 상태를 갱신한다.
  const syncPost = (updated: CommunityPost) => {
    setPosts((current) => current.map((post) => (post.id === updated.id ? updated : post)));
  };

  // 2026.05.18 박현식
  // 새 게시물 작성 모달을 생성 모드로 연다.
  const openWriteModal = () => {
    setEditingPost(null);
    setIsWriteOpen(true);
  };

  // 2026.05.18 박현식
  // 게시물 작성 API를 호출하고 성공 시 피드 맨 위에 추가한다.
  const submitPost = async (payload: CreatePostPayload) => {
    try {
      setIsSubmitting(true);
      const created = await createPostApi(payload);
      setPosts((current) => [created, ...current]);
      setIsWriteOpen(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Create Post API Error:', error);
      Alert.alert('등록 실패', '게시물을 등록하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2026.05.18 박현식
  // 게시물 수정 API를 호출하고 성공 시 기존 카드 상태를 교체한다.
  const submitEditPost = async (payload: CreatePostPayload) => {
    if (!editingPost) return;
    try {
      setIsSubmitting(true);
      const updated = await updatePostApi(editingPost.id, {
        post_title: payload.post_title,
        post_content: payload.post_content,
        hashtags: payload.hashtags,
      });
      syncPost(updated);
      setEditingPost(null);
      setIsWriteOpen(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Update Post API Error:', error);
      Alert.alert('수정 실패', '게시물을 수정하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2026.08.22 임재준
  // 게시물 신고 API를 호출하고 모달 상태를 초기화한다.
  const handleReportPost = async (reason: string, details?: string) => {
    if (!reportingPost) return;
    await reportPostApi(reportingPost.id, reason, details);
  };

  // 2026.05.18 박현식
  // 필터, 검색어, 정렬 기준을 적용해 화면에 표시할 게시물 목록을 계산한다.
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      if (activeFilter !== 'all' && post.type !== activeFilter) return false;
      if (!query) return true;
      return [post.title, post.content, post.user, post.tag, post.movie?.title, post.playlist?.title, ...post.hashtags]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'latest') {
        return posts.findIndex((post) => post.id === a.id) - posts.findIndex((post) => post.id === b.id);
      }
      return b.likes + b.comments * 3 - (a.likes + a.comments * 3);
    });
  }, [activeFilter, posts, searchQuery, sortMode]);

  const featuredPosts = posts.slice(0, 4);
  const isSearching = searchQuery.trim().length > 0;

  // 2026.05.18 박현식
  // 좋아요 상태를 낙관적으로 바꾸고 서버 응답으로 최종 값을 보정한다.
  const toggleLike = async (postId: string) => {
    const target = posts.find((post) => post.id === postId);
    if (!target) return;

    const previous = posts;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );

    try {
      const result = target.isLiked ? await unlikePostApi(postId) : await likePostApi(postId);
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, likes: result.post_likes, isLiked: result.post_is_liked }
            : post
        )
      );
    } catch (error) {
      console.error('Post Like API Error:', error);
      setPosts(previous);
      Alert.alert('오류', '좋아요 상태를 변경하지 못했습니다.');
    }
  };

  // 2026.05.18 박현식
  // 커뮤니티 카드의 영화 미리보기에서 영화 상세 화면으로 이동한다.
  const openMovieDetail = (movie?: MoviePreview) => {
    if (!movie) return;
    router.push({
      pathname: '/detail/[id]',
      params: {
        id: movie.id,
        movieData: JSON.stringify({ id: Number(movie.id), title: movie.title, posterPath: movie.posterPath }),
      },
    } as any);
  };

  // 2026.05.18 박현식
  // 게시물 삭제 확인창을 띄우고 삭제 실패 시 이전 목록으로 되돌린다.
  const confirmDeletePost = (post: CommunityPost) => {
    Alert.alert('게시물 삭제', '게시물을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const previous = posts;
          setPosts((current) => current.filter((item) => item.id !== post.id));
          try {
            await deletePostApi(post.id);
          } catch (error) {
            console.error('Delete Post API Error:', error);
            setPosts(previous);
            Alert.alert('삭제 실패', '게시물을 삭제하지 못했습니다.');
          }
        },
      },
    ]);
  };

  // 2026.05.18 박현식
  // 내 게시물을 수정 모드로 열어 기존 내용을 작성 모달에 채운다.
  const openEditPost = (post: CommunityPost) => {
    setEditingPost(post);
    setIsWriteOpen(true);
  };

  // 2026.06.05 임재준
  // 커뮤니티 게시물 카드를 눌렀을 때 게시물 상세 화면으로 이동한다.
  const openPostDetail = (post: CommunityPost) => {
    router.push({
      pathname: '/community/[id]',
      params: {
        id: post.id,
      },
    } as any);
  };

  // 2026.05.18 박현식
  // 공유 플레이리스트 카드에 들어갈 작은 포스터 묶음을 그린다.
  const renderMiniPosters = (movies: MoviePreview[]) => (
    <View style={styles.miniPosterRow}>
      {movies.slice(0, 3).map((movie) => (
        <PosterImage key={movie.id} uri={movie.poster} style={styles.miniPoster} />
      ))}
    </View>
  );

  // 2026.05.18 박현식
  // 상단 가로 추천 영역의 게시물 카드를 렌더링한다.
  // 2026.06.05 임재준
  // 추천 카드 클릭 시 게시물 상세 화면으로 이동하도록 변경한다.
  const renderFeaturedCard = (post: CommunityPost) => {
    const cover = post.playlist?.movies[0] ?? post.movie;
    const movies = post.playlist?.movies ?? (post.movie ? [post.movie] : []);
    if (!cover) return null;

    return (
      <Pressable
        key={post.id}
        style={styles.featuredCard}
        onPress={() => openPostDetail(post)}
      >
        <Image source={{ uri: cover.poster }} style={styles.featuredImage} />
        <View style={styles.featuredShade}>
          <View style={styles.featuredPosterStack}>
            {movies.slice(0, 4).map((movie, index) => (
              <PosterImage key={movie.id} uri={movie.poster} style={[styles.featuredStackPoster, { right: index * 20 }]} />
            ))}
          </View>
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredLabel}>{post.type === 'playlist' ? '공유 플레이리스트' : '영화 이야기'}</Text>
            <Text style={styles.featuredTitle} numberOfLines={2}>{post.playlist?.title ?? post.movie?.title ?? post.title}</Text>
            <Text style={styles.featuredSub} numberOfLines={2}>{post.content}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  // 2026.05.18 박현식
  // 게시물 타입에 맞춰 영화 상세 또는 공유 플레이리스트 이동 미리보기를 렌더링한다.
  const renderContent = (post: CommunityPost) => {
    if (post.type === 'playlist' && post.playlist) {
      return (
        <Pressable
          style={styles.playlistPreview}
          onPress={(event) => {
            event.stopPropagation();
            router.push({
              pathname: '/playlist/[id]',
              params: {
                id: post.playlist!.id,
                sharedPlaylist: JSON.stringify(post.playlist),
              },
            } as any);
          }}
        >
          {renderMiniPosters(post.playlist.movies)}
          <View style={styles.previewText}>
            <Text style={styles.previewTitle} numberOfLines={1}>{post.playlist.title}</Text>
            <Text style={styles.previewSub} numberOfLines={1}>플레이리스트</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </Pressable>
      );
    }

    return (
      <Pressable
        style={styles.moviePreview}
        onPress={(event) => {
          event.stopPropagation();
          openMovieDetail(post.movie);
        }}
      >
        <PosterImage uri={post.movie?.poster} style={styles.moviePoster} />
        <View style={styles.previewText}>
          <Text style={styles.previewTitle} numberOfLines={1}>{post.movie?.title}</Text>
          <Text style={styles.previewSub}>영화 이야기 보기</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#666" />
      </Pressable>
    );
  };

  // 2026.05.18 박현식
  // 커뮤니티 피드의 단일 게시물 카드를 렌더링한다.
  // 2026.06.05 임재준
  // 게시물 카드 전체에 상세 화면 이동 onPress를 적용한다.
  // 2026.08.14 임재준
  // 스포일러 태그가 포함된 게시물일 경우 피드 화면에서는 본문을 완전히 가리고 상세 페이지 유도 가림막을 표시한다.
  // 2026.08.22 임재준
  // 타인 게시물의 경우 우측 상단에 신고 버튼을 노출한다.
  const renderPost = ({ item }: { item: CommunityPost }) => {
    const isSpoilerPost = item.hashtags?.some((tag) => tag.includes('스포일러') || tag.includes('스포'));

    return (
      <Pressable style={styles.postCard} onPress={() => openPostDetail(item)}>
        <View style={styles.postTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.user.slice(0, 1)}</Text>
          </View>
          <View style={styles.author}>
            <Text style={styles.userName}>{item.user}</Text>
            <Text style={styles.userMeta}>{item.time}</Text>
          </View>

          {/* 2026.08.14 임재준: 스포일러 뱃지 */}
          {isSpoilerPost && (
            <View style={styles.spoilerBadge}>
              <Text style={styles.spoilerBadgeText}>⚠️ 스포일러</Text>
            </View>
          )}

          {item.isMine ? (
            <View style={styles.ownerActions}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  openEditPost(item);
                }}
                style={styles.iconButton}
              >
                <Ionicons name="create-outline" size={18} color="#aaa" />
              </Pressable>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  confirmDeletePost(item);
                }}
                style={styles.iconButton}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6B4A" />
              </Pressable>
            </View>
          ) : (
            /* 2026.08.22 임재준: 타인 게시글 신고 버튼 */
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                setReportingPost(item);
              }}
              style={styles.iconButton}
            >
              <Ionicons name="flag-outline" size={16} color="#777" />
            </Pressable>
          )}
        </View>

        <Text style={styles.postTitle}>{item.title}</Text>

        {/* 2026.08.14 임재준: 피드 화면에서는 스포일러 글의 본문을 노출하지 않고 상세 이동 가림막으로 고정 표시 */}
        {isSpoilerPost ? (
          <View style={styles.spoilerOverlay}>
            <Ionicons name="eye-off-outline" size={16} color="#FF6B4A" />
            <Text style={styles.spoilerOverlayText} numberOfLines={1}>
              스포일러가 포함된 글입니다 (상세보기)
            </Text>
          </View>
        ) : (
          <Text style={styles.postContent} numberOfLines={2}>{item.content}</Text>
        )}

        {/* 2026.08.14 임재준: 첨부된 투표가 있는 경우 투표 위젯 렌더링 */}
        {item.poll && (
          <PollWidget
            postId={item.id}
            poll={item.poll}
            onVoted={(updatedPoll) => {
              syncPost({ ...item, poll: updatedPoll });
            }}
          />
        )}

        {renderContent(item)}

        <View style={styles.actionRow}>
          <Pressable
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              toggleLike(item.id);
            }}
          >
            <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={20} color={item.isLiked ? '#FF6B4A' : '#999'} />
            <Text style={[styles.actionText, item.isLiked && styles.actionTextActive]}>{item.likes}</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              openPostDetail(item);
            }}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#999" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="영화, 플레이리스트, 해시태그 검색"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        />
        {isSearching ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B4A" />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
          /* 2026.08.14 임재준: 당겨서 새로고침 RefreshControl 연결 */
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B4A"
              colors={['#FF6B4A']}
            />
          }
          ListHeaderComponent={
            <>
              {!isSearching && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
                  {featuredPosts.map(renderFeaturedCard)}
                </ScrollView>
              )}
              <View style={styles.controlBar}>
                <View style={styles.filterGroup}>
                  <Pressable
                    style={[styles.filterButton, activeFilter === 'playlist' && styles.filterButtonActive]}
                    onPress={() => setActiveFilter(activeFilter === 'playlist' ? 'all' : 'playlist')}
                  >
                    <Text style={[styles.filterText, activeFilter === 'playlist' && styles.filterTextActive]}>플리만</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.filterButton, activeFilter === 'movie' && styles.filterButtonActive]}
                    onPress={() => setActiveFilter(activeFilter === 'movie' ? 'all' : 'movie')}
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
          ListEmptyComponent={<Text style={styles.emptyText}>조건에 맞는 게시물이 없습니다.</Text>}
        />
      )}

      <Pressable style={styles.fab} onPress={openWriteModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <PostWriteModal
        visible={isWriteOpen}
        title={editingPost ? '게시물 수정' : '공유하기'}
        submitLabel={editingPost ? '수정' : '등록'}
        submittingLabel={editingPost ? '수정 중' : '등록 중'}
        initialType={editingPost?.type ?? 'movie'}
        initialMovie={editingPost?.movie ?? null}
        initialPlaylist={
          editingPost?.playlist
            ? {
                id: editingPost.playlist.id,
                title: editingPost.playlist.title,
                movies: editingPost.playlist.movies,
              }
            : null
        }
        initialTitle={editingPost?.title ?? ''}
        initialContent={editingPost?.content ?? ''}
        initialHashtags={editingPost?.hashtags}
        lockTarget={Boolean(editingPost)}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsWriteOpen(false);
          setEditingPost(null);
        }}
        onSubmit={editingPost ? submitEditPost : submitPost}
      />

      {/* 2026.08.22 임재준: 게시글 신고 모달 */}
      <ReportModal
        visible={Boolean(reportingPost)}
        targetType="post"
        onClose={() => setReportingPost(null)}
        onSubmit={handleReportPost}
      />

      <KeyboardAccessory />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090909', paddingTop: 58 },
  header: { paddingHorizontal: 20, marginBottom: 14 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, marginHorizontal: 20, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#151515', borderWidth: 1, borderColor: '#242424' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  feedContent: { paddingBottom: 110 },
  featuredRow: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  featuredCard: { width: 320, height: 214, borderRadius: 18, overflow: 'hidden', backgroundColor: '#151515' },
  featuredImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featuredShade: { flex: 1, justifyContent: 'flex-end', padding: 18, backgroundColor: 'rgba(0,0,0,0.58)' },
  featuredCopy: { width: '68%', zIndex: 2 },
  featuredLabel: { color: '#FFB199', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  featuredTitle: { color: '#fff', fontSize: 23, lineHeight: 29, fontWeight: '900', marginBottom: 8 },
  featuredSub: { color: '#ddd', fontSize: 13, lineHeight: 19 },
  featuredPosterStack: { position: 'absolute', right: 14, bottom: 22, width: 132, height: 146 },
  featuredStackPoster: { position: 'absolute', bottom: 0, width: 76, height: 118, borderRadius: 10, backgroundColor: '#222', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  miniPosterRow: { flexDirection: 'row', alignItems: 'center', width: 88 },
  miniPoster: { width: 38, height: 56, borderRadius: 7, marginRight: -13, backgroundColor: '#222', borderWidth: 1, borderColor: '#101010' },
  controlBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 16 },
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
  spoilerBadge: { backgroundColor: 'rgba(255,77,77,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 6 },
  spoilerBadgeText: { color: '#FF6B6B', fontSize: 11, fontWeight: '800' },
  ownerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { padding: 8 },
  postTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 7 },
  postContent: { color: '#cfcfcf', fontSize: 14, lineHeight: 21, marginBottom: 13 },
  spoilerOverlay: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 13 },
  spoilerOverlayText: { flex: 1, color: '#bbb', fontSize: 13, fontWeight: '700' },
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
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40 },
  fab: { position: 'absolute', right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF6B4A', justifyContent: 'center', alignItems: 'center', elevation: 6 },
});