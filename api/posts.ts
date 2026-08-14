import client from './client';

export type CommunityPostType = 'playlist' | 'movie';

export type MoviePreview = {
  id: string;
  title: string;
  poster: string;
  posterPath?: string | null;
};

// 2026.08.14 임재준
// 대댓글 식별을 위한 parentId, 멘션 대상, 댓글 좋아요 필드를 추가한다.
export type CommunityReply = {
  id: string;
  user: string;
  text: string;
  time: string;
  isMine: boolean;
  parentId?: string | null;
  replyToUser?: string | null;
  likes?: number;
  isLiked?: boolean;
};

// 2026.08.14 임재준
// 투표 선택지 및 투표 상태 타입 정의
export type PollOption = {
  id: string | number;
  text: string;
  votes: number;
};

export type PostPoll = {
  id?: string | number;
  question?: string | null;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string | number | null;
  isClosed?: boolean;
};

// 2026.08.14 임재준: 투표(poll) 필드 추가
export type CommunityPost = {
  id: string;
  type: CommunityPostType;
  user: string;
  handle?: string;
  time: string;
  title: string;
  content: string;
  tag: string;
  hashtags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  isMine: boolean;
  movie?: MoviePreview;
  playlist?: {
    id: string;
    title: string;
    description?: string;
    saves?: number;
    movies: MoviePreview[];
  };
  commentList: CommunityReply[];
  poll?: PostPoll | null;
};

// 2026.08.14 임재준: 투표 생성 페이로드(poll) 필드 추가
export type CreatePostPayload = {
  is_playlist: boolean;
  movie_id?: number;
  playlist_id?: number;
  post_title: string;
  post_content: string;
  hashtags: string[];
  poll?: {
    question?: string;
    options: string[];
  };
};

export type UpdatePostPayload = {
  post_title?: string;
  post_content?: string;
  hashtags?: string[];
};

// 2026.08.14 임재준
// 대댓글 작성을 위해 parent_id를 전달할 수 있도록 확장한다.
export type ReplyPayload = {
  reply_content: string;
  parent_id?: string | number;
};

export type PostLikeResult = {
  post_id: string;
  post_likes: number;
  post_is_liked: boolean;
};

// 2026.08.14 임재준
// 댓글 좋아요 API 응답 결과를 위한 타입을 정의한다.
export type ReplyLikeResult = {
  reply_id: string;
  reply_likes: number;
  reply_is_liked: boolean;
};

