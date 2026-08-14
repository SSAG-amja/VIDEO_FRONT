import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fetchSearchData } from '../api/explore';
import { fetchPlaylistsApi } from '../api/playlists';
import { CommunityPostType, CreatePostPayload } from '../api/posts';
import KeyboardAccessory, { KEYBOARD_ACCESSORY_ID } from './KeyboardAccessory';

export type PostTargetMovie = {
  id: string | number;
  title: string;
  image?: string;
  poster?: string;
  posterPath?: string | null;
};

export type PostTargetPlaylist = {
  id: string | number;
  name?: string;
  title?: string;
  movieCount?: number;
  movies?: any[];
};

type Props = {
  visible: boolean;
  initialType?: CommunityPostType;
  initialMovie?: PostTargetMovie | null;
  initialPlaylist?: PostTargetPlaylist | null;
  initialTitle?: string;
  initialContent?: string;
  initialHashtags?: string[];
  lockTarget?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  title?: string;
  onClose: () => void;
  onSubmit: (payload: CreatePostPayload) => Promise<void>;
};

// 2026.05.18 박현식
// 선택한 영화 정보를 작성 모달 미리보기 이미지 URL로 변환한다.
const posterUrl = (movie?: PostTargetMovie | null) => {
  if (!movie) return undefined;
  if (movie.image) return movie.image;
  if (movie.poster) return movie.poster;
  if (movie.posterPath) return `https://image.tmdb.org/t/p/w500${movie.posterPath}`;
  return undefined;
};

// 2026.05.18 박현식
// 플레이리스트 객체에서 화면에 표시할 제목을 꺼낸다.
const playlistTitle = (playlist?: PostTargetPlaylist | null) => playlist?.name ?? playlist?.title ?? '';

