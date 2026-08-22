import client from './client';

// 2026.08.22 임재준
// 게시글 신고
export const reportPostApi = async (postId: string | number, reason: string, details?: string) => {
  const res = await client.post(`/api/v1/reports/posts/${postId}`, { reason, details });
  return res.data;
};

// 2026.08.22 임재준
// 댓글 신고
export const reportReplyApi = async (replyId: string | number, reason: string, details?: string) => {
  const res = await client.post(`/api/v1/reports/replies/${replyId}`, { reason, details });
  return res.data;
};

// 2026.08.22 임재준
// 영화 정보 신고
export const reportMovieApi = async (movieId: string | number, reason: string, details?: string) => {
  const res = await client.post(`/api/v1/reports/movies/${movieId}`, { reason, details });
  return res.data;
};