// 2026.05.18 박현식
// 게시물 API의 poster_path를 앱에서 표시 가능한 이미지 URL로 변환한다.
const posterUrl = (posterPath?: string | null, fallbackSize = '500x750') => {
  if (!posterPath) return `https://via.placeholder.com/${fallbackSize}?text=No+Image`;
  return posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w500${posterPath}`;
};

// 2026.05.18 박현식
// 백엔드가 내려준 경과 분 값을 커뮤니티 카드의 상대 시간 문구로 바꾼다.
const elapsedText = (minutes?: number) => {
  const value = Number(minutes ?? 0);
  if (value < 1) return '방금';
  if (value < 60) return `${value}분 전`;
  if (value < 1440) return `${Math.floor(value / 60)}시간 전`;
  return `${Math.floor(value / 1440)}일 전`;
};

// 2026.05.18 박현식
// 영화 요약 응답을 커뮤니티 카드와 공유 플레이리스트 미리보기 구조로 변환한다.
const toMoviePreview = (movie: any, index = 0): MoviePreview => ({
  id: String(movie.movie_id ?? movie.id ?? index),
  title: movie.movie_title ?? movie.title ?? '',
  poster: posterUrl(movie.poster_path ?? movie.posterPath, '160x240'),
  posterPath: movie.poster_path ?? movie.posterPath ?? null,
});

// 2026.05.18 박현식
// 2026.08.14 임재준 수정: 대댓글 부모 ID 및 댓글 좋아요 필드 변환 지원
// 댓글 API 응답을 프론트 댓글 컴포넌트에서 쓰는 구조로 변환한다.
export const toCommunityReply = (reply: any): CommunityReply => ({
  id: String(reply.reply_id ?? reply.id),
  user: reply.nickname ?? reply.user ?? '사용자',
  text: reply.reply_content ?? reply.text ?? '',
  time: reply.reply_elapsed_time !== undefined ? elapsedText(reply.reply_elapsed_time) : (reply.time ?? '방금'),
  isMine: Boolean(reply.reply_is_mine ?? reply.isMine),
  parentId: reply.parent_id ? String(reply.parent_id) : (reply.parentId ? String(reply.parentId) : null),
  replyToUser: reply.reply_to_user ?? reply.replyToUser ?? null,
  likes: Number(reply.reply_likes ?? reply.likes ?? 0),
  isLiked: Boolean(reply.reply_is_liked ?? reply.isLiked),
});

// 2026.05.18 박현식
// 2026.08.14 임재준 수정: 투표(poll) 응답 변환 로직 추가
// 게시물 API 응답을 영화/플레이리스트 타입별 커뮤니티 카드 데이터로 변환한다.
export const toCommunityPost = (post: any): CommunityPost => {
  const hashtags = post.hashtags ?? [];
  const isPlaylist = Boolean(post.is_playlist);

  let poll: PostPoll | null = null;
  if (post.poll) {
    poll = {
      id: post.poll.id,
      question: post.poll.question,
      options: (post.poll.options ?? []).map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        votes: Number(opt.votes ?? 0),
      })),
      totalVotes: Number(post.poll.total_votes ?? 0),
      userVotedOptionId: post.poll.user_voted_option_id,
      isClosed: Boolean(post.poll.is_closed),
    };
  }

  return {
    id: String(post.post_id),
    type: isPlaylist ? 'playlist' : 'movie',
    user: post.nickname ?? '사용자',
    handle: post.user_id ? `@${post.user_id}` : undefined,
    time: elapsedText(post.post_elapsed_time ?? post.posting_time),
    title: post.post_title ?? '',
    content: post.post_content ?? '',
    tag: hashtags[0]?.replace('#', '') ?? (isPlaylist ? '플레이리스트' : '영화'),
    hashtags,
    likes: Number(post.post_likes ?? 0),
    comments: Number(post.post_replies ?? 0),
    isLiked: Boolean(post.post_is_liked),
    isMine: Boolean(post.post_is_mine),
    movie: isPlaylist
      ? undefined
      : toMoviePreview({
          movie_id: post.movie_id,
          movie_title: post.movie_title,
          poster_path: post.poster_path,
        }),
    playlist: isPlaylist
      ? {
          id: String(post.playlist_id),
          title: post.playlist_title ?? post.post_title ?? '',
          movies: (post.movies ?? []).map(toMoviePreview),
        }
      : undefined,
    commentList: (post.replies ?? []).map(toCommunityReply),
    poll,
  };
};

// 2026.05.18 박현식
// 커뮤니티 전체 게시물을 조회한다.
export const fetchPostsApi = async () => {
  const response = await client.get('/api/v1/post');
  return (response.data.data ?? []).map(toCommunityPost);
};

// 2026.05.18 박현식
// 댓글 목록을 포함한 게시물 상세 정보를 조회한다.
export const fetchPostApi = async (postId: string | number) => {
  const response = await client.get(`/api/v1/post/${postId}`);
  return toCommunityPost(response.data);
};

// 2026.05.18 박현식
// 영화 또는 플레이리스트 공유 게시물을 생성한다.
export const createPostApi = async (payload: CreatePostPayload) => {
  const response = await client.post('/api/v1/post', payload);
  return toCommunityPost(response.data.data);
};

// 2026.05.18 박현식
// 내 커뮤니티 게시물의 제목, 내용, 해시태그를 수정한다.
export const updatePostApi = async (postId: string | number, payload: UpdatePostPayload) => {
  const response = await client.patch(`/api/v1/post/${postId}`, payload);
  return toCommunityPost(response.data.data);
};

// 2026.05.18 박현식
// 내 커뮤니티 게시물을 삭제한다.
export const deletePostApi = async (postId: string | number) => {
  const response = await client.delete(`/api/v1/post/${postId}`);
  return response.data;
};

// 2026.05.18 박현식
// 2026.08.14 임재준 수정: 대댓글(parent_id) 지원
// 게시물에 새 댓글 또는 대댓글을 작성한다.
export const createReplyApi = async (postId: string | number, payload: ReplyPayload) => {
  const response = await client.post(`/api/v1/post/${postId}/replies`, payload);
  return toCommunityReply(response.data.data ?? response.data);
};

// 2026.05.18 박현식
// 내 댓글 내용을 수정한다.
export const updateReplyApi = async (
  postId: string | number,
  replyId: string | number,
  payload: ReplyPayload
) => {
  const response = await client.patch(`/api/v1/post/${postId}/replies/${replyId}`, payload);
  return toCommunityReply(response.data.data ?? response.data);
};

// 2026.05.18 박현식
// 내 댓글을 삭제한다.
export const deleteReplyApi = async (postId: string | number, replyId: string | number) => {
  const response = await client.delete(`/api/v1/post/${postId}/replies/${replyId}`);
  return response.data;
};

// 2026.05.18 박현식
// 좋아요 API 응답을 프론트 상태 보정에 필요한 값으로 변환한다.
const toPostLikeResult = (data: any): PostLikeResult => ({
  post_id: String(data.post_id),
  post_likes: Number(data.post_likes ?? 0),
  post_is_liked: Boolean(data.post_is_liked),
});

// 2026.05.18 박현식
// 게시물 좋아요를 추가한다.
export const likePostApi = async (postId: string | number) => {
  const response = await client.post(`/api/v1/post/${postId}/likes`);
  return toPostLikeResult(response.data);
};

// 2026.05.18 박현식
// 게시물 좋아요를 취소한다.
export const unlikePostApi = async (postId: string | number) => {
  const response = await client.delete(`/api/v1/post/${postId}/likes`);
  return toPostLikeResult(response.data);
};

// 2026.08.14 임재준
// 댓글 좋아요 API 응답을 프론트 상태 보정에 필요한 값으로 변환한다.
const toReplyLikeResult = (data: any): ReplyLikeResult => ({
  reply_id: String(data.reply_id),
  reply_likes: Number(data.reply_likes ?? 0),
  reply_is_liked: Boolean(data.reply_is_liked),
});

// 2026.08.14 임재준
// 댓글 좋아요를 추가한다.
export const likeReplyApi = async (postId: string | number, replyId: string | number) => {
  const response = await client.post(`/api/v1/post/${postId}/replies/${replyId}/likes`);
  return toReplyLikeResult(response.data);
};

// 2026.08.14 임재준
// 댓글 좋아요를 취소한다.
export const unlikeReplyApi = async (postId: string | number, replyId: string | number) => {
  const response = await client.delete(`/api/v1/post/${postId}/replies/${replyId}/likes`);
  return toReplyLikeResult(response.data);
};

// 2026.08.14 임재준
// 게시물에 첨부된 투표에 참여한다.
export const votePollApi = async (postId: string | number, optionId: string | number) => {
  const response = await client.post(`/api/v1/post/${postId}/poll/vote`, { option_id: optionId });
  return response.data;
};