// 2026.05.18 박현식
// 영화 또는 플레이리스트를 태그해 커뮤니티 게시물을 작성/수정하는 공용 모달이다.
export default function PostWriteModal({
  visible,
  initialType = 'movie',
  initialMovie = null,
  initialPlaylist = null,
  initialTitle = '',
  initialContent = '',
  initialHashtags,
  lockTarget = false,
  isSubmitting = false,
  submitLabel = '등록',
  submittingLabel = '등록 중',
  title = '공유하기',
  onClose,
  onSubmit,
}: Props) {
  const [writeType, setWriteType] = useState<CommunityPostType>(initialType);
  const [movieQuery, setMovieQuery] = useState('');
  const [movieResults, setMovieResults] = useState<PostTargetMovie[]>([]);
  const [isMovieSearching, setIsMovieSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<PostTargetMovie | null>(initialMovie);
  const [myPlaylists, setMyPlaylists] = useState<PostTargetPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PostTargetPlaylist | null>(initialPlaylist);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [hashtagText, setHashtagText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false); // 2026.08.14 임재준: 스포일러 토글 상태

  // 2026.08.14 임재준: 투표 작성 상태
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  useEffect(() => {
    if (!visible) return;
    setWriteType(initialType);
    setSelectedMovie(initialMovie);
    setSelectedPlaylist(initialPlaylist);
    setMovieQuery(initialMovie?.title ?? '');
    setMovieResults([]);
    setPostTitle(initialTitle);
    setPostContent(initialContent);

    // 2026.08.14 임재준: 기존 태그에 스포일러가 포함되어 있는지 확인
    const initialTags = initialHashtags ?? [];
    const hasSpoilerTag = initialTags.some((tag) => tag.includes('스포일러') || tag.includes('스포'));
    setIsSpoiler(hasSpoilerTag);
    setHashtagText(initialTags.filter((tag) => !tag.includes('스포일러') && !tag.includes('스포')).join(' '));

    setHasPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  }, [initialContent, initialHashtags, initialMovie, initialPlaylist, initialTitle, initialType, visible]);

  useEffect(() => {
    if (!visible || lockTarget || writeType !== 'playlist') return;
    fetchPlaylistsApi()
      .then(setMyPlaylists)
      .catch((error) => console.error('Playlist Load For Post Error:', error));
  }, [lockTarget, visible, writeType]);

  useEffect(() => {
    if (!visible || lockTarget || writeType !== 'movie') return;
    const query = movieQuery.trim();
    if (!query || selectedMovie?.title === query) {
      setMovieResults([]);
      return;
    }

    setIsMovieSearching(true);
    const timer = setTimeout(async () => {
      try {
        setMovieResults(await fetchSearchData(query));
      } catch (error) {
        console.error('Post Movie Search Error:', error);
      } finally {
        setIsMovieSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [lockTarget, movieQuery, selectedMovie?.title, visible, writeType]);

  // 2026.05.18 박현식
  // 선택된 공유 대상 이름 또는 선택 안내 문구를 계산한다.
  const targetLabel = useMemo(() => {
    if (writeType === 'movie') return selectedMovie?.title ?? '영화를 선택해주세요';
    return playlistTitle(selectedPlaylist) || '플레이리스트를 선택해주세요';
  }, [selectedMovie?.title, selectedPlaylist, writeType]);

  // 2026.05.18 박현식
  // 현재 공유 대상 선택 상태를 짧은 라벨로 계산한다.
  const targetStatusLabel = useMemo(() => {
    if (writeType === 'movie') return selectedMovie ? '영화 태그됨' : '영화 선택 필요';
    return selectedPlaylist ? '플레이리스트 태그됨' : '플레이리스트 선택 필요';
  }, [selectedMovie, selectedPlaylist, writeType]);

  const hasTaggedTarget = writeType === 'movie' ? Boolean(selectedMovie) : Boolean(selectedPlaylist);

  // 2026.08.14 임재준: 투표 선택지 추가 (최대 4개)
  const addPollOption = () => {
    if (pollOptions.length >= 4) {
      Alert.alert('알림', '선택지는 최대 4개까지 추가할 수 있습니다.');
      return;
    }
    setPollOptions([...pollOptions, '']);
  };

  // 2026.08.14 임재준: 투표 선택지 삭제 (최소 2개 유지)
  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) {
      Alert.alert('알림', '선택지는 최소 2개 이상이어야 합니다.');
      return;
    }
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  // 2026.08.14 임재준: 투표 선택지 텍스트 변경
  const updatePollOption = (text: string, index: number) => {
    const next = [...pollOptions];
    next[index] = text;
    setPollOptions(next);
  };

  // 2026.05.18 박현식
  // 키보드를 닫고 작성 모달을 종료한다.
  const resetAndClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  // 2026.05.18 박현식
  // 2026.08.14 임재준 수정: 스포일러 및 투표 첨부 데이터 함께 검증 및 전송
  const submit = async () => {
    if (writeType === 'movie' && !selectedMovie) {
      Alert.alert('확인', '공유할 영화를 선택해주세요.');
      return;
    }
    if (writeType === 'playlist' && !selectedPlaylist) {
      Alert.alert('확인', '공유할 플레이리스트를 선택해주세요.');
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert('확인', '제목과 내용을 입력해주세요.');
      return;
    }

    // 투표 검증
    let pollPayload: { question?: string; options: string[] } | undefined = undefined;
    if (hasPoll && !lockTarget) {
      const validOptions = pollOptions.map((opt) => opt.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        Alert.alert('확인', '투표 선택지를 2개 이상 입력해주세요.');
        return;
      }
      pollPayload = {
        question: pollQuestion.trim() || undefined,
        options: validOptions,
      };
    }

    const baseHashtags = hashtagText
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    if (isSpoiler && !baseHashtags.some((tag) => tag === '#스포일러' || tag === '#스포')) {
      baseHashtags.unshift('#스포일러');
    }

    await onSubmit({
      is_playlist: writeType === 'playlist',
      movie_id: writeType === 'movie' ? Number(selectedMovie?.id) : undefined,
      playlist_id: writeType === 'playlist' ? Number(selectedPlaylist?.id) : undefined,
      post_title: postTitle.trim(),
      post_content: postContent.trim(),
      hashtags: baseHashtags,
      poll: pollPayload,
    });

    setPostTitle('');
    setPostContent('');
    setHashtagText('');
    setIsSpoiler(false);
    setHasPoll(false);
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modal}>
        <View style={styles.header}>
          <Pressable onPress={resetAndClose} disabled={isSubmitting}>
            <Text style={styles.cancel}>취소</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={submit} disabled={isSubmitting}>
            <Text style={styles.submit}>{isSubmitting ? submittingLabel : submitLabel}</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {!lockTarget && (
            <View style={styles.shareTypeRow}>
              <Pressable
                style={[styles.shareType, writeType === 'movie' && styles.shareTypeActive]}
                onPress={() => {
                  setWriteType('movie');
                  setSelectedPlaylist(null);
                }}
              >
                <Ionicons name="film-outline" size={20} color="#FF6B4A" />
                <Text style={styles.shareTypeText}>영화</Text>
              </Pressable>
              <Pressable
                style={[styles.shareType, writeType === 'playlist' && styles.shareTypeActive]}
                onPress={() => {
                  setWriteType('playlist');
                  setSelectedMovie(null);
                }}
              >
                <Ionicons name="albums-outline" size={20} color="#FF6B4A" />
                <Text style={styles.shareTypeText}>플리</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.targetBox, hasTaggedTarget && styles.targetBoxTagged]}>
            <View style={styles.targetIcon}>
              <Ionicons name={writeType === 'movie' ? 'film-outline' : 'albums-outline'} size={20} color="#FF6B4A" />
            </View>
            <View style={styles.targetCopy}>
              <Text style={styles.targetStatus}>{targetStatusLabel}</Text>
              <Text style={styles.targetLabel} numberOfLines={1}>{targetLabel}</Text>
            </View>
          </View>

          {!lockTarget && writeType === 'movie' && (
            <View style={styles.targetPicker}>
              <TextInput
                style={styles.searchField}
                placeholder="영화 검색"
                placeholderTextColor="#666"
                value={movieQuery}
                onChangeText={(text) => {
                  setMovieQuery(text);
                  if (selectedMovie && selectedMovie.title !== text) setSelectedMovie(null);
                }}
                returnKeyType="search"
                inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              />
              {isMovieSearching && <ActivityIndicator color="#FF6B4A" style={styles.searching} />}
              {movieResults.slice(0, 6).map((movie) => (
                <Pressable
                  key={movie.id}
                  style={[styles.targetOption, selectedMovie?.id === movie.id && styles.targetOptionActive]}
                  onPress={() => {
                    setSelectedMovie(movie);
                    setMovieQuery(movie.title);
                    setMovieResults([]);
                  }}
                >
                  <Image source={{ uri: posterUrl(movie) }} style={styles.targetPoster} />
                  <Text style={styles.targetTitle} numberOfLines={1}>{movie.title}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {!lockTarget && writeType === 'playlist' && (
            <View style={styles.targetPicker}>
              {myPlaylists.map((playlist) => (
                <Pressable
                  key={playlist.id}
                  style={[styles.targetOption, selectedPlaylist?.id === playlist.id && styles.targetOptionActive]}
                  onPress={() => setSelectedPlaylist(playlist)}
                >
                  <View style={styles.playlistIcon}>
                    <Ionicons name="albums-outline" size={18} color="#FF6B4A" />
                  </View>
                  <View style={styles.targetTextWrap}>
                    <Text style={styles.targetTitle} numberOfLines={1}>{playlistTitle(playlist)}</Text>
                    <Text style={styles.targetSub}>{playlist.movieCount ?? playlist.movies?.length ?? 0}편</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <TextInput
            style={styles.field}
            placeholder="제목"
            placeholderTextColor="#666"
            value={postTitle}
            onChangeText={setPostTitle}
            returnKeyType="next"
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="내용을 입력하세요"
            placeholderTextColor="#666"
            value={postContent}
            onChangeText={setPostContent}
            multiline
            textAlignVertical="top"
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <TextInput
            style={styles.field}
            placeholder="#해시태그 (스페이스로 구분)"
            placeholderTextColor="#666"
            value={hashtagText}
            onChangeText={setHashtagText}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />

          {/* 2026.08.14 임재준: 스포일러 방지 체크 토글 */}
          <Pressable
            style={[styles.toggleBox, isSpoiler && styles.spoilerToggleActive]}
            onPress={() => setIsSpoiler(!isSpoiler)}
          >
            <Ionicons
              name={isSpoiler ? 'alert-circle' : 'alert-circle-outline'}
              size={20}
              color={isSpoiler ? '#FF4D4D' : '#888'}
            />
            <Text style={[styles.toggleBoxText, isSpoiler && styles.spoilerToggleTextActive]}>
              스포일러 포함 여부
            </Text>
            <Ionicons
              name={isSpoiler ? 'checkbox' : 'square-outline'}
              size={20}
              color={isSpoiler ? '#FF4D4D' : '#666'}
            />
          </Pressable>

          {/* 2026.08.14 임재준: 투표 첨부 토글 (작성 시에만 활성화) */}
          {!lockTarget && (
            <View style={styles.pollSection}>
              <Pressable
                style={[styles.toggleBox, hasPoll && styles.pollToggleActive]}
                onPress={() => setHasPoll(!hasPoll)}
              >
                <Ionicons
                  name={hasPoll ? 'stats-chart' : 'stats-chart-outline'}
                  size={19}
                  color={hasPoll ? '#FF6B4A' : '#888'}
                />
                <Text style={[styles.toggleBoxText, hasPoll && styles.pollToggleTextActive]}>
                  투표 첨부하기
                </Text>
                <Ionicons
                  name={hasPoll ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={hasPoll ? '#FF6B4A' : '#666'}
                />
              </Pressable>

              {hasPoll && (
                <View style={styles.pollInputContainer}>
                  <TextInput
                    style={styles.pollQuestionInput}
                    placeholder="투표 질문 (선택)"
                    placeholderTextColor="#666"
                    value={pollQuestion}
                    onChangeText={setPollQuestion}
                    inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                  />

                  {pollOptions.map((option, index) => (
                    <View key={index} style={styles.pollOptionRow}>
                      <TextInput
                        style={styles.pollOptionInput}
                        placeholder={`선택지 ${index + 1}`}
                        placeholderTextColor="#666"
                        value={option}
                        onChangeText={(text) => updatePollOption(text, index)}
                        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                      />
                      {pollOptions.length > 2 && (
                        <Pressable
                          style={styles.removeOptionBtn}
                          onPress={() => removePollOption(index)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#FF6B4A" />
                        </Pressable>
                      )}
                    </View>
                  ))}

                  {pollOptions.length < 4 && (
                    <Pressable style={styles.addOptionBtn} onPress={addPollOption}>
                      <Ionicons name="add" size={16} color="#FF6B4A" />
                      <Text style={styles.addOptionBtnText}>선택지 추가</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
        <KeyboardAccessory />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#222' },
  cancel: { color: '#aaa', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  submit: { color: '#FF6B4A', fontSize: 16, fontWeight: '900' },
  body: { padding: 18 },
  shareTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  shareType: { flex: 1, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: '#151515', borderWidth: 1, borderColor: '#252525' },
  shareTypeActive: { borderColor: '#FF6B4A', backgroundColor: 'rgba(255,107,74,0.10)' },
  shareTypeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  targetBox: { minHeight: 70, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: '#151515', borderWidth: 1, borderColor: '#2b2b2b', marginBottom: 14 },
  targetBoxTagged: { borderColor: '#FF6B4A', backgroundColor: 'rgba(255,107,74,0.09)' },
  targetIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#211715', marginRight: 12 },
  targetCopy: { flex: 1, minWidth: 0 },
  targetStatus: { color: '#888', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  targetLabel: { color: '#fff', fontSize: 15, fontWeight: '900' },
  targetPicker: { marginBottom: 14 },
  searchField: { height: 44, borderRadius: 12, paddingHorizontal: 14, color: '#fff', backgroundColor: '#151515', borderWidth: 1, borderColor: '#252525', marginBottom: 8 },
  searching: { marginVertical: 8 },
  targetOption: { flexDirection: 'row', alignItems: 'center', minHeight: 62, padding: 10, borderRadius: 12, backgroundColor: '#151515', borderWidth: 1, borderColor: '#242424', marginBottom: 8 },
  targetOptionActive: { borderColor: '#FF6B4A', backgroundColor: 'rgba(255,107,74,0.10)' },
  targetPoster: { width: 38, height: 56, borderRadius: 7, backgroundColor: '#222', marginRight: 12 },
  playlistIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#211715', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  targetTextWrap: { flex: 1, minWidth: 0 },
  targetTitle: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '800' },
  targetSub: { color: '#777', fontSize: 12, marginTop: 4 },
  field: { height: 48, borderRadius: 12, paddingHorizontal: 14, color: '#fff', backgroundColor: '#151515', borderWidth: 1, borderColor: '#252525', marginBottom: 12 },
  contentInput: { minHeight: 142, borderRadius: 12, padding: 14, color: '#fff', textAlignVertical: 'top', backgroundColor: '#151515', borderWidth: 1, borderColor: '#252525', marginBottom: 12 },
  toggleBox: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#151515', borderWidth: 1, borderColor: '#252525', marginBottom: 12 },
  spoilerToggleActive: { borderColor: '#FF4D4D', backgroundColor: 'rgba(255,77,77,0.08)' },
  pollToggleActive: { borderColor: '#FF6B4A', backgroundColor: 'rgba(255,107,74,0.08)' },
  toggleBoxText: { flex: 1, color: '#888', fontSize: 14, fontWeight: '700', marginLeft: 10 },
  spoilerToggleTextActive: { color: '#FF4D4D' },
  pollToggleTextActive: { color: '#FF6B4A' },
  pollSection: { marginBottom: 20 },
  pollInputContainer: { padding: 14, borderRadius: 12, backgroundColor: '#121212', borderWidth: 1, borderColor: '#242424', gap: 10 },
  pollQuestionInput: { height: 42, borderRadius: 10, paddingHorizontal: 12, color: '#fff', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', fontSize: 13 },
  pollOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pollOptionInput: { flex: 1, height: 42, borderRadius: 10, paddingHorizontal: 12, color: '#fff', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', fontSize: 13 },
  removeOptionBtn: { padding: 8 },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 10, backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' },
  addOptionBtnText: { color: '#FF6B4A', fontSize: 13, fontWeight: '800' },
});