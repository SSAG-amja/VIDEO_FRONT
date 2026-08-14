import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CommunityPost,
  CommunityReply,
  createReplyApi,
  deleteReplyApi,
  fetchPostApi,
  likePostApi,
  likeReplyApi,
  MoviePreview,
  unlikePostApi,
  unlikeReplyApi,
  updateReplyApi,
} from '../../api/posts';
import KeyboardAccessory, {
  KEYBOARD_ACCESSORY_ID,
} from '../../components/KeyboardAccessory';

// 2026.06.05 임재준
// 포스터 이미지 로딩 실패 시 기본 이미지를 표시한다.
function PosterImage({ uri, style }: { uri?: string; style: any }) {
  const [hasError, setHasError] = useState(false);

  return (
    <Image
      source={{
        uri:
          hasError || !uri
            ? 'https://via.placeholder.com/160x240?text=No+Image'
            : uri,
      }}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}

// 2026.08.14 임재준
// 텍스트 내 @유저태그 부분을 파싱하여 하이라이트 스타일을 적용한다.
function HighlightedCommentText({ text }: { text: string }) {
  const parts = text.split(/(@[^\s]+)/g);

  return (
    <Text style={styles.commentText}>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <Text key={index} style={styles.mentionText}>
              {part}{' '}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}

export default function CommunityDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [editingReply, setEditingReply] = useState<CommunityReply | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommunityReply | null>(null); // 2026.08.14 임재준: 대댓글 대상 상태
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);

  // 2026.06.05 임재준
  // 게시물 상세 정보를 불러와 본문, 좋아요, 댓글 목록을 한 화면에 표시한다.
  const loadPostDetail = useCallback(async () => {
    if (!id) {
      Alert.alert('오류', '게시물 정보를 찾을 수 없습니다.');
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const detail = await fetchPostApi(id);
      setPost(detail);
    } catch (error) {
      console.error('Community Detail Load Error:', error);
      Alert.alert('오류', '게시물을 불러오지 못했습니다.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPostDetail();
  }, [loadPostDetail]);

  // 2026.08.14 임재준
  // 부모 댓글 바로 아래에 대댓글(대댓글의 답글 포함)들이 순서대로 올 수 있도록 계층형 목록을 구성한다.
  const structuredComments = useMemo(() => {
    if (!post?.commentList) return [];

    const commentMap = new Map<string, CommunityReply>();
    const rootComments: CommunityReply[] = [];
    const childMap = new Map<string, CommunityReply[]>();

    post.commentList.forEach((comment) => {
      commentMap.set(String(comment.id), comment);
    });

    post.commentList.forEach((comment) => {
      if (!comment.parentId) {
        rootComments.push(comment);
      } else {
        let currentParentId = String(comment.parentId);
        while (commentMap.has(currentParentId) && commentMap.get(currentParentId)?.parentId) {
          currentParentId = String(commentMap.get(currentParentId)!.parentId);
        }
        const children = childMap.get(currentParentId) || [];
        children.push(comment);
        childMap.set(currentParentId, children);
      }
    });

    const orderedList: CommunityReply[] = [];
    rootComments.forEach((root) => {
      orderedList.push(root);
      const children = childMap.get(String(root.id)) || [];
      orderedList.push(...children);
    });

    const addedIds = new Set(orderedList.map((item) => String(item.id)));
    post.commentList.forEach((item) => {
      if (!addedIds.has(String(item.id))) {
        orderedList.push(item);
      }
    });

    return orderedList;
  }, [post?.commentList]);

  // 2026.06.05 임재준
  // 상세 화면에서 좋아요 상태를 즉시 반영하고 서버 응답으로 최종 값을 보정한다.
  const toggleLike = async () => {
    if (!post || isLikeSubmitting) return;

    const previous = post;
    const optimisticPost = {
      ...post,
      isLiked: !post.isLiked,
      likes: post.isLiked ? post.likes - 1 : post.likes + 1,
    };

    setPost(optimisticPost);

    try {
      setIsLikeSubmitting(true);

      const result = post.isLiked
        ? await unlikePostApi(post.id)
        : await likePostApi(post.id);

      setPost((current) =>
        current
          ? {
              ...current,
              likes: result.post_likes,
              isLiked: result.post_is_liked,
            }
          : current
      );
    } catch (error) {
      console.error('Post Like API Error:', error);
      setPost(previous);
      Alert.alert('오류', '좋아요 상태를 변경하지 못했습니다.');
    } finally {
      setIsLikeSubmitting(false);
    }
  };

  // 2026.08.14 임재준
  // 댓글 좋아요 상태를 낙관적으로 변경하고 서버 API를 호출하여 최종 값을 보정한다.
  const toggleReplyLike = async (reply: CommunityReply) => {
    if (!post) return;

    const previousComments = post.commentList;
    const targetIsLiked = Boolean(reply.isLiked);

    setPost((current) => {
      if (!current) return current;
      return {
        ...current,
        commentList: current.commentList.map((item) => {
          if (item.id === reply.id) {
            const currentLikes = item.likes ?? 0;
            return {
              ...item,
              isLiked: !targetIsLiked,
              likes: !targetIsLiked ? currentLikes + 1 : Math.max(currentLikes - 1, 0),
            };
          }
          return item;
        }),
      };
    });

    try {
      const result = targetIsLiked
        ? await unlikeReplyApi(post.id, reply.id)
        : await likeReplyApi(post.id, reply.id);

      setPost((current) => {
        if (!current) return current;
        return {
          ...current,
          commentList: current.commentList.map((item) =>
            item.id === reply.id
              ? {
                  ...item,
                  likes: result.reply_likes,
                  isLiked: result.reply_is_liked,
                }
              : item
          ),
        };
      });
    } catch (error) {
      console.error('Reply Like API Error:', error);
      setPost((current) => (current ? { ...current, commentList: previousComments } : current));
      Alert.alert('오류', '댓글 좋아요 상태를 변경하지 못했습니다.');
    }
  };

  // 2026.06.05 임재준
  // 2026.08.14 임재준 수정: 대댓글(최상위 부모 ID 매핑) 및 유저 태그 포함 등록 처리
  // 댓글 작성 또는 수정 후 상세 화면의 댓글 목록과 댓글 수를 즉시 갱신한다.
  const submitReply = async () => {
    if (!post) return;

    const content = commentText.trim();

    if (!content) {
      Alert.alert('확인', '댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setIsReplySubmitting(true);

      const targetParentId = replyingTo
        ? (replyingTo.parentId ? replyingTo.parentId : replyingTo.id)
        : undefined;

      const reply = editingReply
        ? await updateReplyApi(post.id, editingReply.id, {
            reply_content: content,
          })
        : await createReplyApi(post.id, {
            reply_content: content,
            ...(targetParentId ? { parent_id: targetParentId } : {}),
          });

      setPost((current) => {
        if (!current) return current;

        const nextComments = editingReply
          ? current.commentList.map((item) =>
              item.id === reply.id ? { ...item, ...reply } : item
            )
          : [...current.commentList, reply];

        return {
          ...current,
          commentList: nextComments,
          comments: editingReply ? current.comments : current.comments + 1,
        };
      });

      setCommentText('');
      setEditingReply(null);
      setReplyingTo(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Reply Submit API Error:', error);
      Alert.alert(
        editingReply ? '수정 실패' : '등록 실패',
        '댓글을 저장하지 못했습니다.'
      );
    } finally {
      setIsReplySubmitting(false);
    }
  };

  // 2026.06.05 임재준
  // 선택한 댓글을 입력창에 올려 수정 모드로 전환한다.
  const startEditReply = (reply: CommunityReply) => {
    setReplyingTo(null);
    setEditingReply(reply);
    setCommentText(reply.text);
  };

  // 2026.08.14 임재준
  // 댓글 수정 전 확인 알림창을 띄우고 승인 시 수정 모드로 전환한다.
  const confirmEditReply = (reply: CommunityReply) => {
    Alert.alert('댓글 수정', '댓글을 수정하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '수정',
        onPress: () => startEditReply(reply),
      },
    ]);
  };

  // 2026.06.05 임재준
  // 댓글 수정 모드를 취소하고 입력값을 초기화한다.
  const cancelEditReply = () => {
    setEditingReply(null);
    setCommentText('');
  };

  // 2026.08.14 임재준
  // 특정 댓글에 대한 대댓글(답글) 작성 모드로 전환하고 @유저태그를 입력창에 자동 입력한다.
  const startReplyToUser = (targetReply: CommunityReply) => {
    setEditingReply(null);
    setReplyingTo(targetReply);
    setCommentText(`@${targetReply.user} `);
  };

  // 2026.08.14 임재준
  // 대댓글(답글) 작성 모드를 취소하고 입력값을 초기화한다.
  const cancelReplyToUser = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  // 2026.06.05 임재준
  // 2026.08.14 임재준 수정: 본 댓글 삭제 시 종속된 모든 대댓글도 함께 삭제하고 총 댓글 수를 올바르게 차감한다.
  const confirmDeleteReply = (reply: CommunityReply) => {
    if (!post) return;

    Alert.alert('댓글 삭제', '댓글을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReplyApi(post.id, reply.id);

            setPost((current) => {
              if (!current) return current;

              // 삭제할 대상 댓글 및 해당 댓글에 종속된 모든 하위 대댓글 ID 탐색 및 수집
              const targetIds = new Set<string>([String(reply.id)]);
              let hasNewChild = true;
              while (hasNewChild) {
                hasNewChild = false;
                current.commentList.forEach((item) => {
                  if (item.parentId && targetIds.has(String(item.parentId)) && !targetIds.has(String(item.id))) {
                    targetIds.add(String(item.id));
                    hasNewChild = true;
                  }
                });
              }

              const nextCommentList = current.commentList.filter(
                (item) => !targetIds.has(String(item.id))
              );

              return {
                ...current,
                commentList: nextCommentList,
                comments: Math.max(current.comments - targetIds.size, 0),
              };
            });

            if (editingReply?.id === reply.id) {
              cancelEditReply();
            }
            if (replyingTo?.id === reply.id) {
              cancelReplyToUser();
            }
          } catch (error) {
            console.error('Delete Reply API Error:', error);
            Alert.alert('삭제 실패', '댓글을 삭제하지 못했습니다.');
          }
        },
      },
    ]);
  };

  // 2026.06.05 임재준
  // 영화 미리보기 클릭 시 영화 상세 화면으로 이동한다.
  const openMovieDetail = (movie?: MoviePreview) => {
    if (!movie) return;

    router.push({
      pathname: '/detail/[id]',
      params: {
        id: movie.id,
        movieData: JSON.stringify({
          id: Number(movie.id),
          title: movie.title,
          posterPath: movie.posterPath,
        }),
      },
    } as any);
  };

  // 2026.06.05 임재준
  // 공유 플레이리스트의 포스터 묶음을 렌더링한다.
  const renderMiniPosters = (movies: MoviePreview[]) => (
    <View style={styles.miniPosterRow}>
      {movies.slice(0, 3).map((movie) => (
        <PosterImage
          key={movie.id}
          uri={movie.poster}
          style={styles.miniPoster}
        />
      ))}
    </View>
  );

  // 2026.06.05 임재준
  // 게시물 타입에 따라 영화 또는 플레이리스트 미리보기를 렌더링한다.
  const renderLinkedContent = () => {
    if (!post) return null;

    if (post.type === 'playlist' && post.playlist) {
      return (
        <Pressable
          style={styles.playlistPreview}
          onPress={() =>
            router.push({
              pathname: '/playlist/[id]',
              params: {
                id: post.playlist!.id,
                sharedPlaylist: JSON.stringify(post.playlist),
              },
            } as any)
          }
        >
          {renderMiniPosters(post.playlist.movies)}

          <View style={styles.previewText}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {post.playlist.title}
            </Text>
            <Text style={styles.previewSub} numberOfLines={1}>
              플레이리스트
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#666" />
        </Pressable>
      );
    }

    return (
      <Pressable
        style={styles.moviePreview}
        onPress={() => openMovieDetail(post.movie)}
      >
        <PosterImage uri={post.movie?.poster} style={styles.moviePoster} />

        <View style={styles.previewText}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {post.movie?.title}
          </Text>
          <Text style={styles.previewSub}>영화 이야기 보기</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#666" />
      </Pressable>
    );
  };

  // 2026.06.05 임재준
  // 상세 화면 상단의 게시물 본문 영역을 카드 없이 자연스럽게 렌더링한다.
  const renderPostHeader = () => {
    if (!post) return null;

    return (
      <View>
        <View style={styles.postSection}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{post.user.slice(0, 1)}</Text>
            </View>

            <View style={styles.author}>
              <Text style={styles.userName}>{post.user}</Text>
              <Text style={styles.userMeta}>{post.time}</Text>
            </View>
          </View>

          <Text style={styles.postTitle}>{post.title}</Text>

          <Text style={styles.postContent}>{post.content}</Text>

          {post.hashtags?.length > 0 && (
            <View style={styles.hashtagRow}>
              {post.hashtags.map((tag) => (
                <Text key={tag} style={styles.hashtagText}>
                  #{tag}
                </Text>
              ))}
            </View>
          )}

          {renderLinkedContent()}

          <View style={styles.detailActionRow}>
            <Pressable style={styles.actionButton} onPress={toggleLike}>
              <Ionicons
                name={post.isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={post.isLiked ? '#FF6B4A' : '#999'}
              />

              <Text
                style={[
                  styles.actionText,
                  post.isLiked && styles.actionTextActive,
                ]}
              >
                좋아요 {post.likes}
              </Text>
            </Pressable>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#999" />
              <Text style={styles.actionText}>댓글 {post.comments}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.commentSectionTitle}>댓글 {post.comments}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B4A" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>게시물을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: 58 + insets.top,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>게시물</Text>

        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={structuredComments}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: 112 + Math.max(insets.bottom, 12),
          },
        ]}
        ListHeaderComponent={renderPostHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>아직 댓글이 없습니다.</Text>
        }
        renderItem={({ item }) => {
          const isReply = Boolean(item.parentId);

          return (
            <View
              style={[
                styles.commentItem,
                isReply && styles.nestedCommentItem,
              ]}
            >
              {isReply && (
                <Ionicons
                  name="return-down-forward"
                  size={16}
                  color="#FF6B4A"
                  style={styles.replyBranchIcon}
                />
              )}

              <View
                style={[
                  styles.commentAvatar,
                  isReply && styles.nestedCommentAvatar,
                ]}
              >
                <Text style={styles.commentAvatarText}>
                  {item.user.slice(0, 1)}
                </Text>
              </View>

              <View style={styles.commentBody}>
                <View style={styles.commentMetaRow}>
                  <Text style={styles.commentUser}>{item.user}</Text>
                  <Text style={styles.commentTime}>{item.time}</Text>
                </View>

                {/* 2026.08.14 임재준: @멘션 하이라이트 텍스트 렌더링 */}
                <HighlightedCommentText text={item.text} />

                {/* 2026.08.14 임재준: 댓글 하단 답글달기 및 좋아요 액션 영역 */}
                <View style={styles.commentFooterRow}>
                  <Pressable
                    onPress={() => startReplyToUser(item)}
                    style={styles.replyTextButton}
                  >
                    <Text style={styles.replyTextButtonLabel}>답글 달기</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => toggleReplyLike(item)}
                    style={styles.replyLikeButton}
                  >
                    <Ionicons
                      name={item.isLiked ? 'heart' : 'heart-outline'}
                      size={14}
                      color={item.isLiked ? '#FF6B4A' : '#777'}
                    />
                    {(item.likes ?? 0) > 0 && (
                      <Text
                        style={[
                          styles.replyLikeCount,
                          item.isLiked && styles.actionTextActive,
                        ]}
                      >
                        {item.likes}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              {item.isMine && (
                <View style={styles.replyActions}>
                  {/* 2026.08.14 임재준: 수정 확인 Alert 연결 */}
                  <Pressable
                    onPress={() => confirmEditReply(item)}
                    style={styles.replyActionButton}
                  >
                    <Ionicons name="create-outline" size={16} color="#aaa" />
                  </Pressable>

                  <Pressable
                    onPress={() => confirmDeleteReply(item)}
                    style={styles.replyActionButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF6B4A" />
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* 2026.08.14 임재준: 댓글 수정 중 표시 바 */}
      {editingReply && (
        <View style={styles.editingReplyBar}>
          <Text style={styles.editingReplyText}>댓글 수정 중</Text>
          <Pressable onPress={cancelEditReply}>
            <Ionicons name="close-circle" size={18} color="#777" />
          </Pressable>
        </View>
      )}

      {/* 2026.08.14 임재준: 대댓글(답글) 작성 중 표시 바 */}
      {replyingTo && !editingReply && (
        <View style={styles.editingReplyBar}>
          <Text style={styles.editingReplyText}>
            @{replyingTo.user}님에게 답글 작성 중
          </Text>
          <Pressable onPress={cancelReplyToUser}>
            <Ionicons name="close-circle" size={18} color="#777" />
          </Pressable>
        </View>
      )}

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Pressable style={styles.bottomLikeButton} onPress={toggleLike}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={post.isLiked ? '#FF6B4A' : '#999'}
          />

          <Text
            style={[
              styles.bottomLikeText,
              post.isLiked && styles.actionTextActive,
            ]}
          >
            {post.likes}
          </Text>
        </Pressable>

        <TextInput
          style={styles.commentInput}
          placeholder={
            replyingTo
              ? `@${replyingTo.user}님에게 답글을 입력하세요`
              : '댓글을 입력하세요'
          }
          placeholderTextColor="#666"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        />

        <Pressable
          style={[
            styles.commentSubmit,
            isReplySubmitting && styles.commentSubmitDisabled,
          ]}
          onPress={submitReply}
          disabled={isReplySubmitting}
        >
          {isReplySubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={editingReply ? 'checkmark' : 'send'}
              size={18}
              color="#fff"
            />
          )}
        </Pressable>
      </View>

      <KeyboardAccessory />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#090909',
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
    backgroundColor: '#090909',
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  headerRight: {
    width: 44,
  },

  listContent: {
    paddingBottom: 112,
  },

  postSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  author: {
    flex: 1,
  },

  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  userMeta: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },

  postTitle: {
    color: '#fff',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 16,
  },

  postContent: {
    color: '#d8d8d8',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 18,
  },

  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },

  hashtagText: {
    color: '#FFB199',
    fontSize: 13,
    fontWeight: '800',
  },

  divider: {
    height: 8,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1c1c1c',
  },

  playlistPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#242424',
    marginBottom: 16,
  },

  moviePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#242424',
    marginBottom: 16,
  },

  moviePoster: {
    width: 42,
    height: 62,
    borderRadius: 7,
    backgroundColor: '#222',
    marginRight: 12,
  },

  miniPosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 88,
  },

  miniPoster: {
    width: 38,
    height: 56,
    borderRadius: 7,
    marginRight: -13,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#101010',
  },

  previewText: {
    flex: 1,
    minWidth: 0,
  },

  previewTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  previewSub: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },

  detailActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 18,
  },

  actionText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '700',
  },

  actionTextActive: {
    color: '#FF6B4A',
  },

  commentSectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },

  commentItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#171717',
  },

  nestedCommentItem: {
    paddingLeft: 36,
    backgroundColor: '#0e0e0e',
    borderLeftWidth: 2,
    borderLeftColor: '#FF6B4A',
  },

  replyBranchIcon: {
    marginRight: 6,
    marginTop: 4,
  },

  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242424',
    marginRight: 10,
  },

  nestedCommentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  commentAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  commentBody: {
    flex: 1,
    minWidth: 0,
  },

  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  commentUser: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  commentTime: {
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
  },

  commentText: {
    color: '#cfcfcf',
    fontSize: 14,
    lineHeight: 20,
  },

  mentionText: {
    color: '#FFB199',
    fontWeight: '800',
  },

  commentFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
  },

  replyTextButton: {
    paddingVertical: 2,
  },

  replyTextButtonLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
  },

  replyLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },

  replyLikeCount: {
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
  },

  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },

  replyActionButton: {
    padding: 6,
  },

  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },

  editingReplyBar: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#181818',
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },

  editingReplyText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '800',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: '#101010',
    borderTopWidth: 1,
    borderTopColor: '#242424',
  },

  bottomLikeButton: {
    height: 44,
    minWidth: 54,
    paddingHorizontal: 10,
    borderRadius: 22,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  bottomLikeText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '800',
  },

  commentInput: {
    flex: 1,
    maxHeight: 96,
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#fff',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    fontSize: 14,
  },

  commentSubmit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B4A',
  },

  commentSubmitDisabled: {
    opacity: 0.55,
  },
});